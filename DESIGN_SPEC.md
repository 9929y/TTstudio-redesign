# Design & interaction specification · 设计与交互规范

## Design scope · 设计范围

The redesign adds AI insights where creators already look at their data, and links them to Creator Assistant.

本次改版在创作者原本查看数据的位置加入 AI 洞察，并把它们和 Creator Assistant 连起来。

| Area · 范围 | What was designed · 设计内容 |
| --- | --- |
| Analytics › Overview | **Performance summary**: five-area peer-comparison radar chart, AI insight (a 2–3 sentence paragraph and 1–2 bullets, the last one a next step), Ask Creator Assistant row · 五维同类创作者对比雷达图、AI 洞察（2–3 句段落 + 1–2 条要点，最后一条是下一步）、Ask 行 |
| Analytics › Content | **Content summary**: three-area horizontal score bars for content performance · 三维横向评分条 |
| Analytics › Viewers / Followers | **Viewer / Follower summary**: audience insight in the same paragraph-and-bullets format, Ask Creator Assistant row; date picker moved into Key metrics · 同样格式的观众洞察和 Ask 行；日期选择移到 Key metrics |
| Post analysis · 作品分析 | **Post summary**: five-area radar comparing with similar videos · 五维同类视频对比雷达图 |
| Post › Engagement | **Comment topics**: what viewers ask or say most · 评论话题 |
| Another creator's post · 他人作品 | **Compared with your posts**: their metrics against your typical post · 对方数据和你的典型作品对比 |
| Topic search · 话题搜索 | **Topic scores**: popularity, relevance and competition · 热度、相关度、竞争度 |
| Home, Create | **Curated for me**: post ideas from your top post, trends and similar creators · 来自你的爆款、趋势和同类创作者的选题推荐 |
| Creator Assistant | Entry on Home and below the Inbox filters with rotating questions; an Ask row under each AI card whose question follows what you select; chat screen · 首页和 Inbox 筛选 Tab 下方入口轮播问题；每张 AI 卡底部的 Ask 行随选择换问题；对话页 |
| System · 系统 | One change-colour rule (up blue, down orange, flat grey), shared card frame, TikTok-native press feedback and sheet motion · 统一涨跌色、统一卡片外框、还原 TikTok 原生的按下反馈与弹层动效 |

### Linked score chart · 评分图联动

Tap an area tab in the Overview / Post summary radar, or a score bar in Content summary. The selected metric and comparison values, matching Key metrics tile (on Content, the Top posts order), and Ask row question update together. Tap the selected area again or the card’s blank space to reset.

点击 Overview / Post summary 的维度 Tab 或 Content summary 的横条，联动对应指标、Key metrics（Content 页是 Top posts 排序）与 Ask 行。再点已选项或卡片空白处恢复默认。

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


### Shared UI rule: blue selection pills · 蓝色筛选胶囊规范

Use the existing `Pills variant="blue"` for metric, ranking and filter chips. Do not create a page-specific colour variant.

| State | Token / value | Usage |
| --- | --- | --- |
| Selected text | `--c-blue-selected` / `#0D4A96` | Every blue selection pill, including Top posts, audience breakdowns, active times, Home trends, Inbox filters, and reward filters |
| Selected background | `--c-blue-weak` / `#E8F2FE` | The same pale blue selection surface |
| Unselected | Existing neutral pill background and secondary label | Preserve the component's neutral state |
| Keyboard focus | `--c-blue-selected` | Visible 2px inset focus ring, including the expanded touch rail |

选中态的文字统一为深蓝，底色统一为浅蓝；焦点描边也使用同一深蓝色。所有 `Pills variant="blue"` 实例共享此规则，包括 Inbox。日期黑色胶囊、黑色导航文字 Tab 和数据图表的蓝色不受此规则影响。颜色只在 `src/tokens.css` 定义，由 `src/app.css` 的共享组件样式消费。
