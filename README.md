# TTstudio-redesign

A TikTok Studio redesign for iPhone, built as a working React 18 + Vite prototype.
(TikTok Studio iPhone 改版的可交互原型)

- **Live prototype:** https://9929y.github.io/TTstudio-redesign/
- **Prompt design notes:** https://9929y.github.io/TTstudio-redesign/prompt-design/

## Design thinking

Creators can see their numbers, but not what to do next. The redesign turns analytics into decisions:

- **Data → useful metrics:** each number is compared with your own baseline and with similar creators.
- **Metrics → AI insight:** combine the card's data, pick the 1–3 findings that decide the result, and explain why.
- **Insight → action:** one next step, either start creating or ask Creator Assistant.
- **Trust built in:** AI label, data period and safety are part of every insight.

## Run it

```bash
git clone https://github.com/9929y/TTstudio-redesign.git
cd TTstudio-redesign
npm install
npm run dev        # open http://localhost:5183/TikTokStudio_prototype.html
```

Needs Node 18 or later.

| Command | What it does |
| --- | --- |
| `npm run build` | Builds one self-contained file: `dist-public/TikTokStudio_prototype.html` |
| `npm run docs` | Runs the build and copies it to `docs/index.html` (served by GitHub Pages) |
| `npm run test:e2e` | Playwright end-to-end flows (needs Google Chrome) |

**Open without building:** `docs/index.html` is a single self-contained file. Open it directly in a browser.

**Screen size:** the phone is laid out for a 393pt-wide iPhone view. In a browser wider than 860px it sits in a phone frame; narrower, it fills the screen.

## Where things are

- `src/screens/` pages (Home, Analytics, Create, Manage, post analysis, Creator Assistant)
- `src/insight/` AI cards and the logic that builds their data
- `src/data/` sample account data
- `e2e/` Playwright tests
- `docs/` the GitHub Pages build and the prompt design page

## Credits

Photos are stock images from [Pexels](https://www.pexels.com/license/); sources are in `illustrations/PHOTO_SOURCES.csv`. TikTok and TikTok Studio are trademarks of their owners. This is an independent design study and is not affiliated with TikTok.
