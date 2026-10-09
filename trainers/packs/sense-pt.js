// Português, "faz sentido": frases simples do dia a dia, feitas com padrões e espaços
// ([alguém] [faz algo] [com alguma coisa] [em algum lugar] [em algum momento]).
// Cada verbo traz as coisas e os lugares que combinam com ele, e cada tipo de coisa os seus adjetivos,
// para a frase fazer sentido ("meu pai consertou o rádio velho na garagem", não "uma banana vermelha").
// Concordância feita à mão: artigo + substantivo + adjetivo (o livro novo / as caixas novas)
// e verbo + pessoa (eu corro / ele corre / nós corremos / eles correm). Cada verbo tem as formas escritas.
// sentence({ punct, nums }) → uma frase. punct off = tudo minúsculo, sem pontuação.

const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;

// Pessoa do verbo: 0 = eu, 1 = ele/ela/você, 2 = nós, 3 = eles/elas
const PEOPLE = [
  ['eu', 0], ['você', 1], ['ele', 1], ['ela', 1], ['meu irmão', 1], ['minha irmã', 1], ['o professor', 1],
  ['a professora', 1], ['nosso vizinho', 1], ['a menina', 1], ['o médico', 1], ['meu pai', 1], ['minha mãe', 1],
  ['nós', 2], ['eles', 3], ['elas', 3], ['meus amigos', 3], ['as crianças', 3],
];
const PEOPLE_OBJ = ['meu irmão', 'minha irmã', 'o professor', 'a professora', 'nosso vizinho', 'a vizinha', 'meu pai', 'minha mãe', 'as crianças', 'os meninos'];

// Adjetivos: [m, f, m plural, f plural]
const A = {
  novo: ['novo', 'nova', 'novos', 'novas'], velho: ['velho', 'velha', 'velhos', 'velhas'],
  pequeno: ['pequeno', 'pequena', 'pequenos', 'pequenas'], grande: ['grande', 'grande', 'grandes', 'grandes'],
  vermelho: ['vermelho', 'vermelha', 'vermelhos', 'vermelhas'], azul: ['azul', 'azul', 'azuis', 'azuis'],
  verde: ['verde', 'verde', 'verdes', 'verdes'], pesado: ['pesado', 'pesada', 'pesados', 'pesadas'],
  curto: ['curto', 'curta', 'curtos', 'curtas'], longo: ['longo', 'longa', 'longos', 'longas'],
  engracado: ['engraçado', 'engraçada', 'engraçados', 'engraçadas'], estranho: ['estranho', 'estranha', 'estranhos', 'estranhas'],
  triste: ['triste', 'triste', 'tristes', 'tristes'], fresco: ['fresco', 'fresca', 'frescos', 'frescas'],
  quente: ['quente', 'quente', 'quentes', 'quentes'], doce: ['doce', 'doce', 'doces', 'doces'],
  quebrado: ['quebrado', 'quebrada', 'quebrados', 'quebradas'], branco: ['branco', 'branca', 'brancos', 'brancas'],
  sujo: ['sujo', 'suja', 'sujos', 'sujas'], baguncado: ['bagunçado', 'bagunçada', 'bagunçados', 'bagunçadas'],
};
// Tipos de coisa: substantivos [singular, plural, gênero], adjetivos que combinam, determinantes, se dá para contar.
const KINDS = {
  thing: { nouns: [['livro', 'livros', 'm'], ['chave', 'chaves', 'f'], ['caixa', 'caixas', 'f'], ['bola', 'bolas', 'f'], ['celular', 'celulares', 'm'], ['mochila', 'mochilas', 'f'], ['carta', 'cartas', 'f'], ['moeda', 'moedas', 'f'], ['chapéu', 'chapéus', 'm']], adj: ['novo', 'velho', 'pequeno', 'grande', 'vermelho', 'azul', 'verde', 'pesado'], det: ['um', 'o', 'meu', 'nosso'], count: true },
  read: { nouns: [['livro', 'livros', 'm'], ['carta', 'cartas', 'f'], ['história', 'histórias', 'f'], ['mapa', 'mapas', 'm'], ['bilhete', 'bilhetes', 'm'], ['poema', 'poemas', 'm']], adj: ['novo', 'velho', 'curto', 'longo', 'engracado', 'estranho'], det: ['um', 'o', 'meu', 'nosso'], count: true },
  write: { nouns: [['carta', 'cartas', 'f'], ['história', 'histórias', 'f'], ['bilhete', 'bilhetes', 'm'], ['poema', 'poemas', 'm']], adj: ['curto', 'longo', 'engracado', 'triste', 'novo'], det: ['um', 'o'], count: true },
  open: { nouns: [['porta', 'portas', 'f'], ['janela', 'janelas', 'f'], ['caixa', 'caixas', 'f'], ['mochila', 'mochilas', 'f'], ['portão', 'portões', 'm']], adj: ['velho', 'pesado', 'grande', 'pequeno'], det: ['o', 'um', 'nosso'], count: false },
  food: { nouns: [['maçã', 'maçãs', 'f'], ['sanduíche', 'sanduíches', 'm'], ['bolo', 'bolos', 'm'], ['ovo', 'ovos', 'm'], ['banana', 'bananas', 'f'], ['biscoito', 'biscoitos', 'm']], adj: ['fresco', 'quente', 'doce', 'grande', 'pequeno'], det: ['um', 'o'], count: true },
  fix: { nouns: [['bicicleta', 'bicicletas', 'f'], ['rádio', 'rádios', 'm'], ['relógio', 'relógios', 'm'], ['lâmpada', 'lâmpadas', 'f'], ['computador', 'computadores', 'm'], ['cadeira', 'cadeiras', 'f']], adj: ['velho', 'quebrado', 'pequeno'], det: ['um', 'o', 'meu', 'nosso'], count: false },
  paint: { nouns: [['parede', 'paredes', 'f'], ['cerca', 'cercas', 'f'], ['porta', 'portas', 'f'], ['quadro', 'quadros', 'm'], ['caixa', 'caixas', 'f']], adj: ['velho', 'branco', 'longo', 'pequeno'], det: ['o', 'um', 'nosso'], count: false },
  clean: { nouns: [['cozinha', 'cozinhas', 'f'], ['quarto', 'quartos', 'm'], ['carro', 'carros', 'm'], ['mesa', 'mesas', 'f'], ['janela', 'janelas', 'f']], adj: ['sujo', 'baguncado', 'pequeno', 'grande'], det: ['o', 'meu', 'nosso'], count: false },
};
// Determinantes: [masculino, feminino]
const DET = { um: ['um', 'uma'], o: ['o', 'a'], meu: ['meu', 'minha'], nosso: ['nosso', 'nossa'] };
const GAMES = ['xadrez', 'futebol', 'videogame', 'cartas', 'um jogo novo', 'vôlei'];
const INSTRUMENTS = ['o violão', 'o piano', 'a guitarra', 'a bateria'];
// Coisas para ver, cada uma com os lugares que combinam.
const SHOWS = [['um filme', ['em casa', 'no cinema']], ['o jogo', ['em casa', 'na escola']], ['a chuva', ['da janela']],
  ['os pássaros', ['no jardim', 'no parque']], ['o pôr do sol', ['na praia', 'da janela']],
  ['um vídeo engraçado', ['em casa', 'no ônibus']], ['as estrelas', ['no jardim', 'da janela']]];

// Verbos: [presente eu/ele/nós/eles], [passado eu/ele/nós/eles], tipo de coisa, lugares que combinam
const VERBS = [
  [['encontro', 'encontra', 'encontramos', 'encontram'], ['encontrei', 'encontrou', 'encontramos', 'encontraram'], 'thing', ['embaixo da mesa', 'no jardim', 'no ônibus', 'no parque', 'perto do rio', 'na escola']],
  [['carrego', 'carrega', 'carregamos', 'carregam'], ['carreguei', 'carregou', 'carregamos', 'carregaram'], 'thing', ['para a escola', 'até o carro', 'escada acima']],
  [['trago', 'traz', 'trazemos', 'trazem'], ['trouxe', 'trouxe', 'trouxemos', 'trouxeram'], 'thing', ['para a escola', 'para a festa', 'para casa']],
  [['esqueço', 'esquece', 'esquecemos', 'esquecem'], ['esqueci', 'esqueceu', 'esquecemos', 'esqueceram'], 'thing', ['em casa', 'no ônibus', 'na escola', 'no carro']],
  [['leio', 'lê', 'lemos', 'leem'], ['li', 'leu', 'lemos', 'leram'], 'read', ['em casa', 'na biblioteca', 'no ônibus', 'na cama', 'no parque']],
  [['escrevo', 'escreve', 'escrevemos', 'escrevem'], ['escrevi', 'escreveu', 'escrevemos', 'escreveram'], 'write', ['em casa', 'na escola', 'na biblioteca', 'no meu quarto']],
  [['abro', 'abre', 'abrimos', 'abrem'], ['abri', 'abriu', 'abrimos', 'abriram'], 'open', []],
  [['como', 'come', 'comemos', 'comem'], ['comi', 'comeu', 'comemos', 'comeram'], 'food', ['na cozinha', 'em casa', 'na escola', 'no parque', 'na praia']],
  [['compro', 'compra', 'compramos', 'compram'], ['comprei', 'comprou', 'compramos', 'compraram'], 'food', ['no mercado', 'na padaria', 'na escola']],
  [['conserto', 'conserta', 'consertamos', 'consertam'], ['consertei', 'consertou', 'consertamos', 'consertaram'], 'fix', ['em casa', 'na garagem']],
  [['pinto', 'pinta', 'pintamos', 'pintam'], ['pintei', 'pintou', 'pintamos', 'pintaram'], 'paint', []],
  [['limpo', 'limpa', 'limpamos', 'limpam'], ['limpei', 'limpou', 'limpamos', 'limparam'], 'clean', []],
  [['chamo', 'chama', 'chamamos', 'chamam'], ['chamei', 'chamou', 'chamamos', 'chamaram'], 'person', []],
  [['ajudo', 'ajuda', 'ajudamos', 'ajudam'], ['ajudei', 'ajudou', 'ajudamos', 'ajudaram'], 'person', ['em casa', 'na escola', 'na cozinha']],
  [['jogo', 'joga', 'jogamos', 'jogam'], ['joguei', 'jogou', 'jogamos', 'jogaram'], 'game', ['na escola', 'no parque', 'em casa']],
  [['toco', 'toca', 'tocamos', 'tocam'], ['toquei', 'tocou', 'tocamos', 'tocaram'], 'instrument', ['em casa', 'na escola', 'na festa']],
  [['vejo', 'vê', 'vemos', 'veem'], ['vi', 'viu', 'vimos', 'viram'], 'show', null], // os lugares vêm com o que se vê
];
const INTRANS = [
  [['corro', 'corre', 'corremos', 'correm'], ['corri', 'correu', 'corremos', 'correram'], ['no parque', 'na escola', 'perto do rio']],
  [['durmo', 'dorme', 'dormimos', 'dormem'], ['dormi', 'dormiu', 'dormimos', 'dormiram'], ['em casa', 'na cama', 'no ônibus']],
  [['espero', 'espera', 'esperamos', 'esperam'], ['esperei', 'esperou', 'esperamos', 'esperaram'], ['no ponto de ônibus', 'lá fora', 'na escola']],
  [['canto', 'canta', 'cantamos', 'cantam'], ['cantei', 'cantou', 'cantamos', 'cantaram'], ['em casa', 'na escola', 'no chuveiro']],
  [['estudo', 'estuda', 'estudamos', 'estudam'], ['estudei', 'estudou', 'estudamos', 'estudaram'], ['na escola', 'na biblioteca', 'em casa']],
  [['nado', 'nada', 'nadamos', 'nadam'], ['nadei', 'nadou', 'nadamos', 'nadaram'], ['na praia', 'no rio', 'na piscina']],
  [['rio', 'ri', 'rimos', 'riem'], ['ri', 'riu', 'rimos', 'riram'], ['na escola', 'em casa', 'no ônibus']],
  [['ando', 'anda', 'andamos', 'andam'], ['andei', 'andou', 'andamos', 'andaram'], ['no parque', 'perto do rio', 'na praia']],
];
const SAYS = [
  [['digo', 'diz', 'dizemos', 'dizem'], ['disse', 'disse', 'dissemos', 'disseram']],
  [['acho', 'acha', 'achamos', 'acham'], ['achei', 'achou', 'achamos', 'acharam']],
  [['sei', 'sabe', 'sabemos', 'sabem'], ['soube', 'soube', 'soubemos', 'souberam']],
];
const PRESENT_TIMES = ['todo dia', 'toda manhã', 'depois da aula', 'nos fins de semana', 'à noite', 'antes do jantar'];
const PAST_TIMES = ['ontem', 'ontem à noite', 'na semana passada', 'hoje de manhã', 'depois do almoço', 'no domingo'];
// Quantos: [masculino, feminino]
const HOW_MANY = [['dois', 'duas'], ['três', 'três'], ['quatro', 'quatro'], ['cinco', 'cinco'], ['alguns', 'algumas'], ['muitos', 'muitas']];

/** O que vem depois do verbo, e os lugares que combinam (para "ver", vêm com o que se vê). */
function object(v, nums) {
  const kind = v[2];
  if (kind === 'person') return [pick(PEOPLE_OBJ), v[3]];
  if (kind === 'game') return [pick(GAMES), v[3]];
  if (kind === 'instrument') return [pick(INSTRUMENTS), v[3]];
  if (kind === 'show') { const [s, places] = pick(SHOWS); return [s, places]; }
  const K = KINDS[kind];
  const [one, many, g] = pick(K.nouns);
  const f = g === 'f';
  const adj = chance(0.5) ? A[pick(K.adj)] : null;
  if (K.count && chance(0.25)) {
    const n = nums ? String(2 + Math.floor(Math.random() * 8)) : pick(HOW_MANY)[f ? 1 : 0];
    return [`${n} ${many}${adj ? ' ' + adj[f ? 3 : 2] : ''}`, v[3]];
  }
  return [`${DET[pick(K.det)][f ? 1 : 0]} ${one}${adj ? ' ' + adj[f ? 1 : 0] : ''}`, v[3]];
}

function clause(past, nums, who) {
  const [s, p] = who || pick(PEOPLE);
  const when = () => (chance(0.5) ? ' ' + pick(past ? PAST_TIMES : PRESENT_TIMES) : '');
  const where = places => (places && places.length && chance(0.55) ? ' ' + pick(places) : '');
  if (chance(0.7)) {
    const v = pick(VERBS);
    const [obj, places] = object(v, nums);
    return `${s} ${v[past ? 1 : 0][p]} ${obj}${where(places)}${when()}`;
  }
  const v = pick(INTRANS);
  return `${s} ${v[past ? 1 : 0][p]}${where(v[2])}${when()}`;
}

export function sentence({ punct = false, nums = false } = {}) {
  const past = chance(0.5);
  let text, end = '.';
  const r = Math.random();
  if (punct && r < 0.15) {
    // Uma pergunta: em português é a mesma ordem, só muda o ponto.
    text = clause(past, nums, ['você', 1]);
    end = '?';
  } else if (r < 0.3) {
    text = `${clause(true, nums)}${punct ? ',' : ''} e depois ${clause(true, nums)}`;
  } else if (r < 0.42) {
    const [who, p] = pick(PEOPLE);
    text = `${who} ${pick(SAYS)[past ? 1 : 0][p]} que ${clause(past, nums)}`;
  } else if (r < 0.52) {
    text = `quando ${clause(past, nums)}${punct ? ',' : ''} ${clause(past, nums)}`;
  } else {
    text = clause(past, nums);
    if (punct && chance(0.08)) end = '!';
  }
  if (!punct) return text.toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1) + end;
}
