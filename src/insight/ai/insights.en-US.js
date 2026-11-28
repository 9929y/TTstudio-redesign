// AI-generated insight lines for the prototype (English).
// Written by _research/20_redesign/prompt_pack/scripts/export_prototype.js on the prototype's own data (build.js).
// Do not edit by hand: re-run the script after the data or the prompts change.
// 2026-11-27 hand edit (Yanice): the five KeyBlock surfaces (performance_summary, content_summary, topic_search,
// post_overview, other_post) now carry key + exactly 2 bullets (fact, then a next-step suggestion), rest "" and next null.
// Second pass (reviewer fixes): performance_summary bullets follow the likes finding; content_summary no longer repeats it.
// Port these to the prompt pack before the next export, or they will be overwritten.
// 2026-11-27 night hand edit (Yanice: "paragraph 2–3 sentences, 1–2 bullets"): five KeyBlock surfaces rewritten from pack .8 output; no links, no semicolons.
// 2026-11-27 night: performance_summary = raw model output, pack .8 live run 1 (Yanice chose it over the hand edit).
// 2026-11-27 (Yanice: scores now compare with similar creators, not the previous 7 days): content_summary rest drops the
// week-over-week sentence; post_overview is not used until the pack is re-run with the similar-creator baseline (build.js).
// 2026-11-28 QA: post_overview and other_post regenerated on pack .11 ("similar videos", no percent, bullets ≤ 38 characters).
// 2026-11-28 hand edit (Yanice: "summary must be more useful than the content below; no 6 in 10 / 2 in 3; say why it is
// good or bad and what to do"): performance_summary, content_summary (no bullets), topic_search, post_overview, other_post.
// Each is marked made.hand_edit = 2026-11-28 and raw_model_output = false. The prompt pack is unchanged (owned elsewhere):
// port these to the pack before the next export, or they will be overwritten.
// 2026-11-28 (Yanice: cards with a chart below the summary get a paragraph only): the five KeyBlock surfaces above
// have bullets: [], and the next step is the last sentence.
// 2026-11-28 ranking-signal pass (08_tiktok_ranking_signals.md): each chart-card summary ties the data to one signal
// (made.signal); curated_past / curated_trend / curated_similar titles and reasons rewritten. Hand edits, pack unchanged.
export default {
  "generated_at": "2026-11-27T23:54:05.039Z",
  "pack_version": "2026-11-28.11",
  "model": "claude-opus-5-5",
  "locale": "en-US",
  "surfaces": {
    "performance_summary": {
      "subject": null,
      "source": "model",
      "output": {
        "story": "contrast",
        "basis": "radar status Views Strong (60), Shares Average (45); signal shares",
        "key": "Views are strong, but shares are only average.",
        "lever": "detail",
        "rest": "Posts people pass on may help you reach more viewers, so add a route map they can send.",
        "bullets": [],
        "refs": [
          "area:Shares",
          "area:Engagement",
          "post:p44"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-28.10",
        "module": "account_overview 1.8.0",
        "date": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit (Yanice: plain, commercial, actionable; no \"6 in 10\"; why good or bad and what to do). Prompt pack unchanged. Paragraph only: a chart sits under this summary, so no bullets (Yanice 2026-11-28). Ranking signal: shares / sends (08_tiktok_ranking_signals.md).",
        "hand_edit": "2026-11-28",
        "signal": "shares / sends"
      }
    },
    "content_summary": {
      "subject": null,
      "source": "model",
      "output": {
        "story": "contrast",
        "basis": "Followers 14 of 30 against typical 15; p44 the only new post, first second 37 left vs 33 on similar videos",
        "key": "Followers are just under typical.",
        "lever": "series",
        "rest": "More viewers left Kyoto at dusk in the first second than on similar videos, so open on the finished shot.",
        "bullets": [],
        "refs": [
          "area:Followers",
          "post:p44"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-28.10",
        "module": "content_summary 1.9.0",
        "date": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit (Yanice: content summary is 2–3 sentences, no bullets). Prompt pack unchanged. Paragraph only (chart below). Ranking signal: first-seconds hook (08_tiktok_ranking_signals.md).",
        "hand_edit": "2026-11-28",
        "signal": "first-seconds hook"
      }
    },
    "topic_search": {
      "subject": "live shop sale",
      "source": "model",
      "output": {
        "story": "verdict",
        "basis": "fit high, proof p33 carry-on finds above your median views; sub-topics Fashion & seasonal promos most posted, Tech & home finds next",
        "key": "Your carry-on finds beat your usual views, so this suits you.",
        "lever": "angle",
        "rest": "Go live with travel gear as tech & home finds, less crowded than fashion.",
        "bullets": [],
        "refs": [
          "score:Relevance",
          "post:p33",
          "sub:2"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-28.10",
        "module": "topic_search 1.8.0",
        "date": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit (Yanice: no scores or ratios in the text; say why it fits and what to do). Prompt pack unchanged. Paragraph only: a chart sits under this summary, so no bullets (Yanice 2026-11-28).",
        "hand_edit": "2026-11-28"
      }
    },
    "post_overview": {
      "subject": "post:p44",
      "source": "model",
      "output": {
        "story": "contrast",
        "basis": "radar Reach Strong (86), Likes Behind (4); top comment word itinerary",
        "key": "Kyoto at dusk reached far more people than similar videos but got far fewer likes.",
        "lever": "series",
        "rest": "Reply to the itinerary asks with a video and pin Part 2.",
        "bullets": [],
        "refs": [
          "area:Reach",
          "area:Likes",
          "post:p44"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-28.11",
        "module": "post_overview 1.8.0",
        "date": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit (Yanice: \"similar videos\", no ratios; why good or bad and what to do). Prompt pack unchanged. Paragraph only: a chart sits under this summary, so no bullets (Yanice 2026-11-28). Ranking signal: comments and video replies (08_tiktok_ranking_signals.md).",
        "hand_edit": "2026-11-28",
        "signal": "comments and video replies"
      }
    },
    "other_post": {
      "subject": "other:insp3",
      "source": "model",
      "output": {
        "story": "largest_gap",
        "basis": "Favorites 17.1 vs 12.4 and Comments 3.8 vs 2.2 per 1K views; caption full receipts",
        "key": "@budgetroutes’ viewers save and comment more than yours.",
        "lever": "detail",
        "rest": "List every cost on screen and end with a question, like their receipts post.",
        "bullets": [],
        "refs": [
          "row:comments",
          "row:favorites",
          "topic:itinerary",
          "topic:budget"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-28.11",
        "module": "other_post 1.8.0",
        "date": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit (Yanice: no \"1.7×\"; bullets ≤ 38 characters in the sheet). Prompt pack unchanged. Paragraph only: a chart sits under this summary, so no bullets (Yanice 2026-11-28). Ranking signal: saves and comments (08_tiktok_ranking_signals.md).",
        "hand_edit": "2026-11-28",
        "signal": "saves and comments"
      }
    },
    "curated_past": {
      "subject": null,
      "source": "model",
      "output": {
        "topic": "Kyoto at dusk, part 2: the itinerary you asked for",
        "rows": [
          {
            "ref": "fact:share",
            "icon": "play",
            "text": "Half your views came from Kyoto at dusk."
          },
          {
            "ref": "fact:word",
            "icon": "chat",
            "text": "Its comments ask for the itinerary most."
          },
          {
            "ref": "signal:saves",
            "icon": "bookmark",
            "text": "A day plan is worth saving and sending."
          }
        ],
        "safety_flag": "none"
      },
      "made": {
        "pack_version": "2026-11-27.6",
        "module": "topic_card 1.2.0",
        "date": "2026-11-28",
        "hand_edit": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit (Yanice: more attractive Curated for me copy tied to ranking signals). Prompt pack unchanged."
      }
    },
    "curated_similar": {
      "subject": null,
      "source": "model",
      "output": {
        "topic": "Amalfi by ferry on a budget: every cost listed",
        "rows": [
          {
            "ref": "fact:gap",
            "icon": "bookmark",
            "text": "@budgetroutes’ viewers save more."
          },
          {
            "ref": "fact:ask",
            "icon": "chat",
            "text": "Their viewers ask for costs and routes."
          },
          {
            "ref": "fact:draft",
            "icon": "play",
            "text": "Your Amalfi draft lists every cost."
          }
        ],
        "safety_flag": "none"
      },
      "made": {
        "pack_version": "2026-11-27.6",
        "module": "topic_card 1.2.0",
        "date": "2026-11-28",
        "hand_edit": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit (Yanice: more attractive Curated for me copy tied to ranking signals). Prompt pack unchanged."
      }
    },
    "curated_trend": {
      "subject": null,
      "source": "model",
      "output": {
        "topic": "Worth the carry-on space? Honest tech test",
        "rows": [
          {
            "icon": "trend",
            "text": "Live shop sales are in demand right now."
          },
          {
            "icon": "similar",
            "text": "Your shares are only average so far."
          },
          {
            "icon": "target",
            "text": "A packing list is easy to send a friend."
          }
        ],
        "safety_flag": "none"
      },
      "made": {
        "pack_version": "2026-11-27.6",
        "module": "topic_card 1.2.0",
        "date": "2026-11-28",
        "hand_edit": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit (Yanice: more attractive Curated for me copy tied to ranking signals). Prompt pack unchanged."
      }
    },
    "weekly_report": {
      "subject": null,
      "source": "model",
      "output": {
        "insight": "Fewer people followed you than in a usual week.",
        "post_lines": [
          {
            "ref": "post:p44",
            "text": "Kyoto at dusk brought 27 new followers, against 11 usually."
          }
        ],
        "refs": [
          "m:followers",
          "post:p44"
        ],
        "bullets": [
          "Kyoto at dusk got 7.3K views.",
          "Post Kyoto Part 2 Thursday around 6 PM."
        ]
      },
      "made": {
        "pack_version": "2026-11-27.6",
        "module": "weekly_report 1.4.0",
        "date": "2026-11-27"
      }
    },
    "creator_assistant": {
      "subject": "How can I get more people to react?",
      "source": "model",
      "output": {
        "insight": "Your likes and comments fell the most, mostly tied to one big post.",
        "bullets": [
          "Likes fell 38.2% and comments 25.5% from the previous 7 days.",
          "Kyoto at dusk, when the lanterns come on brought 50% of views, 33% of likes.",
          "For every view, it got about half the likes your other posts get.",
          "Itinerary is its top comment word, so try a follow-up that lays out the route."
        ],
        "module": {
          "id": "key_metrics"
        },
        "follow_ups": [
          "Which post did best this week?",
          "Why are my shares doing well?"
        ],
        "start_creating": null,
        "refs": [
          "area:Engagement",
          "m:Engagement:0",
          "m:Engagement:1",
          "d:Engagement",
          "d:Views",
          "post:p44"
        ],
        "safety_flag": "none"
      },
      "made": {
        "pack_version": "2026-11-27.6",
        "module": "creator_assistant 1.2.0",
        "date": "2026-11-27"
      }
    }
  }
};
