// AI-generated insight lines for the prototype (English).
// Written by _research/20_redesign/prompt_pack/scripts/export_prototype.js on the prototype's own data (build.js).
// Do not edit by hand: re-run the script after the data or the prompts change.
// 2026-11-27 hand edit (Yanice): the five KeyBlock surfaces (performance_summary, content_summary, topic_search,
// post_overview, other_post) now carry key + exactly 2 bullets (fact, then a next-step suggestion), rest "" and next null.
// Second pass (reviewer fixes): performance_summary bullets follow the likes finding; content_summary no longer repeats it.
// Port these to the prompt pack before the next export, or they will be overwritten.
// 2026-11-27 night hand edit (Yanice: "paragraph 2–3 sentences, 1–2 bullets"): five KeyBlock surfaces rewritten from pack .8 output; no links, no semicolons.
// 2026-11-27 night: performance_summary = raw model output, pack .8 live run 1 (Yanice chose it over the hand edit).
export default {
  "generated_at": "2026-11-27T23:54:05.039Z",
  "pack_version": "2026-11-27.6",
  "model": "claude-opus-5-5",
  "locale": "en-US",
  "surfaces": {
    "performance_summary": {
      "subject": null,
      "source": "model",
      "output": {
        "story": "carrier_mix",
        "basis": "carrier_mix Kyoto at dusk 50% of views, 33% of likes, about half the likes per view, still most liked",
        "key": "Kyoto at dusk brought half your views but only a third of your likes.",
        "lever": "series",
        "rest": "It got 260 of your 783 likes, still your most liked post. Its viewers liked it about half as often as viewers of your other posts.",
        "bullets": [
          "Itinerary is the top word in its comments.",
          "Post Kyoto Part 2 Thursday around 6 PM."
        ],
        "refs": [
          "post:p44",
          "area:Views",
          "area:Engagement",
          "area:Shares"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-27.8",
        "module": "account_overview 1.6.0",
        "date": "2026-11-27"
      }
    },
    "content_summary": {
      "subject": null,
      "source": "model",
      "output": {
        "story": "strongest_weakest",
        "basis": "net_followers_change ↓ 24.0% vs views_change ↓ 10.6%, follow_conversion_fell true; Kyoto at dusk 27 of 60 followers",
        "key": "Kyoto at dusk brought 27 of your 60 new followers, more than any other post.",
        "lever": "series",
        "rest": "Your Positano post brought 15 more. You gained fewer followers than the week before, while views only dipped a little.",
        "bullets": [
          "Follow it up with Kyoto Part 2."
        ],
        "refs": [
          "area:Followers",
          "area:Views",
          "post:p44",
          "post:p41"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-27.8",
        "module": "content_summary 1.6.0",
        "date": "2026-11-27"
      }
    },
    "topic_search": {
      "subject": "live shop sale",
      "source": "model",
      "output": {
        "story": "verdict",
        "basis": "worth_exploring true, fit high, proof carry-on finds about twice usual views, room wide, advice angle sub:2",
        "key": "Your carry-on finds got about twice your usual views, so this topic fits you.",
        "lever": "angle",
        "rest": "Tech & home finds is the closest match to your travel posts. Few creators post it yet.",
        "bullets": [
          "Try Tech & home finds as an honest review."
        ],
        "refs": [
          "score:Relevance",
          "post:p33",
          "sub:2",
          "sub:1"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-27.8",
        "module": "topic_search 1.7.0",
        "date": "2026-11-27"
      }
    },
    "post_overview": {
      "subject": "post:p44",
      "source": "model",
      "output": {
        "story": "largest_gap",
        "basis": "Reach 93 almost 3 times; gap Likes/1K 35.8 vs 80.1; 260 vs 210 likes; comments/1K 2.7 vs 2.1",
        "key": "About 3 times your usual viewers saw Kyoto at dusk, but a smaller share of them liked it.",
        "lever": "series",
        "rest": "It still got 260 likes, against about 210 on a usual post. 37% left in the first second, a little more than the 33% who usually do.",
        "bullets": [
          "Open Kyoto Part 2 on the lanterns.",
          "Post it Thursday around 6 PM."
        ],
        "refs": [
          "area:Reach",
          "area:Likes"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-27.8",
        "module": "post_overview 1.5.0",
        "date": "2026-11-27"
      }
    },
    "other_post": {
      "subject": "other:insp3",
      "source": "model",
      "output": {
        "story": "largest_gap",
        "basis": "largest_rate_gap Comments 3.8 vs 2.2; itinerary 32% of comments; your_match Amalfi, itinerary",
        "key": "People comment on @budgetroutes' post much more often than on yours.",
        "lever": "detail",
        "rest": "About a third of its comments ask for the itinerary. Itinerary is also the top word on your Amalfi post.",
        "bullets": [
          "Post your Amalfi itinerary with the budget.",
          "Post it Thursday around 6 PM."
        ],
        "refs": [
          "row:comments",
          "topic:itinerary",
          "post:p28"
        ],
        "safety_flag": "none",
        "next": null
      },
      "made": {
        "pack_version": "2026-11-27.8",
        "module": "other_post 1.6.0",
        "date": "2026-11-27"
      }
    },
    "curated_past": {
      "subject": null,
      "source": "model",
      "output": {
        "topic": "Kyoto at dusk: a one-day itinerary",
        "rows": [
          {
            "ref": "fact:word",
            "icon": "chat",
            "text": "Top word in comments: itinerary."
          },
          {
            "ref": "fact:median",
            "icon": "chart",
            "text": "Kyoto posts get 5.1K views, the rest 3.5K."
          },
          {
            "ref": "fact:time",
            "icon": "chart",
            "text": "Viewers most active Thursday around 6 PM."
          }
        ],
        "safety_flag": "none"
      },
      "made": {
        "pack_version": "2026-11-27.6",
        "module": "topic_card 1.2.0",
        "date": "2026-11-27"
      }
    },
    "curated_similar": {
      "subject": null,
      "source": "model",
      "output": {
        "topic": "Amalfi by ferry: full itinerary and budget",
        "rows": [
          {
            "ref": "fact:gap",
            "icon": "chart",
            "text": "@budgetroutes' post got comments 1.7× as often."
          },
          {
            "ref": "fact:ask",
            "icon": "chat",
            "text": "Their viewers ask for the itinerary and budget."
          },
          {
            "ref": "fact:own",
            "icon": "play",
            "text": "Your Amalfi by ferry: 7.7K views, usual 3.5K."
          }
        ],
        "safety_flag": "none"
      },
      "made": {
        "pack_version": "2026-11-27.6",
        "module": "topic_card 1.2.0",
        "date": "2026-11-27"
      }
    },
    "curated_trend": {
      "subject": null,
      "source": "model",
      "output": {
        "topic": "Honest review: travel tech worth packing",
        "rows": [
          {
            "icon": "trend",
            "text": "In demand right now."
          },
          {
            "icon": "target",
            "text": "Close to your carry-on finds."
          },
          {
            "icon": "similar",
            "text": "Room for new creators."
          }
        ],
        "safety_flag": "none"
      },
      "made": {
        "pack_version": "2026-11-27.6",
        "module": "topic_card 1.2.0",
        "date": "2026-11-27"
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
