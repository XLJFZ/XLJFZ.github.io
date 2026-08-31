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

## 项目简介 / Project

这是一个以摄影作品展示为核心的个人作品集网站，包含作品分类、系列介绍、图片浏览和个人简介页面。

This is a personal photography portfolio website centered on photo series, image browsing, project statements, and an artist biography.

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
git add .
git commit -m "Update portfolio"
git push origin main
```

## 项目结构 / Structure

```text
app/                         页面与路由 / Pages and routes
components/                  可复用组件 / Reusable components
lib/portfolio.ts             作品集数据 / Portfolio data
public/portfolio/            摄影作品 / Photography assets
scripts/                     GitHub Pages 导出脚本 / Export scripts
.github/workflows/pages.yml  自动部署流程 / Deployment workflow
```

## 版权声明 / Copyright

网站中的摄影作品、文字与视觉内容归 XLJFZ 所有。未经许可，不得复制、转载、修改或用于商业用途。

All photographs, texts, and visual materials on this website belong to XLJFZ.  
No reproduction, redistribution, modification, or commercial use is permitted without permission.
