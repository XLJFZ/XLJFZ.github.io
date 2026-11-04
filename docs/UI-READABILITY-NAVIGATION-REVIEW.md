# 可读性、章节导航与灯箱总览验收

## 构建与回退基线

- 最终应用源码与本地构建提交：`ca63efeb0da8a06db3ca9d3edf269a22a3b6a249`。
- 修改前回退标签：`pre-ui-readability-navigation-2026-10-24`，指向 `2f37bf32eb7abb5c6a7cc865d949e7651431a4d4`。
- 本记录是独立分支的本地验收证据，不代表已经合并或部署到 GitHub Pages。

## 响应式矩阵

- 使用最终 `_site` 导出产物，在 Chromium 中检查实际 CSS 视口宽度：`390`、`767`、`768`、`820`、`1024`、`1480px`。
- 检查首页、系列目录、四个专题、关于、工具目录和 `404.html`，共 54 次页面／宽度组合。
- 最终未发现页面横向溢出，正文、页头、页脚、主要按钮、照片和图注未出现非预期越界。首屏照片保留原有 2% 放大出血，不计为内容溢出。
- 城市专题实际跳转东京与北京章节，当前章节文字、字重、下划线及进度同步；检查首章、后续延迟绘制章节和末章，并完成 767 → 768 → 1480px 宽窄切换恢复。
- 导出工具另行请求 `/404` 返回 404；`404.html` 用于本地静态服务器的页面视觉检查。

## 灯箱与触控

- 桌面端打开总览后显示 35 张缩略图；选择第 20 张后按右方向键进入第 21 张，URL 与作品同步，关闭正常。
- 手机触控上下文中，点按首图和“总览”均可打开对应界面；总览轨道横向触摸事件后仍为 `01 / 35`，不会误触整图切换；点按第 8 张后显示 `08 / 35` 并更新单图 URL，关闭正常。
- 宽桌面间距验收曾发现主图与总览轨道重叠，已将总览开启后的桌面底部保留空间增至 12rem；重新构建导出后，六种宽度均未检测到主图与总览轨道重叠。
- 减少动态效果模式下，缩略图过渡时长降为 `0.01ms`；键盘、深链接、图注、EXIF 与序号保持可用。
- 手机结果来自浏览器触控与视口模拟，不等同于实体手机验收。

## 本次截图

截图保存在仓库内未跟踪的 `tmp/` 工作证据目录，不随源码提交：

- `tmp/ui-readability-navigation-2026-10-25/desktop-home.png`
- `tmp/ui-readability-navigation-2026-10-25/desktop-overview.png`
- `tmp/ui-readability-navigation-2026-10-25/mobile-home.png`
- `tmp/ui-readability-navigation-2026-10-25/mobile-chapter.png`
- `tmp/ui-readability-navigation-2026-10-25/mobile-overview.png`
- `tmp/ui-readability-navigation-2026-10-25/narrow-767-chapter.png`
- `tmp/ui-readability-navigation-2026-10-25/narrow-768-chapter.png`

## 质量门禁

- 本次修改文件 `oxfmt --check` 通过，`git diff --check` 通过。
- `oxlint`：0 warnings、0 errors。
- Node 回归测试：125 项全部通过。
- 应用构建、18 路由 Pages 导出、源资产检查和导出资产检查通过。
- 性能门禁通过：首页 HTML `60,152` 字节（预算 65,000），城市专题 HTML `121,646` 字节（预算 125,000）；共享字体 CSS 与内容哈希检查通过。
- `npm ci` 按锁文件报告 24 项依赖漏洞（1 low、5 moderate、15 high、3 critical）；本轮未执行可能引入无关升级的自动修复。
