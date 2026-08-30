// 源码备份：把整个源码目录（除 node_modules/dist）一次性提交到 main 分支
// 用 Git Data API：blobs -> tree(base_tree=main) -> commit -> update ref main
import fs from "node:fs";
import path from "node:path";
const REPO = "fanglinru98/designerworkspace";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error("缺少 GITHUB_TOKEN"); process.exit(1); }
const H = { Authorization: `token ${TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "lingjing-deploy" };
async function api(p, opts) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/${p}`, { headers: H, ...opts });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${r.status} ${p}: ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}
const ROOT = process.cwd();
const SKIP = new Set(["node_modules", "dist", ".git"]);
const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else files.push(path.relative(ROOT, full).split(path.sep).join("/"));
  }
})(ROOT);
console.log(`待上传文件数: ${files.length}`);
const ref = await api("git/ref/heads/main");
const baseTree = ref.object.sha;
let n = 0;
const tree = [];
for (const f of files) {
  const content = fs.readFileSync(path.join(ROOT, f));
  const blob = await api("git/blobs", { method: "POST", body: JSON.stringify({ content: content.toString("base64"), encoding: "base64" }) });
  tree.push({ path: f, mode: "100644", type: "blob", sha: blob.sha });
  n++;
  if (n % 40 === 0) console.log(`  blobs ${n}/${files.length}`);
}
const newTree = await api("git/trees", { method: "POST", body: JSON.stringify({ base_tree: baseTree, tree }) });
const commit = await api("git/commits", {
  method: "POST",
  body: JSON.stringify({ message: "source backup: 灵境工作台完整源码（登录修复+甘特图日/周/月+时间轴常显 v5）", tree: newTree.sha, parents: [await api(`commits/${baseTree}`).then(c => c.sha)] }),
});
await api("git/refs/heads/main", { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
console.log(`BACKUP_DONE main -> ${commit.sha.slice(0, 8)} (${files.length} 个文件)`);
