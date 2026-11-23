"""Ajoute automatiquement les prochaines journées dans les ligues (même logique que le site).

Lancé par GitHub Actions après la mise à jour des données ESPN.
Nécessite le secret FIREBASE_SERVICE_ACCOUNT (clé JSON du compte de service Firebase).
"""
import json, os, re, sys
from datetime import datetime, timezone, timedelta

COMP_NAMES = {'fra.1': 'Ligue 1', 'fra.2': 'Ligue 2', 'eng.1': 'Premier League', 'esp.1': 'Liga',
              'ita.1': 'Serie A', 'ger.1': 'Bundesliga', 'uefa.champions': 'Ligue des champions',
              'nba': 'NBA', 'top14': 'Top 14'}
AUTO_DAYS = 21


def ts(iso):
    if not iso:
        return 0
    s = str(iso).replace('Z', '+00:00')
    if re.search(r'T\d\d:\d\d\+', s):  # "2026-11-27T19:45+00:00" sans secondes
        s = s.replace('+', ':00+', 1)
    return int(datetime.fromisoformat(s).timestamp() * 1000)


def build_round(feed, comp, fr, n_fallback):
    evs = [dict(id=i, **feed['events'][i]) for i in fr['ev'] if i in feed['events']]
    evs = sorted([e for e in evs if e.get('d') and e.get('st') != 'canc'], key=lambda e: ts(e['d']))
    if not evs:
        return None
    rmap = {}
    for g in feed.get('standings') or []:
        for r in g['rows']:
            rmap[str(r['t'])] = r['rank']
    matches = {}
    for i, e in enumerate(evs):
        def side(tid):
            tm = feed['teams'].get(str(tid), {'n': '?'})
            s = {'n': tm.get('n', '?'), 'id': str(tid), 'logo': tm.get('logo', '')}
            if rmap.get(str(tid)):
                s['rk'] = rmap[str(tid)]
            return s
        matches[f"m{i}_{e['id']}"] = {'h': side(e['h']), 'a': side(e['a']), 'd': e['d'], 'ev': e['id'],
                                      'comp': comp, 'result': None}
    rk = re.sub(r'[^A-Za-z0-9_-]', '_', f"{comp}_{fr['k']}")
    return rk, {'n': fr.get('n') or n_fallback, 'deadline': evs[0]['d'], 'dl': ts(evs[0]['d']),
                'label': COMP_NAMES.get(comp, ''), 'matches': matches}


def main(data_dir):
    key = os.environ.get('FIREBASE_SERVICE_ACCOUNT', '').strip()
    if not key:
        print('Pas de clé Firebase : ajout automatique ignoré.')
        return
    import firebase_admin
    from firebase_admin import credentials, firestore
    firebase_admin.initialize_app(credentials.Certificate(json.loads(key)))
    db = firestore.client()

    now = int(datetime.now(timezone.utc).timestamp() * 1000)
    horizon = now + AUTO_DAYS * 864e5
    feeds = {}
    for snap in db.collection('leagues').stream():
        lg = snap.to_dict() or {}
        mode = lg.get('mode') or ('majority' if lg.get('category') == 'tuprefere' else 'pick')
        comp = lg.get('comp')
        if mode != 'pick' or not comp or lg.get('autoImport') is False:
            continue
        if comp not in feeds:
            p = os.path.join(data_dir, 'feeds', comp + '.json')
            feeds[comp] = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else None
        feed = feeds[comp]
        if not feed or not feed.get('rounds'):
            continue
        start = ts(lg.get('startAt'))
        rounds = lg.get('rounds') or {}
        n = len(rounds)
        add = {}
        for fr in feed['rounds']:
            s = ts(fr['s'])
            if not (s > now and s >= start and s <= horizon):
                continue
            b = build_round(feed, comp, fr, n + 1)
            if not b or b[0] in rounds or b[0] in add:
                continue
            add[b[0]] = b[1]
            n += 1
        if add:
            snap.reference.set({'rounds': add}, merge=True)
            print(f"{lg.get('name', snap.id)} : {len(add)} journée(s) ajoutée(s)")
    print('Ajout automatique terminé.')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'data')
