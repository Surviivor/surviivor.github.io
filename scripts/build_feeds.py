"""Transforme le fichier ESPN brut en données compactes pour le site.
Usage : python scripts/build_feeds.py dump.json data"""
# Build compact feeds + logos for the Survivor page from raw ESPN dumps.
import json, os, sys, shutil, datetime, collections
from zoneinfo import ZoneInfo
import base64
SRC=sys.argv[1]; DST=sys.argv[2]
DUMP={'comps':{},'logos':{}}
FETCHED=[]
for path in SRC.split(','):
    d=json.load(open(path))
    if d.get('fetchedAt'): FETCHED.append(d['fetchedAt'])
    DUMP['logos'].update(d.get('logos',{}))
    for k,v in d['comps'].items():
        cur=DUMP['comps'].setdefault(k,{'scoreboard':{'events':[]},'standings':None})
        if v.get('scoreboard',{}).get('events'):
            ids={e['id'] for e in v['scoreboard']['events']}
            cur['scoreboard']['events']=[e for e in cur['scoreboard']['events'] if e['id'] not in ids]+v['scoreboard']['events']
        if v.get('standings'): cur['standings']=v['standings']
LOGOS={}
for href,b64 in DUMP.get('logos',{}).items():
    path=href.split('espncdn.com')[-1].split('?')[0]; LOGOS[path.strip('/').replace('/','_')]=base64.b64decode(b64)
NAMES={'fra.1':'Ligue 1','fra.2':'Ligue 2','eng.1':'Premier League','esp.1':'Liga','ita.1':'Serie A','ger.1':'Bundesliga','uefa.champions':'Ligue des champions','nba':'NBA','top14':'Top 14'}
SPORT={'nba':'basketball','top14':'rugby'}
os.makedirs(DST+'/feeds',exist_ok=True); os.makedirs(DST+'/logos',exist_ok=True)
logo_files=set(LOGOS)
used_logos=set()
existing=set(os.listdir(DST+'/logos'))
def calc_rugby_standings(teams, events):
    """ESPN ne fournit pas le classement du Top 14 : on le calcule à partir des résultats.
    Victoire 4 pts, nul 2, défaite 0, +1 bonus défensif si défaite de 5 points ou moins
    (le bonus offensif, qui dépend des essais, n'est pas disponible)."""
    canon={}; byname={}
    alias={'Section Paloise':'Pau','USA Perpignan':'Perpignan'}
    for tid,t in teams.items():
        nm=alias.get(t.get('n'),t.get('n'))
        canon[tid]=byname.setdefault(nm,tid)
    tab={}
    for e in events.values():
        if e.get('st')!='post' or e.get('hs') is None or e.get('as') is None: continue
        h,a=canon.get(e['h'],e['h']),canon.get(e['a'],e['a']); hs,as_=int(e['hs']),int(e['as'])
        for t,f,ag in ((h,hs,as_),(a,as_,hs)):
            r=tab.setdefault(t,{'t':t,'gp':0,'w':0,'d':0,'l':0,'gf':0,'ga':0,'gd':0,'pts':0})
            r['gp']+=1; r['gf']+=f; r['ga']+=ag; r['gd']=r['gf']-r['ga']
            if f>ag: r['w']+=1; r['pts']+=4
            elif f==ag: r['d']+=1; r['pts']+=2
            else:
                r['l']+=1
                if ag-f<=5: r['pts']+=1
    rows=sorted(tab.values(), key=lambda r:(-r['pts'],-r['gd'],-r['gf']))
    for i,r in enumerate(rows): r['rank']=i+1
    return [{'g':'Top 14','rows':rows,'calc':True}] if rows else []

# Logos corrigés à la main (ESPN renvoie un mauvais logo ou aucun)
LOGO_FIX={'top14':{'Bayonne':'data/logos/rugby_fix_bayonne.png','Aviron Bayonnais':'data/logos/rugby_fix_bayonne.png',
  'Perpignan':'data/logos/rugby_fix_perpignan.png','USA Perpignan':'data/logos/rugby_fix_perpignan.png',
  'Vannes':'data/logos/rugby_fix_vannes.png','RC Vannes':'data/logos/rugby_fix_vannes.png',
  'Section Paloise':'data/logos/rugby_teams_270567.png'}}
def fix_logos(key, o):
    fx=LOGO_FIX.get(key)
    if not fx: return
    if isinstance(o,dict):
        if isinstance(o.get('n'),str) and 'logo' in o and o['n'] in fx: o['logo']=fx[o['n']]
        for v in o.values(): fix_logos(key, v)
    elif isinstance(o,list):
        for v in o: fix_logos(key, v)
def logo_for(href):
    if not href: return ''
    path=href.split('espncdn.com')[-1].split('?')[0]
    fn=path.strip('/').replace('/','_')
    out=fn.replace('i_teamlogos_','').replace('_500_','_')
    if out in existing: return 'data/logos/'+out
    if fn not in logo_files: return ''
    used_logos.add((fn,out)); return 'data/logos/'+out
def P(s): return datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
index=[]
now=datetime.datetime.now(datetime.timezone.utc)
stamp=(min(FETCHED) if FETCHED else now.isoformat().replace('+00:00','Z'))
for key in NAMES:
    if key not in DUMP['comps']: continue
    sb=DUMP['comps'][key].get('scoreboard') or {}; st=DUMP['comps'][key].get('standings') or {}
    teams={}; events={}
    def addteam(t):
        if not t or not t.get('id'): return
        tid=str(t['id'])
        href=t.get('logo') or ((t.get('logos') or [{}])[0].get('href'))
        cur=teams.get(tid,{})
        teams[tid]={'n':t.get('displayName') or t.get('name') or cur.get('n','?'),'logo':cur.get('logo') or logo_for(href)}
    for e in (sb or {}).get('events',[]):
        comp=e['competitions'][0]; cs=comp.get('competitors',[])
        h=next((c for c in cs if c.get('homeAway')=='home'),None); a=next((c for c in cs if c.get('homeAway')=='away'),None)
        if not h or not a: continue
        addteam(h['team']); addteam(a['team'])
        stt=(e.get('status') or comp.get('status') or {}).get('type',{})
        state=stt.get('state','pre'); name=stt.get('name','')
        if 'POSTPONED' in name or 'CANCELED' in name or 'CANCELLED' in name: state='canc'
        def sc(c):
            s=c.get('score'); 
            if isinstance(s,dict): s=s.get('value') or s.get('displayValue')
            try: return int(float(s))
            except Exception: return None
        ev={'d':e['date'],'h':str(h['team']['id']),'a':str(a['team']['id']),'st':state}
        if state in('in','post'): ev['hs']=sc(h); ev['as']=sc(a)
        events[str(e['id'])]=ev
    # standings
    groups=[]; gp_now={}
    def entries(node):
        out=[]
        if isinstance(node,dict):
            if node.get('standings',{}).get('entries'): out.append((node.get('name') or node.get('abbreviation') or '', node['standings']['entries']))
            for ch in node.get('children',[]) or []: out+=entries(ch)
        return out
    for gname,ents in entries(st):
        rows=[]
        for en in ents:
            t=en.get('team',{}); addteam(t); stats={s.get('name') or s.get('type'):s.get('value') for s in en.get('stats',[])}
            gp=stats.get('gamesPlayed'); 
            if gp is None and stats.get('wins') is not None: gp=(stats.get('wins') or 0)+(stats.get('losses') or 0)+(stats.get('ties') or 0)
            gd=stats.get('pointDifferential', stats.get('pointsDifference', stats.get('pointsDifferential', stats.get('differential'))))
            if key=='nba': pts=stats.get('wins')
            else: pts=stats.get('points')
            rk=stats.get('rank') or stats.get('playoffSeed')
            I=lambda v: int(round(float(v))) if v not in (None,'') else None
            row={'t':str(t.get('id')),'gp':I(gp),'gd':I(gd),'pts':I(pts),'rank':I(rk) if rk else None,
                 'w':I(stats.get('wins', stats.get('gamesWon'))),'d':I(stats.get('ties', stats.get('gamesDrawn'))),'l':I(stats.get('losses', stats.get('gamesLost'))),
                 'gf':I(stats.get('pointsFor')),'ga':I(stats.get('pointsAgainst'))}
            disp={s.get('name'):s.get('displayValue') for s in en.get('stats',[])}
            if disp.get('streak') and disp.get('streak')!='-': row['streak']=disp['streak']
            if disp.get('Last Ten Games'): row['l10']=disp['Last Ten Games']
            row={k:v for k,v in row.items() if v is not None}
            rows.append(row); 
            if row['gp'] is not None: gp_now[row['t']]=row['gp']
        if key=='nba': rows.sort(key=lambda r:(-(r['pts'] or 0), r['gp'] or 0))
        else: rows.sort(key=lambda r:(r['rank'] or 999, -(r['pts'] or 0)))
        for i,r in enumerate(rows): r['rank']=i+1
        g=gname.replace('\r','').replace('\n','').strip()
        if key=='nba': g='Conférence Est' if 'East' in g else 'Conférence Ouest' if 'West' in g else g
        groups.append({'g':g,'rows':rows,'season':(st.get('children') or [{}])[0].get('abbreviation') if isinstance(st,dict) else None})
    # drop stale standings (ESPN sometimes serves an old season, e.g. Top 14)
    import re as _re
    if key!='nba' and groups and groups[0].get('season') and not _re.search(r'202[67]', str(groups[0]['season'])):
        print(key,'stale standings', groups[0]['season']); groups=[]
    if key=='top14' and not groups: groups=calc_rugby_standings(teams, events)
    # rounds
    evl=sorted([(k,v) for k,v in events.items() if v['st']!='canc'], key=lambda x:x[1]['d'])
    rounds=[]; cur=None
    if key=='nba':
        ny=ZoneInfo('America/New_York'); by=collections.OrderedDict()
        for k,v in evl: by.setdefault(P(v['d']).astimezone(ny).date().isoformat(),[]).append(k)
        for day,ids in by.items(): rounds.append({'k':day.replace('-',''),'ev':ids})
    else:
        last=None
        for k,v in evl:
            d=P(v['d']); teams_in=set()
            if cur: teams_in=cur['teams']
            if cur is None or (d-last).total_seconds()>2.5*86400 or v['h'] in teams_in or v['a'] in teams_in:
                cur={'ev':[],'teams':set()}; rounds.append(cur)
            cur['ev'].append(k); cur['teams'].update([v['h'],v['a']]); last=d
        for r in rounds: r.pop('teams',None); r['k']=P(events[r['ev'][0]]['d']).strftime('%Y%m%d')
    # keys unique
    seen=collections.Counter()
    for r in rounds:
        seen[r['k']]+=1
        if seen[r['k']]>1: r['k']+=f"_{seen[r['k']]}"
        ds=[events[i]['d'] for i in r['ev']]; r['s']=min(ds); r['e']=max(ds)
    # matchday numbers (not NBA)
    if key not in ('nba','top14') and gp_now:
        team_ev=collections.defaultdict(list)
        for k,v in evl: team_ev[v['h']].append(k); team_ev[v['a']].append(k)
        for r in rounds:
            votes=collections.Counter()
            for k in r['ev']:
                v=events[k]
                for tm in (v['h'],v['a']):
                    if tm not in gp_now: continue
                    lst=team_ev[tm]
                    if v['st']=='post':
                        later=sum(1 for x in lst if events[x]['st']=='post' and events[x]['d']>v['d'])
                        votes[gp_now[tm]-later]+=1
                    else:
                        before=sum(1 for x in lst if events[x]['st']!='post' and events[x]['d']<v['d'])
                        votes[gp_now[tm]+before+1]+=1
            if votes:
                n=votes.most_common(1)[0][0]
                if 0<n<60: r['n']=n
    feed={'key':key,'name':NAMES[key],'sport':SPORT.get(key,'soccer'),'updatedAt':stamp,
          'teams':teams,'events':events,'rounds':rounds,'standings':groups}
    if key=='nba': feed['ptsLabel']='V'
    fix_logos(key, feed)
    json.dump(feed,open(f'{DST}/feeds/{key}.json','w'),separators=(',',':'),ensure_ascii=False)
    index.append({'key':key,'name':NAMES[key],'rounds':len(rounds),'events':len(events)})
    print(key, len(events),'events', len(rounds),'rounds', sum(len(g['rows']) for g in groups),'rows', [ (r['k'],r.get('n'),len(r['ev'])) for r in rounds if r['e']>now.isoformat()][:3])
for fn,out in used_logos: open(f'{DST}/logos/{out}','wb').write(LOGOS[fn])
json.dump({'updatedAt':stamp,'comps':index},open(f'{DST}/feeds/index.json','w'))
print('logos', len(used_logos))
