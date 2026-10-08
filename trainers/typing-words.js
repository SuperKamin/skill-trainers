// The 200 most common English words (the usual list for typing tests).
export const COMMON = `the be of and a to in he have it that for they with as not on she at by this we you do but from or which one would all will there say who make when can more if no man out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still nation hand old life tell write become here show house both between need mean call develop under last right move thing general school never same another begin while number part turn real leave might want point form off child few small since against ask late home interest large person end open public follow during present without again hold govern around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line`.split(' ');

// More everyday words, so drills on a letter pair still use real words (research: no nonsense strings).
export const MORE = `able above across act add age ago air allow almost alone along already always among animal answer appear apply area arm art away baby bad ball bank base bear beat beautiful bed behind believe best better big bill bit black blood blue board body book born box boy break bring brother build business buy car card care carry case catch cause center certain chair chance character check choose church city claim class clear close cold color common community company compare control cost country couple cover create cross cup cut dark data daughter dead deal death decide deep describe design detail die different difficult dinner direction discover doctor dog door draw dream drive drop dry easy eat edge effect effort eight either else energy enjoy enough enter entire event ever every everything exactly example expect experience explain fall family far fast father fear field fight figure fill film final finally fine finger finish fire fish five floor fly food foot force forget forward four free friend front full fun future game garden girl glass gold green ground grow guess guy hair half happen happy hard hear heart heat heavy hello history hit hope hot hour huge human hundred idea image imagine inside instead island job join jump kind king kitchen knowledge land language laugh law learn less letter level light list listen live local lose lot love low machine main major manage market matter maybe measure meet member memory middle mind minute miss modern moment money month morning mother mountain mouth movie music myself name natural near nearly news next nice night nothing notice off office often oil once only order outside page pain paper parent party pass past path pay peace perhaps period phone pick picture piece plant player please police poor popular power pretty price private produce pull push put quick quiet quite race radio rather reach read ready reason red remember report rest result return rich ride river road rock room rule safe save scene science sea season seat second section security send sense serve seven several shake share short shot shoulder side sign simple sing sister sit six size skill skin sky sleep slow smile social soft soldier someone something sometimes son song soon sort sound south space speak special spend sport spring square staff stage star start stay step stop store story street strong student study stuff style subject success sudden summer sun support sure surface table talk task teach team ten test thank theory third though thought thousand three throw today together tonight top total touch toward town trade travel tree trip trouble true truth try twenty type until upon usually value voice wait walk wall war watch water weak wear weather week weight west white whole whose why wide wife win wind window wish woman wonder wood worker worry wrong yard yeah yes yet young`.split(' ');

export const ALL = [...COMMON, ...MORE];

export const pick = list => list[Math.floor(Math.random() * list.length)];

/** n random words, never the same word twice in a row. */
export function words(n, list = COMMON) {
  const out = [];
  while (out.length < n) {
    const w = pick(list);
    if (w !== out[out.length - 1]) out.push(w);
  }
  return out.join(' ');
}

/**
 * Words for a pair drill: about 7 in 10 contain one of the pairs, the rest are ordinary
 * common words so it still flows like real typing. Returns { text, marks }.
 */
export function pairText(pairsWanted, n = 90) {
  const withPair = ALL.filter(w => pairsWanted.some(p => w.includes(p)));
  const out = [];
  while (out.length < n) {
    const w = withPair.length && Math.random() < 0.7 ? pick(withPair) : pick(COMMON);
    if (w !== out[out.length - 1]) out.push(w);
  }
  const text = out.join(' ');
  const marks = new Set();
  for (const p of pairsWanted) {
    let i = text.indexOf(p);
    while (i >= 0) { marks.add(i); marks.add(i + 1); i = text.indexOf(p, i + 1); }
  }
  return { text, marks };
}
