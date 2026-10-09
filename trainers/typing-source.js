// Where Test words come from: a word pack, plus the punctuation / numbers switches (like Monkeytype),
// and the "makes sense" switch (whole sentences / lines of code from the pack's grammar, sense-<id>.js).
// makeSource({ pack, punct, nums, sense }) → next(n): the next n words as one string (keeps sentence state
// between calls, so text added while you type continues the same sentence).
import { PACKS } from './packs/index.js';

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = p => Math.random() < p;
const cap = w => w.charAt(0).toUpperCase() + w.slice(1);

export function makeSource({ pack = 'en', punct = false, nums = false, sense = false } = {}) {
  const P = PACKS[pack] || PACKS.en;
  const usePunct = punct && !P.code, useNums = nums && !P.code;
  if (sense && P.sense) {
    // Sentence after sentence, handed out a word at a time.
    let queue = [];
    const nextWord = () => {
      while (!queue.length) queue = P.sense({ punct: usePunct, nums: useNums }).split(' ').filter(Boolean);
      return queue.shift();
    };
    return n => Array.from({ length: n }, nextWord).join(' ');
  }
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
