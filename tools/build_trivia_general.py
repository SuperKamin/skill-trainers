"""Build the General knowledge trivia pack from Open Trivia DB (https://opentdb.com).

Run once on a PC:   python tools/build_trivia_general.py
Writes trainers/packs/trivia-general.js.
Licence: Open Trivia DB questions are CC BY-SA 4.0. Credit is kept in the pack and shown in the app,
and the pack file stays CC BY-SA 4.0 (kept apart from the rest of the code). English only.
Plan: plans/trivia-packs-mix.md (stage 3).

Kept: questions that work as a typed answer (not "Which of these…", not "NOT", not true/false),
with a short answer. Levels: easy 1 · medium 2 · hard 3.
"""
import json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'trainers' / 'packs' / 'trivia-general.js'
CATEGORY = 9  # General Knowledge
UA = 'SkillTrainersTriviaBuilder/1.0'
DROP_IDS = set()  # question texts dropped after reading (see BAD below)


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def fetch_all():
    token = get('https://opentdb.com/api_token.php?command=request')['token']
    out = []
    while True:
        time.sleep(5.5)  # the API allows one request every 5 seconds
        d = get(f'https://opentdb.com/api.php?amount=50&category={CATEGORY}&type=multiple&encode=url3986&token={token}')
        if d['response_code'] == 1:  # fewer than 50 left: ask for smaller amounts
            for n in (25, 10, 5, 1):
                time.sleep(5.5)
                d = get(f'https://opentdb.com/api.php?amount={n}&category={CATEGORY}&type=multiple&encode=url3986&token={token}')
                if d['response_code'] == 0:
                    break
        if d['response_code'] != 0:
            break
        out += d['results']
        print(' ', len(out), file=sys.stderr)
    return out


dec = urllib.parse.unquote
CHOICE_WORDS = re.compile(r'\b(which of (these|the following)|which one|following|not\b|NOT\b|true or false|all of)', re.I)
CACHE = ROOT / 'tools' / 'opentdb-general-raw.json'   # what was fetched (CC BY-SA 4.0), so a rebuild gives the same pack
REVIEW = json.loads((ROOT / 'tools' / 'trivia-general-review.json').read_text(encoding='utf-8'))
# Pogo read every question (05/11): 'drop' = wrong, outdated, alcohol, US-only stats, full dates, sad news, or doesn't
# work as a typed answer; 'aliases' = other answers that count; 'level' = level fixes.
NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
       'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']


def keep(q, a):
    if CHOICE_WORDS.search(q):
        return False
    if len(a) > 32 or len(a.split()) > 5:
        return False
    if q in REVIEW['drop']:
        return False
    return True


def main():
    if CACHE.exists():
        raw = json.loads(CACHE.read_text(encoding='utf-8'))
    else:
        raw = fetch_all()
        CACHE.write_text(json.dumps(raw, ensure_ascii=False, indent=0), encoding='utf-8')
    qs, seen = [], set()
    for i, r in enumerate(raw):
        q, a = dec(r['question']).strip(), dec(r['correct_answer']).strip()
        wrong = [dec(x).strip() for x in r['incorrect_answers']][:3]
        if q in seen or not keep(q, a) or len(wrong) < 3:
            continue
        seen.add(q)
        lvl = REVIEW['level'].get(q) or {'easy': 1, 'medium': 2, 'hard': 3}[r['difficulty']]
        aliases = list(REVIEW['aliases'].get(q, []))
        low = a.lower()
        if low in NUM:
            aliases.append(str(NUM.index(low)))
        elif a.isdigit() and int(a) < len(NUM):
            aliases.append(NUM[int(a)])
        qid = 'gk-' + re.sub(r'[^a-z0-9]+', '-', q.lower())[:40].strip('-')
        qs.append({'id': qid, 'q': {'en': q, 'pt': q}, 'a': {'en': a, 'pt': a}, 'aliases': aliases,
                   'wrong': {'en': wrong, 'pt': wrong}, 'note': {'en': '', 'pt': ''}, 'level': lvl})
    ids = [q['id'] for q in qs]
    assert len(ids) == len(set(ids)), 'duplicate ids'
    pack = {'id': 'general', 'title': {'en': 'General knowledge', 'pt': 'Conhecimentos gerais'}, 'langs': ['en'],
            'licence': 'CC BY-SA 4.0', 'credit': 'Questions from Open Trivia DB (opentdb.com), CC BY-SA 4.0.', 'questions': qs}
    js = ('// Trivia pack: General knowledge. Questions from Open Trivia DB (https://opentdb.com), licensed CC BY-SA 4.0\n'
          '// (https://creativecommons.org/licenses/by-sa/4.0/). This file (and any change to it) stays CC BY-SA 4.0.\n'
          '// Built by tools/build_trivia_general.py: change the script and run it again rather than editing by hand.\n'
          f'const pack = {json.dumps(pack, ensure_ascii=False, indent=1)};\n\nexport default pack;\n')
    OUT.write_text(js, encoding='utf-8')
    lv = {1: 0, 2: 0, 3: 0}
    for q in qs:
        lv[q['level']] += 1
    print(f'{len(raw)} fetched, {len(qs)} kept, by level {lv}')


if __name__ == '__main__':
    main()
