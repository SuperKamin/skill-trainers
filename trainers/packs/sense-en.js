// English, "makes sense": simple everyday sentences from patterns with slots
// ([someone] [does something] [to something] [somewhere] [sometime]). Made up fresh each time.
// Every verb carries the things and places that fit it, and every kind of thing its own describing
// words, so sentences stay sensible ("my dad fixed the old radio in the garage", not "a red banana").
// sentence({ punct, nums }) → one sentence. punct off = all lowercase, no marks (like the random words).

const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;

// Who: [text, singular?]
const PEOPLE = [
  ['my brother', 1], ['my sister', 1], ['my friend', 1], ['the teacher', 1], ['our neighbor', 1],
  ['the old man', 1], ['a little girl', 1], ['the doctor', 1], ['my dad', 1], ['my mom', 1],
  ['the new student', 1], ['the bus driver', 1], ['the cook', 1], ['a tall boy', 1], ['the farmer', 1],
  ['I', 0], ['we', 0], ['they', 0], ['you', 0], ['he', 1], ['she', 1], ['my friends', 0], ['the kids', 0],
];
const PEOPLE_OBJ = ['my brother', 'my sister', 'my friend', 'the teacher', 'our neighbor', 'the doctor', 'my dad', 'my mom', 'the new student', 'the kids', 'them', 'him', 'her', 'us'];

// Kinds of things: nouns [one, many], describing words, which "a / the / my…" fit, and whether a count fits.
const KINDS = {
  thing: { nouns: [['book', 'books'], ['key', 'keys'], ['box', 'boxes'], ['ball', 'balls'], ['phone', 'phones'], ['bag', 'bags'], ['letter', 'letters'], ['coin', 'coins'], ['hat', 'hats']], adj: ['old', 'new', 'small', 'big', 'red', 'blue', 'heavy', 'little', 'green'], det: ['a', 'the', 'my', 'our'], count: true },
  read: { nouns: [['book', 'books'], ['letter', 'letters'], ['story', 'stories'], ['map', 'maps'], ['note', 'notes'], ['poem', 'poems']], adj: ['old', 'new', 'short', 'long', 'funny', 'strange'], det: ['a', 'the', 'my', 'our'], count: true },
  write: { nouns: [['letter', 'letters'], ['story', 'stories'], ['note', 'notes'], ['poem', 'poems']], adj: ['short', 'long', 'funny', 'sad', 'new'], det: ['a', 'the'], count: true },
  open: { nouns: [['door', 'doors'], ['window', 'windows'], ['box', 'boxes'], ['bag', 'bags'], ['gate', 'gates']], adj: ['front', 'back', 'old', 'heavy', 'big', 'small'], det: ['the', 'a', 'our'], count: false },
  food: { nouns: [['apple', 'apples'], ['sandwich', 'sandwiches'], ['cake', 'cakes'], ['egg', 'eggs'], ['banana', 'bananas'], ['cookie', 'cookies']], adj: ['fresh', 'warm', 'sweet', 'big', 'small'], det: ['a', 'the'], count: true },
  fix: { nouns: [['bike', 'bikes'], ['radio', 'radios'], ['clock', 'clocks'], ['lamp', 'lamps'], ['computer', 'computers'], ['chair', 'chairs']], adj: ['old', 'broken', 'small'], det: ['a', 'the', 'my', 'our'], count: false },
  paint: { nouns: [['wall', 'walls'], ['fence', 'fences'], ['door', 'doors'], ['picture', 'pictures'], ['box', 'boxes']], adj: ['old', 'white', 'long', 'small'], det: ['the', 'a', 'our'], count: false },
  clean: { nouns: [['kitchen', 'kitchens'], ['room', 'rooms'], ['car', 'cars'], ['table', 'tables'], ['window', 'windows']], adj: ['messy', 'dirty', 'small', 'big'], det: ['the', 'my', 'our'], count: false },
};
const GAMES = ['chess', 'football', 'the guitar', 'the piano', 'cards', 'a new game', 'video games'];
// Things to watch, each with places that fit it.
const SHOWS = [['a movie', ['at home', 'at the cinema']], ['the game', ['at home', 'at school']], ['the rain', ['from the window']],
  ['the birds', ['in the garden', 'in the park']], ['the sunset', ['at the beach', 'from the window']],
  ['a funny video', ['at home', 'on the bus']], ['the stars', ['in the garden', 'from the window']]];

const ANYWHERE = ['at home', 'at school', 'in the park', 'on the bus', 'in the garden'];
// Verbs: [base, -s form, past, kind of thing, places that fit]
const VERBS = [
  ['find', 'finds', 'found', 'thing', ['under the table', 'in the garden', 'on the bus', 'in the park', 'near the river', 'at school']],
  ['carry', 'carries', 'carried', 'thing', ['to school', 'to the car', 'up the stairs', 'across the street']],
  ['bring', 'brings', 'brought', 'thing', ['to school', 'to the party', 'home']],
  ['forget', 'forgets', 'forgot', 'thing', ['at home', 'on the bus', 'at school', 'in the car']],
  ['read', 'reads', 'read', 'read', ['at home', 'in the library', 'on the bus', 'in bed', 'in the park']],
  ['write', 'writes', 'wrote', 'write', ['at home', 'at school', 'in the library', 'in my room']],
  ['open', 'opens', 'opened', 'open', []],
  ['eat', 'eats', 'ate', 'food', ['in the kitchen', 'at home', 'at school', 'in the park', 'at the beach']],
  ['buy', 'buys', 'bought', 'food', ['at the store', 'at the market', 'at school']],
  ['fix', 'fixes', 'fixed', 'fix', ['at home', 'in the garage']],
  ['paint', 'paints', 'painted', 'paint', []],
  ['clean', 'cleans', 'cleaned', 'clean', []],
  ['call', 'calls', 'called', 'person', []],
  ['help', 'helps', 'helped', 'person', ['at home', 'at school', 'in the kitchen']],
  ['meet', 'meets', 'met', 'person', ['at school', 'in the park', 'at the beach', 'near the river']],
  ['play', 'plays', 'played', 'game', ['at school', 'in the park', 'at home']],
  ['watch', 'watches', 'watched', 'show', null], // places come with the show
];
const INTRANS = [
  ['run', 'runs', 'ran', ['in the park', 'at school', 'near the river']],
  ['sleep', 'sleeps', 'slept', ['at home', 'in bed', 'on the bus']],
  ['laugh', 'laughs', 'laughed', ['at school', 'at home', 'on the bus']],
  ['wait', 'waits', 'waited', ['at the bus stop', 'outside', 'at school']],
  ['walk', 'walks', 'walked', ['in the park', 'to school', 'near the river']],
  ['sing', 'sings', 'sang', ['at home', 'at school', 'in the shower']],
  ['study', 'studies', 'studied', ['at school', 'in the library', 'at home']],
  ['swim', 'swims', 'swam', ['at the beach', 'in the river', 'in the pool']],
];
const PRESENT_TIMES = ['every morning', 'after school', 'on weekends', 'in the evening', 'every day', 'before dinner'];
const PAST_TIMES = ['yesterday', 'last night', 'last week', 'this morning', 'after lunch', 'on sunday'];
const NUM_WORDS = ['two', 'three', 'four', 'five', 'some', 'many'];

const an = w => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;

/** The thing after the verb, and the places that fit it (for watching, they come with the show). */
function object(v, nums) {
  const kind = v[3];
  if (kind === 'person') return [pick(PEOPLE_OBJ), v[4]];
  if (kind === 'game') return [pick(GAMES), v[4]];
  if (kind === 'show') { const [s, places] = pick(SHOWS); return [s, places]; }
  const K = KINDS[kind];
  const [one, many] = pick(K.nouns);
  const adj = chance(0.5) ? pick(K.adj) + ' ' : '';
  if (K.count && chance(0.25)) return [`${nums ? 2 + Math.floor(Math.random() * 8) : pick(NUM_WORDS)} ${adj}${many}`, v[4]];
  const det = pick(K.det);
  return [det === 'a' ? an(adj + one) : `${det} ${adj}${one}`, v[4]];
}

function clause(past, nums, who) {
  const [s, single] = who || pick(PEOPLE);
  const when = () => (chance(0.5) ? ' ' + pick(past ? PAST_TIMES : PRESENT_TIMES) : '');
  const where = places => (places && places.length && chance(0.55) ? ' ' + pick(places) : '');
  if (chance(0.7)) {
    const v = pick(VERBS);
    const [obj, places] = object(v, nums);
    return `${s} ${past ? v[2] : single ? v[1] : v[0]} ${obj}${where(places)}${when()}`;
  }
  const v = pick(INTRANS);
  return `${s} ${past ? v[2] : single ? v[1] : v[0]}${where(v[3])}${when()}`;
}

export function sentence({ punct = false, nums = false } = {}) {
  const past = chance(0.5);
  let text, end = '.';
  const r = Math.random();
  if (punct && r < 0.15) {
    // A question: did / does / do + subject + base verb.
    const v = pick(VERBS);
    const [who, single] = pick(PEOPLE);
    text = `${past ? 'did' : single ? 'does' : 'do'} ${who} ${v[0]} ${object(v, nums)[0]}`;
    end = '?';
  } else if (r < 0.3) {
    text = `${clause(true, nums)}${punct ? ',' : ''} and then ${clause(true, nums)}`;
  } else if (r < 0.42) {
    const [who, single] = pick(PEOPLE);
    const says = pick(['said', 'wrote', single ? 'thinks' : 'think', single ? 'knows' : 'know']);
    text = `${who} ${says} that ${clause(past, nums)}`;
  } else if (r < 0.52) {
    text = `when ${clause(past, nums)}${punct ? ',' : ''} ${clause(past, nums)}`;
  } else {
    text = clause(past, nums);
    if (punct && chance(0.08)) end = '!';
  }
  if (!punct) return text.toLowerCase();
  // "I" stays a capital; the sentence starts with one.
  text = text.replace(/\bi\b/g, 'I').replace(/\bsunday\b/g, 'Sunday');
  return text.charAt(0).toUpperCase() + text.slice(1) + end;
}
