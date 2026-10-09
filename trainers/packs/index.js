// Word packs for Typing. One file per pack; add a new one by writing its file and listing it here.
// A pack = { id, name, words[], code?, sense? }. Code packs keep their symbols as typed and skip the
// punctuation / numbers switches (they already have both). sense({ punct, nums }) = one sentence / line
// that makes sense (the "makes sense" switch); each lives in its own sense-<id>.js file.
import { COMMON } from '../typing-words.js';
import portuguese from './portuguese.js';
import gdscript from './gdscript.js';
import mcfunction from './mcfunction.js';
import { sentence as senseEn } from './sense-en.js';
import { sentence as sensePt } from './sense-pt.js';
import { sentence as senseGd } from './sense-gd.js';
import { sentence as senseMcf } from './sense-mcf.js';

const english = { id: 'en', name: 'English', words: COMMON, sense: senseEn };
portuguese.sense = sensePt;
gdscript.sense = senseGd;
mcfunction.sense = senseMcf;

export const PACK_LIST = [english, portuguese, gdscript, mcfunction];
export const PACKS = Object.fromEntries(PACK_LIST.map(p => [p.id, p]));
