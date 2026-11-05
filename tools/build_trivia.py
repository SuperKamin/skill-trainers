"""Build the Geography and Science trivia packs from Wikidata (CC0), in English + Portuguese.

Run once on a PC (not in the browser):   python tools/build_trivia.py
Writes trainers/packs/trivia-geography.js and trainers/packs/trivia-science.js.
Plan: plans/trivia-packs-mix.md (stage 2). Wikidata data is CC0, so the packs are free to use.

Levels (1 Easy · 2 Medium · 3 Hard · 4 Extra hard) come from how famous a thing is:
the number of Wikipedia language editions that have an article on it ("sitelinks").
Hand-written questions (planets, the body, physics…) are at the bottom of this file.
"""
import json, random, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'trainers' / 'packs'
UA = 'SkillTrainersTriviaBuilder/1.0 (personal practice app; https://superkamin.github.io/skill-trainers/)'
random.seed(7)  # same wrong choices every build


def sparql(query):
    url = 'https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': query, 'format': 'json'})
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/sparql-results+json'})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode('utf-8'), strict=False)['results']['bindings']
        except Exception as e:  # 429 / timeout: wait and retry
            print('  retry', attempt + 1, e, file=sys.stderr)
            time.sleep(5 * (attempt + 1))
    raise SystemExit('Wikidata did not answer')


def qid(uri):
    return uri.rsplit('/', 1)[-1]


def batched(ids, query):
    ids = sorted(ids)
    for i in range(0, len(ids), 100):
        yield from sparql(query.replace('IDS', ' '.join('wd:' + x for x in ids[i:i + 100])))


def labels(ids):
    """{id: {'en', 'pt', 'extra'}}: Brazilian Portuguese name first (pt-br), else pt; the pt one kept in 'extra'."""
    raw = {}
    q = 'SELECT ?x ?l WHERE { VALUES ?x { IDS } ?x rdfs:label ?l. FILTER(LANG(?l) IN ("en", "pt", "pt-br")) }'
    for r in batched(ids, q):
        raw.setdefault(qid(v(r, 'x')), {})[r['l']['xml:lang']] = v(r, 'l')
    out = {}
    for k, d in raw.items():
        pt = d.get('pt-br') or d.get('pt')
        if 'en' in d and pt:
            out[k] = {'en': d['en'], 'pt': pt, 'extra': [d['pt']] if d.get('pt') and d.get('pt') != pt else []}
    return out


def populations(ids):
    out = {}
    for r in batched(ids, 'SELECT ?x (MAX(?p) AS ?pop) WHERE { VALUES ?x { IDS } ?x wdt:P1082 ?p. } GROUP BY ?x'):
        out[qid(v(r, 'x'))] = int(float(v(r, 'pop')))
    return out


def alt_labels(ids):
    """Other names (en + pt) for a set of Wikidata ids, asked in small batches."""
    out, ids = {}, sorted(ids)
    for i in range(0, len(ids), 120):
        vals = ' '.join('wd:' + x for x in ids[i:i + 120])
        for r in sparql('SELECT ?x ?a WHERE { VALUES ?x { ' + vals + ' } ?x skos:altLabel ?a. FILTER(LANG(?a) IN ("en", "pt", "pt-br")) }'):
            a = v(r, 'a')
            if 2 <= len(a) <= 40:
                out.setdefault(v(r, 'x').rsplit('/', 1)[-1], []).append(a)
    return out


def v(row, k):
    return row[k]['value'] if k in row else ''


def fmt_pop(n, lang):
    n = int(float(n))
    if n >= 1_000_000:
        x = round(n / 1_000_000, 1)
        s = f'{x:g}'
        return (s + ' million') if lang == 'en' else (s.replace('.', ',') + ' milhões' if x >= 2 else s.replace('.', ',') + ' milhão')
    x = round(n, -3) if n >= 10_000 else n
    return f'{x:,}' if lang == 'en' else f'{x:,}'.replace(',', '.')


def split_alts(s):
    return [a for a in (s or '').split('|') if 2 <= len(a) <= 40]


def level_by_rank(items, key, cuts):
    """Sort by fame (sitelinks, high first) and give levels by position: cuts = sizes of levels 1, 2, 3 (rest = 4)."""
    items.sort(key=lambda x: -x[key])
    for i, it in enumerate(items):
        it['level'] = 1 if i < cuts[0] else 2 if i < cuts[0] + cuts[1] else 3 if i < sum(cuts) else 4


def pick_wrong(pool, right, n=3):
    pool = [p for p in pool if p['en'].lower() != right['en'].lower()]
    random.shuffle(pool)
    return pool[:n]


def Q(id, q, a, aliases, wrong, note, level):
    return {'id': id, 'q': q, 'a': a, 'aliases': sorted(set(x for x in aliases if x and x not in (a['en'], a['pt']))),
            'wrong': wrong, 'note': note, 'level': level}


# ---------------------------------------------------------------- Geography
# Shorter everyday names where Wikidata's are formal; 'the' where English needs it.
DISPLAY = {
    'Q35': ('Denmark', 'Dinamarca'), 'Q756617': ('Denmark', 'Dinamarca'), 'Q29999': ('the Netherlands', 'Países Baixos'), 'Q148': ('China', 'China'),
    'Q30': ('the United States', 'Estados Unidos'), 'Q145': ('the United Kingdom', 'Reino Unido'),
    'Q878': ('the United Arab Emirates', 'Emirados Árabes Unidos'), 'Q213': ('the Czech Republic', 'Tchéquia'),
    'Q929': ('the Central African Republic', 'República Centro-Africana'), 'Q974': ('the Democratic Republic of the Congo', 'República Democrática do Congo'),
    'Q971': ('the Republic of the Congo', 'República do Congo'), 'Q786': ('the Dominican Republic', 'República Dominicana'),
    'Q928': ('the Philippines', 'Filipinas'), 'Q826': ('the Maldives', 'Maldivas'), 'Q709': ('the Marshall Islands', 'Ilhas Marshall'),
    'Q685': ('the Solomon Islands', 'Ilhas Salomão'), 'Q970': ('the Comoros', 'Comores'), 'Q1042': ('the Seychelles', 'Seicheles'),
    'Q702': ('Micronesia', 'Micronésia'), 'Q778': ('the Bahamas', 'Bahamas'), 'Q1005': ('the Gambia', 'Gâmbia'),
}


def countries_data():
    rows = sparql('SELECT ?c ?cap ?links WHERE { ?c wdt:P31 wd:Q3624078; wdt:P36 ?cap; wikibase:sitelinks ?links. }')
    caps_of, links = {}, {}
    for r in rows:
        cid = qid(v(r, 'c'))
        caps_of.setdefault(cid, set()).add(qid(v(r, 'cap')))
        links[cid] = int(v(r, 'links'))
    gone = {qid(v(r, 'x')) for r in batched(set(caps_of), 'SELECT ?x WHERE { VALUES ?x { IDS } ?x wdt:P576 ?d. }')}
    one = {c: next(iter(cs)) for c, cs in caps_of.items() if len(cs) == 1 and c not in gone}  # skip two-capital and former countries
    names = labels(set(one) | set(one.values()))
    pops = populations(set(one.values()))
    alts = alt_labels(set(one) | set(one.values()))
    out = []
    for cid, capid in one.items():
        if cid not in names or capid not in names or re.match(r'^Q\d+$', names[capid]['en']):
            continue
        n = dict(names[cid])
        if cid in DISPLAY:
            n['alts'] = [n['en'], n['pt']]
            n['en'], n['pt'] = DISPLAY[cid]
        out.append({'id': cid, 'en': n['en'], 'pt': n['pt'], 'links': links[cid],
                    'alts': alts.get(cid, []) + n.get('alts', []) + names[cid].get('extra', []),
                    'cap': {'en': names[capid]['en'], 'pt': names[capid]['pt'], 'alts': alts.get(capid, []) + names[capid].get('extra', [])},
                    'pop': pops.get(capid, 0)})
    return out


def near_wrong(items, i, get, n=3, span=15):
    """Wrong choices from things of similar fame (neighbours in the fame order), so they're not giveaways."""
    pool = [x for j, x in enumerate(items) if j != i and abs(j - i) <= span and get(x)['en'] != get(items[i])['en']]
    random.shuffle(pool)
    return [get(x) for x in pool[:n]]


def cap_en(name):  # "the United States" → "The United States" at the start of a sentence
    return name[0].upper() + name[1:]


def geography():
    print('countries...')
    countries = countries_data()
    level_by_rank(countries, 'links', (45, 50, 50))
    print(' ', len(countries), 'countries')

    qs = []
    for i, c in enumerate(countries):
        cap = c['cap']
        wrong = near_wrong(countries, i, lambda x: x['cap'])
        if c['pop']:
            big = c['pop'] >= 1_000_000
            note = {'en': f"About {fmt_pop(c['pop'], 'en')} people live in {cap['en']}.",
                    'pt': f"Cerca de {fmt_pop(c['pop'], 'pt')} {'de ' if big else ''}pessoas moram em {cap['pt']}."}
        else:
            note = {'en': f"{cap['en']} is the capital of {c['en']}.", 'pt': f"{cap['pt']} é a capital desse país."}
        qs.append(Q('geo-cap-' + c['id'],
                    {'en': f"What is the capital of {c['en']}?", 'pt': f"{c['pt']}: qual é a capital?"},
                    {'en': cap['en'], 'pt': cap['pt']}, cap['alts'],
                    {'en': [w['en'] for w in wrong], 'pt': [w['pt'] for w in wrong]}, note, c['level']))
        if c['level'] <= 3:  # the other way round, for the better-known ones
            wc = near_wrong(countries, i, lambda x: x)
            qs.append(Q('geo-of-' + c['id'],
                        {'en': f"{cap['en']} is the capital of which country?", 'pt': f"{cap['pt']} é a capital de qual país?"},
                        {'en': cap_en(c['en']), 'pt': c['pt']}, c['alts'] + [c['en']],
                        {'en': [cap_en(w['en']) for w in wc], 'pt': [w['pt'] for w in wc]}, note, min(4, c['level'] + 1)))

    # Brazilian states: written by hand (Wikidata's list misses some), level by how well known.
    for i, (sid, en, pt, cap, region_en, region_pt, lvl) in enumerate(BR_STATES):
        others = [s for s in BR_STATES if s[0] != sid]
        random.shuffle(others)
        qs.append(Q('geo-br-' + sid,
                    {'en': f"What is the capital of the Brazilian state of {en}?", 'pt': f"Estado {pt}: qual é a capital?"},
                    {'en': cap, 'pt': cap}, [],
                    {'en': [s[3] for s in others[:3]], 'pt': [s[3] for s in others[:3]]},
                    {'en': f"{en} is in Brazil's {region_en} region.", 'pt': f"O estado fica na região {region_pt}."}, lvl))
    print(' ', len(BR_STATES), 'states')
    qs += HAND_GEO
    return {'id': 'geography', 'title': {'en': 'Geography', 'pt': 'Geografia'},
            'licence': 'CC0 (Wikidata) + written for Skill Trainers', 'credit': 'Country facts from Wikidata (CC0).', 'questions': qs}


BR_STATES = [  # id, English name, Portuguese "Estado ___" phrase, capital, region en, region pt, level
    ('sp', 'São Paulo', 'de São Paulo', 'São Paulo', 'Southeast', 'Sudeste', 1),
    ('rj', 'Rio de Janeiro', 'do Rio de Janeiro', 'Rio de Janeiro', 'Southeast', 'Sudeste', 1),
    ('mg', 'Minas Gerais', 'de Minas Gerais', 'Belo Horizonte', 'Southeast', 'Sudeste', 1),
    ('es', 'Espírito Santo', 'do Espírito Santo', 'Vitória', 'Southeast', 'Sudeste', 2),
    ('ba', 'Bahia', 'da Bahia', 'Salvador', 'Northeast', 'Nordeste', 1),
    ('pe', 'Pernambuco', 'de Pernambuco', 'Recife', 'Northeast', 'Nordeste', 1),
    ('ce', 'Ceará', 'do Ceará', 'Fortaleza', 'Northeast', 'Nordeste', 1),
    ('ma', 'Maranhão', 'do Maranhão', 'São Luís', 'Northeast', 'Nordeste', 2),
    ('pi', 'Piauí', 'do Piauí', 'Teresina', 'Northeast', 'Nordeste', 3),
    ('rn', 'Rio Grande do Norte', 'do Rio Grande do Norte', 'Natal', 'Northeast', 'Nordeste', 2),
    ('pb', 'Paraíba', 'da Paraíba', 'João Pessoa', 'Northeast', 'Nordeste', 3),
    ('al', 'Alagoas', 'de Alagoas', 'Maceió', 'Northeast', 'Nordeste', 2),
    ('se', 'Sergipe', 'de Sergipe', 'Aracaju', 'Northeast', 'Nordeste', 3),
    ('pr', 'Paraná', 'do Paraná', 'Curitiba', 'South', 'Sul', 1),
    ('sc', 'Santa Catarina', 'de Santa Catarina', 'Florianópolis', 'South', 'Sul', 1),
    ('rs', 'Rio Grande do Sul', 'do Rio Grande do Sul', 'Porto Alegre', 'South', 'Sul', 1),
    ('go', 'Goiás', 'de Goiás', 'Goiânia', 'Central-West', 'Centro-Oeste', 2),
    ('mt', 'Mato Grosso', 'de Mato Grosso', 'Cuiabá', 'Central-West', 'Centro-Oeste', 2),
    ('ms', 'Mato Grosso do Sul', 'de Mato Grosso do Sul', 'Campo Grande', 'Central-West', 'Centro-Oeste', 2),
    ('am', 'Amazonas', 'do Amazonas', 'Manaus', 'North', 'Norte', 1),
    ('pa', 'Pará', 'do Pará', 'Belém', 'North', 'Norte', 2),
    ('ac', 'Acre', 'do Acre', 'Rio Branco', 'North', 'Norte', 3),
    ('ro', 'Rondônia', 'de Rondônia', 'Porto Velho', 'North', 'Norte', 3),
    ('rr', 'Roraima', 'de Roraima', 'Boa Vista', 'North', 'Norte', 3),
    ('ap', 'Amapá', 'do Amapá', 'Macapá', 'North', 'Norte', 3),
    ('to', 'Tocantins', 'do Tocantins', 'Palmas', 'North', 'Norte', 3),
]


# ---------------------------------------------------------------- Science
def science():
    print('elements...')
    rows = sparql('''
SELECT ?e ?en ?pt ?sym ?z ?year WHERE {
  ?e wdt:P31 wd:Q11344; wdt:P246 ?sym; wdt:P1086 ?z.
  ?e rdfs:label ?en. FILTER(LANG(?en) = "en")
  OPTIONAL { ?e rdfs:label ?ptbr. FILTER(LANG(?ptbr) = "pt-br") }
  ?e rdfs:label ?pt0. FILTER(LANG(?pt0) = "pt")
  BIND(COALESCE(?ptbr, ?pt0) AS ?pt)
  OPTIONAL { ?e wdt:P575 ?d. BIND(YEAR(?d) AS ?year) }
}''')
    els = {}
    for r in rows:
        z = int(float(v(r, 'z')))
        if not 1 <= z <= 118:
            continue
        it = els.setdefault(z, {'z': z, 'en': v(r, 'en').capitalize(), 'pt': v(r, 'pt').capitalize(), 'sym': v(r, 'sym'), 'year': 0})
        y = v(r, 'year')
        if y and int(float(y)) > 1500:
            it['year'] = min(it['year'] or 9999, int(float(y)))
    els = [els[z] for z in sorted(els)]
    print(' ', len(els), 'elements')
    WELL_KNOWN = {26, 29, 47, 79, 80, 82, 50, 78, 92, 53, 30, 28}  # iron copper silver gold mercury lead tin platinum uranium iodine zinc nickel

    def lvl(z, bump=0):
        base = 1 if z <= 10 else 2 if z <= 30 or z in WELL_KNOWN else 3 if z <= 86 else 4
        return min(4, base + bump)

    qs = []
    for e in els:
        near = [x for x in els if x['z'] != e['z'] and abs(x['z'] - e['z']) <= 12]
        random.shuffle(near)
        w = near[:3]
        note = ({'en': f"{e['en']} (number {e['z']}) was discovered in {e['year']}.", 'pt': f"O elemento {e['pt'].lower()} (número {e['z']}) foi descoberto em {e['year']}."}
                if e['year'] else {'en': f"{e['en']} is element number {e['z']}, symbol {e['sym']}.", 'pt': f"O elemento {e['pt'].lower()} é o número {e['z']}, símbolo {e['sym']}."})
        qs.append(Q(f"sci-sym-{e['z']}", {'en': f"Which element has the symbol {e['sym']}?", 'pt': f"Qual elemento tem o símbolo {e['sym']}?"},
                    {'en': e['en'], 'pt': e['pt']}, [], {'en': [x['en'] for x in w], 'pt': [x['pt'] for x in w]}, note, lvl(e['z'])))
        qs.append(Q(f"sci-of-{e['z']}", {'en': f"What is the chemical symbol for {e['en'].lower()}?", 'pt': f"Qual é o símbolo químico do elemento {e['pt'].lower()}?"},
                    {'en': e['sym'], 'pt': e['sym']}, [], {'en': [x['sym'] for x in w], 'pt': [x['sym'] for x in w]}, note, lvl(e['z'])))
        if e['z'] <= 36 or e['z'] in WELL_KNOWN:
            wz = sorted({e['z'] + d for d in (-2, -1, 1, 2, 8) if 1 <= e['z'] + d <= 118} - {e['z']})
            random.shuffle(wz)
            qs.append(Q(f"sci-z-{e['z']}", {'en': f"What is the atomic number of {e['en'].lower()}?", 'pt': f"Qual é o número atômico do elemento {e['pt'].lower()}?"},
                        {'en': str(e['z']), 'pt': str(e['z'])}, [], {'en': [str(x) for x in wz[:3]], 'pt': [str(x) for x in wz[:3]]},
                        {'en': f"The atomic number is how many protons are in the nucleus.", 'pt': f"O número atômico é quantos prótons tem no núcleo."},
                        lvl(e['z'], 1)))
    qs += HAND_SCI
    return {'id': 'science', 'title': {'en': 'Science', 'pt': 'Ciência'},
            'licence': 'CC0 (Wikidata) + written for Skill Trainers', 'credit': 'Element facts from Wikidata (CC0).', 'questions': qs}


def H(id, level, qEn, qPt, aEn, aPt, aliases, wEn, wPt, nEn, nPt):
    return Q(id, {'en': qEn, 'pt': qPt}, {'en': aEn, 'pt': aPt}, aliases, {'en': wEn, 'pt': wPt or wEn}, {'en': nEn, 'pt': nPt}, level)


HAND_GEO = [
    H('geo-everest', 1, 'What is the highest mountain on Earth?', 'Qual é a montanha mais alta da Terra?', 'Mount Everest', 'Monte Everest', ['everest', 'sagarmatha', 'chomolungma'],
      ['K2', 'Kangchenjunga', 'Aconcagua'], ['K2', 'Kangchenjunga', 'Aconcágua'],
      'Its top is about 8,849 m above sea level, on the border of Nepal and China.', 'O topo fica a cerca de 8.849 m acima do mar, na fronteira do Nepal com a China.'),
    H('geo-aconcagua', 3, 'What is the highest mountain in South America?', 'Qual é a montanha mais alta da América do Sul?', 'Aconcagua', 'Aconcágua', [],
      ['Chimborazo', 'Huascarán', 'Pico da Neblina'], None,
      'It\'s in Argentina, about 6,961 m high: the highest outside Asia.', 'Fica na Argentina, com cerca de 6.961 m: a mais alta fora da Ásia.'),
    H('geo-neblina', 3, 'What is the highest mountain in Brazil?', 'Qual é a montanha mais alta do Brasil?', 'Pico da Neblina', 'Pico da Neblina', ['neblina'],
      ['Pico da Bandeira', 'Monte Roraima', 'Pedra da Gávea'], None,
      'It\'s in Amazonas, near the border with Venezuela, about 2,995 m high.', 'Fica no Amazonas, perto da fronteira com a Venezuela, com cerca de 2.995 m.'),
    H('geo-nile-amazon', 2, 'Which river carries the most water in the world?', 'Qual rio leva mais água no mundo?', 'Amazon', 'Amazonas', ['amazon river', 'rio amazonas'],
      ['Nile', 'Congo', 'Yangtze'], ['Nilo', 'Congo', 'Yangtzé'],
      'The Amazon carries more water than the next several biggest rivers put together.', 'O Amazonas leva mais água que os vários rios seguintes juntos.'),
    H('geo-pacific', 1, 'What is the largest ocean?', 'Qual é o maior oceano?', 'Pacific Ocean', 'Oceano Pacífico', ['pacific', 'pacifico'],
      ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'], ['Oceano Atlântico', 'Oceano Índico', 'Oceano Ártico'],
      'It covers more area than all the land on Earth put together.', 'Ele cobre mais área que todas as terras da Terra juntas.'),
    H('geo-sahara', 2, 'What is the largest hot desert in the world?', 'Qual é o maior deserto quente do mundo?', 'Sahara', 'Saara', ['sahara desert', 'deserto do saara'],
      ['Gobi', 'Kalahari', 'Arabian Desert'], ['Gobi', 'Kalahari', 'Deserto da Arábia'],
      'Counting cold deserts, Antarctica is the biggest desert of all.', 'Contando os desertos frios, a Antártida é o maior de todos.'),
    H('geo-russia', 1, 'What is the largest country by area?', 'Qual é o maior país em área?', 'Russia', 'Rússia', ['russian federation', 'federacao russa'],
      ['Canada', 'China', 'United States'], ['Canadá', 'China', 'Estados Unidos'],
      'It spans 11 time zones.', 'Ele tem 11 fusos horários.'),
    H('geo-vatican', 2, 'What is the smallest country in the world?', 'Qual é o menor país do mundo?', 'Vatican City', 'Vaticano', ['vatican', 'cidade do vaticano', 'holy see'],
      ['Monaco', 'San Marino', 'Liechtenstein'], ['Mônaco', 'San Marino', 'Liechtenstein'],
      'It\'s about 0.44 km², inside the city of Rome.', 'Tem cerca de 0,44 km², dentro da cidade de Roma.'),
    H('geo-brazil-borders', 3, 'Which two South American countries do NOT border Brazil? (name one)', 'Quais dois países da América do Sul NÃO fazem fronteira com o Brasil? (diga um)',
      'Chile', 'Chile', ['ecuador', 'equador'], ['Bolivia', 'Peru', 'Colombia'], ['Bolívia', 'Peru', 'Colômbia'],
      'Chile and Ecuador: every other South American country touches Brazil.', 'Chile e Equador: todos os outros países da América do Sul encostam no Brasil.'),
    H('geo-titicaca', 3, 'Which lake, between Peru and Bolivia, is the highest big lake that boats can sail on?', 'Qual lago, entre o Peru e a Bolívia, é o lago grande navegável mais alto?',
      'Lake Titicaca', 'Lago Titicaca', ['titicaca'], ['Lake Poopó', 'Lake Maracaibo', 'Lake Nicaragua'], ['Lago Poopó', 'Lago de Maracaibo', 'Lago Nicarágua'],
      'It sits about 3,800 m above sea level.', 'Fica a cerca de 3.800 m acima do nível do mar.'),
]

HAND_SCI = [
    H('sci-planets-count', 1, 'How many planets are in our solar system?', 'Quantos planetas tem o nosso sistema solar?', '8', '8', ['eight', 'oito'],
      ['9', '7', '10'], None, 'Pluto was moved to "dwarf planet" in 2006.', 'Plutão virou "planeta anão" em 2006.'),
    H('sci-jupiter', 1, 'Which is the biggest planet in our solar system?', 'Qual é o maior planeta do sistema solar?', 'Jupiter', 'Júpiter', [],
      ['Saturn', 'Neptune', 'Uranus'], ['Saturno', 'Netuno', 'Urano'], 'More than 1,300 Earths would fit inside it.', 'Caberiam mais de 1.300 Terras dentro dele.'),
    H('sci-mercury', 1, 'Which planet is closest to the Sun?', 'Qual planeta fica mais perto do Sol?', 'Mercury', 'Mercúrio', [],
      ['Venus', 'Mars', 'Earth'], ['Vênus', 'Marte', 'Terra'], 'Yet Venus is hotter, because its thick air traps heat.', 'Mesmo assim, Vênus é mais quente, porque o ar grosso dela prende o calor.'),
    H('sci-venus-hot', 2, 'Which planet is the hottest?', 'Qual é o planeta mais quente?', 'Venus', 'Vênus', [],
      ['Mercury', 'Mars', 'Jupiter'], ['Mercúrio', 'Marte', 'Júpiter'], 'Its surface is about 465 °C: hot enough to melt lead.', 'A superfície fica em cerca de 465 °C: quente o bastante pra derreter chumbo.'),
    H('sci-mars', 1, 'Which planet is called the Red Planet?', 'Qual planeta é chamado de Planeta Vermelho?', 'Mars', 'Marte', [],
      ['Jupiter', 'Venus', 'Mercury'], ['Júpiter', 'Vênus', 'Mercúrio'], 'The red is iron oxide: rust, in the dust.', 'O vermelho é óxido de ferro: ferrugem, na poeira.'),
    H('sci-titan', 3, 'What is Saturn\'s largest moon?', 'Qual é a maior lua de Saturno?', 'Titan', 'Titã', [],
      ['Enceladus', 'Europa', 'Ganymede'], ['Encélado', 'Europa', 'Ganimedes'], 'It\'s the only moon with a thick atmosphere.', 'É a única lua com atmosfera grossa.'),
    H('sci-ganymede', 4, 'What is the largest moon in the solar system?', 'Qual é a maior lua do sistema solar?', 'Ganymede', 'Ganimedes', [],
      ['Titan', 'Callisto', 'Io'], ['Titã', 'Calisto', 'Io'], 'It\'s Jupiter\'s, and it\'s bigger than the planet Mercury.', 'É de Júpiter, e é maior que o planeta Mercúrio.'),
    H('sci-light-min', 3, 'About how many minutes does sunlight take to reach Earth?', 'Mais ou menos quantos minutos a luz do Sol leva pra chegar na Terra?', '8', '8', ['eight', 'oito', '8 minutes', '8 minutos'],
      ['1', '30', '60'], None, 'It\'s about 8 minutes 20 seconds.', 'São cerca de 8 minutos e 20 segundos.'),
    H('sci-bones', 2, 'How many bones does an adult human have?', 'Quantos ossos tem um ser humano adulto?', '206', '206', [],
      ['300', '212', '186'], None, 'Babies have around 300; some join together as you grow.', 'Bebês têm cerca de 300; alguns se juntam enquanto você cresce.'),
    H('sci-femur', 2, 'What is the longest bone in the human body?', 'Qual é o maior osso do corpo humano?', 'Femur', 'Fêmur', ['thigh bone', 'osso da coxa'],
      ['Tibia', 'Humerus', 'Spine'], ['Tíbia', 'Úmero', 'Coluna'], 'It\'s in your thigh.', 'Fica na sua coxa.'),
    H('sci-stapes', 3, 'What is the smallest bone in the human body?', 'Qual é o menor osso do corpo humano?', 'Stapes', 'Estribo', ['stirrup'],
      ['Incus', 'Malleus', 'Coccyx'], ['Bigorna', 'Martelo', 'Cóccix'], 'It\'s in your ear, and it helps you hear.', 'Fica no ouvido, e ajuda você a ouvir.'),
    H('sci-skin', 2, 'What is the largest organ of the human body?', 'Qual é o maior órgão do corpo humano?', 'Skin', 'Pele', [],
      ['Liver', 'Brain', 'Lungs'], ['Fígado', 'Cérebro', 'Pulmões'], 'The liver is the largest one inside the body.', 'O fígado é o maior dentro do corpo.'),
    H('sci-light-speed', 3, 'About how fast does light travel, in km per second?', 'Mais ou menos qual a velocidade da luz, em km por segundo?', '300,000', '300.000', ['300000', '300 000', '299,792', '299792', '300 mil', '300 thousand'],
      ['30,000', '3,000,000', '150,000'], ['30.000', '3.000.000', '150.000'], 'Exactly 299,792.458 km/s in a vacuum.', 'Exatamente 299.792,458 km/s no vácuo.'),
    H('sci-water', 1, 'Which two elements make up water?', 'Quais dois elementos formam a água?', 'Hydrogen and oxygen', 'Hidrogênio e oxigênio', ['h2o', 'oxygen and hydrogen', 'oxigenio e hidrogenio', 'hydrogen oxygen', 'hidrogenio oxigenio'],
      ['Hydrogen and carbon', 'Oxygen and nitrogen', 'Carbon and oxygen'], ['Hidrogênio e carbono', 'Oxigênio e nitrogênio', 'Carbono e oxigênio'],
      'Two hydrogens and one oxygen: H₂O.', 'Dois hidrogênios e um oxigênio: H₂O.'),
    H('sci-boil', 1, 'At sea level, at what temperature does water boil (°C)?', 'No nível do mar, a que temperatura a água ferve (°C)?', '100', '100', ['100 c', '100 degrees', '100 graus'],
      ['90', '120', '80'], None, 'High on a mountain it boils at a lower temperature, because the air presses less.', 'No alto de uma montanha ela ferve com menos, porque o ar pressiona menos.'),
    H('sci-photosynthesis', 2, 'What do plants call the process of making food from sunlight?', 'Como se chama o processo em que as plantas fazem comida com a luz do Sol?', 'Photosynthesis', 'Fotossíntese', [],
      ['Respiration', 'Fermentation', 'Transpiration'], ['Respiração', 'Fermentação', 'Transpiração'],
      'It takes in carbon dioxide and water, and gives out oxygen.', 'Ela usa gás carbônico e água, e solta oxigênio.'),
    H('sci-mitochondria', 3, 'Which part of a cell turns food into energy?', 'Qual parte da célula transforma comida em energia?', 'Mitochondria', 'Mitocôndria', ['mitochondrion', 'mitocondrias'],
      ['Nucleus', 'Ribosome', 'Chloroplast'], ['Núcleo', 'Ribossomo', 'Cloroplasto'], 'Mitochondria have their own tiny DNA, passed down from your mother.', 'As mitocôndrias têm seu próprio DNA, que vem da sua mãe.'),
    H('sci-newton', 2, 'Which unit measures force?', 'Qual unidade mede força?', 'Newton', 'Newton', ['newtons', 'n'],
      ['Joule', 'Watt', 'Pascal'], None, 'One newton is about the weight of a small apple.', 'Um newton é mais ou menos o peso de uma maçã pequena.'),
    H('sci-blue-whale', 1, 'What is the largest animal that has ever lived?', 'Qual é o maior animal que já existiu?', 'Blue whale', 'Baleia-azul', ['baleia azul'],
      ['Argentinosaurus', 'Megalodon', 'Sperm whale'], ['Argentinossauro', 'Megalodonte', 'Cachalote'], 'It\'s bigger than any dinosaur we know of.', 'Ela é maior que qualquer dinossauro que conhecemos.'),
    H('sci-octopus-hearts', 3, 'How many hearts does an octopus have?', 'Quantos corações tem um polvo?', '3', '3', ['three', 'tres'],
      ['1', '2', '8'], None, 'Its blood is blue, because it uses copper instead of iron.', 'O sangue dele é azul, porque usa cobre em vez de ferro.'),
]


def write(pack, name):
    js = (f'// Trivia pack: {pack["title"]["en"]}. Built by tools/build_trivia.py from Wikidata (CC0) + hand-written questions.\n'
          '// Do not edit by hand: change the script and run it again.\n'
          f'const pack = {json.dumps(pack, ensure_ascii=False, indent=1)};\n\nexport default pack;\n')
    (OUT / name).write_text(js, encoding='utf-8')
    lv = {1: 0, 2: 0, 3: 0, 4: 0}
    for q in pack['questions']:
        lv[q['level']] += 1
    print(name, len(pack['questions']), 'questions, by level', lv)


if __name__ == '__main__':
    write(geography(), 'trivia-geography.js')
    write(science(), 'trivia-science.js')
