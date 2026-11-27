// AI-generated insight lines for the prototype (English).
// Written by prompt pack（未包含在本仓库） on the prototype's own data (build.js).
// Do not edit by hand: re-run the script after the data or the prompts change.
export default {
  "generated_at": "2026-11-27T00:57:13.832Z",
  "pack_version": "2026-11-26.16",
  "model": "claude-opus-5-5",
  "locale": "en-US",
  "surfaces": {
    "performance_summary": {
      "subject": null,
      "source": "model",
      "output": {
        "story": "carrier_mix",
        "basis": "carrier_mix Kyoto at dusk 50% of views, 33% of likes, likes per view about half of your other posts",
        "key": "Kyoto at dusk got half your views, at half your usual likes per view.",
        "lever": "detail",
        "rest": "Itinerary tops its comments, so show your route.",
        "refs": [
          "post:p44",
          "area:Engagement"
        ],
        "safety_flag": "none"
      }
    },
    "content_summary": {
      "subject": null,
      "source": "model",
      "output": {
        "story": "strongest_weakest",
        "basis": "follow_conversion_fell true: net followers ↓ 24.0% vs views ↓ 10.6%; top post Kyoto 45% of new followers",
        "key": "Net followers fell 24.0% while views fell only 10.6%.",
        "lever": "series",
        "rest": "Turn Kyoto at dusk into a series viewers can return to.",
        "refs": [
          "area:Followers",
          "area:Views",
          "post:p44"
        ],
        "safety_flag": "none"
      }
    },
    "topic_search": {
      "subject": "live shop sale",
      "source": "model",
      "output": {
        "story": "verdict",
        "basis": "demand high, fit high, room wide, worth_exploring true; angle sub:2 closest to travel content",
        "key": "This topic fits you and has room for your honest reviews.",
        "lever": "angle",
        "rest": "Try Tech & home finds, the angle closest to travel.",
        "refs": [
          "score:Relevance",
          "score:Competition",
          "sub:2"
        ],
        "safety_flag": "none"
      }
    },
    "post_overview": {
      "subject": "post:p44",
      "source": "model",
      "output": {
        "story": "largest_gap",
        "basis": "largest_metric_gap Likes per 1K views 35.8 vs 80.1, Reach 93 well above, key_moment 0:01 37% vs 33%",
        "key": "This post reached far more people, but likes per view fell by half.",
        "lever": "hook",
        "rest": "37% left at 0:01 against 33%, so open faster.",
        "refs": [
          "area:Reach",
          "area:Likes",
          "moment:0:01"
        ],
        "safety_flag": "none"
      }
    },
    "other_post": {
      "subject": "other:insp3",
      "source": "model",
      "output": {
        "story": "largest_gap",
        "basis": "largest_rate_gap Comments per 1K views 3.8 vs 2.2, 1.7×; top topic itinerary 32%",
        "key": "Per view, its biggest lead is Comments per 1K views, at 1.7×.",
        "lever": "detail",
        "rest": "Share your full itinerary, the top ask at 32%.",
        "refs": [
          "row:comments",
          "topic:itinerary"
        ],
        "safety_flag": "none"
      }
    },
    "curated_past": {
      "subject": null,
      "source": "model",
      "output": {
        "topic": "Kyoto at dusk: a one-day itinerary",
        "rows": [
          {
            "ref": "fact:views",
            "icon": "play",
            "text": "7.3K views since Nov 21, best this week."
          },
          {
            "ref": "fact:word",
            "icon": "chat",
            "text": "Top word in comments: itinerary."
          },
          {
            "ref": "fact:median",
            "icon": "chart",
            "text": "Median views: Kyoto posts 5.1K, the rest 3.5K."
          }
        ],
        "safety_flag": "none"
      }
    },
    "curated_similar": {
      "subject": null,
      "source": "model",
      "output": {
        "topic": "Amalfi by ferry: your full budget breakdown",
        "rows": [
          {
            "ref": "fact:gap",
            "icon": "chart",
            "text": "A similar post got 1.7× your comments per view."
          },
          {
            "ref": "fact:ask",
            "icon": "chat",
            "text": "Its viewers ask for the itinerary and budget."
          },
          {
            "ref": "fact:own",
            "icon": "play",
            "text": "Amalfi by ferry: 7.7K views, median post 3.5K."
          }
        ],
        "safety_flag": "none"
      }
    },
    "curated_trend": {
      "subject": null,
      "source": "model",
      "output": {
        "topic": "Travel tech finds: an honest review",
        "rows": [
          {
            "icon": "trend",
            "text": "Popularity 62: in demand right now."
          },
          {
            "icon": "target",
            "text": "Relevance to you 78: fits your content."
          },
          {
            "icon": "similar",
            "text": "Competition 36: room for new creators."
          }
        ],
        "safety_flag": "none"
      }
    },
    "weekly_report": {
      "subject": null,
      "source": "model",
      "output": {
        "insight": "New followers fell furthest from your last 4 weeks, down 74.3%.",
        "post_lines": [
          {
            "ref": "post:p44",
            "text": "Kyoto at dusk brought 27 new followers, against 11 usually."
          }
        ],
        "refs": [
          "m:followers",
          "post:p44"
        ]
      }
    },
    "creator_assistant": {
      "subject": "How can I get more people to react?",
      "source": "model",
      "output": {
        "insight": "Engagement fell the most, and your Kyoto post pulled the rate down.",
        "bullets": [
          "Kyoto at dusk brought 50% of your views but only 33% of your likes.",
          "Its likes per view were about half of your other posts'.",
          "It is still your most liked post, and itinerary is its top comment word.",
          "Worth testing: show your Kyoto itinerary on screen and ask which stop to skip."
        ],
        "module": {
          "id": "top_posts"
        },
        "follow_ups": [
          "Why did my rewards drop?",
          "Compare this week with last week"
        ],
        "start_creating": null,
        "refs": [
          "area:Engagement",
          "m:Engagement:0",
          "d:Engagement",
          "d:Views",
          "post:p44"
        ],
        "safety_flag": "none"
      }
    }
  }
};
