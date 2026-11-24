"""Récupère calendriers, résultats, classements et logos depuis ESPN.
Usage : python scripts/fetch_espn.py dump.json data/logos
Lancé automatiquement par GitHub Actions (voir .github/workflows/update-data.yml)."""
import json, sys, os, time, base64, datetime, urllib.request

OUT = sys.argv[1] if len(sys.argv) > 1 else 'dump.json'
LOGO_DIR = sys.argv[2] if len(sys.argv) > 2 else 'data/logos'
# clé: (sport, ligue ESPN, jours en arrière, jours en avant, utiliser le calendrier)
COMPS = {
    'fra.1': ('soccer', 'fra.1', 45, 70, True), 'fra.2': ('soccer', 'fra.2', 45, 70, True),
    'eng.1': ('soccer', 'eng.1', 45, 70, True), 'esp.1': ('soccer', 'esp.1', 45, 70, True),
    'ita.1': ('soccer', 'ita.1', 45, 70, True), 'ger.1': ('soccer', 'ger.1', 45, 70, True),
    'uefa.champions': ('soccer', 'uefa.champions', 45, 100, False),
    'nba': ('basketball', 'nba', 10, 21, True), 'top14': ('rugby', '270559', 45, 100, False),
}
UA = {'User-Agent': 'Mozilla/5.0 (survivor-league data updater)'}
PAUSE = 1.0

def get(url, binary=False):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                b = r.read()
                return b if binary else json.loads(b)
        except urllib.error.HTTPError as e:
            if e.code == 403:  # limite de débit ESPN : on patiente
                time.sleep(30)
            else:
                time.sleep(3)
        except Exception:
            time.sleep(3)
    print('ÉCHEC', url, file=sys.stderr)
    return None

def ds(d): return d.strftime('%Y%m%d')

today = datetime.datetime.utcnow()
dump = {'fetchedAt': today.isoformat(timespec='seconds') + 'Z', 'comps': {}, 'logos': {}}
for key, (sport, lg, back, fwd, use_cal) in COMPS.items():
    base = get(f'https://site.api.espn.com/apis/site/v2/sports/{sport}/{lg}/scoreboard'); time.sleep(PAUSE)
    events = {e['id']: e for e in (base or {}).get('events', [])}
    if key == 'top14':
        # classement calculé à partir des résultats : on remonte au début de la saison (fin août)
        start = datetime.datetime(today.year if today.month >= 8 else today.year - 1, 8, 20)
        back = max(back, (today - start).days)
    lo, hi = today - datetime.timedelta(days=back), today + datetime.timedelta(days=fwd)
    days = []
    cal = (((base or {}).get('leagues') or [{}])[0]).get('calendar')
    if use_cal and cal and isinstance(cal[0], str):
        for c in cal:
            d = datetime.datetime.fromisoformat(c.replace('Z', '+00:00')).replace(tzinfo=None)
            if lo <= d <= hi: days.append(ds(d))
    else:
        days = [ds(today + datetime.timedelta(days=i)) for i in range(-back, fwd + 1)]
    for d in sorted(set(days)):
        j = get(f'https://site.api.espn.com/apis/site/v2/sports/{sport}/{lg}/scoreboard?dates={d}')
        for e in (j or {}).get('events', []): events[e['id']] = e
        time.sleep(PAUSE)
    st = get(f'https://site.api.espn.com/apis/v2/sports/{sport}/{lg}/standings'); time.sleep(PAUSE)
    dump['comps'][key] = {'scoreboard': {'events': list(events.values())}, 'standings': st}
    print(key, len(events), 'matchs', 'classement OK' if st else 'pas de classement')

# logos manquants uniquement
have = set(os.listdir(LOGO_DIR)) if os.path.isdir(LOGO_DIR) else set()
hrefs = set()
def walk(o):
    if isinstance(o, dict):
        t = o.get('team') if isinstance(o.get('team'), dict) else None
        if t and t.get('id'):
            h = t.get('logo') or ((t.get('logos') or [{}])[0].get('href'))
            if h: hrefs.add(h.split('?')[0])
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
walk(dump['comps'])
for h in sorted(hrefs):
    path = h.split('espncdn.com')[-1]
    name = path.strip('/').replace('/', '_').replace('i_teamlogos_', '').replace('_500_', '_')
    if name in have: continue
    b = get(f'https://a.espncdn.com/combiner/i?img={path}&w=96&h=96', binary=True) or get(h, binary=True)
    if b: dump['logos'][h] = base64.b64encode(b).decode()
    time.sleep(0.3)
print('nouveaux logos', len(dump['logos']))
json.dump(dump, open(OUT, 'w'))
