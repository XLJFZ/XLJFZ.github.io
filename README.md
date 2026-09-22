# XLJFZ Photography Portfolio

> 城市与自然之间，持续观看世界。  
> Between cities and landscapes, I keep looking.

[访问摄影作品集 / Visit the portfolio](https://xljfz.github.io/)

## 关于我 / About

我是一名关注城市建筑与自然地景的摄影师。镜头不是答案，而是持续观看世界的方式。现就读于西安交通大学。

I am a photographer focused on urban architecture and natural landscapes.  
The camera is not an answer, but a way of continuing to look at the world.  
I am currently studying at Xi’an Jiaotong University.

## 作品集 / Series

### 城市脉冲 / Urban Pulse

记录街道、建筑、轨道、江岸与灯光构成的城市节奏。

A study of urban rhythms formed by streets, architecture, transit, waterfronts, and light.

### 远方的天气 / Distant Weather

关注雾、风、云层与短暂光线如何改变自然地景。

A collection exploring how mist, wind, clouds, and fleeting light transform the landscape.

### 时间的纹理 / Textures of Time

从石窟、木构、室内空间与民间艺术中，寻找时间留下的表面。

A study of the surfaces left by time in grottoes, timber structures, interiors, and folk art.

### 近处发生 / Close at Hand

记录人物、动物与日常生活中短暂而完整的动作。

A close look at people, animals, and complete yet fleeting gestures in everyday life.

## 项目简介 / Project

这是一个以摄影作品展示为核心的个人作品集网站，包含作品分类、系列介绍、图片浏览和个人简介页面。

This is a personal photography portfolio website centered on photo series, image browsing, project statements, and an artist biography.

后续添加照片或修改页面前，请先阅读[网站维护规范](docs/SITE-GUIDELINES.md)。其中记录了专题分类、EXIF、图片配对、响应式布局和发布流程等不可随意破坏的规则。

Before adding photographs or changing the site, read the [site maintenance guidelines](docs/SITE-GUIDELINES.md). They define the series taxonomy, EXIF rules, gallery pairing, responsive layout, and release workflow.

## 技术栈 / Tech Stack

- React
- Vinext
- TypeScript
- Tailwind CSS
- GitHub Pages
- GitHub Actions

## 本地运行 / Local Development

需要 Node.js `22.13.0` 或更高版本。

Requires Node.js `22.13.0` or later.

```bash
npm ci
npm run dev
```

仓库已包含展示预览，普通开发无需重新生成图片。新增或替换作品时，先设置 `PORTFOLIO_ORIGINALS_DIR` 指向仓库外的原图目录，再运行 `npm run previews`。画廊与灯箱均使用展示预览，原图不随站点发布。

Committed previews are sufficient for local development. Regeneration requires external originals via `PORTFOLIO_ORIGINALS_DIR`. Both the gallery and lightbox use published previews; originals are not published.

构建项目：

Build the project:

```bash
npm run build
npm run export:github-pages
```

## 自动部署 / Deployment

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

Every push to the `main` branch triggers GitHub Actions to build and deploy the site to GitHub Pages.

```bash
git add <changed-files>
git commit -m "Update portfolio"
git push origin main
```

## 项目结构 / Structure

```text
src/app/                     页面与路由 / Pages and routes
src/components/              网站组件 / Site components
src/components/ui/           实际使用的基础组件 / Used UI primitives
src/lib/portfolio.ts         作品集数据 / Portfolio data
public/portfolio-previews/   画廊与灯箱预览 / Gallery and lightbox previews
public/hero-previews/        首页预览 / Hero previews
public/covers/               专题封面 / Series covers
scripts/                     预览生成与 Pages 导出 / Preview generation and Pages export
tests/                       自动检查 / Automated checks
docs/README.md               文档导航 / Documentation index
docs/REPOSITORY-GUIDE.md      目录与归档约定 / Repository organization
docs/SITE-GUIDELINES.md       网站维护规范 / Site maintenance guidelines
.github/workflows/pages.yml  自动部署流程 / Deployment workflow
```

本地构建目录、缓存和 `outputs/` 不提交。文件归属、脚本用途及临时产物约定见[仓库导航](docs/REPOSITORY-GUIDE.md)。

## 版权声明 / Copyright

网站中的摄影作品、文字与视觉内容归 XLJFZ 所有。未经许可，不得复制、转载、修改或用于商业用途。

All photographs, texts, and visual materials on this website belong to XLJFZ.  
No reproduction, redistribution, modification, or commercial use is permitted without permission.
