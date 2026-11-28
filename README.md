# TTstudio-redesign

A redesign of TikTok Studio for iPhone, designed and built as a working React prototype.

TikTok Studio（iPhone）改版：从设计到前端实现，做成可以直接操作的 React 原型。

**Try it / 体验：** open **https://9929y.github.io/TTstudio-redesign/** in a browser, or clone this repo and double-click `docs/index.html` (a single self-contained file that works offline).

在浏览器打开 **https://9929y.github.io/TTstudio-redesign/**，或 clone 仓库后双击 `docs/index.html`（单个自包含文件，离线可用）。

## Technology · 技术

React 18, Vite, Zustand, Framer Motion, Semi, and Playwright. The build inlines all required assets into one self-contained HTML file.

Built with simulated account data; no API credentials are required. 本项目使用模拟账号数据，无需配置 API 凭证。

## Run · 运行

Requires Node.js 18 or later. 需要 Node.js 18+。

```bash
npm install
npm run dev        # http://localhost:5183/TikTokStudio_prototype.html
npm run test:e2e   # requires Google Chrome
npm run docs       # builds docs/index.html
```

## Credits · 版权说明

Photos are stock images from [Pexels](https://www.pexels.com/license/); sources are in `illustrations/PHOTO_SOURCES.csv`. TikTok and TikTok Studio are trademarks of their owners. This is an independent design study and is not affiliated with TikTok.

照片来自 [Pexels](https://www.pexels.com/license/)，来源见 `illustrations/PHOTO_SOURCES.csv`。TikTok 与 TikTok Studio 是其所有者的商标。本项目为独立设计作品，与 TikTok 无关联。
