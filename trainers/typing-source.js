// Where Test words come from: a word pack, plus the punctuation / numbers switches (like Monkeytype).
// makeSource({ pack, punct, nums }) → next(n): the next n words as one string (keeps sentence state
// between calls, so text added while you type continues the same sentence).
import { PACKS } from './packs/index.js';

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = p => Math.random() < p;
const cap = w => w.charAt(0).toUpperCase() + w.slice(1);

export function makeSource({ pack = 'en', punct = false, nums = false } = {}) {
  const P = PACKS[pack] || PACKS.en;
  const usePunct = punct && !P.code, useNums = nums && !P.code;
  let last = null, inSentence = 0, sentenceLen = rand(5, 12);

  function word() {
    let w;
    do w = P.words[Math.floor(Math.random() * P.words.length)]; while (w === last && P.words.length > 1);
    last = w;
    return w;
  }

  function one() {
    if (useNums && chance(0.12)) return String(chance(0.5) ? rand(0, 99) : rand(100, 9999));
    let w = word();
    if (!usePunct) return w;
    if (inSentence === 0) w = cap(w);
    inSentence++;
    if (inSentence >= sentenceLen) {
      w += chance(0.12) ? '?' : chance(0.06) ? '!' : '.';
      inSentence = 0; sentenceLen = rand(5, 12);
    } else if (chance(0.03)) w = `"${w}"`;
    else if (chance(0.02)) w = `(${w})`;
    else if (chance(0.1)) w += ',';
    else if (chance(0.02)) w += chance(0.5) ? ';' : ':';
    return w;
  }

  return n => Array.from({ length: n }, one).join(' ');
}
