// Word packs for Typing. One file per pack; add a new one by writing its file and listing it here.
// A pack = { id, name, words[], code? }. Code packs keep their symbols as typed and skip the
// punctuation / numbers switches (they already have both).
import { COMMON } from '../typing-words.js';
import portuguese from './portuguese.js';
import gdscript from './gdscript.js';
import mcfunction from './mcfunction.js';

const english = { id: 'en', name: 'English', words: COMMON };

export const PACK_LIST = [english, portuguese, gdscript, mcfunction];
export const PACKS = Object.fromEntries(PACK_LIST.map(p => [p.id, p]));
