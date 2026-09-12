# 本地开发与发布排障

当前发布规则见 [维护规范](SITE-GUIDELINES.md)。以下来自 Windows 历史运行，不保证其他环境表现相同。

## 代理与构建停滞

先查看日志确认是否在 Workers 启动阶段停滞。如疑似代理影响，仅在本次构建或导出进程中清空大小写 HTTP_PROXY、HTTPS_PROXY、ALL_PROXY 后重试；不要修改系统配置。过去的耗时不能作为本次成功依据。

## 依赖目录被占用

遇到 EBUSY 时先确认占用路径、PID、命令行与所属项目。只停止本任务启动且确认已无用途的进程，不按名称批量终止 workerd。不要直接删除 node_modules 或覆盖其他任务环境。

## 换行符噪音

先用 git diff --numstat、git diff 与 git ls-files --eol 区分内容差异和换行符。仅格式化目标文件并显式暂存；不要用删除、全量恢复或硬重置消除状态噪音。任何会丢弃工作内容的操作均须遵守维护规范 §10.1。

## 历史观察原文

以下仅保留证据，不是可直接执行的操作手册；其中的全量恢复、删除和终止进程建议已被上面的安全流程替代。

- Windows 本机若出现 Workers runtime 启动失败，且已确认目录权限可用，可仅在本次导出进程中移除 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 后重试；不要修改系统代理或以此跳过导出检查。已实测：带代理时 `npm run build` 与 `npm run export:github-pages` 会在 Vite 打印 `Proxy environment variables detected` 之后长时间完全无进展（16 分钟零进度），去掉代理后 build 约 `23s`、export 约 `15s`。因此**构建与导出前先行清空全部代理变量（含小写形式）是常规步骤，不是应急手段**。

- Windows 本机若 `npm ci` 长时间无任何输出（npm 调试日志停在 `silly idealTree buildDeps`），或报 `EBUSY: resource busy or locked` 并反复重试重命名 `node_modules/<包名>`，应先检查是否存在遗留的 `workerd.exe`：`tasklist /FI "IMAGENAME eq workerd.exe"`，存在则 `taskkill /PID <pid> /F` 后再安装。这些孤儿进程由 `wrangler dev` 派生，在导出脚本结束 dev server 后未被回收，会长期占用 `node_modules/miniflare` 等目录，使安装无限重试。

- 本机 `core.autocrlf=true`，git 检出的工作副本是 CRLF，而 `oxfmt` 会把整个工作区改写为 LF。由于仓库 blob 本身存的是 LF，`git diff --numstat` 不会产生任何真实内容差异（只列出人工修改的文件），但 `git status` 会把大批文件列为已修改，形成噪音。因此：**提交前只显式 `git add <目标文件>`，不要用 `git add -A`；在 `git status` 中看到大量此类「已修改」文件时，先用 `git diff --numstat` 确认真实内容差异**。需要把工作区恢复为检出状态时用 `git checkout -- .`（**先按 10.1 节确认并备份未提交内容**）；注意它只会重写 stat 已失效的文件，**刚刚 `git add` 或 amend 过的文件会因 stat 仍新鲜而被跳过、继续保持 LF**（`git checkout-index -f` 同样不会重新应用换行符转换，已实测无效）。要可靠地把单个文件恢复为检出状态，先删除该文件再 `git checkout -- <文件路径>`，然后用 `git ls-files --eol <文件路径>` 确认工作副本显示为 `w/crlf`。不要为此批量重写换行符，也不要把换行符变化混入提交。
