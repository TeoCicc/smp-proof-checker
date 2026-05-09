import { NextResponse } from 'next/server';
import type { ProofEntry } from '@/lib/proofs';

// ── Types ──────────────────────────────────────────────────────────────────

interface SubmitBody {
  theoremName: string;
  description: string;
  leanCode: string;
}

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  base: string;
}

// ── Validation ─────────────────────────────────────────────────────────────

function validate(body: unknown): SubmitBody | string {
  if (!body || typeof body !== 'object') return 'Invalid request body.';

  const { theoremName, description, leanCode } = body as Record<string, unknown>;

  if (!theoremName || typeof theoremName !== 'string' || !theoremName.trim())
    return 'theoremName is required.';

  if (!/^[a-zA-Z0-9_]+$/.test(theoremName.trim()))
    return 'theoremName may only contain letters, numbers, and underscores.';

  if (!leanCode || typeof leanCode !== 'string' || !leanCode.trim())
    return 'leanCode is required.';

  return {
    theoremName: theoremName.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    leanCode: leanCode.trim(),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toPascalCase(name: string): string {
  return name
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function buildLeanFile(leanCode: string): string {
  return (
    `import ProofCollection.Basic\n` +
    `\n` +
    `namespace ProofCollection.Submissions\n` +
    `\n` +
    `${leanCode}\n` +
    `\n` +
    `end ProofCollection.Submissions\n`
  );
}

// ── GitHub API client ──────────────────────────────────────────────────────

async function gh(
  cfg: GitHubConfig,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
  });
}

async function ghJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

function b64encode(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64');
}

function b64decode(encoded: string): string {
  // GitHub embeds newlines inside base64 for readability — strip them first.
  return Buffer.from(encoded.replace(/\n/g, ''), 'base64').toString('utf8');
}

// ── Auto-merge via GraphQL ─────────────────────────────────────────────────

async function enableAutoMerge(cfg: GitHubConfig, pullRequestNodeId: string): Promise<boolean> {
  const mutation = `
    mutation($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) {
      enablePullRequestAutoMerge(input: {
        pullRequestId: $pullRequestId
        mergeMethod: $mergeMethod
      }) {
        pullRequest {
          autoMergeRequest { enabledAt }
        }
      }
    }
  `;
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { pullRequestId: pullRequestNodeId, mergeMethod: 'MERGE' },
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { errors?: unknown[] };
    return !data.errors?.length;
  } catch {
    return false;
  }
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  // 1. Parse and validate input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const validated = validate(body);
  if (typeof validated === 'string') {
    return NextResponse.json({ error: validated }, { status: 400 });
  }
  const { theoremName, description, leanCode } = validated;

  // 2. Load server-side env vars (never exposed to the browser)
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const base = process.env.GITHUB_BASE_BRANCH ?? 'main';

  if (!token || !owner || !repo) {
    return NextResponse.json(
      { error: 'GitHub integration is not configured on this server.' },
      { status: 500 }
    );
  }

  const cfg: GitHubConfig = { token, owner, repo, base };

  // 3. Derived values
  const pascalName = toPascalCase(theoremName);
  const branchName = `proof/${theoremName.toLowerCase()}-${Date.now()}`;
  const filePath = `lean/ProofCollection/Submissions/${pascalName}.lean`;
  const importLine = `import ProofCollection.Submissions.${pascalName}`;
  const fileContent = buildLeanFile(leanCode);

  try {
    // Step A: get the SHA of the base branch tip
    const refRes = await gh(cfg, `/git/ref/heads/${base}`);
    if (!refRes.ok) {
      const err = await ghJson<{ message?: string }>(refRes);
      return NextResponse.json(
        { error: `Could not read base branch "${base}": ${err.message ?? refRes.statusText}` },
        { status: 502 }
      );
    }
    const { object } = await ghJson<{ object: { sha: string } }>(refRes);
    const baseSha = object.sha;

    // Step B: read proofs/index.json from the base branch before creating anything.
    // 404 = file doesn't exist yet; any other error is a real failure.
    const indexRes = await gh(cfg, `/contents/proofs/index.json?ref=${base}`);
    if (!indexRes.ok && indexRes.status !== 404) {
      return NextResponse.json(
        { error: 'Could not read proofs/index.json from the base branch.' },
        { status: 502 }
      );
    }

    let currentIndex: ProofEntry[] = [];
    let indexSha: string | undefined;

    if (indexRes.ok) {
      const indexData = await ghJson<{ content: string; sha: string }>(indexRes);
      currentIndex = JSON.parse(b64decode(indexData.content)) as ProofEntry[];
      indexSha = indexData.sha;
    }

    // Step C: duplicate checks — must pass before any branch or file is created.
    if (currentIndex.some((e) => e.theoremName === theoremName)) {
      return NextResponse.json(
        { error: `A proof with theorem name "${theoremName}" already exists in the collection.` },
        { status: 409 }
      );
    }

    if (currentIndex.some((e) => e.moduleName === pascalName)) {
      return NextResponse.json(
        {
          error: `A proof with module name "${pascalName}" already exists in the collection. ` +
            `This would create a conflicting file at ${filePath}.`,
        },
        { status: 409 }
      );
    }

    // Step D: create the new branch
    const branchRes = await gh(cfg, '/git/refs', {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
    });
    if (!branchRes.ok) {
      const err = await ghJson<{ message?: string }>(branchRes);
      return NextResponse.json(
        { error: `Could not create branch: ${err.message ?? branchRes.statusText}` },
        { status: 502 }
      );
    }

    // Step E: safety-net — confirm the proof file doesn't exist on the base branch.
    const existsRes = await gh(cfg, `/contents/${filePath}?ref=${base}`);
    if (existsRes.ok) {
      return NextResponse.json(
        { error: `A proof file named "${pascalName}.lean" already exists. Choose a different theorem name.` },
        { status: 409 }
      );
    }

    // Step F: create the proof file on the new branch
    const createRes = await gh(cfg, `/contents/${filePath}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Add proof: ${pascalName}`,
        content: b64encode(fileContent),
        branch: branchName,
      }),
    });
    if (!createRes.ok) {
      const err = await ghJson<{ message?: string }>(createRes);
      return NextResponse.json(
        { error: `Could not create proof file: ${err.message ?? createRes.statusText}` },
        { status: 502 }
      );
    }

    // Step G: read ProofCollection.lean from the base branch
    const rootRes = await gh(cfg, `/contents/lean/ProofCollection.lean?ref=${base}`);
    if (!rootRes.ok) {
      return NextResponse.json(
        { error: 'Could not read lean/ProofCollection.lean from the base branch.' },
        { status: 502 }
      );
    }
    const rootData = await ghJson<{ content: string; sha: string }>(rootRes);
    const currentRootContent = b64decode(rootData.content);

    if (currentRootContent.includes(importLine)) {
      return NextResponse.json(
        { error: `"${importLine}" is already present in ProofCollection.lean.` },
        { status: 409 }
      );
    }

    // Step H: append the import line and update ProofCollection.lean on the new branch
    const updatedRootContent = `${currentRootContent.trimEnd()}\n${importLine}\n`;
    const updateRootRes = await gh(cfg, '/contents/lean/ProofCollection.lean', {
      method: 'PUT',
      body: JSON.stringify({
        message: `Import ${pascalName} into ProofCollection`,
        content: b64encode(updatedRootContent),
        sha: rootData.sha,
        branch: branchName,
      }),
    });
    if (!updateRootRes.ok) {
      const err = await ghJson<{ message?: string }>(updateRootRes);
      return NextResponse.json(
        { error: `Could not update ProofCollection.lean: ${err.message ?? updateRootRes.statusText}` },
        { status: 502 }
      );
    }

    // Step I: append the new entry and update proofs/index.json on the new branch
    const newEntry: ProofEntry = {
      theoremName,
      moduleName: pascalName,
      description,
      filePath,
      importLine,
      leanCode,
      submittedVia: 'automatic-pr',
    };

    const updatedIndex = [...currentIndex, newEntry];
    const updatedIndexContent = JSON.stringify(updatedIndex, null, 2) + '\n';

    const updateIndexBody: Record<string, unknown> = {
      message: `Index proof: ${pascalName}`,
      content: b64encode(updatedIndexContent),
      branch: branchName,
    };
    if (indexSha) updateIndexBody.sha = indexSha;

    const updateIndexRes = await gh(cfg, '/contents/proofs/index.json', {
      method: 'PUT',
      body: JSON.stringify(updateIndexBody),
    });
    if (!updateIndexRes.ok) {
      const err = await ghJson<{ message?: string }>(updateIndexRes);
      return NextResponse.json(
        { error: `Could not update proofs/index.json: ${err.message ?? updateIndexRes.statusText}` },
        { status: 502 }
      );
    }

    // Step J: open the pull request
    const prBody = [
      description ? `**Description:** ${description}\n` : null,
      '### Files changed',
      `- \`${filePath}\` — new proof`,
      `- \`lean/ProofCollection.lean\` — added \`${importLine}\``,
      `- \`proofs/index.json\` — indexed \`${theoremName}\``,
      '\n---',
      '_Submitted via SMP Proof Checker. GitHub Actions will verify this proof with `lake build`._',
    ]
      .filter(Boolean)
      .join('\n');

    const prRes = await gh(cfg, '/pulls', {
      method: 'POST',
      body: JSON.stringify({
        title: `Add proof: ${pascalName}${description ? ` — ${description}` : ''}`,
        body: prBody,
        head: branchName,
        base,
      }),
    });
    if (!prRes.ok) {
      const err = await ghJson<{ message?: string }>(prRes);
      return NextResponse.json(
        { error: `Could not create pull request: ${err.message ?? prRes.statusText}` },
        { status: 502 }
      );
    }
    const prData = await ghJson<{ html_url: string; number: number; node_id: string }>(prRes);

    // Attempt to enable auto-merge. Failure is non-fatal — return a warning instead.
    const autoMergeEnabled = await enableAutoMerge(cfg, prData.node_id);

    return NextResponse.json({
      success: true,
      pullRequestUrl: prData.html_url,
      branchName,
      filePath,
      importLine,
      autoMergeEnabled,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal error: ${message}` }, { status: 500 });
  }
}
