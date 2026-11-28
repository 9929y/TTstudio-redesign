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
// 2026-11-28 copy pass 2 (Yanice: "not insightful"; data must not overlap the text): the five chart-card surfaces now
// explain why from this creator's own posts (Kyoto at dusk is 12 s, too short for Creator Rewards; it was the only new
// post; carry-on finds; what the comments ask for) and give one concrete step. No status words (Strong /
// Typical / Room to grow), ratios or %. curated_trend row 2 drops "average". other_post ("Inspire me") reads what the
// comments reveal people want (its rows show Engagement and Reach). Core rule (Yanice): every sentence is an
// interpretation or a recommendation; facts only as the reason inside one. Each fits 3 lines at 393pt (about 120
// characters, measured in the build). Hand edits, pack unchanged: port before re-export.
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
        "story": "why",
        "basis": "Kyoto at dusk (p44, 12 s) top post for views, shares and new followers this week; Creator Rewards only count posts over 1 min (rewardsSplit: duration ≥ 60); draft d-seed-1 Kyoto Part 2",
        "key": "Make Kyoto Part 2 over a minute, since the 12-second original drew your views but can’t count toward Creator Rewards.",
        "lever": "duration",
        "rest": "",
        "bullets": [],
        "refs": [
          "post:p44",
          "area:Rewards",
          "draft:d-seed-1"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-28.10",
        "module": "account_overview 1.8.0",
        "date": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit, copy pass 2 (Yanice: summaries must explain why with this creator’s own posts and say what to do; never restate the chart; no status words, ratios or %). Prompt pack unchanged. Paragraph only (chart below).",
        "hand_edit": "2026-11-28",
        "signal": "Creator Rewards qualified views (>1 min) and watch time"
      }
    },
    "content_summary": {
      "subject": null,
      "source": "model",
      "output": {
        "story": "why",
        "basis": "p44 the only post published in the 7 days; brought 27 of 60 new followers (most); draft d-seed-1 Kyoto Part 2",
        "key": "With one new post this week, your growth rode on Kyoto at dusk alone.",
        "lever": "cadence",
        "rest": "Posting Part 2 within days may keep it going.",
        "bullets": [],
        "refs": [
          "post:p44",
          "area:Followers",
          "draft:d-seed-1"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-28.10",
        "module": "content_summary 1.9.0",
        "date": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit, copy pass 2 (Yanice: summaries must explain why with this creator’s own posts and say what to do; never restate the chart; no status words, ratios or %). Prompt pack unchanged. Paragraph only (chart below).",
        "hand_edit": "2026-11-28",
        "signal": "posting rhythm and series"
      }
    },
    "topic_search": {
      "subject": "live shop sale",
      "source": "model",
      "output": {
        "story": "why",
        "basis": "p33 carry-on finds 6.6K views vs 3.6K public median; sub-topics Fashion & seasonal promos 43%, Tech & home finds 32%",
        "key": "Viewers liked your carry-on finds, so go live with that gear as Tech & home finds, a less crowded spot than Fashion.",
        "lever": "angle",
        "rest": "",
        "bullets": [],
        "refs": [
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
        "note": "Hand edit, copy pass 2 (Yanice: summaries must explain why with this creator’s own posts and say what to do; never restate the chart; no status words, ratios or %). Prompt pack unchanged. Paragraph only (chart below).",
        "hand_edit": "2026-11-28"
      }
    },
    "post_overview": {
      "subject": "post:p44",
      "source": "model",
      "output": {
        "story": "why",
        "basis": "p44 duration 12 s, likes rank 4 among similar videos; top comment word itinerary",
        "key": "At 12 seconds, Kyoto at dusk gives viewers little to act on.",
        "lever": "video_reply",
        "rest": "Reply to the itinerary asks with a video of the route.",
        "bullets": [],
        "refs": [
          "post:p44",
          "area:Likes",
          "word:itinerary"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-28.11",
        "module": "post_overview 1.8.0",
        "date": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit, copy pass 2 (Yanice: summaries must explain why with this creator’s own posts and say what to do; never restate the chart; no status words, ratios or %). Prompt pack unchanged. Paragraph only (chart below).",
        "hand_edit": "2026-11-28",
        "signal": "comments and video replies"
      }
    },
    "other_post": {
      "subject": "other:insp3",
      "source": "model",
      "output": {
        "story": "borrow",
        "basis": "comment topics: Asking for the itinerary, Budget questions (otherPostTopics insp3); the card rows show Engagement and Reach, so the summary reads the comments; draft d-seed-1 Kyoto Part 2",
        "key": "People here want to copy the trip, not just watch it.",
        "lever": "borrow",
        "rest": "Show the route and costs on screen in your Kyoto Part 2.",
        "bullets": [],
        "refs": [
          "topic:itinerary",
          "topic:budget",
          "draft:d-seed-1"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-28.11",
        "module": "other_post 1.8.0",
        "date": "2026-11-28",
        "raw_model_output": false,
        "note": "Hand edit, copy pass 2 (Yanice: summaries must explain why with this creator’s own posts and say what to do; never restate the chart; no status words, ratios or %). Prompt pack unchanged. Paragraph only (chart below).",
        "hand_edit": "2026-11-28",
        "signal": "saves and shares"
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
            "text": "One post brought most of your shares."
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
        "note": "Hand edit (Yanice: more attractive Curated for me copy tied to ranking signals). Prompt pack unchanged. 2026-11-28 copy pass 2: no “average” status word."
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
