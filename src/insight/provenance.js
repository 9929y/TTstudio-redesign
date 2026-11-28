// 2026-11-28 AI provenance line under every insight block (KeyBlock): "Based on data from <window>" + Helpful / Not helpful.
// The builders in build.js know which date window each card's numbers use; the card components only pass the
// insight's key / rest / bullets / next to KeyBlock. So each builder files its window and feedback data-act prefix
// against the bullets array it returns (a WeakMap: nothing is added to the insight objects or to the AI snapshot), and
// KeyBlock looks it up with the bullets prop it already receives. KeyBlock's own basis / act props win when a caller
// passes them.
const META = new WeakMap();

export function setProvenance(insight, meta) {
  if (insight && Array.isArray(insight.bullets)) META.set(insight.bullets, meta);
  return insight;
}

export const provenanceOf = (bullets) => (Array.isArray(bullets) ? META.get(bullets) : undefined) || null;
