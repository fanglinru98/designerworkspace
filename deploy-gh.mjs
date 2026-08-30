// 部署：gh-pages 更新 index.html + sw.js（Contents API，无 git 环境）
import fs from "node:fs";
const REPO = "fanglinru98/designerworkspace";
const BRANCH = "gh-pages";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error("缺少 GITHUB_TOKEN"); process.exit(1); }
const H = { Authorization: `token ${TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "lingjing-deploy" };
async function api(path, opts) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/${path}`, { headers: H, ...opts });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${r.status} ${path}: ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}
for (const f of ["index.html", "sw.js"]) {
  const content = fs.readFileSync(`dist/spa/${f}`);
  const existing = await api(`contents/${f}?ref=${BRANCH}`).catch(() => null);
  const out = await api(`contents/${f}`, {
    method: "PUT",
    body: JSON.stringify({
      message: "deploy: 甘特图时间轴常显（空数据也显示日/周/月表头+今天线）(lingjing-v5)",
      content: content.toString("base64"),
      branch: BRANCH,
      sha: existing?.sha,
    }),
  });
  console.log(`OK ${f} -> ${out.commit.sha.slice(0, 8)}`);
}
console.log("DEPLOY_DONE");
