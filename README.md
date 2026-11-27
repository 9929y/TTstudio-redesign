# TTstudio-redesign

A redesign of TikTok Studio for iPhone, designed and built as a working React prototype.

TikTok Studio（iPhone）改版：从设计到前端实现，做成可以直接操作的 React 原型。

**Try it / 体验：** open **https://9929y.github.io/TTstudio-redesign/** in a browser, or clone this repo and double-click `docs/index.html` (a single self-contained file that works offline).

在浏览器打开 **https://9929y.github.io/TTstudio-redesign/**，或 clone 仓库后双击 `docs/index.html`（单个自包含文件，离线可用）。

---

## Design scope · 设计范围

The redesign adds AI insights where creators already look at their data, and links them to Creator Assistant.

本次改版在创作者原本查看数据的位置加入 AI 洞察，并把它们和 Creator Assistant 连起来。

| Area · 范围 | What was designed · 设计内容 |
| --- | --- |
| Analytics › Overview | **Performance summary**: five-area score chart, one-line insight, Ask Creator Assistant row · 五维评分图、一句话洞察、Ask 行 |
| Analytics › Content | **Content summary**: three-area score chart for content performance · 三维评分图 |
| Analytics › Viewers / Followers | **Viewer / Follower summary**: one-sentence audience insight; date picker moved into Key metrics · 一句话观众洞察；日期选择移到 Key metrics |
| Post analysis · 作品分析 | **Post summary**: compares a post with your typical post · 和你的典型作品对比 |
| Post › Engagement | **Comment topics**: what viewers ask or say most · 评论话题 |
| Another creator's post · 他人作品 | **Compared with your posts**: their metrics against your typical post · 对方数据和你的典型作品对比 |
| Topic search · 话题搜索 | **Topic scores**: popularity, relevance and competition · 热度、相关度、竞争度 |
| Home, Create | **Curated for me**: post ideas from your top post, trends and similar creators · 来自你的爆款、趋势和同类创作者的选题推荐 |
| Creator Assistant | Entry on Home with rotating questions; an Ask row under each AI card whose question follows what you select; chat screen · 首页入口轮播问题；每张 AI 卡底部的 Ask 行随选择换问题；对话页 |
| System · 系统 | One change-colour rule (up blue, down orange, flat grey), shared card frame, TikTok-native press feedback and sheet motion · 统一涨跌色、统一卡片外框、还原 TikTok 原生的按下反馈与弹层动效 |

### Linked score chart · 评分图联动

Tap a slice or its label to select an area. The centre score, the note under the chart, the matching Key metrics tile (on Content, the Top posts order) and the Ask row's question change together. Tap the selected area again, the centre or blank space in the card to go back.

点扇区或标签选中一个维度，中央分数、图下说明、下方 Key metrics 对应的卡（Content 页是 Top posts 排序）和 Ask 行的问题一起切换。再点已选中的项、图中央或卡片空白处恢复默认。

| Area · 维度 | Key metrics | Ask row · Ask 行 |
| --- | --- | --- |
| none · 未选中 | no tile selected · 不选卡 | rotating page questions · 轮播页面级问题 |
| Views | Post views | Which posts drove views? |
| Engagement | Likes | Why did my engagement drop? |
| Shares | Shares | How can I get more shares? |
| Visits | Profile views | How can I get more profile visits? |
| Rewards | Est. rewards | How are my rewards worked out? |

### Notes · 说明

- All data comes from one simulated account, so every screen shows the same numbers. 所有数据来自同一个模拟账号，各页面数字一致。
- Insight sentences on the cards were generated with Claude from that data. 卡片上的结论句由 Claude 基于这份数据生成。
- Creator Assistant replies are a UI preview for now; the live model will be connected on our side, and viewers do not need to set anything up. Creator Assistant 的回答目前是 UI 预览；之后由我们这边接入模型，使用者不需要任何设置。

---

## Code · 代码

**Stack / 技术栈：** React 18, Vite, zustand, framer-motion, Semi UI (selected components), Playwright. The build inlines everything into one HTML file (`vite-plugin-singlefile`).

构建时所有资源内联成一个 HTML 文件。

### Run · 运行

```bash
npm install
npm run dev        # http://localhost:5183/TikTokStudio_prototype.html
npm run docs       # build docs/index.html · 生成 docs/index.html
npm run test:e2e   # end-to-end flows, needs Google Chrome · 端到端测试，需要 Chrome
```

Node 18 or later. 需要 Node 18+。

### Structure · 目录

| Path · 路径 | Contents · 内容 |
| --- | --- |
| `docs/index.html` | Built single-file prototype · 构建好的单文件原型 |
| `TikTokStudio_prototype.html` | Development entry · 开发入口 |
| `src/App.jsx` | Routes and bottom-sheet registry · 路由与弹层登记 |
| `src/store.js` | App state and navigation · 状态与导航 |
| `src/data/` | Simulated account and aggregations · 模拟账号与聚合计算 |
| `src/insight/build.js` | Scores, insights and Ask questions, computed from the data · 由数据算出分数、洞察和 Ask 问题 |
| `src/insight/` | AI cards, Ask entries, Curated for me · AI 卡片、Ask 入口、推荐卡 |
| `src/screens/` | Home, Analytics, Create, Manage, Inbox, post analysis, Creator Assistant · 各页面与子流程 |
| `src/shell/`, `src/ui/` | Navigator, sheets, shared components, charts, icons · 导航、弹层、公共组件、图表、图标 |
| `e2e/flows.spec.js` | 14 task flows, launch to back · 14 条从启动到返回的任务动线 |
| `illustrations/` | Stock photos and welcome art · 图库照片与欢迎页插图 |

### Working on it · 修改须知

These apply to people and coding agents alike. 人和 coding agent 都适用。

- **Navigation:** `switchTab(tab)`, `push(route, params)`, `pop()`, `openSheet(type, props)`, `closeSheet()` from `src/store.js`. New pages go in `ROUTES` and new sheets in the `SheetHost` registry, both in `src/App.jsx`; wrap sheet content in `SheetFrame`. **导航**用 store 里的这些方法；新页面加进 `ROUTES`，新弹层加进 `SheetHost`，内容包在 `SheetFrame` 里。
- **Numbers:** compute values in `src/data/agg.js` or `src/insight/build.js` and render them; don't type numbers into components. **数字**在 `agg.js` 或 `build.js` 里算，组件只负责显示。
- **Buttons:** every visible button needs a `data-act` attribute; the tests use it. **按钮**都要有 `data-act`，测试靠它定位。
- **Cards:** AI cards use `CARD_STYLE`, `CardHead` and `KeyBlock` from `src/insight/CardParts.jsx`. **AI 卡**统一用 `CardParts.jsx` 里的外框组件。
- **Colours:** above +1% `#1765c4` on `#e5f0fc`, below −1% `#b4400c` on `#fdece3`, otherwise `#57585e` with no arrow. **涨跌色**规则如上。
- **Motion:** press = opacity 0.6, no scale; sheets 270 ms `cubic-bezier(0.45, 0.2, 0.6, 1)`; on-screen state changes 200–280 ms ease-out `[0.23, 1, 0.32, 1]`, exits faster; animate `transform` and `opacity` only; respect reduced motion. **动效**数值如上；只动 `transform` 和 `opacity`；尊重「减弱动态效果」。
- **Deep link:** `index.html#embed` shows the phone only; `window.__studioGo({ tab, aTab, push: [[route, params]], sheet: [type, props] })` jumps to a state. **直达**：`#embed` 只显示手机，`__studioGo` 跳到指定状态。
- **Before you finish:** run `npm run test:e2e`, then `npm run docs`. **改完**先跑测试，再生成 `docs/index.html`。

---

## Credits · 版权说明

Photos are stock images from [Pexels](https://www.pexels.com/license/); sources are in `illustrations/PHOTO_SOURCES.csv`. TikTok and TikTok Studio are trademarks of their owners. This is an independent design study and is not affiliated with TikTok.

照片来自 [Pexels](https://www.pexels.com/license/)，来源见 `illustrations/PHOTO_SOURCES.csv`。TikTok 与 TikTok Studio 是其所有者的商标。本项目为独立设计作品，与 TikTok 无关联。
