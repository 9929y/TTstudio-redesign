// Peer comparison for the shared radar (Performance summary, Post summary).
// Every number is computed in build.js from the seeded cohort in data/peers.js;
// this module only names the two entry points and the info drawer copy (status bands from radarStats.js).
import { accountRadar, postRadar } from './build.js';
import { COHORT } from '../data/peers.js';
import { statusRule } from './radarStats.js';

export const accountPeerComparison = () => accountRadar();
export const videoPeerComparison = (post) => postRadar(post);

export function peerInfo(scope) {
  return [
    { icon: 'insights', ic: 'insights', t: 'Compared with', lines: [scope === 'post'
      ? `Posts of a similar length by ${COHORT.phrase}, measured over the same time after posting.`
      : `${COHORT.phrase[0].toUpperCase()}${COHORT.phrase.slice(1)}, over the same 7 days.`] },
    { icon: 'info', ic: 'info', t: 'How to read this chart', lines: ['The solid line is your data. The dashed line is a typical one in that group.', statusRule()] },
    { icon: 'info', ic: 'info', t: 'Prototype data', lines: ['Your metrics use the existing sample account or video. Comparison-group values are simulated for this prototype.'] },
  ];
}
