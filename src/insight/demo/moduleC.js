// Demo content for this module. `D` is the `D` constant of design_final/post_topic/project/IMS-C-Blue.dc.html, copied verbatim.
// A later step replaces this object with an API-generated one of the same shape; the component reads everything from it.
// `ui` holds the copy that the dc file hard-codes in its markup / renderVals instead of in D (same wording).
const D = {
  "title": "About these scores",
  "key": "This topic fits your content and has room to explore.",
  "rest": " Try a shopping find through your usual review format.",
  "rows": [
    {
      "name": "Popularity",
      "score": 62,
      "color": "#0d4a96",
      "ic": "flame",
      "note": "is 62: steady interest, with searches and views above the middle.",
      "desc": "Based on search volume and average views, this reflects how interested viewers are in the topic. A higher score means more demand; a lower score may mean a niche or emerging topic."
    },
    {
      "name": "Relevance to you",
      "score": 78,
      "color": "#5a9ff0",
      "ic": "star",
      "note": "is 78: it matches what you post and what your viewers watch.",
      "desc": "How closely the topic matches the posts you make and the posts your viewers watch. A higher score means it fits your account better."
    },
    {
      "name": "Competition",
      "score": 36,
      "color": "#1765c4",
      "ic": "people",
      "note": "is 36: fewer creators cover it, so there is room to stand out.",
      "desc": "Reflects how much content already exists for the topic. A lower score means more room for new content; a higher score means the topic is already well covered."
    }
  ]
};

const ui = {
  infoLabel: "About these scores",
  // first ⓘ drawer row, before one row per score
  intro: { ic: "insights", t: "Scores", lines: ["Each score runs from 0 to 100 and describes this topic in TikTok\u2019s current content ecosystem."] },
};

export const moduleC = { ...D, ui };
export default moduleC;
