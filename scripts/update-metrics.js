/**
 * Generates assets/metrics.svg using public GitHub data.
 *
 * No npm dependencies are required.
 * GITHUB_TOKEN is supplied automatically by GitHub Actions.
 */

const fs = require("node:fs");
const path = require("node:path");

const USERNAME = process.env.GITHUB_REPOSITORY_OWNER || "vgduchieu0602";
const TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${USERNAME}-profile-readme`,
  "X-GitHub-Api-Version": "2022-11-28",
};

if (TOKEN) {
  headers.Authorization = `Bearer ${TOKEN}`;
}

async function github(pathname) {
  const response = await fetch(`https://api.github.com${pathname}`, { headers });

  if (!response.ok) {
    throw new Error(
      `GitHub API ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}

async function getAllPublicRepos() {
  const repos = [];

  for (let page = 1; ; page += 1) {
    const batch = await github(
      `/users/${USERNAME}/repos?type=public&sort=updated&per_page=100&page=${page}`
    );

    repos.push(...batch);

    if (batch.length < 100) break;
  }

  return repos;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function buildSvg({ profile, repos }) {
  const totalStars = repos.reduce(
    (sum, repo) => sum + repo.stargazers_count,
    0
  );

  const totalForks = repos.reduce(
    (sum, repo) => sum + repo.forks_count,
    0
  );

  const languages = new Map();

  for (const repo of repos) {
    if (!repo.language) continue;
    languages.set(repo.language, (languages.get(repo.language) || 0) + 1);
  }

  const topLanguages = [...languages.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([language]) => language)
    .join(" · ") || "Building...";

  const updatedAt = new Date().toISOString().slice(0, 10);

  const stats = [
    ["PUBLIC REPOS", formatNumber(profile.public_repos)],
    ["FOLLOWERS", formatNumber(profile.followers)],
    ["TOTAL STARS", formatNumber(totalStars)],
    ["TOTAL FORKS", formatNumber(totalForks)],
  ];

  const columns = stats.map(([label, value], index) => {
    const x = 55 + index * 205;

    return `
      <g transform="translate(${x}, 105)">
        <text class="value">${escapeXml(value)}</text>
        <text class="label" y="30">${escapeXml(label)}</text>
      </g>
    `;
  }).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="250" viewBox="0 0 900 250" role="img" aria-label="GitHub metrics for ${escapeXml(USERNAME)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1117"/>
      <stop offset="55%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0b3b75"/>
    </linearGradient>

    <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2f81f7"/>
      <stop offset="50%" stop-color="#58a6ff"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>

    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <style>
    .title {
      font: 700 21px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      fill: #f0f6fc;
    }

    .subtitle {
      font: 500 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      fill: #8b949e;
    }

    .value {
      font: 800 26px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      fill: #58a6ff;
    }

    .label {
      font: 700 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: 1.2px;
      fill: #8b949e;
    }

    .meta {
      font: 500 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      fill: #c9d1d9;
    }

    .pulse {
      animation: pulse 2.2s ease-in-out infinite;
      transform-origin: center;
    }

    @keyframes pulse {
      0%, 100% { opacity: .55; }
      50% { opacity: 1; }
    }
  </style>

  <rect x="1" y="1" width="898" height="248" rx="18" fill="url(#bg)" stroke="#30363d"/>

  <rect x="24" y="24" width="852" height="4" rx="2" fill="url(#stroke)" filter="url(#glow)"/>

  <circle cx="52" cy="62" r="5" fill="#3fb950" class="pulse"/>
  <text x="68" y="69" class="title">@${escapeXml(USERNAME)} / LIVE ENGINEERING METRICS</text>
  <text x="68" y="88" class="subtitle">generated automatically from GitHub public data</text>

  ${columns}

  <line x1="48" y1="172" x2="852" y2="172" stroke="#30363d"/>

  <text x="52" y="203" class="meta">
    TOP REPO LANGUAGES
    <tspan fill="#58a6ff">  ${escapeXml(topLanguages)}</tspan>
  </text>

  <text x="52" y="226" class="subtitle">last render: ${escapeXml(updatedAt)} UTC</text>

  <text x="848" y="226" text-anchor="end" class="subtitle">GitHub Actions + Node.js</text>
</svg>
`.trim();
}

async function main() {
  const [profile, repos] = await Promise.all([
    github(`/users/${USERNAME}`),
    getAllPublicRepos(),
  ]);

  const output = buildSvg({ profile, repos });
  const outputPath = path.join(process.cwd(), "assets", "metrics.svg");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, "utf8");

  console.log(`Rendered ${outputPath}`);
  console.log(`Public repos: ${profile.public_repos}`);
  console.log(`Repos included: ${repos.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
