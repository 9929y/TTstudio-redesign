# TikTok Studio prototype

A code-to-design prototype of a TikTok Studio (iPhone) redesign. It is built in React so the interactions, motion and data can be judged in a real phone frame, not only on a canvas.

**Open it:** download or clone this repo and double-click `docs/index.html`. It is one self-contained file and works offline.

## What to look at

- **AI insight cards.** Performance summary (Analytics › Overview), Content summary (Analytics › Content) and Post summary (a post's analysis) each show a score chart, a one-line insight and an Ask Creator Assistant row.
- **Linked score chart.** Tap a slice or its label to select an area. The centre score, the one-line note, the matching Key metrics tile (or the Top posts order on Content) and the Ask row's question change together. Tap the same area again, the centre or the blank space in the card to go back.
- **Viewer and Follower summaries, Comment topics, Curated for me.** One-sentence insights on the audience tabs, topic summaries for comments, and recommendation cards on Home and Create.
- **Creator Assistant.** The entry points and the chat are a UI reference. Replies are scripted from the prototype's sample data and are not generated live (see the note in the app).

All numbers come from one simulated account, so every screen agrees with every other screen. Scores are computed from that data: each area ranks this week against the account's own previous 12 weeks.

## Run the source

```bash
npm install
npm run dev
```

Then open http://localhost:5183/TikTokStudio_prototype.html.

```bash
npm run docs        # rebuild docs/index.html
npm run test:e2e    # end-to-end task flows (Playwright, Chrome)
```

## Structure

| Path | What it holds |
| --- | --- |
| `src/data/` | The simulated account: posts, daily metrics, audience |
| `src/insight/build.js` | Every insight, score and sentence, computed from the data |
| `src/insight/` | The AI cards (score charts, Ask rows, Curated for me, Comment topics) |
| `src/insight/ai/` | Insight sentences generated with Claude ahead of time from the same data |
| `src/screens/` | Home, Analytics, Create, Manage, Inbox and the sub-flows |
| `e2e/flows.spec.js` | Task flows from launch to back, including the score chart linkage |

## Not connected yet

Creator Assistant does not call a model. Connecting it needs a small proxy that keeps the API key out of the page (for example a Cloudflare Worker), plus the agent harness a real assistant needs: access to account data, tools and safety checks.

## Credits

Photos are stock images from [Pexels](https://www.pexels.com/license/); sources are listed in `illustrations/PHOTO_SOURCES.csv`. TikTok and TikTok Studio are trademarks of their owners. This is an independent design study with simulated data and is not affiliated with TikTok.
