(() => {
"use strict";

/* ================================================================ Config */
const CATS = {
  football:{label:'Football',icon:'ball',emo:'⚽',mode:'pick',draw:true,cover:'gazon',comps:['fra.1','fra.2','eng.1','esp.1','ita.1','ger.1','uefa.champions']},
  rugby:{label:'Rugby',icon:'rugby',emo:'🏉',mode:'pick',draw:true,cover:'gazon',comps:['top14']},
  basket:{label:'Basketball',icon:'basket',emo:'🏀',mode:'pick',draw:false,cover:'orage',comps:['nba']},
  tuprefere:{label:'Tu préfères',icon:'flash',emo:'⚡',mode:'majority',draw:false,cover:'orage',comps:[]}
};
const COMP_NAMES = {'fra.1':'Ligue 1','fra.2':'Ligue 2','eng.1':'Premier League','esp.1':'Liga','ita.1':'Serie A','ger.1':'Bundesliga','uefa.champions':'Ligue des champions','nba':'NBA','top14':'Top 14'};
const COVERS = [
  {k:'gazon',label:'Gazon',emo:'🏟️',bg:'linear-gradient(160deg,#16A34A,#064E3B)'},
  {k:'terre',label:'Terre battue',emo:'🎾',bg:'linear-gradient(160deg,#EA580C,#7C2D12)'},
  {k:'orage',label:'Orage',emo:'⛈️',bg:'linear-gradient(160deg,#4338CA,#0F172A)'}
];
const cat = k => CATS[k] || CATS.football;
const COMP_RX=[['eng.1',/premi(e|è)re?\s*league|\bpl\b|angleterre/i],['esp.1',/\bliga\b|espagne/i],['ita.1',/serie\s*a|italie|calcio/i],['ger.1',/bundesliga|allemagne/i],['uefa.champions',/champions|\bldc\b|\bucl\b/i],['fra.2',/ligue\s*2|\bl2\b/i],['fra.1',/ligue\s*1|\bl1\b/i],['nba',/\bnba\b/i],['top14',/top\s*14/i]];
const compFromName = n => { for(const [k,rx] of COMP_RX) if(rx.test(String(n||''))) return k; return null; };
const POINTS_N = 20; // Race : points à atteindre par défaut
const pointsRules = n => `Le premier joueur à atteindre ${n} points gagne la ligue.\nÀ chaque journée, choisis UNE équipe parmi les matchs proposés.\nElle gagne : 3 points. Match nul : 1 point. Elle perd : 0 point. Pas de choix = 0 point.\nAttention : tu ne peux choisir qu'une seule fois la même équipe sur toute la ligue.\nLes choix restent secrets jusqu'à l'heure limite.\nSi plusieurs joueurs atteignent ${n} points lors de la même journée, celui qui a le meilleur goal-average gagne (buts marqués moins buts encaissés par les équipes qu'il a choisies).`;
const DEFAULT_RULES = {
  merguez:"Ligue MERGUEZ : tout est à l'envers ! À chaque journée, choisis UNE équipe qui va PERDRE son match.\nSi ton équipe perd, tu restes en course pour la journée suivante. Si elle gagne ou fait match nul, tu es éliminé. Pas de pari = éliminé.\nMême principe pour les survivants à chaque journée, mais tu ne peux pas choisir plusieurs fois la même équipe tout au long de la ligue : les équipes déjà jouées sont grisées.\nLe dernier joueur en vie remporte la ligue.\nLes choix restent secrets jusqu'à l'heure limite.",
  pick:"À chaque journée, choisis UN seul match et parie sur l'équipe ou le résultat de ton choix.\nSi ton pari se réalise, tu restes en course pour la journée suivante. Sinon (ton équipe perd ou fait match nul), tu es éliminé. Pas de pari = éliminé.\nMême principe pour les survivants à chaque journée, mais tu ne peux pas choisir plusieurs fois la même équipe tout au long de la ligue : les équipes déjà jouées sont grisées.\nLe dernier joueur en vie remporte la ligue.\nLes choix restent secrets jusqu'à l'heure limite. Tu peux ensuite retrouver les choix de chacun dans l'onglet « HISTORIQUE ».\nSi tous les survivants tombent la même journée, ils sont départagés à l'audace : gagne celui qui a joué, en moyenne depuis le début, les équipes les moins bien classées avant chaque journée.",
  majority:"À chaque question, vote pour l'option de ton choix.\nTu restes en vie si tu votes comme la majorité des survivants.\nSi tu votes comme la minorité, ou si tu ne votes pas, tu es éliminé…\nLes votes restent secrets jusqu'à l'heure limite. Tu peux ensuite retrouver le résultat dans l'onglet « HISTORIQUE ».\nEn cas d'égalité parfaite entre les 2 options, personne parmi les votants n'est éliminé.\nLes 2 derniers survivants remportent la ligue."
};

const I = {
  logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/></svg>',
  crop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l7 7 4-4 7 7"/><path d="M15 16h6v-6"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v2h3a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 7.3 12H7a4 4 0 0 1-4-4V6a1 1 0 0 1 1-1h3V3zm10 4v3a2 2 0 0 0 2-2V7h-2zM5 7v1a2 2 0 0 0 2 2V7H5z"/></svg>',
  paris:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13l4 4L16 7M10 15l2 2L22 7"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2l.5 2.6a8 8 0 0 1 2 1.2l2.5-.9 1.5 2.6-2 1.7a8 8 0 0 1 0 2.4l2 1.7-1.5 2.6-2.5-.9a8 8 0 0 1-2 1.2L13.5 22h-3l-.5-2.6a8 8 0 0 1-2-1.2l-2.5.9L4 16.5l2-1.7a8 8 0 0 1 0-2.4l-2-1.7L5.5 8l2.5.9a8 8 0 0 1 2-1.2L10.5 2h3zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v4H7v2h4v4h2v-4h4v-2h-4V7z"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 9c-2.6 0-4.8 1.2-5.8 3a8 8 0 0 0 11.6 0c-1-1.8-3.2-3-5.8-3z"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  chev:'<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M13 8l4 4-4 4"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M2 5c3-1.5 6.5-1.5 10 1 3.5-2.5 7-2.5 10-1v14c-3-1.5-6.5-1.5-10 1-3.5-2.5-7-2.5-10-1V5zM12 6v14"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 21V11h5v10M8 21V4h6v17M14 21V8h6v13M2 21h20"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm7.5 1.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM9 13c3.9 0 7 2 7 4.5V20H2v-2.5C2 15 5.1 13 9 13zm8 .3c2.8.3 5 1.9 5 3.9V20h-4v-2.5c0-1.6-.4-3-1-4.2z"/></svg>',
  heart:'<svg class="heart" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8.5-5.2-9.8-10.6C1.4 6.9 3.6 4 6.9 4c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.5 2.9 4.7 6.4C20.5 15.8 12 21 12 21z"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
  cam:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1.5 2H20a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3.5L9 3zm3 5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v8M14 10v8"/></svg>',
  image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
  sparkle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15zM5 2l.6 1.4L7 4l-1.4.6L5 6l-.6-1.4L3 4l1.4-.6L5 2z"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3zm4 7.5l-1.4-1.4L11 11.7 9.4 10.1 8 11.5l3 3 5-5z"/></svg>',
  ball:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 7l4 3-1.5 5h-5L8 10l4-3zM12 2v5M16 10l5-1.5M14.5 15l3 4.5M9.5 15l-3 4.5M8 10L3 8.5"/></svg>',
  rugby:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)"/><path d="M9 15l6-6M10 11l3 3M12 9l3 3M8 13l3 3"/></svg>',
  basket:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2v20M5 5c3 3 3 11 0 14M19 5c-3 3-3 11 0 14"/></svg>',
  data:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/><circle cx="19" cy="6" r="1.2" fill="currentColor"/></svg>',
  flash:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
  key:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="8" cy="15" r="5"/><path d="M11.5 11.5L21 2M17 6l3 3M15 8l2 2"/></svg>'
};

/* ================================================================ State */
const S = {
  mode:'loading', me:null, isOwner:false, email:'', readOnly:false, stale:false,
  leagues:{}, players:{}, names:{}, feeds:{}, feedIndex:null,
  loaded:{leagues:false,players:false},
  view:{tab:'ligues', league:null, ltab:'paris', manage:null, filter:'all', comp:null, newCat:'football'},
  open:{}
};
// « Comment on joue ? » : déroulé lors des 3 premières visites, puis replié par défaut
(()=>{ try{ const n=(+localStorage.getItem('survivor-visits')||0)+1; localStorage.setItem('survivor-visits',String(n)); S.visits=n; if(n>3) S.open.howX=true; }catch(e){} })();
let db=null, user=null, assets=null;

/* ================================================================ Utils */
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now = () => Date.now();
const t = iso => iso ? new Date(iso).getTime() : 0;
const rid = () => Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2,'0');
const fmtDT = iso => { const d=new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtD = iso => { const d=new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };
const fmtShort = iso => { const d=new Date(iso); return d.toLocaleDateString('fr-FR',{weekday:'short'})+` ${pad(d.getDate())}/${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dateIn = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const timeIn = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
function untilJH(iso){
  const d=t(iso)-now(); if(d<=0) return 'quelques instants';
  const m=Math.floor(d/60000), h=Math.floor(m/60), j=Math.floor(h/24), hh=h%24;
  if(j>=1) return `${j} jour${j>1?'s':''}${hh?` et ${hh} heure${hh>1?'s':''}`:''}`;
  if(h>=1) return `${h} heure${h>1?'s':''}${m%60?` et ${m%60} min`:''}`;
  return `${Math.max(1,m)} min`;
}
function until(iso){
  const d=t(iso)-now(); if(d<=0) return null;
  const m=Math.floor(d/60000), h=Math.floor(m/60), j=Math.floor(h/24);
  if(j>=1) return j+(j>1?' jours':' jour'); if(h>=1) return h+' h'; return Math.max(1,m)+' min';
}
function initials(n){ const p=String(n||'?').trim().split(/\s+/); return ((p[0]||'?')[0]+(p[1]?p[1][0]:'')).toUpperCase(); }
const genCode = () => { const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<6;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; };
let toastT;
function toast(msg, err){ const el=document.getElementById('toast'); el.textContent=msg; try{ wmify(el); }catch(e){} el.className='show'+(err?' err':''); clearTimeout(toastT); toastT=setTimeout(()=>el.className=err?'err':'',2800); }
const clone = o => JSON.parse(JSON.stringify(o||{}));
function deepMerge(a,b){ for(const k in b){ if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){ if(!a[k]||typeof a[k]!=='object') a[k]={}; deepMerge(a[k],b[k]); } else a[k]=b[k]; } return a; }
const blobUrl = id => !id ? '' : /^(data:|https?:)/.test(String(id)) ? String(id) : '/_blob/'+encodeURIComponent(id);
const imgFb = (src, fb, cls='') => src ? `<img src="${esc(src)}" class="${cls}" data-fb="${esc(fb)}" alt="">` : fb;

// image fallback (logo / wordmark / covers)
document.addEventListener('error', e=>{
  const el=e.target; if(el && el.tagName==='IMG' && el.dataset.fb!==undefined){ const span=document.createElement('span'); span.innerHTML=el.dataset.fb; el.replaceWith(...span.childNodes); }
}, true);

// Logos : « Survivor » (élimination) et « Race » (ligue aux points)
const BRANDS = { survivor:{img:'survivor', txt:'SURVIVOR', alt:'Survivor'}, oneshot:{img:'race', txt:'RACE', alt:'Race'}, merguez:{img:'merguez', txt:'MERGUEZ', alt:'Merguez'} };
const brandOf = s => /^(one\s*shot|race)$/i.test(String(s).trim()) ? 'oneshot' : /^merguez$/i.test(String(s).trim()) ? 'merguez' : 'survivor';
const WM = (k='survivor', white=false) => { const b=BRANDS[k]||BRANDS.survivor; return `<img class="wm" src="img/${b.img}${white?'-white':''}.png" data-fb="${esc('<span class="wm-txt">'+b.txt+'</span>')}" alt="${b.alt}">`; };
const WM_RE=/survivor|one shot|\bRACE\b|\bRace\b|\bmerguez\b/i;
function isLight(el){ try{ const c=getComputedStyle(el).color.match(/\d+(\.\d+)?/g); if(!c) return false; const [r,g,b]=c.map(Number); return (0.299*r+0.587*g+0.114*b)>160; }catch(e){ return false; } }
function wmify(root){
  if(!root) return;
  const tw=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode:n=>{ const p=n.parentElement; if(!p||/^(SCRIPT|STYLE|OPTION|SELECT|TEXTAREA|TITLE)$/.test(p.tagName)||p.closest('.wm-txt')) return NodeFilter.FILTER_REJECT; return WM_RE.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP; }});
  const nodes=[]; while(tw.nextNode()) nodes.push(tw.currentNode);
  nodes.forEach(n=>{
    const light=isLight(n.parentElement); const parts=n.nodeValue.split(/(survivor|one shot|\bRACE\b|\bRace\b|\bmerguez\b)/i); const frag=document.createDocumentFragment();
    parts.forEach(pt=>{ if(/^(survivor|one shot|race|merguez)$/i.test(pt)){ const b=BRANDS[brandOf(pt)]; const img=document.createElement('img'); img.className='wm in'; img.alt=b.alt; img.src=`img/${b.img}${light?'-white':''}.png`; img.dataset.fb=`<span class="wm-txt">${b.txt}</span>`; frag.appendChild(img); } else if(pt) frag.appendChild(document.createTextNode(pt)); });
    n.replaceWith(frag);
  });
}
const TITLE_SEL='.sec,.sec2,.ltitle .rest,.h-disp,.card .ctitle,.round h3,.hero-h,.empty h3,.sheet h3,.celeb h2,.bigcount .t,.codebox .code,.ptitle span.big';
const noAcc = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function unaccent(root){
  if(!root||!root.querySelectorAll) return;
  const els=[...root.querySelectorAll(TITLE_SEL)]; if(root.matches&&root.matches(TITLE_SEL)) els.push(root);
  els.forEach(el=>{ const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT); let n; while((n=tw.nextNode())){ const v=noAcc(n.nodeValue); if(v!==n.nodeValue) n.nodeValue=v; } });
}
const _obs=new MutationObserver(ms=>{ ms.forEach(m=>m.addedNodes.forEach(nd=>{ if(nd.nodeType===1){ wmify(nd); } else if(nd.nodeType===3 && nd.parentElement) wmify(nd.parentElement); })); });
document.addEventListener('DOMContentLoaded',()=>{});
const stripPrefix = n => String(n||'').replace(/^\s*(survivor|one\s*shot|race|merguez)\s*(x\b)?\s*/i,'').trim();
const fmtBrand = f => f==='points' ? 'oneshot' : 'survivor';
const fullName = (rest, f) => (f==='points'?'Race X ':f==='merguez'?'Merguez X ':'Survivor X ')+stripPrefix(rest);
const splitBrand = name => { const m=String(name||'').match(/^\s*(survivor|one\s*shot|race|merguez)\b\s*(.*)$/i); return m?{k:brandOf(m[1]), rest:m[2]}:null; };
const XI = () => `<img class="xm" src="img/x.png" data-fb="X" alt="X">`;
const xify = h => { const m=String(h).match(/^\s*x(\s+|$)(.*)$/i); return m ? `${XI()}<span>${m[2]}</span>` : h; };
const pfxInput = (id, cls, val, ph, k='survivor') => `<div class="pfx-in ${cls} ${k}"><span class="pfx">${WM(k)}${XI()}</span><input class="in ${cls}" id="${id}" maxlength="48" value="${esc(val||'')}" placeholder="${esc(ph)}"></div>`;
function leagueTitle(name, cls=''){
  const n=String(name||'');
  const sb=splitBrand(n);
  if(sb) return `<div class="ltitle ${cls}">${WM(sb.k)}<span class="rest">${xify(esc(sb.rest).toUpperCase())}</span></div>`;
  return `<div class="ltitle ${cls}"><span class="rest" style="margin-top:0">${esc(n).toUpperCase()}</span></div>`;
}
const titleImg = (file, text) => `<img class="big" src="img/${file}?v=2" data-fb="${esc('<span class="big">'+text+'</span>')}" alt="${esc(text)}">`;

const PHOTOS=[{k:'supporter',label:'Supporter'},{k:'ciseau',label:'Ciseau'},{k:'derby',label:'Derby'},{k:'trophee',label:'Trophée'},{k:'nuit',label:'Terrain de nuit'},{k:'tribune',label:'Tribune'},{k:'coupfranc',label:'Coup franc'},{k:'pause',label:'Pause'},{k:'volee',label:'Volée'},{k:'sprint',label:'Sprint'},{k:'mur',label:'Le mur'}];
const isPhoto = k => PHOTOS.some(p=>p.k===k);
let CREDITS=null;
fetch('img/covers/credits.json').then(r=>r.ok?r.json():{}).then(j=>{ CREDITS=j||{}; try{ render(); }catch(e){} }).catch(()=>{ CREDITS={}; });
function coverKey(lg){
  const c=lg.cover||'auto';
  if(c!=='auto' && (String(c).startsWith('asset:') || isPhoto(c))) return c;
  let h=0; const id=String(lg.id||lg.name||''); for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0;
  return PHOTOS[h%PHOTOS.length].k;
}
function coverFrame(p){ if(!p) return ''; const x=+p.x||50, y=+p.y||50, z=Math.max(1,+p.z||1); return `object-position:${x}% ${y}%;transform:scale(${z});transform-origin:${x}% ${y}%`; }
function coverHtml(lg){
  const k=coverKey(lg), st=coverFrame(lg.coverPos);
  if(k.startsWith && k.startsWith('asset:')) return `<img src="${blobUrl(k.slice(6))}" alt=""${st?` style="${st}"`:''}>`;
  const h=coverImg(k, cat(lg.category).emo);
  return st ? h.replace('<img ',`<img style="${st}" `) : h;
}
// Recadrage de la couverture : on garde l'image entière et on mémorise le cadrage (point visé + zoom)
function cropCover(lid){
  const lg=S.leagues[lid]; if(!lg) return;
  const p=lg.coverPos||{}; let x=+p.x||50, y=+p.y||50, z=Math.max(1,+p.z||1);
  const d=document.createElement('div'); d.className='modal';
  d.innerHTML=`<div class="sheet crop-sheet"><h3>RECADRER LA PHOTO</h3><div class="muted" style="font-size:14px">Fais glisser la photo et zoome : le cadrage s'applique à la vignette de la ligue.</div>
    <div class="ccv-box">${coverHtml({...lg,coverPos:null})}</div>
    <div class="crop-zoom"><span>−</span><input type="range" min="1" max="3" step="0.01" value="${z}"><span>+</span></div>
    <div class="acts"><button class="btn ghost" data-x>ANNULER</button><button class="btn" data-ok>VALIDER</button></div></div>`;
  document.body.appendChild(d);
  const box=d.querySelector('.ccv-box'), img=box.querySelector('img'), range=d.querySelector('input[type=range]');
  if(!img){ d.remove(); return toast('Pas de photo à recadrer.',true); }
  const draw=()=>{ x=Math.min(100,Math.max(0,x)); y=Math.min(100,Math.max(0,y)); img.setAttribute('style',coverFrame({x,y,z})); };
  draw();
  let last=null;
  box.addEventListener('pointerdown',e=>{ box.setPointerCapture(e.pointerId); last={x:e.clientX,y:e.clientY}; });
  box.addEventListener('pointermove',e=>{ if(!last) return; const r=box.getBoundingClientRect(); x-=(e.clientX-last.x)/r.width*100/z; y-=(e.clientY-last.y)/r.height*100/z; last={x:e.clientX,y:e.clientY}; draw(); });
  const up=()=>{ last=null; }; box.addEventListener('pointerup',up); box.addEventListener('pointercancel',up);
  box.addEventListener('wheel',e=>{ e.preventDefault(); z=Math.min(3,Math.max(1,z*(e.deltaY<0?1.06:1/1.06))); range.value=z; draw(); },{passive:false});
  range.addEventListener('input',()=>{ z=+range.value; draw(); });
  d.addEventListener('click',e=>{
    if(e.target===d||e.target.closest('[data-x]')){ d.remove(); return; }
    if(e.target.closest('[data-ok]')){ d.remove(); writeLeague(lid,{coverPos:{x:Math.round(x*10)/10,y:Math.round(y*10)/10,z:Math.round(z*100)/100}}).then(()=>toast('Cadrage enregistré.')); }
  });
}
function coverImg(k, emo){
  if(isPhoto(k)) return `<img src="img/covers/${k}.jpg" alt="">`;
  const cv=COVERS.find(x=>x.k===k)||COVERS[0];
  return `<div class="ph" style="background:${cv.bg}">${emo||cv.emo}</div>`;
}
function creditLine(k){
  const c=CREDITS&&CREDITS[k]; if(!c) return '';
  return `Photo : ${esc(c.artist)} · <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.license)}</a> · Wikimedia Commons`;
}
function nameOf(id){ const p=S.players[id]; if(p && p.pseudo) return p.pseudo; return S.names[id] || 'Joueur'; }
const DEFAULT_AVATAR='img/avatar-default.jpg';
function avatarOf(id, cls=''){ const p=S.players[id]; const ini=esc(initials(nameOf(id))); return `<div class="av ${cls}"><img src="${p && p.avatar ? blobUrl(p.avatar) : DEFAULT_AVATAR}" data-fb="${ini}" alt=""></div>`; }
let nameReq=null;
function resolveNames(){
  if(!user || S.mode!=='live' || nameReq) return;
  const ids=Object.keys(S.players).filter(id=>!(id in S.names)); if(!ids.length) return;
  nameReq=user.profiles(ids).then(ps=>{ ids.forEach(id=>{ S.names[id]=(ps&&ps[id]&&ps[id].name)||''; }); }).catch(()=>{}).finally(()=>{ nameReq=null; render(); });
}

/* ================================================================ Feeds */
const feedReq={};
function loadFeed(key){
  if(!key || S.feeds[key] || feedReq[key]) return;
  feedReq[key]=fetch('data/feeds/'+encodeURIComponent(key)+'.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{ S.feeds[key]=j||{missing:true}; render(); setTimeout(autoImportAll,300); }).catch(()=>{ S.feeds[key]={missing:true}; render(); });
}
function loadFeedIndex(){
  if(S.feedIndex) return;
  S.feedIndex={loading:true};
  fetch('data/feeds/index.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{ S.feedIndex=j||{comps:[]}; render(); }).catch(()=>{ S.feedIndex={comps:[]}; render(); });
}
const teamOf = (feed,id) => (feed && feed.teams && feed.teams[id]) || {n:'?'};
// Logos corrigés (ESPN renvoie un mauvais logo ou aucun pour ces clubs de rugby)
const LOGO_FIX={'Bayonne':'data/logos/rugby_fix_bayonne.png','Aviron Bayonnais':'data/logos/rugby_fix_bayonne.png','Perpignan':'data/logos/rugby_fix_perpignan.png','USA Perpignan':'data/logos/rugby_fix_perpignan.png','Vannes':'data/logos/rugby_fix_vannes.png','RC Vannes':'data/logos/rugby_fix_vannes.png','Section Paloise':'data/logos/rugby_teams_270567.png','Bordeaux':'data/logos/rugby_teams_143737.png','Stade Toulousain':'data/logos/rugby_teams_25922.png','LOU Rugby':'data/logos/rugby_teams_143736.png'};
const BAD_LOGOS=/countries_(usa|van)\.png$/;
function logoOf(side){ if(!side) return ''; return LOGO_FIX[side.n] || side.logo || ''; }
function logoTag(side, cls='lg'){ const u=logoOf(side); return u ? `<img class="${cls}" src="${esc(u)}" data-fb="" alt="">` : ''; }

/* ================================================================ Game logic */
const isPickMode = lg => (lg.mode||cat(lg.category).mode)==='pick';
const isPoints = lg => !!lg && lg.scoring==='points' && isPickMode(lg);
const nRoundsOf = lg => Math.max(1, +lg.target || POINTS_N); // ici : points à atteindre
const defaultRules = lg => isPoints(lg) ? pointsRules(nRoundsOf(lg)) : isMerguez(lg) ? DEFAULT_RULES.merguez : DEFAULT_RULES[isPickMode(lg)?'pick':'majority'];
const isMerguez = lg => !!(lg && lg.merguez && !isPoints(lg));
// Merguez : on survit si l'équipe choisie PERD
const pickOk = (lg, res, side) => isMerguez(lg) ? ((side==='H'&&res==='A')||(side==='A'&&res==='H')) : res===side;
const allowDraw = lg => isPoints(lg) ? false : isMerguez(lg) ? false : lg.allowDraw!==undefined ? lg.allowDraw : cat(lg.category).draw;
const roundsOf = lg => Object.entries(lg.rounds||{}).map(([k,r])=>({...r,k})).sort((a,b)=>t(a.deadline)-t(b.deadline)||a.k.localeCompare(b.k));
const matchesOf = r => Object.entries(r.matches||{}).map(([k,m])=>({...m,k})).sort((a,b)=>t(a.d)-t(b.d)||a.k.localeCompare(b.k));
const teamKey = side => side ? String(side.id || side.n || '').toLowerCase() : '';
function pickOf(uid, lid, rk){ const p=S.players[uid]; return p && p.picks && p.picks[lid] && p.picks[lid][rk] ? p.picks[lid][rk] : null; }
// Icônes maison (traits sobres, couleur du texte) — remplacent les emojis
const IC=(()=>{ const sv=(d,extra='')=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`; return {
  heart:sv('<path d="M12 20s-7-4.4-9.2-8.6C1.4 8.6 3 5 6.5 5c2 0 3.5 1.2 5.5 3.3C14 6.2 15.5 5 17.5 5 21 5 22.6 8.6 21.2 11.4 19 15.6 12 20 12 20z" fill="currentColor" stroke="none"/>'),
  bomb:sv('<circle cx="10.5" cy="14" r="6.5" fill="currentColor" stroke="none"/><path d="M15 9.5l2-2"/><path d="M17.5 7c.5-1.6 2-2.6 3.5-2.5"/><path d="M21 3v1.5M22.5 4.5H21"/>'),
  lantern:sv('<path d="M9 4h6"/><path d="M12 2v2"/><path d="M8 7h8l1 10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2l1-10z" fill="currentColor" stroke="none"/><path d="M8 7h8"/><path d="M10 21h4"/>'),
  eye:sv('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff:sv('<path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.5 4.5-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  trophy:sv('<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M16 6h3a3 3 0 0 1-3 4M8 6H5a3 3 0 0 0 3 4"/><path d="M12 13v4M8 21h8M9.5 17h5"/>'),
  gift:sv('<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12"/><path d="M12 9S10.5 4 8 4.5 7 9 12 9zM12 9s1.5-5 4-4.5S17 9 12 9z"/>'),
  clock:sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  life:sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>'),
  users:sv('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>'),
  flame:sv('<path d="M12 22c4 0 7-2.8 7-7 0-4.5-4-6.5-4-11-3 1.5-5 4.5-5 7.5-1.5-.8-2.2-2.3-2.3-3.5C5.5 9.6 5 11.8 5 15c0 4.2 3 7 7 7z"/>'),
  bolt:sv('<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>'),
  skull:sv('<path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3z"/><circle cx="9" cy="11.5" r="1.6" fill="currentColor"/><circle cx="15" cy="11.5" r="1.6" fill="currentColor"/><path d="M10.5 20v-2M13.5 20v-2"/>'),
  thumb:sv('<path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3z"/><path d="M7 10l4-8a2.5 2.5 0 0 1 2.5 2.5V9h5.6a2 2 0 0 1 2 2.3l-1.4 8a2 2 0 0 1-2 1.7H7"/>'),
  check:sv('<path d="M4 12.5l5 5L20 6.5"/>'),
  x:sv('<path d="M6 6l12 12M18 6L6 18"/>'),
  minus:sv('<path d="M5 12h14"/>'),
  flex:sv('<path d="M7 11V8.5a2.5 2.5 0 0 1 5 0V11"/><path d="M7 11h9.5a3.5 3.5 0 0 1 0 7H10a5 5 0 0 1-5-5v-1a1 1 0 0 1 2 0"/>'),
  shirt:sv('<path d="M8 3l-5 3 2 4 2-1v12h10V9l2 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z"/>'),
  beer:sv('<path d="M5 8h10v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8z"/><path d="M15 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"/><path d="M5 8c0-2 1.5-3 3-3 .5-1 1.5-2 3-2s2.5 1 3 2c1.5 0 2 1 1 3"/>'),
  alert:sv('<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17.5v.5"/>'),
  chat:sv('<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.6-5.4A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01" stroke-width="2.6"/>'),
  crop:sv('<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>'),
  phone:sv('<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18h2"/>'),
  qmark:sv('<circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4"/><path d="M12 17.4v.2" stroke-width="2.8"/>'),
  ticket:sv('<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4V8z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/>'),
  chart:sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  money:sv('<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>'),
  joker:'<img class="jki" src="img/jester.png" alt="">',
}; })();
// Pictos en couleur (options, règles, jokers) + pastille pastel
const CI={
  heart:'<svg class="ic" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9C.9 8.8 2.8 4.5 6.7 4.5c2.2 0 3.7 1.3 5.3 3.2 1.6-1.9 3.1-3.2 5.3-3.2 3.9 0 5.8 4.3 4.3 7.5C19.5 16.4 12 21 12 21z" fill="#E5493A"/><path d="M6.5 8.2c.6-1 1.6-1.4 2.6-1.2" stroke="#fff" stroke-opacity=".55" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  trophy:'<svg class="ic" viewBox="0 0 24 24"><path d="M7 3h10v6a5 5 0 0 1-10 0V3z" fill="#F6B40E"/><path d="M17 5h3a3.5 3.5 0 0 1-3.6 4.6M7 5H4a3.5 3.5 0 0 0 3.6 4.6" fill="none" stroke="#F6B40E" stroke-width="2" stroke-linecap="round"/><rect x="10.8" y="13" width="2.4" height="4" fill="#B9810A"/><rect x="7.5" y="17" width="9" height="4" rx="1.2" fill="#B9810A"/><path d="M10 6.5v3" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/></svg>',
  lantern:'<svg class="ic" viewBox="0 0 24 24"><path d="M9 2.5h6M12 2.5v2" stroke="#16181D" stroke-width="2" stroke-linecap="round"/><rect x="7.5" y="4.5" width="9" height="2.5" rx="1" fill="#16181D"/><path d="M8 7h8l.8 10.5a1.5 1.5 0 0 1-1.5 1.5H8.7a1.5 1.5 0 0 1-1.5-1.5L8 7z" fill="#E5493A"/><ellipse cx="12" cy="13" rx="2" ry="3" fill="#FFD36B"/><rect x="7.5" y="19" width="9" height="2.5" rx="1" fill="#16181D"/></svg>',
  bomb:'<svg class="ic" viewBox="0 0 24 24"><circle cx="10.5" cy="14" r="7" fill="#5B3FD6"/><rect x="13.3" y="6.3" width="4" height="3.4" rx="1" transform="rotate(45 15.3 8)" fill="#5B3FD6"/><path d="M17 6.5c.8-1.8 2.2-2.6 3.6-2.4" stroke="#16181D" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M21 2.2l.4 1.3 1.3.4-1.3.4-.4 1.3-.4-1.3-1.3-.4 1.3-.4z" fill="#F6A623"/><circle cx="8" cy="11.5" r="1.6" fill="#fff" fill-opacity=".45"/></svg>',
};
const TI=k=>`<span class="ict ict-${k}">${k==='joker'?'<img src="img/jester.png" alt="">':(CI[k]||IC[k])}</span>`;
const JOKER_ICO='<img class="jki" src="img/jester.png" alt="">';
// Joker « double chance » (Survivor, 1 fois par ligue) : le pari contient une 2e équipe (m2/p2, j:true)
const jokerOn = lg => !!lg && !!lg.joker && isPickMode(lg) && !isPoints(lg);
const pickSides = p => !p ? [] : [{m:p.m,p:p.p}, ...(p.j && p.m2 && p.p2 ? [{m:p.m2,p:p.p2}] : [])];
// Sabotage 💣 : un joueur interdit une équipe à un adversaire pour une journée (1 fois par ligue). Stocké chez le saboteur : players[u].sabo[lid]={to,team,tn,rk,at}
const saboOn = lg => !!lg && !!lg.sabotage && isPickMode(lg);
function sabosOn(lid, uid, rk){ const out=[]; Object.entries(S.players).forEach(([u,p])=>{ [p&&p.sabo&&p.sabo[lid], p&&p.sabo2&&p.sabo2[lid]].forEach(x=>{ if(x && x.to===uid && x.rk===rk) out.push({from:u, team:x.team, tn:x.tn}); }); }); return out; }
const mySabo = lid => { const p=S.players[S.me]; if(xjOf(S.me,lid)==='sabo') return (p&&p.sabo2&&p.sabo2[lid])||null; return (p&&p.sabo&&p.sabo[lid])||null; };
// pari « effectif » : on retire les équipes sabotées
function effPick(u, lid, r){
  const p=pickOf(u,lid,r.k); if(!p) return null; const lg=S.leagues[lid];
  // une équipe déjà jouée lors d'une journée précédente ne compte pas (règle « une seule fois par équipe », vérifiée aussi au calcul)
  const ban=new Set(saboOn(lg)?sabosOn(lid,u,r.k).map(x=>x.team):[]);
  const r0t=t(r.deadline); roundsOf(lg).forEach(q=>{ if(q.k===r.k || t(q.deadline)>=r0t) return; pickSides(pickOf(u,lid,q.k)).forEach(x=>{ if(x.p==='D') return; const m=(q.matches||{})[x.m]; if(m) ban.add(teamKey(x.p==='H'?m.h:m.a)); }); });
  if(!ban.size) return p;
  const ok=pickSides(p).filter(x=>{ if(x.p==='D') return true; const m=(r.matches||{})[x.m]; return !m || !ban.has(teamKey(x.p==='H'?m.h:m.a)); });
  if(!ok.length) return null; if(ok.length===pickSides(p).length) return p;
  return {...p, m:ok[0].m, p:ok[0].p, m2:null, p2:null, j:false};
}
// Lanterne rouge 🔴 : l'équipe choisie est dernière du classement (classement d'avant la journée si dispo)
function isLantern(lg, r, x){
  if(!x||x.p==='D'||!r.matches) return false; const m=r.matches[x.m]; if(!m) return false;
  const f=S.feeds[m.comp||lg.comp]; if(!f||!f.standings||!f.standings.length) return false;
  const rk=sideRank(lg,m,x.p==='H'?m.h:m.a); if(!rk) return false;
  if(isMerguez(lg)) return rk===1; // option Leader : parier sur la défaite du 1er
  const g=f.standings.find(g=>g.rows.some(rw=>String(rw.t)===String((x.p==='H'?m.h:m.a).id)))||f.standings[0];
  return rk===g.rows.length;
}
// Paris des autres visibles avant l'heure limite ?
const picksVisible = lg => lg && lg.picksVis==='visible';
function jokerRound(lid, uid){ const p=S.players[uid]; const pk=(p&&p.picks&&p.picks[lid])||{}; const ks=Object.keys(pk).filter(k=>pk[k]&&pk[k].j&&pk[k].m2); if(xjOf(uid,lid)==='joker'){ const lg=S.leagues[lid]||{}; ks.sort((a,b)=>t(((lg.rounds||{})[a]||{}).deadline)-t(((lg.rounds||{})[b]||{}).deadline)); return ks[1]||null; } return ks[0]||null; }
const members = lid => Object.keys(S.players).filter(id=>S.players[id].leagues && S.players[id].leagues[lid]);
const isMember = lid => !!(S.me && S.players[S.me] && S.players[S.me].leagues && S.players[S.me].leagues[lid]);
const canManage = lg => !!lg && (S.isOwner || lg.id===S.me);

function feedEvent(lg, m){
  if(!m.ev) return null;
  const f=S.feeds[m.comp||lg.comp]; if(!f || !f.events) return null;
  return f.events[m.ev]||null;
}
function matchResult(lg, m){
  if(m.result) return {r:m.result, manual:true, hs:m.hs??null, as:m.as??null};
  const e=feedEvent(lg,m);
  if(e && e.st==='post' && e.hs!=null && e.as!=null){ const hs=+e.hs, as=+e.as; return {r: hs>as?'H':hs<as?'A':'D', auto:true, hs, as}; }
  return null;
}
function matchScore(lg,m){ const e=feedEvent(lg,m); if(e && (e.st==='post'||e.st==='in') && e.hs!=null) return `${e.hs} - ${e.as}`; return ''; }

function rankMap(comp){
  const f=S.feeds[comp]; if(!f||!f.standings) return null;
  let map=rankCache.get(f); if(!map){ map={}; f.standings.forEach(g=>g.rows.forEach(r=>map[r.t]=r.rank)); rankCache.set(f,map); }
  return map;
}
// rank of a team before the round: snapshot saved at import, else current standings
function shortName(lg, m, side){ const f=S.feeds[(m&&m.comp)||(lg&&lg.comp)]; const tm=f&&f.teams&&side&&side.id?f.teams[String(side.id)]:null; return (tm&&tm.sn)||side.n||''; }
// nom sur une seule ligne (coupé avec … si trop long) + pastille de classement toujours visible
function teamLabel(lg, m, side, right){
  const nm=`<span class="tn">${esc(shortName(lg,m,side))}</span>`, n=sideRank(lg,m,side), rk=n?`<span class="rk2">${n}${n===1?'er':'e'}</span>`:'';
  return right?rk+nm:nm+rk;
}
function sideRank(lg, m, side){ if(!side) return null; if(side.rk) return side.rk; const map=rankMap(m.comp||lg.comp); return map&&side.id?map[String(side.id)]||null:null; }
function pickRank(lg, r, p){ if(!p||p.p==='D'||!r.matches) return null; const m=r.matches[p.m]; if(!m) return null; return sideRank(lg, m, p.p==='H'?m.h:m.a); }
function audacity(lg, rounds, info, uid, upto){
  let sum=0, n=0;
  for(const r of rounds){ const ri=info[r.k]; if(!ri||!['done','tiebreak','cancelled'].includes(ri.state)) { if(r.k===upto) break; continue; } const rk=pickRank(lg,r,pickOf(uid,lg.id,r.k)); if(rk){ sum+=rk; n++; } if(r.k===upto) break; }
  return n? sum/n : null;
}
function compute(lid){
  const lg=S.leagues[lid]; if(!lg) return null;
  const mem=members(lid), rounds=roundsOf(lg), pick=isPickMode(lg);
  if(isPoints(lg)) return computePoints(lg, mem, rounds);
  let alive=new Set(mem); const elimAt={}; const info={}; let finished=false, blocked=false, n=0;
  // Vies (Survivor) : lg.lives = vie(s) en réserve au départ ; lg.awayBonus = +1 vie après 3 paris gagnés de suite sur l'équipe à l'extérieur
  const lives={}, streak={}; mem.forEach(u=>{ lives[u]=pick?(+lg.lives||0):0; streak[u]=0; });
  for(const r of rounds){
    n++; const ri={n, aliveBefore:[...alive], state:'open'}; info[r.k]=ri;
    const closed=t(r.deadline)<=now();
    if(!closed){ ri.state='open'; continue; }
    if(finished){ ri.state='after'; continue; }
    if(blocked){ ri.state='waiting'; continue; }
    const A=[...alive];
    if(pick){
      const ms=matchesOf(r); const res={}; let all=true;
      ms.forEach(m=>{ const x=matchResult(lg,m); if(x) res[m.k]=x.r; else all=false; });
      ri.res=res;
      if(!ms.length || !all){ ri.state='waiting'; blocked=true; continue; }
      let correct=A.filter(u=>{ const p=effPick(u,lid,r); return p && pickSides(p).some(x=>pickOk(lg,res[x.m],x.p)); });
      const anyPick=A.some(u=>pickOf(u,lid,r.k));
      if(!anyPick){ ri.state='cancelled'; ri.out=[]; }
      // tous les survivants perdent la même journée : tout le monde est repêché, la journée est annulée pour eux
      else if(!correct.length && !A.some(u=>lives[u]>0)){ const out=A.filter(u=>!pickOf(u,lid,r.k)); out.forEach(u=>elimAt[u]=r.k); if(out.length){ alive=new Set(A.filter(u=>!out.includes(u))); } ri.state=out.length?'done':'cancelled'; ri.out=out; ri.rescued=true; }
      else {
        // bonus extérieur : tous les 3 paris sur une équipe qui joue à l'extérieur (gagnés ou non, pas forcément de suite) = +1 vie
        if(lg.redLantern){ ri.lantern=[]; A.forEach(u=>{ const p=effPick(u,lid,r); if(p && !p.j && correct.includes(u) && isLantern(lg,r,p)){ lives[u]++; ri.lantern.push(u); } }); }
        const wrong=A.filter(u=>!correct.includes(u)), saved=wrong.filter(u=>lives[u]>0); saved.forEach(u=>lives[u]--);
        const out=wrong.filter(u=>!saved.includes(u)); out.forEach(u=>elimAt[u]=r.k); alive=new Set(A.filter(u=>!out.includes(u))); ri.state='done'; ri.out=out; ri.saved=saved;
      }
      if(ri.state==='done'){ let bold=null, br=0; correct.forEach(u=>{ const rk=pickRank(lg,r,pickOf(u,lid,r.k)); if(rk&&rk>br){ br=rk; bold=u; } }); if(bold) ri.bold={u:bold,rk:br}; }
      if(mem.length>1 && alive.size<=1) finished=true;
    } else {
      let ca=0, cb=0; A.forEach(u=>{ const p=pickOf(u,lid,r.k); if(p&&p.p==='A') ca++; else if(p&&p.p==='B') cb++; });
      ri.votes={A:ca,B:cb};
      if(ca+cb===0){ ri.state='cancelled'; ri.out=[]; }
      else {
        let keep;
        if(ca===cb){ keep=A.filter(u=>pickOf(u,lid,r.k)); ri.win=null; }
        else { const w=ca>cb?'A':'B'; ri.win=w; keep=A.filter(u=>{ const p=pickOf(u,lid,r.k); return p&&p.p===w; }); }
        const out=A.filter(u=>!keep.includes(u)); out.forEach(u=>elimAt[u]=r.k); alive=new Set(keep); ri.state='done'; ri.out=out;
      }
      if(mem.length>2 && alive.size<=2) finished=true;
    }
  }
  const started = now()>=t(lg.startAt);
  return {lg, mem, rounds, info, alive:[...alive], elimAt, started, pick,
    status: !started?'upcoming':finished?'finished':'live', winners: finished?[...alive]:[], lives, streak};
}
// Race : 3 pts victoire, 1 pt nul, 0 défaite. Le premier à atteindre l'objectif gagne ; égalité → meilleur goal-average.
function computePoints(lg, mem, rounds){
  const lid=lg.id, N=nRoundsOf(lg), info={}, pts={}, w={}, d={}, l={}, ga={};
  mem.forEach(u=>{ pts[u]=0; w[u]=0; d[u]=0; l[u]=0; ga[u]=0; });
  let played=0, finished=false, firsts=[];
  rounds.forEach((r,i)=>{
    const ri={n:i+1, idx:i+1, aliveBefore:[...mem], state:'open', out:[], pts:{}, ga:{}}; info[r.k]=ri;
    if(finished){ ri.state='after'; return; }
    if(t(r.deadline)>now()) return;
    const ms=matchesOf(r), res={}, sco={}; let all=!!ms.length;
    ms.forEach(m=>{ const x=matchResult(lg,m); if(x){ res[m.k]=x.r; if(x.hs!=null) sco[m.k]=[+x.hs,+x.as]; } else all=false; });
    ri.res=res; ri.state=all?'done':'waiting'; if(all) played++;
    mem.forEach(u=>{ const p=effPick(u,lid,r);
      if(!p){ if(all) ri.pts[u]=0; return; }
      const x=res[p.m]; if(!x) return;
      const sc=(x===p.p?3:x==='D'?1:0)+(x===p.p&&lg.redLantern&&isLantern(lg,r,p)?2:0); ri.pts[u]=sc; pts[u]+=sc; if(sc>=3) w[u]++; else if(sc===1) d[u]++; else l[u]++;
      const g=sco[p.m]; const diff=g?(p.p==='H'?g[0]-g[1]:p.p==='A'?g[1]-g[0]:0):0; ri.ga[u]=diff; ga[u]+=diff; });
    if(all){ let bold=null, br=0; mem.forEach(u=>{ if(ri.pts[u]===3){ const rk=pickRank(lg,r,pickOf(u,lid,r.k)); if(rk&&rk>br){ br=rk; bold=u; } } }); if(bold) ri.bold={u:bold,rk:br};
      const reached=mem.filter(u=>pts[u]>=N);
      if(reached.length){ finished=true; const best=Math.max(...reached.map(u=>ga[u])); firsts=reached.filter(u=>ga[u]===best); ri.finish=true; } }
  });
  const started=now()>=t(lg.startAt);
  const key=u=>[firsts.includes(u)?1:0, pts[u], ga[u], w[u]];
  const cmp=(a,b)=>{ const A=key(a), B=key(b); return B[0]-A[0]||B[1]-A[1]||B[2]-A[2]||B[3]-A[3]; };
  const sorted=[...mem].sort((a,b)=>cmp(a,b)||nameOf(a).localeCompare(nameOf(b)));
  const ranking=sorted.map(u=>({u, pos:sorted.filter(v=>cmp(v,u)<0).length+1, tie:sorted.some(v=>v!==u&&cmp(v,u)===0), pts:pts[u], w:w[u], d:d[u], l:l[u], ga:ga[u]}));
  const rankOf={}; ranking.forEach(x=>rankOf[x.u]=x);
  return {lg, mem, rounds, info, alive:[...mem], elimAt:{}, started, pick:true, points:true, N, pts, ga, played, ranking, rankOf, losers:[], firsts, lasts:[],
    status: !started?'upcoming':finished?'finished':'live', winners: started&&finished?firsts:[]};
}
// Option « le dernier » (ligues privées) : lastRule = 'wins' (le dernier gagne aussi) | 'drink' (le dernier doit un verre au premier)
function lastsOf(c){
  if(c.mem.length<2 || c.status!=='finished') return [];
  if(c.points){ const rest=c.ranking.filter(x=>!c.firsts.includes(x.u)); if(!rest.length) return [];
    const lo=rest[rest.length-1]; return rest.filter(x=>x.pts===lo.pts&&x.ga===lo.ga).map(x=>x.u); }
  for(const r of c.rounds){ const ri=c.info[r.k]; if(ri&&ri.out&&ri.out.length) return ri.out.filter(u=>!c.winners.includes(u)); }
  return [];
}
const LAST_RULES={wins:{ico:'🏆',t:'Le dernier gagne aussi'}, drink:{ico:'🍺',t:'Le dernier doit un verre au premier'}};
const C = lid => { const c=compute(lid); if(!c) return c; c.lastRule=(c.points&&LAST_RULES[c.lg.lastRule])?c.lg.lastRule:null; c.lasts=c.lastRule?lastsOf(c):[]; c.firstsW=c.points?c.firsts:c.winners; return c; };
const wonBy=(c,u)=>c.winners.includes(u)||(c.lastRule==='wins'&&c.lasts.includes(u));
function lastBanner(c){
  if(!c.lastRule) return '';
  const nm=a=>a.map(u=>u===S.me?'toi':esc(nameOf(u))).join(' & ');
  if(c.status!=='finished'||!c.lasts.length) return '';
  if(c.lastRule==='wins') return c.lasts.includes(S.me)?`<div class="banner win"><span class="ico">🏆</span>Tu finis à la dernière place… et tu gagnes quand même !</div>`:`<div class="banner info"><span class="ico">🏆</span>${nm(c.lasts)} ${c.lasts.length>1?'finissent à la dernière place et gagnent':'finit à la dernière place et gagne'} aussi !</div>`;
  if(c.lasts.includes(S.me)) return `<div class="banner dead"><span class="ico">🍺</span>Tu finis à la dernière place : tu dois un verre à ${nm(c.firstsW)} !</div>`;
  if(c.firstsW.includes(S.me)) return `<div class="banner win"><span class="ico">🍺</span>${nm(c.lasts)} ${c.lasts.length>1?'te doivent':'te doit'} un verre !</div>`;
  return `<div class="banner info"><span class="ico">🍺</span>${nm(c.lasts)} ${c.lasts.length>1?'doivent':'doit'} un verre à ${nm(c.firstsW)}.</div>`;
}
function usedTeams(c, uid, rk){
  const set=new Set(); const r0=c.lg.rounds[rk]; if(!r0) return set;
  c.rounds.forEach(r=>{ if(r.k===rk || t(r.deadline)>=t(r0.deadline)) return; const p=pickOf(uid,c.lg.id,r.k); pickSides(p).forEach(x=>{ if(x.p==='D') return; const m=(r.matches||{})[x.m]; if(m) set.add(teamKey(x.p==='H'?m.h:m.a)); }); });
  return set;
}
const canPick = (c, r) => c && isMember(c.lg.id) && c.alive.includes(S.me) && c.status!=='finished' && t(r.deadline)>now();

/* ================================================================ Data layer */
let myQ=Promise.resolve();
function writeMe(patch, replaceAll){
  const id=S.me; const cur=S.players[id];
  const base = replaceAll ? clone(patch) : deepMerge(clone(cur||{leagues:{},picks:{}}), patch);
  S.players[id]=base; render();
  if(S.mode==='demo') return Promise.resolve();
  const exists=!!cur;
  const p=myQ.then(()=>{ const ref=db.doc('players/'+id); return (exists&&!replaceAll)?ref.update(patch):ref.set(base); });
  myQ=p.catch(()=>{});
  return p.then(()=>true, e=>{ handleErr(e); return new Promise(()=>{}); });
}
const lq={};
function writeLeague(lid, patch, kind){
  if(kind==='delete') delete S.leagues[lid];
  else if(kind==='set') S.leagues[lid]={...clone(patch),id:lid};
  else S.leagues[lid]=deepMerge(clone(S.leagues[lid]), patch);
  render();
  if(S.mode==='demo') return Promise.resolve();
  const full=S.leagues[lid];
  const p=(lq[lid]||Promise.resolve()).then(()=>{ const ref=db.doc('leagues/'+lid); if(kind==='delete') return ref.delete(); if(kind==='set') return ref.set({...clone(patch),id:lid}); return ref.update(patch); });
  lq[lid]=p.catch(()=>{});
  return p.then(()=>true, e=>{ handleErr(e); return new Promise(()=>{}); });
}
// remove a nested key: rewrite whole doc
function replaceLeague(lid, full){ return writeLeague(lid, full, 'set'); }
function handleErr(e){
  console.warn(e);
  if(e && e.code==='permission-denied'){ toast("Action refusée : l'heure limite est passée ou tu n'as pas les droits.",true); render(); return; }
  if(e && e.code==='invalid_argument'){ S.readOnly=true; toast("Action refusée : demande à l'organisateur de t'inviter comme Éditeur.",true); }
  else if(e && e.code==='quota_exceeded') toast('Base de données pleine : supprime d\'anciennes ligues.',true);
  else toast('Erreur réseau, réessaie.',true);
  render();
}
const guard = () => { if(S.readOnly){ toast("Lecture seule : demande à l'organisateur de t'inviter comme Éditeur.",true); return true; } return false; };

async function boot(){
  loadFeedIndex();
  try{ if(window.claude && window.claude.use){ [db,user,assets]=await Promise.all([window.claude.use('db'),window.claude.use('user'),window.claude.use('assets')]); } }catch(e){ db=null; }
  if(!db||!user) return startDemo();
  try{ S.me=await user.id(); }catch(e){}
  if(!S.me && window.survivorLogin){ S.guest=true; S.me='__visiteur__'; }
  if(!S.me) return startDemo();
  try{ S.isOwner=!!user.isOwner(); }catch(e){}
  try{ if(user.can && user.can('data.write')===false) S.readOnly=true; }catch(e){}
  if(!S.guest) try{ const me=await user.me(); S.email=(me&&me.email)||''; if(me&&me.name) S.names[S.me]=me.name; }catch(e){}
  S.mode='live';
  const timer=setTimeout(()=>{ S.stale=true; S.loaded.leagues=S.loaded.players=true; render(); },10000);
  const sub=(col,store)=>db.collection(col).onSnapshot(snap=>{
    const o={}; snap.docs.forEach(d=>{ if(d.exists) o[d.id]={...d.data(),id:d.id}; });
    Object.keys(store).forEach(k=>delete store[k]); Object.assign(store,o);
    S.loaded[col]=true; if(!snap.metadata.fromCache) S.stale=false;
    if(S.loaded.leagues&&S.loaded.players) clearTimeout(timer);
    afterData(); render();
  }, err=>{ S.loaded[col]=true; console.warn(err);
    if(S.guest && err && err.code==='permission-denied'){ window.survivorLogin('Le dernier en vie remporte la ligue.',true); return; }
    toast('Données indisponibles pour le moment.',true); render(); });
  sub('leagues',S.leagues); sub('players',S.players);
  try{ db.collection('reacts').onSnapshot(snap=>{ const o={}; snap.docs.forEach(d=>{ if(d.exists) o[d.id]=d.data(); }); S.reacts=o; render(); }, e=>console.warn('reacts',e)); }catch(e){}
  try{ db.collection('votes').onSnapshot(snap=>{ const o={}; snap.docs.forEach(d=>{ if(d.exists) o[d.id]=d.data(); }); S.votes=o; render(); }, e=>console.warn('votes',e)); }catch(e){}
  render(); setInterval(render,30000);
}

/* ---------- Visiteurs non connectés ---------- */
const GUEST_OK=new Set(['hideBand','openSurv','reload','fmt','lfmt','hview','toLeagues','slide','install','hideInstall','filter','ltype','lsport','open','back','ltab','toggle','comp','peek']);
function askLogin(a,v){
  const lg=v&&S.leagues[String(v).split('|')[0]];
  if(a==='join' && lg){ try{ sessionStorage.setItem('survivor-after-login',JSON.stringify({a:'join',v:lg.id})); }catch(e){} }
  const intro = a==='join'&&lg ? `Connecte-toi ou crée ton compte pour t'inscrire à la ligue ${stripPrefix(lg.name)||''}.`.replace(' .','.')
    : a==='pick' ? 'Connecte-toi ou crée ton compte pour parier.' : 'Connecte-toi ou crée ton compte pour jouer.';
  window.survivorLogin(intro);
}
let afterLoginDone=false;
function runAfterLogin(){
  if(afterLoginDone || S.guest || S.mode!=='live' || !S.loaded.leagues || !S.loaded.players) return;
  let job=null; try{ job=JSON.parse(sessionStorage.getItem('survivor-after-login')||'null'); sessionStorage.removeItem('survivor-after-login'); }catch(e){}
  afterLoginDone=true;
  if(job && job.a==='join' && S.leagues[job.v]){
    if(!isMember(job.v)) A.join(job.v);
    S.view.league=job.v; S.view.tab='ligues'; render();
  }
}
function afterData(){ setTimeout(autoImportAll,300); runAfterLogin(); resolveNames(); Object.values(S.leagues).forEach(l=>{ if(l.comp) loadFeed(l.comp); Object.values(l.rounds||{}).forEach(r=>Object.values(r.matches||{}).forEach(m=>m.comp&&loadFeed(m.comp))); }); }

function startDemo(){
  S.mode='demo'; S.me='moi'; S.isOwner=true; S.email='toi@exemple.fr';
  const H=36e5, D=24*H, n=now(), iso=x=>new Date(x).toISOString();
  const tm=(nm,e)=>({n:nm,id:nm.toLowerCase(),logo:''});
  const rd=(k,nn,dl,ms)=>[k,{n:nn,deadline:iso(dl),matches:Object.fromEntries(ms.map((m,i)=>[k+'m'+i,{h:tm(m[0]),a:tm(m[1]),d:iso(dl+i*2*H),result:m[2]||null}]))}];
  S.leagues={
    L1:{id:'L1',name:'Survivor X Ligue 2',category:'football',mode:'pick',comp:'fra.2',startAt:iso(n-9*D),createdAt:iso(n-12*D),code:'S2STGM',private:false,cover:'auto',
      rounds:Object.fromEntries([
        rd('r12',12,n-8*D,[['Saint-Étienne','Rodez','H'],['Pau','Metz','D'],['Annecy','Laval','A']]),
        rd('r13',13,n-2*D,[['Nantes','Grenoble'],['Sochaux','Dunkerque'],['Annecy','Clermont Foot'],['AS Nancy Lorraine','Dijon FCO']]),
        rd('r14',14,n+3*D,[['Montpellier','Red Star FC 93'],['Stade de Reims','Guingamp'],['Boulogne','Stade Laval']])
      ])},
    L2:{id:'L2',name:'Survivor X Top 14',category:'rugby',mode:'pick',comp:'top14',startAt:iso(n-D),createdAt:iso(n-3*D),code:'TOP14X',private:false,cover:'auto',
      rounds:Object.fromEntries([rd('t1',1,n+6*D,[['Bordeaux Begles','Montpellier Herault'],['Bayonne','Castres Olympique'],['La Rochelle','Perpignan'],['Stade Francais Paris','Vannes']])])},
    L3:{id:'L3',name:'Survivor X The Best',category:'tuprefere',mode:'majority',startAt:iso(n-5*D),createdAt:iso(n-6*D),code:'BEST23',private:false,cover:'auto',
      rounds:{q1:{n:1,deadline:iso(n-3*D),q:'Le meilleur de l\'histoire ?',a:{n:'Pelé'},b:{n:'Maradona'}},q2:{n:2,deadline:iso(n+D),q:'Tu préfères ?',a:{n:'Zidane'},b:{n:'Henry'}}}},
    L4:{id:'L4',name:'Survivor X NBA',prize:'en bon d\'achat Decathlon',prizeVal:'50€',category:'basket',mode:'pick',comp:'nba',startAt:iso(n+D+6*H),createdAt:iso(n-D),code:'NBA777',private:false,cover:'auto',rounds:{}}
  };
  { const r12=S.leagues.L1.rounds.r12.matches; const sc=[[2,0],[1,1],[0,2]]; Object.keys(r12).sort().forEach((k,i)=>{ if(sc[i]){ r12[k].hs=sc[i][0]; r12[k].as=sc[i][1]; } }); }
  S.leagues.L5={...S.leagues.L1, id:'L5', name:'Race X Ligue 2', scoring:'points', target:20, private:true, lastRule:'drink', code:'RACE20', cover:'trophee', createdAt:iso(n-11*D)};
  const P=(id,pseudo,lg,picks)=>({id,pseudo,leagues:Object.fromEntries(lg.map(l=>[l,iso(n-10*D)])),picks});
  S.players={
    moi:P('moi','Rémy',['L1','L2','L3','L5'],{L1:{r12:{m:'r12m0',p:'H'},r13:{m:'r13m0',p:'H'}},L2:{t1:{m:'t1m2',p:'H'}},L3:{q1:{p:'A'}},L5:{r12:{m:'r12m0',p:'H'},r13:{m:'r13m0',p:'H'}}}),
    p1:P('p1','Karim',['L1','L3','L5'],{L1:{r12:{m:'r12m1',p:'D'},r13:{m:'r13m2',p:'A'}},L3:{q1:{p:'A'},q2:{p:'B'}},L5:{r12:{m:'r12m1',p:'H'},r13:{m:'r13m1',p:'D'}}}),
    p2:P('p2','Léa',['L1','L3','L4','L5'],{L1:{r12:{m:'r12m2',p:'A'}},L3:{q1:{p:'B'}},L5:{r12:{m:'r12m2',p:'A'},r13:{m:'r13m2',p:'A'}}}),
    p3:P('p3','Hugo',['L1'],{L1:{r12:{m:'r12m0',p:'A'}}}),
    p4:P('p4','Inès',['L1','L3','L5'],{L1:{r12:{m:'r12m0',p:'H'},r13:{m:'r13m3',p:'H'}},L3:{q1:{p:'A'}},L5:{r12:{m:'r12m0',p:'A'},r13:{m:'r13m3',p:'H'}}})
  };
  afterData(); render(); setInterval(render,30000);
}


/* ---------- Installer l'appli (écran d'accueil du téléphone) ---------- */
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; render(); });
window.addEventListener('appinstalled',()=>{ installEvt=null; toast('Survivor est installé sur ton téléphone !'); render(); });
const isStandalone=()=>{ try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone===true; }catch(e){ return false; } };
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
function installBand(){
  const mobile=isIOS()||/Android/i.test(navigator.userAgent);
  if(S.mode!=='demo' && (!window.SURVIVOR_FIREBASE || isStandalone() || !mobile)) return '';
  try{ if(localStorage.getItem('survivor-band-hide')) return ''; }catch(e){}
  const ios=isIOS(), open=S.open.instHow;
  const how=ios
    ? `Dans Safari, touche <b>Partager</b> <span class="ishare"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M7 10H5v11h14V10h-2"/></svg></span> puis <b>« Sur l'écran d'accueil »</b>.`
    : `Dans le menu du navigateur <b>⋮</b>, choisis <b>« Ajouter à l'écran d'accueil »</b> ou <b>« Installer l'application »</b>.`;
  const btn=(!ios&&installEvt)?`<button class="ib-go" data-a="install">Installer</button>`:`<button class="ib-go" data-a="toggle" data-v="instHow">${open?'OK':'Comment ?'}</button>`;
  return `<div class="iband"><div class="ib-row"><img src="img/icon-192.png" alt=""><div class="ib-tx"><b>Installe l'appli</b><span>Accès en 1 clic depuis ton écran d'accueil</span></div>${btn}<button class="ib-x" data-a="hideBand" aria-label="Fermer">✕</button></div>${open?`<div class="ib-how">${how}</div>`:''}</div>`;
}
function avatarBand(){
  if(S.guest || !S.me) return '';
  const me=S.players[S.me]||{}; if(me.avatar) return '';
  try{ if(localStorage.getItem('survivor-avband-hide')) return ''; }catch(e){}
  return `<div class="avband"><img src="${DEFAULT_AVATAR}" alt=""><div class="ab-tx"><b>Enlève Macron, tu es bien plus beau.</b><button class="ab-go" data-a="uploadAvatar">Changer ma photo ${I.arrow}</button></div><button class="ib-x" data-a="hideAvBand" aria-label="Fermer">✕</button></div>`;
}
function installCard(where){
  if(!window.SURVIVOR_FIREBASE || isStandalone()) return '';
  if(where==='home'){ try{ if(localStorage.getItem('survivor-install-hide')) return ''; }catch(e){} }
  const ios=isIOS();
  if(!ios && !installEvt && where==='home') return '';
  const how=ios
    ? `Dans Safari, touche <b>Partager</b> <span class="ishare"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M7 10H5v11h14V10h-2"/></svg></span> puis <b>« Sur l'écran d'accueil »</b>.`
    : installEvt ? `Ajoute l'icône Survivor sur ton téléphone : elle ouvre le site en plein écran, comme une appli.`
    : `Dans le menu du navigateur <b>⋮</b>, choisis <b>« Ajouter à l'écran d'accueil »</b> ou <b>« Installer l'application »</b>.`;
  return `<div class="card install"><img src="img/icon-192.png" alt=""><div class="itx"><b>INSTALLE L'APPLI</b><p>${how}</p>${!ios&&installEvt?`<button class="btn pop sm" data-a="install">INSTALLER</button>`:''}</div>${where==='home'?`<button class="ix" data-a="hideInstall" aria-label="Fermer">✕</button>`:''}</div>`;
}

/* ================================================================ Actions */
function buildRound(lg, comp, fr, nFallback){
  const f=S.feeds[comp];
  const evs=fr.ev.map(id=>({id,...f.events[id]})).filter(e=>e.d && e.st!=='canc').sort((a,b)=>t(a.d)-t(b.d));
  if(!evs.length) return null;
  const matches={};
  const rmap=rankMap(comp)||{};
  evs.forEach((e,i)=>{ const h=teamOf(f,e.h), a=teamOf(f,e.a); const hs={n:h.n,id:e.h,logo:logoOf(h)}, as={n:a.n,id:e.a,logo:logoOf(a)}; if(rmap[e.h]) hs.rk=rmap[e.h]; if(rmap[e.a]) as.rk=rmap[e.a]; matches['m'+i+'_'+e.id]={h:hs,a:as,d:e.d,ev:e.id,comp,result:null}; });
  const n=fr.n || nFallback;
  return {rk:(comp+'_'+fr.k).replace(/[^A-Za-z0-9_-]/g,'_'), round:{n,deadline:evs[0].d,dl:Date.parse(evs[0].d),label:COMP_NAMES[comp]||'',matches}, count:evs.length};
}
// Automatic import: upcoming rounds of the league's championship (next 3 weeks), done by a manager's device.
const autoBusy={};
const AUTO_DAYS=21;
function autoImport(lid){
  const lg=S.leagues[lid];
  if(!lg || !canManage(lg) || !lg.comp || !isPickMode(lg) || lg.autoImport===false || S.readOnly) return;
  const f=S.feeds[lg.comp]; if(!f){ loadFeed(lg.comp); return; } if(f.missing||!f.rounds) return;
  const start=t(lg.startAt), horizon=now()+AUTO_DAYS*864e5;
  let n=Object.keys(lg.rounds||{}).length; const add={};
  const cap=Infinity;
  f.rounds.filter(r=>t(r.s)>now() && t(r.s)>=start && t(r.s)<=horizon).forEach(fr=>{
    if(n>=cap) return;
    const b=buildRound(lg, lg.comp, fr, n+1); if(!b) return;
    if((lg.rounds||{})[b.rk] || autoBusy[lid+b.rk]) return;
    add[b.rk]=b.round; autoBusy[lid+b.rk]=1; n++;
  });
  const keys=Object.keys(add); if(!keys.length) return;
  writeLeague(lid,{rounds:add}).then(()=>{ if(S.view.manage===lid||S.view.league===lid) toast(keys.length>1?`${keys.length} journées ajoutées automatiquement.`:'Prochaine journée ajoutée automatiquement.'); });
}
function autoImportAll(){ Object.keys(S.leagues).forEach(autoImport); }

const A = {
  shareJourney(lid){
    const c=C(lid); if(!c) return; const txt=journeyText(c,S.me);
    if(navigator.share && window.survivorLogout){ navigator.share({text:txt}).catch(()=>{}); return; }
    try{ navigator.clipboard.writeText(txt).then(()=>toast('Parcours copié ! Colle-le dans ton groupe.'),()=>toast(txt)); }catch(e){ toast(txt); }
  },
  hview(v){ S.view.hview=v; S.view.hv=v; render(); },
  toLeagues(){ const el=document.getElementById('ligues'); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); },
  reload(){ location.reload(); },
  lfmt(v){ S.view.lfmt=v; S.view.filter='all'; render(); },
  fmt(v){ S.view.fmt=v; S.view.filter='all'; S.slide=0; const el=document.getElementById('slides'); if(el) el.scrollLeft=0; render(); },
  slide(i){ slideClock=Date.now(); const el=document.getElementById('slides'); if(el) el.scrollTo({left:el.clientWidth*(+i),behavior:'smooth'}); },
  install(){ if(!installEvt) return; installEvt.prompt(); installEvt.userChoice.finally(()=>{ installEvt=null; render(); }); },
  hideAvBand(){ try{ localStorage.setItem('survivor-avband-hide','1'); }catch(e){} render(); },
  hideBand(){ try{ localStorage.setItem('survivor-band-hide','1'); }catch(e){} render(); },
  hideInstall(){ try{ localStorage.setItem('survivor-install-hide','1'); }catch(e){} render(); },
  logout(){ if(window.survivorLogout) window.survivorLogout(); },
  tab(v){ S.view.tab=v; S.view.league=null; S.view.manage=null; render(); scrollTo(0,0); },
  filter(v){ S.view.filter=v; render(); },
  ltype(v){ S.view.ltype=S.view.ltype===v?null:v; render(); },
  lsport(v){ S.view.lsport=S.view.lsport===v?null:v; render(); },
  open(v){ S.view.league=v; S.view.ltab='paris'; S.view.hv='days'; S.view.tab='ligues'; render(); scrollTo(0,0); celebrate(v); },
  openSurv(v){ A.open(v); S.view.ltab='surv'; render(); scrollTo(0,0); },
  back(){ S.view.league=null; render(); scrollTo(0,0); },
  ltab(v){ S.view.ltab=v; S.view.hv='days'; render(); if(v==='surv'){ const e=document.querySelector('.seg'); if(e&&e.getBoundingClientRect().top<0) e.scrollIntoView({behavior:'smooth',block:'start'}); } },
  recap(lid){ S.recap=lid; render(); },
  recapClose(){ S.recap=null; render(); },
  rxOpen(k){ S.view.rx=S.view.rx===k?null:k; render(); },
  react(v){ if(S.guest) return window.survivorLogin&&window.survivorLogin('Connecte-toi pour réagir.');
    const [lid,rk,to,kind,...rest]=v.split('|'); const val=rest.join('|'); if(to===S.me) return;
    const id=[lid,rk,to,S.me].join('__'); const cur=S.reacts[id]||{lid,rk,to,uid:S.me,e:null,q:null};
    const rec={...cur,at:Date.now()}; if(kind==='e') rec.e=cur.e===val?null:val; else rec.q=cur.q===val?null:val;
    S.view.rx=null;
    if(!rec.e&&!rec.q){ delete S.reacts[id]; render(); if(S.mode!=='demo') db.doc('reacts/'+id).delete().catch(e=>handleErr(e)); return; }
    S.reacts[id]=rec; render(); if(S.mode!=='demo') db.doc('reacts/'+id).set(rec).catch(e=>handleErr(e)); },
  myUsed(lid){ S.open['svU'+lid]=true; S.view.ltab='surv'; render(); setTimeout(()=>{ const e=document.querySelector('[data-v="svU'+lid+'"]'); if(e) e.scrollIntoView({behavior:'smooth',block:'start'}); },50); },
  manage(v){ S.view.manage=v; const lg=S.leagues[v]; S.view.comp=(lg&&lg.comp)||cat(lg&&lg.category).comps[0]||null; if(S.view.comp) loadFeed(S.view.comp); render(); scrollTo(0,0); },
  unmanage(){ S.view.manage=null; render(); scrollTo(0,0); },
  join(lid){
    const c=C(lid); if(!c) return;
    if(c.started) return toast('Inscriptions closes : la ligue a commencé.',true);
    if(guard()) return;
    writeMe({leagues:{[lid]:new Date().toISOString()}}).then(()=>toast('Tu es inscrit ! Bonne chance 🍀'));
  },
  leave(lid){
    const c=C(lid); if(!c||!isMember(lid)) return;
    const live=c.started && c.status!=='finished';
    modal(`<h3>QUITTER LA LIGUE ?</h3><div class="muted" style="font-size:15px">Tu vas quitter <b>${esc(c.lg.name)}</b>.${live?' La ligue a commencé : tu ne pourras plus revenir et tu disparais du classement.':' Tu pourras te réinscrire tant que la ligue n’a pas commencé.'}</div>`,'QUITTER',()=>{
      const me=clone(S.players[S.me]||{}); if(me.leagues) delete me.leagues[lid]; if(me.sabo) delete me.sabo[lid];
      const cur=S.players[S.me]; if(cur){ delete cur.leagues[lid]; if(cur.sabo) delete cur.sabo[lid]; }
      const {picks, ...rest}=me;
      (S.mode==='demo'?Promise.resolve():db.doc('players/'+S.me).set(rest)).then(()=>toast('Tu as quitté la ligue.'),e=>handleErr(e));
      S.view.league=null; render(); scrollTo(0,0);
    });
  },
  joinCode(){
    modal(`<h3>REJOINDRE UNE LIGUE</h3><div class="muted" style="font-size:15px">Entre le code à 6 caractères donné par le créateur.</div><input class="in" id="jc" maxlength="6" style="margin-top:14px;text-transform:uppercase;letter-spacing:6px;font-size:24px;text-align:center" placeholder="ABC123">`,'REJOINDRE',()=>{
      const code=(document.getElementById('jc').value||'').trim().toUpperCase();
      const lg=Object.values(S.leagues).find(l=>(l.code||'').toUpperCase()===code && shownL(l.id));
      if(!lg){ toast('Code inconnu.',true); return false; }
      if(isMember(lg.id)){ A.open(lg.id); return; }
      const c=C(lg.id); if(c.started){ toast('Cette ligue a déjà commencé.',true); return false; }
      if(guard()) return false;
      writeMe({leagues:{[lg.id]:new Date().toISOString()}}).then(()=>{ toast('Bienvenue dans '+lg.name+' !'); A.open(lg.id); });
    });
  },
  pick(lid, rk, mk, p){
    const c=C(lid); const r=c&&c.lg.rounds[rk]; if(!r) return;
    if(!canPick(c,r)) return toast(t(r.deadline)<=now()?'Les choix sont clos pour cette journée.':'Tu ne peux pas jouer cette journée.',true);
    if(guard()) return;
    if(c.pick && p!=='D'){ const m=r.matches[mk], tk=teamKey(p==='H'?m.h:m.a); if(usedTeams(c,S.me,rk).has(tk)) return toast('Tu as déjà joué cette équipe.',true); const sb=saboOn(c.lg)&&sabosOn(lid,S.me,rk).find(x=>x.team===tk); if(sb) return toast('💣 '+nameOf(sb.from)+' t\'a interdit cette équipe pour cette journée.',true); }
    const cur=pickOf(S.me,lid,rk), at=new Date().toISOString();
    if(jokerOn(c.lg) && (S.view.jk===lid+'|'+rk || (cur&&cur.j))){
      // mode joker : 2 équipes de 2 matchs différents
      const sides=pickSides(cur), i=sides.findIndex(x=>x.m===mk&&x.p===p);
      let nx;
      if(i>=0){ if(sides.length<2) return; nx=[sides[1-i]]; }
      else if(!sides.length) nx=[{m:mk,p}];
      else if(sides.length===1){ if(sides[0].m===mk) nx=[{m:mk,p}]; else nx=[sides[0],{m:mk,p}]; }
      else { if(sides[0].m===mk) nx=[{m:mk,p},sides[1]]; else if(sides[1].m===mk) nx=[sides[0],{m:mk,p}]; else nx=[sides[0],{m:mk,p}]; }
      const doc=nx.length===2?{m:nx[0].m,p:nx[0].p,m2:nx[1].m,p2:nx[1].p,j:true,at}:{m:nx[0].m,p:nx[0].p,m2:null,p2:null,j:false,at};
      S.view.jk=lid+'|'+rk;
      return writeMe({picks:{[lid]:{[rk]:doc}}}).then(()=>toast(nx.length===2?'Joker utilisé : 2 équipes choisies !':'Choisis ta 2e équipe (dans un autre match).'));
    }
    if(cur && cur.m===mk && cur.p===p) return;
    writeMe({picks:{[lid]:{[rk]:{m:mk||null,p,m2:null,p2:null,j:false,at}}}}).then(()=>toast(cur?'Choix modifié !':'Choix enregistré !'));
  },
  toggle(v){ S.open[v]=!S.open[v]; render(); },
  vote(v){ if(S.guest) return window.survivorLogin&&window.survivorLogin('Connecte-toi pour voter.'); const [pid,a]=v.split('|'); const rec={poll:pid,uid:S.me,a:+a,at:Date.now()};
    S.votes[pid+'__'+S.me]=rec; render();
    if(S.mode!=='demo') db.doc('votes/'+pid+'__'+S.me).set(rec).catch(e=>handleErr(e)); },
  verdictClose(){ const v=S.verdict; if(v){ try{ localStorage.setItem(vKey(v.lid,v.r.k),'1'); }catch(e){} } S.verdict=null; render(); },
  verdictOpen(){ const v=S.verdict; if(v){ try{ localStorage.setItem(vKey(v.lid,v.r.k),'1'); }catch(e){} } S.verdict=null; A.open(v.lid); },
  async exportEmails(){
    if(!S.isOwner) return;
    if(S.mode==='demo') return toast('Export indisponible en mode démo.',true);
    if(!window.survivorContacts) return toast('Recharge la page puis réessaie.',true);
    let rows; try{ rows=await window.survivorContacts(); }catch(e){ return toast('Accès refusé : pense à publier les nouvelles règles Firestore.',true); }
    if(!rows.length) return toast('Aucun e-mail enregistré pour l’instant : ils s’ajoutent à la prochaine connexion de chaque joueur.',true);
    const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
    const lines=[['Pseudo','E-mail','Inscrit le','Dernière visite','Ligues'].map(q).join(';')];
    const known=new Set(rows.map(r=>r.id)); Object.keys(S.players).forEach(id=>{ if(!known.has(id)) rows.push({id,email:'(pas encore récupéré)',first:'',last:''}); });
    rows.sort((a,b)=>(a.first||'9').localeCompare(b.first||'9')).forEach(r=>{ const p=S.players[r.id]||{}; const lg=Object.keys(p.leagues||{}).map(l=>S.leagues[l]&&S.leagues[l].name).filter(Boolean).join(', ');
      lines.push([nameOf(r.id)||r.name||'', r.email, (r.first||'').slice(0,10), (r.last||'').slice(0,10), lg].map(q).join(';')); });
    const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='survivor-emails-'+new Date().toISOString().slice(0,10)+'.csv'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000);
    const ok=known.size; toast(ok+' e-mail'+(ok>1?'s':'')+' sur '+rows.length+' joueurs'+(rows.length>ok?' (les autres s’ajoutent à leur prochaine visite)':''));
  },
  saboStart(v){ if(guard()) return; const [lid,rk]=v.split('|'); S.view.sab={lid,rk}; render(); },
  saboTo(v){ if(!S.view.sab) return; S.view.sab.to=v; S.view.sab.team=null; render(); },
  saboTeam(v){ if(!S.view.sab) return; const i=v.indexOf('|'); S.view.sab.team=v.slice(0,i); S.view.sab.tn=v.slice(i+1); render(); },
  saboCancel(){ S.view.sab=null; render(); },
  saboGo(){ const sb=S.view.sab; if(!sb||!sb.to||!sb.team) return; const c=C(sb.lid), r=c&&c.lg.rounds[sb.rk]; if(!r||t(r.deadline)<=now()) return toast('Trop tard pour cette journée.',true); if(mySabo(sb.lid)) return toast('Tu as déjà utilisé ton sabotage.',true); if(sabosOn(sb.lid,sb.to,sb.rk).length) return toast(nameOf(sb.to)+' est déjà saboté pour cette journée.',true);
    const doc={to:sb.to, team:sb.team, tn:sb.tn, rk:sb.rk, at:new Date().toISOString()}; S.view.sab=null;
    writeMe({[xjOf(S.me,sb.lid)==='sabo'?'sabo2':'sabo']:{[sb.lid]:doc}}).then(()=>toast('Sabotage lancé contre '+nameOf(doc.to)+' !')); },
  jokerUse(v){ if(guard()) return; S.view.jk=v; render(); toast('Joker activé : choisis 2 équipes de 2 matchs différents.'); },
  jokerCancel(v){ const [lid,rk]=v.split('|'); S.view.jk=null; const cur=pickOf(S.me,lid,rk); if(cur&&cur.j){ writeMe({picks:{[lid]:{[rk]:{m:cur.m,p:cur.p,m2:null,p2:null,j:false,at:new Date().toISOString()}}}}).then(()=>toast('Joker annulé : tu le gardes pour plus tard.')); } else render(); },
  mpTog(v){ const [lid,d]=v.split('|'), k='mp'+lid; const cur=(k in S.open)?S.open[k]:d==='1'; S.open[k]=!cur; render(); },
  newCat(v){ if(HIDDEN_CATS.includes(v)) return; S.view.newCat=v; render(); },
  newFmt(v){ S.view.newFmt=v; render(); },
  newLast(v){ S.view.newLast=v; render(); },
  newLives(v){ if(v==='lastwins') S.view.newLast=S.view.newLast==='wins'?'':'wins'; else if(v==='lives') S.view.newLives=S.view.newLives?0:1; else if(v==='joker') S.view.newJoker=!S.view.newJoker; else if(v==='sabotage') S.view.newSabotage=!S.view.newSabotage; else if(v==='lantern') S.view.newLantern=!S.view.newLantern; else if(v==='merguez'){ S.view.newMerguez=!S.view.newMerguez; } else if(v.startsWith('vis:')) S.view.newVis=v.slice(4); else S.view.newAway=!S.view.newAway; render(); },
  setLives(v){ const [lid,k]=v.split('|'); const lg=S.leagues[lid]; if(!lg) return; if(k==='merguez'){ const on=!lg.merguez; return writeLeague(lid,{merguez:on, name:fullName(stripPrefix(lg.name), on?'merguez':'survivor').slice(0,60)}).then(()=>toast(on?'Option MERGUEZ activée.':'Option MERGUEZ désactivée.')); }
    const patch=k==='lastwins'?{lastRule:lg.lastRule==='wins'?null:'wins'}:k==='lives'?{lives:(+lg.lives?0:1)}:k==='joker'?{joker:!lg.joker}:k==='sabotage'?{sabotage:!lg.sabotage}:k==='lantern'?{redLantern:!lg.redLantern}:k.startsWith('vis:')?{picksVis:k.slice(4)}:{awayBonus:!lg.awayBonus}; writeLeague(lid,patch).then(()=>toast('Option mise à jour.')); },
  setLast(v){ const [lid,k]=v.split('|'); if(!S.leagues[lid]) return; writeLeague(lid,{lastRule:k||null}).then(()=>toast(k?'Option activée : '+LAST_RULES[k].t.toLowerCase()+'.':'Option désactivée.')); },
  setFmt(v){ const [lid,f]=v.split('|'); const lg=S.leagues[lid]; if(!lg) return;
    const name=fullName(stripPrefix(lg.name), f).slice(0,60);
    writeLeague(lid, f==='points'?{scoring:'points', target:+lg.target||POINTS_N, name, merguez:false}:{scoring:'survivor', name:lg.merguez?fullName(stripPrefix(lg.name),'merguez').slice(0,60):name}).then(()=>toast(f==='points'?'Ligue passée au format Race.':'Ligue passée au format Survivor.')); },
  createLeague(){
    const g=id=>document.getElementById(id);
    const rest=stripPrefix(g('nl-name').value), mz=cat(S.view.newCat).mode==='pick'&&S.view.newFmt!=='points'&&!!S.view.newMerguez, name=fullName(rest, (cat(S.view.newCat).mode==='pick'&&S.view.newFmt==='points')?'points':mz?'merguez':'survivor'), d=g('nl-date').value, h=g('nl-time').value||'20:00';
    if(rest.length<2) return toast('Complète le nom de la ligue.',true);
    if(!d) return toast('Choisis la date de fin des inscriptions.',true);
    if(!S.isOwner && S.leagues[S.me]) return toast('Tu as déjà créé ta ligue.',true);
    if(guard()) return;
    const k=S.view.newCat, cc=cat(k);
    const id=S.isOwner ? 'l'+rid() : S.me;
    const pts=cc.mode==='pick'&&S.view.newFmt==='points'; const nr=Math.min(40,Math.max(10,+((g('nl-nr')||{}).value)||POINTS_N));
    const lg={...(pts?{scoring:'points',target:nr}:{}),name:name.slice(0,60),category:k,mode:cc.mode,comp:(cc.comps.includes(compFromName(name))?compFromName(name):cc.comps[0])||null,startAt:new Date(d+'T'+h).toISOString(),createdAt:new Date().toISOString(),createdBy:S.me,private:!S.isOwner,...(pts&&S.view.newLast==='wins'?{lastRule:'wins'}:{}),...(!pts&&cc.mode==='pick'?{lives:S.view.newLives?1:0,joker:!!S.view.newJoker,...(mz?{merguez:true}:{})}:{}),...(cc.mode==='pick'?{sabotage:!!S.view.newSabotage,redLantern:!!S.view.newLantern,picksVis:S.view.newVis==='visible'?'visible':'hidden'}:{}),code:genCode(),cover:'auto',rules:'',rounds:{}};
    writeLeague(id,lg,'set').then(()=>{ if(!isMember(id)) writeMe({leagues:{[id]:new Date().toISOString()}}); toast('Ligue créée ! Code : '+lg.code); A.manage(id); setTimeout(()=>autoImport(id),400); });
  },
  saveInfo(lid){
    const g=id=>document.getElementById(id);
    const rest=stripPrefix(g('ei-name').value); if(rest.length<2) return toast('Complète le nom de la ligue.',true); const name=fullName(rest, isPoints(S.leagues[lid])?'points':isMerguez(S.leagues[lid])?'merguez':'survivor');
    const patch={name:name.slice(0,60)};
    const pzI=g('ei-prize'); if(pzI) patch.prize=pzI.value.trim().slice(0,80); const pvI=g('ei-prizev'); if(pvI) patch.prizeVal=pvI.value.trim().replace(/\s*€/,'€').slice(0,10);
    const cf=compFromName(name), lgx=S.leagues[lid]; if(cf && cat(lgx.category).comps.includes(cf) && cf!==lgx.comp){ patch.comp=cf; S.view.comp=cf; loadFeed(cf); }
    const nrI=g('ei-nr'); if(nrI && !nrI.disabled && isPoints(lgx)) patch.target=Math.min(40,Math.max(10,+nrI.value||POINTS_N));
    const d=g('ei-date'), h=g('ei-time'); if(d && d.value) patch.startAt=new Date(d.value+'T'+(h.value||'20:00')).toISOString();
    writeLeague(lid,patch).then(()=>{ toast('Ligue mise à jour.'); autoImport(lid); });
  },
  setCat(lid,k){ const cc=cat(k); writeLeague(lid,{category:k,mode:cc.mode,comp:cc.comps[0]||null}); S.view.comp=cc.comps[0]||null; if(S.view.comp) loadFeed(S.view.comp); },
  setComp(lid,k){ S.view.comp=k; loadFeed(k); writeLeague(lid,{comp:k}).then(()=>{ toast('Championnat : '+COMP_NAMES[k]); autoImport(lid); }); },
  setCover(lid,k){ writeLeague(lid,{cover:k,coverPos:null}).then(()=>toast('Photo mise à jour.')); },
  uploadCover(lid){ pickFile(async f=>{ const a=await upload(f); if(a) writeLeague(lid,{cover:'asset:'+a.id,coverPos:null}).then(()=>toast('Photo importée !')); }); },
  cropCover(lid){ if(guard()) return; cropCover(lid); },
  uploadAvatar(){ if(guard()) return; pickFile(async f=>{ const u=URL.createObjectURL(f); const b=await cropAvatar(u); URL.revokeObjectURL(u); if(!b) return; const a=await upload(b); if(a) writeMe({avatar:a.id}).then(()=>toast('Photo de profil mise à jour !')); }); },
  photoMenu(){ const me=S.players[S.me]||{}; if(!me.avatar) return A.uploadAvatar();
    const d=document.createElement('div'); d.className='modal';
    d.innerHTML=`<div class="sheet"><h3>TA PHOTO</h3><div class="pf-list" style="margin:6px 0 14px"><button class="pf-it" data-m="new"><span class="pf-ic" style="background:#FFF3C4;color:#16181D">${I.cam}</span><span class="pf-tx">Choisir une nouvelle photo</span><em>›</em></button><button class="pf-it" data-m="crop"><span class="pf-ic" style="background:#FFF3C4;color:#16181D">${IC.crop}</span><span class="pf-tx">Recadrer la photo actuelle</span><em>›</em></button></div><div class="acts"><button class="btn ghost" data-x>ANNULER</button></div></div>`;
    d.addEventListener('click',e=>{ const m=e.target.closest('[data-m]'); if(e.target===d||e.target.closest('[data-x]')||m) d.remove(); if(m) (m.dataset.m==='new'?A.uploadAvatar():A.recropAvatar()); });
    document.body.appendChild(d); },
  recropAvatar(){ if(guard()) return; const me=S.players[S.me]||{}; if(!me.avatar) return A.uploadAvatar(); if(S.mode==='demo') return toast('Indisponible en mode démo.',true);
    cropAvatar(blobUrl(me.avatar)).then(async b=>{ if(!b) return; const a=await upload(b); if(a) writeMe({avatar:a.id}).then(()=>toast('Photo recadrée !')); }); },
  comp(v){ S.view.comp=v; loadFeed(v); render(); },
  importRound(lid, key){
    const lg=S.leagues[lid], f=S.feeds[S.view.comp]; if(!lg||!f) return;
    const fr=(f.rounds||[]).find(r=>r.k===key); if(!fr) return;
    const b=buildRound(lg, S.view.comp, fr, Object.keys(lg.rounds||{}).length+1); if(!b) return;
    if(lg.rounds && lg.rounds[b.rk]) return toast('Journée déjà importée.');
    const patch={rounds:{[b.rk]:b.round}};
    if(lg.comp!==S.view.comp) patch.comp=S.view.comp;
    writeLeague(lid,patch).then(()=>toast(`Journée ${b.round.n} importée : ${b.count} matchs.`));
  },
  togglePin(lid){ const on=!S.leagues[lid].pin; writeLeague(lid,{pin:on?Date.now():0}).then(()=>toast(on?'Ligue affichée en premier sur l\'accueil.':'Ligue retirée de la tête de liste.')); },
  toggleAuto(lid){ const on=S.leagues[lid].autoImport===false; writeLeague(lid,{autoImport:on}).then(()=>{ toast(on?'Ajout automatique activé.':'Ajout automatique désactivé.'); if(on) autoImport(lid); }); },
  peek(v){ S.open['peek'+v]=!S.open['peek'+v]; render(); },
  saveRules(lid){ writeLeague(lid,{rules:document.getElementById('ru-txt').value.slice(0,3000)}).then(()=>toast('Règles enregistrées.')); },
  defRules(lid){ const lg=S.leagues[lid]; document.getElementById('ru-txt').value=defaultRules(lg); },
  startNow(lid){ modal('<h3>DÉMARRER MAINTENANT ?</h3><div class="muted">Les inscriptions seront closes immédiatement.</div>','DÉMARRER',()=>{ writeLeague(lid,{startAt:new Date().toISOString()}).then(()=>toast('La ligue a démarré !')); }); },
  invite(lid){ const c=C(lid); if(!c) return; const lg=c.lg;
    const nm=String(lg.name||'').replace(/^\s*(survivor|race|merguez|one\s*shot)\b/i,m=>m.toUpperCase());
    const url=`https://surviivor.github.io/?l=${encodeURIComponent(lid)}${S.me&&!S.guest?'&r='+refCode(S.me):''}`;
    const txt=`Rejoins ma Ligue ${nm}`+(lg.private&&lg.code?` (code : ${lg.code})`:'');
    const mobile=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
    if(mobile && navigator.share){ navigator.share({text:txt+' '+url}).catch(()=>{}); return; }
    window.open('https://wa.me/?text='+encodeURIComponent(txt+' '+url),'_blank'); },
  refShare(){ const url=`https://surviivor.github.io/?r=${refCode(S.me)}`, txt=`Rejoins-moi sur SURVIVOR avec mon code parrainage ${refCode(S.me)}`;
    const mobile=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
    if(mobile && navigator.share){ navigator.share({text:txt+' '+url}).catch(()=>{}); return; }
    window.open('https://wa.me/?text='+encodeURIComponent(txt+' '+url),'_blank'); },
  refApply(){ const el=document.getElementById('pf-ref'); const code=(el&&el.value||'').trim().toUpperCase(); if(!code) return toast('Entre un code.',true);
    const me=S.players[S.me]||{}; if(me.refBy) return toast('Tu as déjà un parrain.',true); if(hasAnyPick(me)) return toast('Le code ne marche que pour un nouveau compte.',true);
    const u=Object.keys(S.players).find(x=>x!==S.me&&refCode(x)===code); if(!u) return toast('Code inconnu.',true);
    writeMe({refBy:u}).then(()=>toast('Code validé : '+nameOf(u)+' est ton parrain !')); },
  xjUse(v){ const [lid,type]=v.split('|'); if(refStock()<=0) return toast('Aucun joker en stock.',true); if(xjOf(S.me,lid)) return toast('Tu as déjà réactivé un joker dans cette ligue.',true);
    writeMe({xj:{[lid]:type}}).then(()=>toast('Joker réactivé !')); },
  prizeRules(lid){ S.open['rules'+lid]=true; render(); setTimeout(()=>{ const e=document.querySelector('[data-v="rules'+lid+'"]'); if(e) e.scrollIntoView({behavior:'smooth',block:'start'}); },60); },
  shareCode(lid){
    const lg=S.leagues[lid]; const txt=`Rejoins ma ligue « ${lg.name} » sur Survivor ! Code : ${lg.code}`;
    try{ navigator.clipboard.writeText(txt).then(()=>toast('Code copié ! Colle-le à tes proches.'),()=>toast('Code : '+lg.code)); }catch(e){ toast('Code : '+lg.code); }
  },
  addMatch(lid){
    const g=id=>document.getElementById(id); const lg=S.leagues[lid];
    const h=g('am-h').value.trim(), a=g('am-a').value.trim(), d=g('am-d').value, tm=g('am-t').value||'20:00', target=g('am-r').value;
    if(!h||!a) return toast('Renseigne les deux équipes.',true);
    if(!d) return toast('Choisis la date du match.',true);
    const when=new Date(d+'T'+tm).toISOString();
    const mk='m'+rid(); const m={h:{n:h.slice(0,40),id:'',logo:''},a:{n:a.slice(0,40),id:'',logo:''},d:when,result:null};
    let rk=target;
    if(rk==='new'){ rk='r'+rid(); writeLeague(lid,{rounds:{[rk]:{n:Object.keys(lg.rounds||{}).length+1,deadline:when,dl:Date.parse(when),matches:{[mk]:m}}}}); }
    else { const r=lg.rounds[rk]; const patch={rounds:{[rk]:{matches:{[mk]:m}}}}; if(t(when)<t(r.deadline)){ patch.rounds[rk].deadline=when; patch.rounds[rk].dl=Date.parse(when); } writeLeague(lid,patch); }
    g('am-h').value=''; g('am-a').value=''; toast('Match ajouté !');
  },
  addQuestion(lid){
    const g=id=>document.getElementById(id); const lg=S.leagues[lid];
    const q=g('aq-q').value.trim()||'Tu préfères ?', a=g('aq-a').value.trim(), b=g('aq-b').value.trim(), d=g('aq-d').value, tm=g('aq-t').value||'20:00';
    if(!a||!b) return toast('Renseigne les deux options.',true);
    if(!d) return toast('Choisis la date limite.',true);
    const rk='q'+rid();
    writeLeague(lid,{rounds:{[rk]:{n:Object.keys(lg.rounds||{}).length+1,deadline:new Date(d+'T'+tm).toISOString(),dl:Date.parse(d+'T'+tm),q:q.slice(0,80),a:{n:a.slice(0,40),img:S.tmpImg.a||''},b:{n:b.slice(0,40),img:S.tmpImg.b||''}}}});
    S.tmpImg={}; S.qNames={a:'',b:'',q:''}; g('aq-a').value=''; g('aq-b').value=''; g('aq-q').value=''; toast('Question ajoutée !');
  },
  async autoImg(){
    const sides=['a','b'].filter(k=>(S.qNames[k]||'').trim());
    if(!sides.length) return toast('Écris d\'abord les deux options.',true);
    toast('Recherche des photos…');
    let n=0; for(const k of sides){ if(await autoSide(k)) n++; }
    if(n) toast(n>1?'Photos trouvées !':'Photo trouvée !');
  },
  async autoImgFor(arg){
    const [lid,rk]=arg.split('|'); const r=((S.leagues[lid]||{}).rounds||{})[rk]; if(!r) return;
    toast('Recherche des photos…'); const upd={};
    for(const k of ['a','b']){ const u=await findImg((r[k]||{}).n); if(u) upd[k]={img:u}; }
    if(!Object.keys(upd).length) return toast('Aucune photo trouvée.',true);
    writeLeague(lid,{rounds:{[rk]:upd}}).then(()=>toast('Photos mises à jour.'));
  },
  qImg(side){ pickFile(async f=>{ const a=await upload(f); if(a){ S.tmpImg=S.tmpImg||{}; S.tmpImg[side]=a.id; render(); toast('Photo ajoutée.'); } }); },
  qImgFor(arg){ const [lid,rk,side]=arg.split('|'); pickFile(async f=>{ const a=await upload(f); if(a) writeLeague(lid,{rounds:{[rk]:{[side]:{img:a.id}}}}).then(()=>toast('Photo mise à jour.')); }); },
  setRes(arg){
    const [lid,rk,mk,v]=arg.split('|'); const lg=S.leagues[lid]; const m=lg.rounds[rk].matches[mk];
    if(t(m.d)>now()) return toast('Le match n\'a pas encore eu lieu.',true);
    writeLeague(lid,{rounds:{[rk]:{matches:{[mk]:{result:m.result===v?null:v}}}}}).then(()=>toast(m.result===v?'Résultat manuel retiré.':'Résultat enregistré.'));
  },
  delRound(arg){
    const [lid,rk]=arg.split('|');
    modal('<h3>SUPPRIMER LA JOURNÉE ?</h3><div class="muted">Les choix des joueurs sur cette journée ne compteront plus.</div>','SUPPRIMER',()=>{ const full=clone(S.leagues[lid]); delete full.id; delete full.rounds[rk]; replaceLeague(lid,full).then(()=>toast('Journée supprimée.')); });
  },
  delMatch(arg){
    const [lid,rk,mk]=arg.split('|');
    modal('<h3>SUPPRIMER CE MATCH ?</h3>','SUPPRIMER',()=>{ const full=clone(S.leagues[lid]); delete full.id; delete full.rounds[rk].matches[mk]; if(!Object.keys(full.rounds[rk].matches).length) delete full.rounds[rk]; replaceLeague(lid,full).then(()=>toast('Match supprimé.')); });
  },
  delLeague(lid){
    modal('<h3>SUPPRIMER LA LIGUE ?</h3><div class="muted">La ligue disparaîtra pour tout le monde. Action définitive.</div>','SUPPRIMER',()=>{ S.view.manage=null; writeLeague(lid,null,'delete').then(()=>toast('Ligue supprimée.')); });
  },
  editName(){
    const me=S.players[S.me]||{};
    modal(`<h3>NOM D'UTILISATEUR</h3><input class="in" id="pn" maxlength="24" value="${esc(me.pseudo||nameOf(S.me))}">`,'ENREGISTRER',()=>{
      const v=document.getElementById('pn').value.trim(); if(v.length<2){ toast('2 caractères minimum.',true); return false; }
      if(guard()) return false; writeMe({pseudo:v.slice(0,24)}).then(()=>toast('Nom enregistré !'));
    });
  },
  deleteAccount(){
    if(!window.survivorDeleteAccount) return A.wipe();
    modal('<h3>SUPPRIMER MON COMPTE ?</h3><div class="muted">Ton compte, ton profil et tous tes paris sont effacés, et tu quittes toutes tes ligues. Action définitive.</div>','SUPPRIMER',()=>{
      if(guard()) return false;
      toast('Suppression du compte…');
      window.survivorDeleteAccount().catch(e=>{ const c=e&&e.code;
        if(c==='cancelled'||c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request') toast('Suppression annulée.');
        else if(c==='auth/wrong-password'||c==='auth/invalid-credential') toast('Mot de passe incorrect.',true);
        else if(c==='auth/requires-recent-login') toast('Par sécurité, déconnecte-toi, reconnecte-toi puis recommence.',true);
        else handleErr(e); });
    });
  },
  wipe(){
    modal('<h3>SUPPRIMER MES DONNÉES ?</h3><div class="muted">Tu quittes toutes tes ligues et tes paris sont effacés. Action définitive.</div>','SUPPRIMER',()=>{
      if(guard()) return false; const id=S.me; delete S.players[id]; render();
      if(S.mode==='live') db.doc('players/'+id).delete().then(()=>toast('Données supprimées.')).catch(handleErr); else toast('Données supprimées.');
    });
  }
};
S.tmpImg={}; S.qNames={a:'',b:'',q:''};
function pickFile(cb){
  if(!assets && S.mode!=='demo') return toast('Import de photo réservé aux éditeurs du site.',true);
  if(S.mode==='demo') return toast('Indisponible en mode démo.',true);
  const inp=document.getElementById('filepick'); inp.value=''; inp.onchange=()=>{ const f=inp.files[0]; if(f) cb(f); }; inp.click();
}

/* ---------- Recadrage de la photo de profil ---------- */
function cropAvatar(src){
  return new Promise(resolve=>{
    const BOX=260, OUT=480;
    const d=document.createElement('div'); d.className='modal';
    d.innerHTML=`<div class="sheet crop-sheet"><h3>RECADRER LA PHOTO</h3><div class="muted" style="font-size:14px">Fais glisser la photo et zoome pour bien cadrer ton visage.</div>
      <div class="crop-box"><img alt="" draggable="false"></div>
      <div class="crop-zoom"><span>−</span><input type="range" min="1" max="4" step="0.01" value="1"><span>+</span></div>
      <div class="acts"><button class="btn ghost" data-x>ANNULER</button><button class="btn" data-ok>VALIDER</button></div></div>`;
    document.body.appendChild(d);
    const box=d.querySelector('.crop-box'), img=box.querySelector('img'), range=d.querySelector('input[type=range]');
    let W=0,H=0, base=1, z=1, x=0, y=0;
    const clamp=()=>{ const s=base*z, w=W*s, h=H*s; x=Math.min(0,Math.max(BOX-w,x)); y=Math.min(0,Math.max(BOX-h,y)); };
    const draw=()=>{ clamp(); const s=base*z; img.style.width=W*s+'px'; img.style.height=H*s+'px'; img.style.transform=`translate(${x}px,${y}px)`; };
    const zoomTo=(nz,cx=BOX/2,cy=BOX/2)=>{ nz=Math.min(4,Math.max(1,nz)); const k=nz/z; x=cx-(cx-x)*k; y=cy-(cy-y)*k; z=nz; range.value=z; draw(); };
    img.onload=()=>{ W=img.naturalWidth; H=img.naturalHeight; base=Math.max(BOX/W,BOX/H); x=(BOX-W*base)/2; y=(BOX-H*base)/2; draw(); };
    img.onerror=()=>{ toast('Photo illisible.',true); d.remove(); resolve(null); };
    if(/^https?:/.test(src)) img.crossOrigin='anonymous';
    img.src=src;
    const pts=new Map(); let last=null, pinch=null;
    box.addEventListener('pointerdown',e=>{ box.setPointerCapture(e.pointerId); pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); last={x:e.clientX,y:e.clientY}; if(pts.size===2){ const [a,b]=[...pts.values()]; pinch={dist:Math.hypot(a.x-b.x,a.y-b.y), z}; } });
    box.addEventListener('pointermove',e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pts.size===2 && pinch){ const [a,b]=[...pts.values()]; const r=box.getBoundingClientRect(); zoomTo(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.dist,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top); return; }
      if(last){ x+=e.clientX-last.x; y+=e.clientY-last.y; last={x:e.clientX,y:e.clientY}; draw(); } });
    const up=e=>{ pts.delete(e.pointerId); if(pts.size<2) pinch=null; const rest=[...pts.values()][0]; last=rest?{...rest}:null; };
    box.addEventListener('pointerup',up); box.addEventListener('pointercancel',up);
    box.addEventListener('wheel',e=>{ e.preventDefault(); const r=box.getBoundingClientRect(); zoomTo(z*(e.deltaY<0?1.08:1/1.08),e.clientX-r.left,e.clientY-r.top); },{passive:false});
    range.addEventListener('input',()=>zoomTo(+range.value));
    d.addEventListener('click',e=>{
      if(e.target===d||e.target.closest('[data-x]')){ d.remove(); resolve(null); return; }
      if(e.target.closest('[data-ok]')){
        const s=base*z, c=document.createElement('canvas'); c.width=c.height=OUT;
        try{ c.getContext('2d').drawImage(img,-x/s,-y/s,BOX/s,BOX/s,0,0,OUT,OUT);
          c.toBlob(b=>{ d.remove(); resolve(b); },'image/jpeg',0.86); }
        catch(err){ console.warn(err); toast('Impossible de recadrer cette photo.',true); d.remove(); resolve(null); }
      }
    });
  });
}
async function upload(file){
  try{
    let blob=file;
    if(file.size>600*1024 && /^image\/(jpeg|png|webp)/.test(file.type)) blob=await shrink(file,1200);
    toast('Envoi de la photo…'); const r=await assets.upload(blob); return r;
  }catch(e){ console.warn(e); toast('Échec de l\'envoi de la photo.',true); return null; }
}
function shrink(file,max){ return new Promise(res=>{ const img=new Image(); img.onload=()=>{ const s=Math.min(1,max/Math.max(img.width,img.height)); const c=document.createElement('canvas'); c.width=img.width*s; c.height=img.height*s; c.getContext('2d').drawImage(img,0,0,c.width,c.height); c.toBlob(b=>res(b||file),'image/jpeg',.85); }; img.onerror=()=>res(file); img.src=URL.createObjectURL(file); }); }
function modal(html, ok, fn){
  const d=document.createElement('div'); d.className='modal';
  d.innerHTML=`<div class="sheet">${html}<div class="acts"><button class="btn ghost" data-x>ANNULER</button><button class="btn" data-ok>${esc(ok)}</button></div></div>`;
  d.addEventListener('click',e=>{ if(e.target===d||e.target.closest('[data-x]')) d.remove(); if(e.target.closest('[data-ok]')){ if(fn()!==false) d.remove(); } });
  document.body.appendChild(d); const i=d.querySelector('input'); if(i) setTimeout(()=>i.focus(),50);
}
function celebrate(lid){
  const c=C(lid); if(!c||c.status!=='finished'||!c.winners.includes(S.me)) return;
  const key='celeb-'+lid+'-'+S.me; try{ if(localStorage.getItem(key)) return; localStorage.setItem(key,'1'); }catch(e){}
  const d=document.createElement('div'); d.className='celeb'; const cols=['#fff','#111827','#FDE68A','#86EFAC'];
  let conf=''; for(let i=0;i<40;i++) conf+=`<span class="confetti" style="left:${Math.random()*100}%;background:${cols[i%4]};animation-duration:${2+Math.random()*3}s;animation-delay:${-Math.random()*3}s"></span>`;
  const p=S.players[S.me]||{};
  d.innerHTML=conf+(p.avatar?`<div class="face"><img src="${blobUrl(p.avatar)}" alt=""></div>`:'<div class="trophy">🏆</div>')+`<h2>${c.winners.length>1?'LES 2 DERNIERS SURVIVANTS !':'TU ES LE GRAND GAGNANT !'}</h2><p>Félicitations, tu remportes « ${esc(c.lg.name)} ».</p><button class="btn" style="margin-top:20px;background:#fff;color:var(--on)">CONTINUER</button>`;
  d.querySelector('button').onclick=()=>d.remove(); document.body.appendChild(d);
}

/* ================================================================ Views */
function statusPill(c){ if(c.status==='upcoming') return '<span class="pill green">À venir</span>'; if(c.status==='finished') return '<span class="pill grey">Terminée</span>'; return '<span class="pill">En cours</span>'; }
const catTag = k => `<span class="tag">${I[cat(k).icon]}${esc(cat(k).label)}</span>`;
const HIDDEN_CATS=['tuprefere']; // « Tu préfères » désactivé pour le moment
const shownL = lid => !HIDDEN_CATS.includes((S.leagues[lid]||{}).category);
// Toutes les ligues (y compris celles créées par les joueurs) sont visibles par tout le monde
const visible = lg => !HIDDEN_CATS.includes(lg.category);


/* Lot : maillot rétro du championnat (ligues de football) */
// Lot de la ligue : champ « prize » réglé dans Gérer la ligue (valeur par défaut pour Race X Ligue 1)
const prizeOf = lg => lg.private ? '' : typeof lg.prize==='string' ? lg.prize.trim().replace(/^.*kak[aá].*$/i,'') : '';
const prizeValOf = lg => String(lg.prizeVal||'').trim();
const capFirst = x => x ? x.charAt(0).toUpperCase()+x.slice(1) : x;
function prizeBand(lg, cls){
  const pz=prizeOf(lg);
  if(pz) return '';
  if(false) return `<div class="prize ${cls||''}"><span class="pz-i">👕</span><span>${isPoints(lg)?'Le gagnant':'Le dernier survivant'} de cette ligue gagne <b>${esc(pz)}</b></span></div>`;
  if(isPoints(lg)) return '';
  if((lg.category||'football')!=='football' || !lg.comp || !COMP_NAMES[lg.comp]) return '';
  return `<div class="prize ${cls||''}"><span class="pz-i">👕</span><span>Le dernier survivant de cette ligue gagne <b>un maillot rétro de ${esc(COMP_NAMES[lg.comp])}</b></span></div>`;
}
// Ticket du lot (page de la ligue) et petit ticket (vignette)
function prizeTicket(lg){
  const pz=prizeOf(lg); if(!pz) return ''; const v=prizeValOf(lg);
  return `<div class="ptk">${v?`<div class="ptk-l"><small>À GAGNER</small><b>${esc(v)}</b></div>`:`<div class="ptk-l"><small>À GAGNER</small><b>🏆</b></div>`}<div class="ptk-r"><b>${esc(capFirst(pz))}</b><small>pour le vainqueur de la ligue</small><button class="ptk-more" data-a="prizeRules" data-v="${lg.id}">En savoir plus</button></div></div>`;
}
function prizeMini(lg){
  const pz=prizeOf(lg); if(!pz) return ''; const v=prizeValOf(lg);
  return `<span class="ptm"><small>À GAGNER</small><b>${esc(v||'🏆')}</b><em>${esc(pz.length>40?pz.slice(0,39)+'…':pz)}</em></span>`;
}
function prizeRulesHtml(lg){
  const pz=prizeOf(lg); if(!pz) return ''; const v=prizeValOf(lg), pts=isPoints(lg);
  const what=(v?v+' ':'')+pz;
  return `<div class="rlot"><b class="rlot-t">Règlement du lot<small>${esc(capFirst(what))}</small></b>
    <p><b>Le vainqueur</b> ${pts?`est le premier joueur à atteindre ${nRoundsOf(lg)} points (en cas d'égalité : meilleur goal-average).`:'est le dernier joueur encore en vie dans la ligue.'}</p>
    ${pts?'':`<p><b>Tous perdent la même journée ?</b> Personne n'est éliminé : les survivants sont repêchés et rejouent la journée suivante, jusqu'à ce qu'il n'en reste qu'un.</p>`}
    <p><b>Remise :</b> le lot est envoyé par e-mail au gagnant à la fin de la ligue.</p>
    <p class="rlot-f">Participation gratuite et sans obligation d'achat. Un seul compte par personne.</p></div>`;
}
// Compteur « X survivants sur Y » avec jauge qui se vide
function survMeter(c, small){
  if(c.points || c.status==='upcoming' || !c.mem.length) return '';
  const a=c.alive.length, n=c.mem.length, pct=Math.max(2,Math.round(a*100/n));
  const done=c.rounds.filter(r=>['done','cancelled'].includes((c.info[r.k]||{}).state)).length;
  return `<div class="smeter ${small?'sm':''}"><div class="sm-top"><b>${a}</b><span>survivant${a>1?'s':''} sur ${n}</span>${(small||!done)?'':`<em>après ${done} journée${done>1?'s':''}</em>`}</div><div class="sm-bar"><i style="width:${pct}%"></i></div></div>`;
}
function cardDur(iso){ const d=t(iso)-now(); if(d<=0) return ''; const m=Math.floor(d/60000), h=Math.floor(m/60), j=Math.floor(h/24); return j>=1?`${j}j`:h>=1?`${h}h`:`${Math.max(1,m)} min`; }
function leagueCardNew(c){ let h='';
    const lg=c.lg, mine=isMember(lg.id), pz=prizeOf(lg), pv=prizeValOf(lg);
    let act;
    if(c.status==='upcoming') act = mine?`<button class="nc-p ok" data-a="open" data-v="${lg.id}">Inscrit ✓</button>`:`<button class="nc-p go" data-a="join" data-v="${lg.id}">Je m'inscris</button>`;
    else if(c.status==='live' && mine && c.alive.includes(S.me)) act=`<button class="nc-p dark" data-a="open" data-v="${lg.id}">Parier</button>`;
    else act=`<button class="nc-p" data-a="open" data-v="${lg.id}">Voir</button>`;
    const dur=c.status==='upcoming'?cardDur(lg.startAt):'';
    const st=c.status==='upcoming'?`<span class="nc-p up">À venir${dur?' · '+dur:''}</span>`:c.status==='finished'?`<span class="nc-p end">Terminée</span>`:`<span class="nc-p live">En cours</span>`;
    const faces=c.mem.slice(0,3).map(u=>`<span class="nc-face">${(S.players[u]||{}).avatar?`<img src="${blobUrl(S.players[u].avatar)}" alt="">`:`<img src="${DEFAULT_AVATAR}" alt="">`}</span>`).join('');
    const band=pz?`<span class="nc-band">${pv?`<span class="nc-tk">${esc(pv)}</span>`:''}<span>à gagner ${esc(pz)}</span></span>`:'';
    const extra=[
      c.winners.length?`<div class="nc-win">🏆 ${[...c.winners,...(c.lastRule==='wins'?c.lasts:[])].map(w=>esc(nameOf(w))).join(' & ')}</div>`:'',
      c.lastRule==='drink'&&c.lasts.length?`<div class="nc-win">🍺 ${c.lasts.map(w=>esc(nameOf(w))).join(' & ')} ${c.lasts.length>1?'doivent':'doit'} un verre</div>`:'',
      c.lastRule&&c.status!=='finished'?`<div class="nc-opt">${LAST_RULES[c.lastRule].ico} ${LAST_RULES[c.lastRule].t}</div>`:'',
      c.status==='upcoming'?'':(!c.points?survMeter(c,true):`<div class="nc-info"><span>${I.chart}${esc(`Objectif ${c.N} pts · leader à ${c.ranking[0]?c.ranking[0].pts:0}`)}</span></div>`)
    ].join('');
    if(c.status!=='upcoming'){
      const meter=c.points?`<div class="nci-m"><div class="nci-mt">Objectif <b>${c.N}</b> pts · leader à ${c.ranking[0]?c.ranking[0].pts:0}</div><div class="nci-bar"><i style="width:${Math.min(100,Math.round((c.ranking[0]?c.ranking[0].pts:0)*100/Math.max(1,c.N)))}%"></i></div></div>`
        :`<div class="nci-m"><div class="nci-mt"><b>${c.alive.length}</b> survivant${c.alive.length>1?'s':''} sur ${c.mem.length} inscrit${c.mem.length>1?'s':''}</div><div class="nci-bar"><i style="width:${Math.round(c.alive.length*100/Math.max(1,c.mem.length))}%"></i></div></div>`;
      const win=[c.winners.length?`<div class="nc-win w">🏆 ${[...c.winners,...(c.lastRule==='wins'?c.lasts:[])].map(w=>esc(nameOf(w))).join(' & ')}</div>`:'', c.lastRule==='drink'&&c.lasts.length?`<div class="nc-win w">🍺 ${c.lasts.map(w=>esc(nameOf(w))).join(' & ')} ${c.lasts.length>1?'doivent':'doit'} un verre</div>`:''].join('');
      const title=leagueTitle(lg.name).replace(/src="img\/(survivor|race|oneshot|merguez|x)\.png/g,'src="img/$1-white.png');
      h+=`<div class="ncard h"><div class="nci" data-a="open" data-v="${lg.id}" role="button" aria-label="Ouvrir la ligue">${coverHtml(lg)}<div class="nci-sh"></div>
        <div class="nci-top"><span class="nc-p cat">${esc(cat(lg.category).label)}</span><span class="nc-stk">${st}${mine?`<button class="nc-p ok" data-a="open" data-v="${lg.id}">Inscrit ✓</button>`:''}</span></div>
        <div class="nci-b">${title}${win}${meter}</div></div>${pz?`<div class="nc-lot" data-a="open" data-v="${lg.id}" role="button"><span class="nc-lot-v"><svg class="crown" viewBox="0 0 48 34" aria-hidden="true"><path d="M3 9.5c-.6-2.6 2.2-4.4 4.3-2.8l6.2 4.7c1.5 1.1 3.6.9 4.8-.5l4.4-5.2c1.3-1.5 3.6-1.5 4.9 0l4.4 5.2c1.2 1.4 3.3 1.6 4.8.5l6.2-4.7c2.1-1.6 4.9.2 4.3 2.8L39.1 30.6c-.3 1.5-1.6 2.4-3.1 2.4H12c-1.5 0-2.8-.9-3.1-2.4z" fill="#F2B84B"/></svg>${esc(pv||'')}</span><span class="nc-lot-t">à gagner ${esc(pz)}</span></div>`:''}</div>`;
      return h;
    }
    { const title=leagueTitle(lg.name).replace(/src="img\/(survivor|race|oneshot|merguez|x)\.png/g,'src="img/$1-white.png');
      const fc=c.mem.slice(0,3).map(u=>`<span class="nc-face">${(S.players[u]||{}).avatar?`<img src="${blobUrl(S.players[u].avatar)}" alt="">`:`<img src="${DEFAULT_AVATAR}" alt="">`}</span>`).join('');
      const cta=mine?`<button class="nc-p ok" data-a="open" data-v="${lg.id}">Inscrit ✓</button>`:`<button class="nc-go" data-a="join" data-v="${lg.id}">Je m'inscris<i>›</i></button>`;
      const tick=pz?`<div class="nc-lot" data-a="open" data-v="${lg.id}" role="button"><span class="nc-lot-v"><svg class="crown" viewBox="0 0 48 34" aria-hidden="true"><path d="M3 9.5c-.6-2.6 2.2-4.4 4.3-2.8l6.2 4.7c1.5 1.1 3.6.9 4.8-.5l4.4-5.2c1.3-1.5 3.6-1.5 4.9 0l4.4 5.2c1.2 1.4 3.3 1.6 4.8.5l6.2-4.7c2.1-1.6 4.9.2 4.3 2.8L39.1 30.6c-.3 1.5-1.6 2.4-3.1 2.4H12c-1.5 0-2.8-.9-3.1-2.4z" fill="#F2B84B"/></svg>${esc(pv||'')}</span><span class="nc-lot-t">à gagner ${esc(pz)}</span></div>`:'';
      h+=`<div class="ncard h"><div class="nci up" data-a="open" data-v="${lg.id}" role="button" aria-label="Ouvrir la ligue">${coverHtml(lg)}<div class="nci-sh"></div>
        <div class="nci-top"><span class="nc-p cat">${esc(cat(lg.category).label)}</span>${st}</div>
        <div class="nci-b">${title}<div class="nci-f"><button class="nci-pl" data-a="openSurv" data-v="${lg.id}">${fc?`<span class="nci-fc">${fc}</span>`:''}${c.mem.length} joueur${c.mem.length>1?'s':''}</button>${cta}</div></div></div>${tick}</div>`;
    }
  return h;
}
// Tableau de bord de l'accueil : paris à valider (anneau) + situation dans chaque ligue en cours
function dashCard(myL, todo){
  if(S.guest) return '';
  let open=0, done=0, next=null, nextAll=null;
  myL.forEach(c=>{ if(c.status!=='live'||!c.alive.includes(S.me)) return; const r=openR(c); if(!r) return; open++;
    const ok=!!pickOf(S.me,c.lg.id,r.k), tt=t(r.deadline); if(ok) done++; else if(!next||tt<next) next=tt; if(!nextAll||tt<nextAll) nextAll=tt; });
  const ratio=open?done/open:1, C0=94.25, arc=Math.max(todo?4:0,Math.round(ratio*C0*10)/10);
  const ring=`<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="${arc} 200"/></svg>`;
  const tag=(tt,lbl)=>tt?`<span class="dtag">${I.clock}${lbl||''}<em class="cdl" data-t="${tt}">${cdText(tt)}</em></span>`:'';
  const CHV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  const pill=todo?`<button class="zp" data-a="tab" data-v="paris"><span class="n">${todo}</span>pari${todo>1?'s':''} à valider${CHV}</button>`:`<button class="zp" data-a="tab" data-v="paris">${IC.thumb}0 pari à valider</button>`;
  let h='';
  const L=myL.filter(c=>c.status!=='finished').sort((a,b)=>(a.status==='upcoming')-(b.status==='upcoming'));
  if(!L.length) return '';
  const CHV2='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  const card=c=>{
    const nm=`<div class="dl-nm"><small class="dk">${WM(c.points?'oneshot':'survivor')}</small><b>X ${esc(stripPrefix(c.lg.name))}<span class="dl-go">${CHV2}</span></b></div>`;
    let st, pct, l='', r='';
    if(c.points){ const me=c.rankOf[S.me]||{}, p=me.pts||0; st=`<b>${p}</b> / ${c.N} pts`; pct=p*100/c.N;
      l=c.status==='upcoming'?`Début dans ${shortDur(t(c.lg.startAt))}`:`Classement : ${me.pos||'–'}${me.pos===1?'er':'e'}`; }
    else { const a=c.status==='upcoming'?c.mem.length:c.alive.length, n=c.mem.length, out=n-a, dead=c.status!=='upcoming'&&!c.alive.includes(S.me);
      st=`<b class="${dead?'ko':''}">${a}</b> / ${n} en vie`; pct=a*100/Math.max(1,n);
      if(c.status==='upcoming') l=`Début dans ${shortDur(t(c.lg.startAt))}`;
      else { const cur=c.rounds.find(r=>t(r.deadline)>now()); const jn=cur?((c.info[cur.k]||{}).n||(c.rounds.indexOf(cur)+1)):''; l=`${out} éliminé${out>1?'s':''}`; r=dead?'<b class="ko">Tu es éliminé</b>':`Tu es en vie${jn?' · J'+jn:''}`; } }
    return `<button class="dl-card" data-a="open" data-v="${c.lg.id}"><div class="dl-top">${nm}<div class="dl-st">${st}</div></div><div class="dl-bar"><i style="width:${Math.max(2,Math.min(100,pct))}%"></i></div><div class="dl-lg"><span>${l}</span><span>${r}</span></div></button>`; };
  const all=S.open.dashAll, shown=all?L:L.slice(0,3);
  h+=`<div class="dh2"><span>Tes ligues en cours</span>${pill}</div>`+shown.map(card).join('');
  if(L.length>3) h+=`<button class="dl-more" data-a="toggle" data-v="dashAll"><span class="dl-mi ${all?'up':''}">${I.chev}</span>${all?'Voir moins':`Voir plus (${L.length-3})`}</button>`;
  return `<div class="dash2">${h}</div>`;
}
function viewHome(){
  const all=Object.values(S.leagues).filter(visible).map(l=>C(l.id)).filter(Boolean);
  const order={upcoming:0,live:1,finished:2};
  all.sort((a,b)=>(+(b.lg.pin||0))-(+(a.lg.pin||0)) || order[a.status]-order[b.status] || (a.status==='upcoming'?t(a.lg.startAt)-t(b.lg.startAt):t(b.lg.createdAt)-t(a.lg.createdAt)));
  const fmt=S.view.fmt||'survivor', howOpen=!S.open.howX;
  const DESC={survivor:'Un mauvais pari et tu es éliminé. Le dernier en vie gagne.', oneshot:'Pas d’élimination : cumule des points pour gagner la ligue.'};
  const nOs=all.filter(c=>c.points).length, nSv=all.length-nOs;
  const cats=Object.keys(CATS).filter(k=>!HIDDEN_CATS.includes(k));
  const f=['all','mine','up','live'].includes(S.view.filter)?S.view.filter:'all', ty=S.view.ltype||null, sp=S.view.lsport||null;
  const list=all.filter(c=> (f==='all'||(f==='mine'?isMember(c.lg.id):f==='up'?c.status==='upcoming':c.status==='live'))
    && (!ty||(ty==='oneshot'?c.points:!c.points)) && (!sp||(c.lg.category||'football')===sp));
  const nMine=all.filter(c=>isMember(c.lg.id)).length;
  const myL=Object.keys(S.leagues).filter(lid=>isMember(lid)&&shownL(lid)).map(C).filter(Boolean);
  const aliveIn=myL.filter(c=>c.status==='live'&&c.alive.includes(S.me)).length, inGame=myL.filter(c=>c.status==='upcoming'||(c.status==='live'&&c.alive.includes(S.me))).length, soon=myL.filter(c=>c.status==='upcoming').length, todo=countTodo();
  const me=S.players[S.me]||{}, nm=nameOf(S.me);
  let line, cta;
  if(!myL.length){ line='Rejoins une ligue et tiens le plus longtemps possible.'; cta=`<button class="btn brand" data-a="joinCode">${I.key} J'AI UN CODE</button>`; }
  else {
    const bits=[]; if(aliveIn) bits.push(`en vie dans <b>${aliveIn}</b> ligue${aliveIn>1?'s':''}`); if(soon) bits.push(`<b>${soon}</b> ligue${soon>1?'s':''} à venir`);
    line=(bits.length?'Tu es '+bits.join(' · '):'Aucune ligue en cours pour toi.')+(todo?` · <b class="hot">${todo} choix à faire</b>`:'');
    cta=`<button class="btn ${todo?'brand':'light'}" data-a="tab" data-v="paris">${todo?'À TOI DE JOUER':'MES PARIS'} ${I.arrow}</button>`;
  }
  let nextDl=null; myL.forEach(c=>{ if(c.status==='finished'||!c.alive.includes(S.me)) return; const r=openR(c); if(!r) return; const done=!!pickOf(S.me,c.lg.id,r.k); const cand={t:t(r.deadline), name:stripPrefix(c.lg.name), done};
    if(!nextDl || (nextDl.done && !done) || (nextDl.done===done && cand.t<nextDl.t)) nextDl=cand; });
  const avImg=`<img src="${me.avatar?blobUrl(me.avatar):DEFAULT_AVATAR}" data-fb="${esc(initials(nm))}" alt="">`;
  let h=(S.guest?`<div class="nh-top"><div class="nh-hi"><small>Bienvenue sur</small><span class="nh-logo">${WM()}</span></div><button class="btn sm brand" data-a="tab" data-v="profil">Se connecter</button></div>`:`<div class="nh-top"><button class="nh-av" data-a="tab" data-v="profil" aria-label="Profil">${avImg}</button><div class="nh-hi"><small>Salut,</small><b>${esc(nm)}</b></div><span class="nh-logo">${WM()}</span></div>`)+installBand()+avatarBand()+`
  ${dashCard(myL,todo)}
  <div class="how-card ${howOpen?'open':''}"><div class="how"><button class="how-t how-tg" data-a="toggle" data-v="howX" aria-expanded="${howOpen}"><span>Comment on joue&nbsp;?</span>${I.chev}</button>${howOpen?`
    <div class="how-sw" role="tablist"><button role="tab" class="${fmt==='survivor'?'on':''}" data-a="fmt" data-v="survivor" aria-label="Survivor">${WM('survivor', false)}</button><button role="tab" class="${fmt==='oneshot'?'on':''}" data-a="fmt" data-v="oneshot" aria-label="Race">${WM('oneshot', false)}</button></div></div>
  <div class="how-d">${fmt==='oneshot'?'– Cumule des points –':'– Le dernier en vie gagne –'}</div>
  <div class="slider"><div class="slides" id="slides">
${fmt==='oneshot'?`    <div class="sl slide "><div class="sl-ph"><div class="il il1b">
<div class="m1"><b><img src="data/logos/soccer_2502.png" alt=""></b><em>N</em><b><img src="data/logos/soccer_179.png" alt=""></b></div>
<div class="m1 sel"><b class="on"><img src="data/logos/soccer_176.png" alt=""><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></i></b><em>N</em><b><img src="data/logos/soccer_169.png" alt=""></b></div>
<div class="m1"><b><img src="data/logos/soccer_166.png" alt=""></b><em>N</em><b><img src="data/logos/soccer_180.png" alt=""></b></div>
</div><span class="sl-k">1<small>/4</small></span></div><div class="sl-tx nobtn"><div class="sl-h">Chaque journée, choisis <mark>une équipe</mark>.</div></div></div>
    <div class="sl slide "><div class="sl-ph"><div class="il il-os2"><div class="os-r"><span class="sc"><img src="data/logos/soccer_176.png" alt=""><b>2-0</b><img src="data/logos/soccer_169.png" alt=""></span><em class="w">+3</em></div><div class="os-r"><span class="sc"><img src="data/logos/soccer_176.png" alt=""><b>1-1</b><img src="data/logos/soccer_169.png" alt=""></span><em class="d">+1</em></div><div class="os-r"><span class="sc"><img src="data/logos/soccer_176.png" alt=""><b>0-1</b><img src="data/logos/soccer_169.png" alt=""></span><em class="l">+0</em></div></div><span class="sl-k">2<small>/4</small></span></div><div class="sl-tx nobtn"><div class="sl-h">Gagne des points en fonction de <mark class="g">son résultat</mark>.</div></div></div>
    <div class="sl slide yel"><div class="sl-ph"><div class="il il3"><div class="il3-big"><img src="data/logos/soccer_176.png" alt=""><span>Déjà joué</span></div><div class="il3-row"><b><img src="data/logos/soccer_160.png" alt=""></b><b><img src="data/logos/soccer_175.png" alt=""></b><b><img src="data/logos/soccer_167.png" alt=""></b><b><img src="data/logos/soccer_174.png" alt=""></b><b><img src="data/logos/soccer_166.png" alt=""></b></div></div><span class="sl-k">3<small>/4</small></span></div><div class="sl-tx nobtn"><div class="sl-h"><span class="sl-bub" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.2c5.6 0 9.8 3.7 9.8 8.9s-4.2 8.9-9.8 8.9c-1 0-2-.1-2.9-.4l-4.3 2.6c-.6.4-1.4-.1-1.3-.8l.5-3.6C2.6 16.2 2.2 13.8 2.2 11.1 2.2 5.9 6.4 2.2 12 2.2z"/><rect x="10.7" y="6" width="2.6" height="7" rx="1.3" fill="#fff"/><circle cx="12" cy="15.9" r="1.45" fill="#fff"/></svg></span>Une équipe ne peut pas être sélectionnée 2&nbsp;fois&nbsp;!</div></div></div>
    <div class="sl slide "><div class="sl-ph"><div class="il il-os4"><div class="os-t"><i>1</i><span>Karim</span><b>20 pts 🏁</b></div><div class="os-t me"><i>2</i><span>Toi</span><b>16 pts</b></div><div class="os-t"><i>3</i><span>Léa</span><b>14 pts</b></div></div><span class="sl-k">4<small>/4</small></span></div><div class="sl-tx nobtn"><div class="sl-h">Cumule <mark>le plus de points</mark> pour gagner la ligue.</div></div></div>
`:`    <div class="sl slide "><div class="sl-ph"><div class="il il1b">
<div class="m1"><b><img src="data/logos/soccer_6997.png" alt=""></b><em>N</em><b><img src="data/logos/soccer_6851.png" alt=""></b></div>
<div class="m1 sel"><b class="on"><img src="data/logos/soccer_160.png" alt=""><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></i></b><em>N</em><b><img src="data/logos/soccer_273.png" alt=""></b></div>
<div class="m1"><b><img src="data/logos/soccer_7868.png" alt=""></b><em>N</em><b><img src="data/logos/soccer_175.png" alt=""></b></div>
</div><span class="sl-k">1<small>/4</small></span></div><div class="sl-tx nobtn"><div class="sl-h">Chaque journée, choisis <mark>une équipe</mark>.</div></div></div>
    <div class="sl slide "><div class="sl-ph"><div class="il il2"><div class="il-res ok"><div class="il-sc"><img src="data/logos/soccer_160.png" alt=""><b>2 - 0</b><img src="data/logos/soccer_273.png" alt=""></div><div class="il-st"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8.5-5.2-9.8-10.6C1.4 6.9 3.6 4 6.9 4c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.5 2.9 4.7 6.4C20.5 15.8 12 21 12 21z"/></svg>En vie</div></div>
<div class="il-res ko"><div class="il-sc"><img src="data/logos/soccer_160.png" alt=""><b>0 - 1</b><img src="data/logos/soccer_273.png" alt=""></div><div class="il-st"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>Éliminé</div></div></div><span class="sl-k">2<small>/4</small></span></div><div class="sl-tx nobtn"><div class="sl-h">Ton équipe gagne → <mark class="g">tu survis</mark>.<br>Sinon, tu es éliminé.</div></div></div>
    <div class="sl slide yel"><div class="sl-ph"><div class="il il3"><div class="il3-big"><img src="data/logos/soccer_160.png" alt=""><span>Déjà joué</span></div><div class="il3-row"><b><img src="data/logos/soccer_176.png" alt=""></b><b><img src="data/logos/soccer_175.png" alt=""></b><b><img src="data/logos/soccer_167.png" alt=""></b><b><img src="data/logos/soccer_174.png" alt=""></b><b><img src="data/logos/soccer_166.png" alt=""></b></div></div><span class="sl-k">3<small>/4</small></span></div><div class="sl-tx nobtn"><div class="sl-h"><span class="sl-bub" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.2c5.6 0 9.8 3.7 9.8 8.9s-4.2 8.9-9.8 8.9c-1 0-2-.1-2.9-.4l-4.3 2.6c-.6.4-1.4-.1-1.3-.8l.5-3.6C2.6 16.2 2.2 13.8 2.2 11.1 2.2 5.9 6.4 2.2 12 2.2z"/><rect x="10.7" y="6" width="2.6" height="7" rx="1.3" fill="#fff"/><circle cx="12" cy="15.9" r="1.45" fill="#fff"/></svg></span>Une équipe ne peut pas être sélectionnée 2&nbsp;fois&nbsp;!</div></div></div>
    <div class="sl slide dark mid full"><img class="sl-bgimg" src="img/slide-supporter.jpg" alt=""><div class="sl-ph"><div class="il il4p"></div><span class="sl-k">4<small>/4</small></span></div><div class="sl-tx nobtn"><div class="sl-h">Le dernier en vie <mark>gagne</mark>.</div></div></div>
`}  </div><div class="sdots">${[0,1,2,3].map(i=>`<button data-a="slide" data-v="${i}" aria-label="Écran ${i+1}"></button>`).join('')}</div></div>`:`</div>`}</div>
  <div class="nh-sec" id="ligues"><span>Les ligues</span><small>${list.length} ligue${list.length>1?'s':''}</small></div>`;
  const ft=[['all','Toutes'],...(S.guest?[]:[['mine','Mes ligues']]),['up','À venir'],['live','En cours']];
  h+=`<div class="lft" role="tablist">`+ft.map(([k,l])=>`<button role="tab" class="${f===k?'on':''}" data-a="filter" data-v="${k}">${l}${k==='mine'&&nMine?`<em>${nMine}</em>`:''}</button>`).join('')+`</div>`;
  h+=`<div class="lfc"><button class="lch wmc ${ty==='survivor'?'on':''}" data-a="ltype" data-v="survivor" aria-label="Survivor">${WM('survivor',ty==='survivor')}</button><button class="lch wmc ${ty==='oneshot'?'on':''}" data-a="ltype" data-v="oneshot" aria-label="Race">${WM('oneshot',ty==='oneshot')}</button><span class="ldv"></span>`+cats.map(k=>`<button class="lch ${sp===k?'on':''}" data-a="lsport" data-v="${k}">${cat(k).emo} ${esc(k==='basket'?'Basket':k==='football'?'Foot':cat(k).label)}</button>`).join('')+`</div>`;
  if(!list.length){
    h+=`<div class="empty"><div class="ico">${f==='mine'?'🎟️':'🏟️'}</div><h3>${f==='mine'?'AUCUNE LIGUE':'PAS ENCORE DE LIGUE'}</h3>${f==='mine'?'<p>Inscris-toi à une ligue ou entre un code privé.</p></div>':'</div>'}`;
  }
  list.forEach(c=>{ h+=leagueCardNew(c); });
  h+=`<button class="nc-join" data-a="joinCode">${I.key} Rejoindre une ligue privée avec un code</button>`;
  h+=`<button class="nc-join nc-create" data-a="tab" data-v="admin">${I.plus} Créer une ligue et invite tes amis</button>`;
  return h;
}

function dlLine(r){
  const closed=t(r.deadline)<=now();
  return closed ? `<div class="dl closed">${I.clock}Choix clos depuis le ${fmtDT(r.deadline)}</div>` : `<div class="dl open">${I.clock}<span>Choix ouvert jusqu'au ${fmtDT(r.deadline)} · <b class="cdl" data-t="${t(r.deadline)}">${cdText(t(r.deadline))}</b></span></div>`;
}
function shortDur(ms){ const d=ms-now(); if(d<=0) return 'quelques instants'; const m=Math.floor(d/60000), h=Math.floor(m/60), j=Math.floor(h/24); return j>=1?`${j}j ${h%24}h`:h>=1?`${h}h${String(m%60).padStart(2,"0")}`:`${Math.max(1,m)} min`; }
function cdText(ms){
  const d=ms-now(); if(d<=0) return 'terminé';
  const m=Math.floor(d/60000), h=Math.floor(m/60), j=Math.floor(h/24);
  if(j>=1) return `encore ${j} j ${h%24} h`;
  if(h>=1) return `encore ${h} h ${String(m%60).padStart(2,'0')} min`;
  return `encore ${Math.max(1,m)} min`;
}
// Défilement automatique du tutoriel : toutes les 7 secondes (pause de 7 s après un geste du joueur)
let slideClock=Date.now();
setInterval(()=>{
  const el=document.getElementById('slides'); if(!el || document.hidden) return;
  if(Date.now()-slideClock<7000) return;
  const n=el.querySelectorAll('.slide').length||1, i=((S.slide||0)+1)%n;
  slideClock=Date.now(); el.scrollTo({left:el.clientWidth*i,behavior:'smooth'});
},500);
function syncSlider(){
  const el=document.getElementById('slides'); if(!el) return;
  const upd=()=>{ const i=Math.round(el.scrollLeft/Math.max(1,el.clientWidth)); S.slide=i; document.querySelectorAll('.sdots button').forEach((b,j)=>b.classList.toggle('on',j===i)); };
  if(!el.dataset.bound){ el.dataset.bound='1'; el.addEventListener('scroll',()=>requestAnimationFrame(upd),{passive:true});
    ['pointerdown','touchstart','wheel'].forEach(ev=>el.addEventListener(ev,()=>{ slideClock=Date.now(); },{passive:true})); }
  if(S.slide===undefined) S.slide=0;
  el.scrollLeft=el.clientWidth*S.slide; upd();
}
function tickCountdowns(){
  document.querySelectorAll('.cdl[data-t]').forEach(el=>{ const ms=+el.dataset.t; el.textContent=cdText(ms); const hot=ms-now()<36e5; el.classList.toggle('hot',hot); const line=el.closest('.dl'); if(line) line.classList.toggle('urgent',hot); });
}
setInterval(tickCountdowns, 15000);
function tileHtml(c, r, m, side, opts){
  const lg=c.lg, my=pickOf(S.me,lg.id,r.k), sel=pickSides(my).some(x=>x.m===m.k&&x.p===side);
  const res=matchResult(lg,m); const can=opts.can;
  const sd = side==='H'?m.h : side==='A'?m.a : null;
  const ban = side!=='D' && opts.ban && opts.ban.has(teamKey(sd));
  const used = side!=='D' && ((opts.used && opts.used.has(teamKey(sd))) || ban);
  const lant = side!=='D' && lg.redLantern && isLantern(lg,r,{m:m.k,p:side});
  let cls='tile v2'; if(sel) cls+=' sel'; if(!can && !sel) cls+=' off'; if(used && !sel) cls+=' used'; if(ban && !sel) cls+=' ban';
  if(res){ if(pickOk(lg,res.r,side)) cls+=' win'; else if(sel) cls+=' lose'; }
  const bd = side==='D' ? '<b class="eq">=</b>' : (logoOf(sd)?`<img src="${esc(logoOf(sd))}" data-fb="${esc(initials(sd.n).slice(0,1))}" alt="">`:esc(initials(sd.n).slice(0,1)));
  const name = side==='D' ? 'Nul' : isMerguez(lg) ? 'Défaite' : 'Victoire';
  let pct=''; if(opts.dist){ const tot=opts.dist.tot; const k=m.k+'|'+side; const v=tot?Math.round((opts.dist.c[k]||0)*100/tot):0; pct=`<span class="vlab">${v} %</span>`; }
  const act = can && !used ? `data-a="pick" data-v="${lg.id}|${r.k}|${m.k}|${side}"` : 'disabled';
  return `<button class="${cls}" ${act} aria-label="${side==='D'?'Match nul':'Victoire '+esc(sd.n)}">${sel?`<span class="ck">${I.check}</span>`:''}${ban?'<span class="bomb" title="Sabotée">'+IC.bomb+'</span>':''}<span class="nm">${name}</span>${lant?`<span class="lnt">${isMerguez(lg)?'👑':CI.lantern} ${c.points?'+2 pts':'+1 vie'}</span>`:''}${pct}</button>`;
}
function roundDist(c, r){
  const voters=(c.info[r.k]&&c.info[r.k].aliveBefore)||c.mem; const cnt={}; let tot=0;
  voters.forEach(u=>{ const p=pickOf(u,c.lg.id,r.k); if(p){ cnt[(p.m||'')+'|'+p.p]=(cnt[(p.m||'')+'|'+p.p]||0)+1; tot++; } });
  return {c:cnt,tot};
}
function rankTag(lg, m, side){
  const r=sideRank(lg, m, side); return r?`<span class="rk">${r}<sup>${r===1?'er':'e'}</sup></span>`:'';
}
function liveChoice(c, u){
  if(!picksVisible(c.lg)) return '';
  const r=c.rounds.find(r=>t(r.deadline)>now()); if(!r) return '';
  const p=pickOf(u,c.lg.id,r.k); return ` · ${IC.eye} ${p?esc(pickLabel(c.lg,r,p)):'pas encore choisi'}`;
}
// ---------- Jokers : encart repliable « JOKERS (X) » au-dessus de « Mon choix »
const canXj = lg => !S.guest && refStock()>0 && !xjOf(S.me,lg.id);
function jokerItems(c, r){
  const lg=c.lg, out=[], closed=t(r.deadline)<=now(), can=!closed&&canPick(c,r), my=pickOf(S.me,lg.id,r.k);
  const jn=k=>{ const n=(c.info[k]||{}).n; return n?'journée '+n:''; };
  if(jokerOn(lg)){
    const used=jokerRound(lg.id,S.me), here=used===r.k, act=S.view.jk===lg.id+'|'+r.k;
    const it={k:'joker', ico:TI('joker'), t:'Double chance', d:'Choisis 2 équipes sur une journée : tu survis si au moins une des 2 équipes gagne.', avail:!used};
    if(here&&my&&my.j){ it.state='on'; it.note='Utilisé sur cette journée : tes 2 équipes sont choisies.'; if(can) it.btn=`<button class="jx" data-a="jokerCancel" data-v="${lg.id}|${r.k}" title="Annuler le joker" aria-label="Annuler le joker">${I.x||'✕'}</button>`; it.avail=true; }
    else if(used){ it.state='used'; it.note='Utilisé'+(jn(used)?' ('+jn(used)+')':'')+'.'; if(canXj(lg)) it.react=`<button class="jre" data-a="xjUse" data-v="${lg.id}|joker">${CARD_ICO}Réactiver ce joker</button>`; }
    else if(act){ it.state='on'; it.note=my?'Activé : choisis ta 2e équipe dans un autre match.':'Activé : choisis 2 équipes dans 2 matchs différents.'; it.btn=`<button class="jx" data-a="jokerCancel" data-v="${lg.id}|${r.k}" title="Annuler" aria-label="Annuler">${I.x||'✕'}</button>`; }
    else if(can) it.btn=`<button class="jbtn" data-a="jokerUse" data-v="${lg.id}|${r.k}">Utiliser</button>`;
    out.push(it);
  }
  if(saboOn(lg)){
    const sb=mySabo(lg.id), it={k:'sabo', ico:TI('bomb'), t:'Sabotage', d:"Interdis une équipe à un adversaire pour la journée. Il découvre qui l'a saboté au moment de parier.", avail:!sb};
    const foes=(c.status==='upcoming'?c.mem:c.alive).filter(u=>u!==S.me);
    if(sb){ it.state='used'; it.note=`Utilisé${jn(sb.rk)?' ('+jn(sb.rk)+')':''} : ${esc(sb.tn)} interdit à ${esc(nameOf(sb.to))}.`; if(canXj(lg)) it.react=`<button class="jre" data-a="xjUse" data-v="${lg.id}|sabo">${CARD_ICO}Réactiver ce joker</button>`; }
    else if(can && foes.length){
      const st=S.view.sab&&S.view.sab.lid===lg.id&&S.view.sab.rk===r.k?S.view.sab:null;
      if(!st) it.btn=`<button class="jbtn red" data-a="saboStart" data-v="${lg.id}|${r.k}">Utiliser</button>`;
      else {
        let x=`<div class="sab-step"><b>Qui veux-tu saboter ?</b><div class="schips">${foes.map(u=>{ const hit=sabosOn(lg.id,u,r.k).length>0; return `<button class="chip sm ${st.to===u?'on':''} ${hit?'off':''}" ${hit?'disabled title="Déjà saboté pour cette journée"':`data-a="saboTo" data-v="${u}"`}>${hit?'💣 ':''}${esc(nameOf(u))}</button>`; }).join('')}</div>${foes.some(u=>sabosOn(lg.id,u,r.k).length)?'<div class="help" style="margin:6px 0 0">💣 = déjà saboté par un autre joueur pour cette journée.</div>':''}`;
        if(st.to){ const used=usedTeams(c,st.to,r.k);
          x+=`<b style="margin-top:12px">Quelle équipe lui interdire ?</b><div class="schips">${matchesOf(r).flatMap(m=>[m.h,m.a]).map(sd=>{ const k=teamKey(sd), u=used.has(k), lo=logoOf(sd);
            return `<button class="chip sm tchip ${st.team===k?'on':''} ${u?'off':''}" ${u?'disabled title="Déjà jouée par ce joueur"':`data-a="saboTeam" data-v="${esc(k)}|${esc(sd.n)}"`}>${lo?`<img src="${esc(lo)}" alt="">`:''}${esc(sd.n)}</button>`; }).join('')}</div><div class="help" style="margin:6px 0 0">Les équipes grisées ont déjà été jouées par ${esc(nameOf(st.to))}.</div>`; }
        x+=`<div class="srow"><button class="jbtn ghost2" data-a="saboCancel">Annuler</button>${st.to&&st.team?`<button class="jbtn red" data-a="saboGo">Confirmer le sabotage</button>`:''}</div></div>`;
        it.state='on'; it.panel=x;
      }
    }
    out.push(it);
  }
  return out;
}
function jokersCard(c, r){
  const lg=c.lg; if(!isMember(lg.id) || (!jokerOn(lg)&&!saboOn(lg))) return '';
  const items=jokerItems(c,r); if(!items.length) return '';
  const n=items.filter(x=>x.avail && x.state!=='used').length, k='jkc'+lg.id;
  const op=S.open[k] || (S.view.jk&&S.view.jk.startsWith(lg.id+'|')) || (S.view.sab&&S.view.sab.lid===lg.id);
  const body=items.map(x=>`<div class="jitem ${x.state||''}"><div class="jt">${x.ico}<b>${x.t}</b>${x.state==='used'?'<span class="jtag">Utilisé</span>':x.state==='on'&&!x.btn?'<span class="jtag on">En cours</span>':''}${x.btn||''}</div><small>${x.d}</small>${x.note?`<div class="jnote">${x.note}</div>`:''}${x.react||''}${x.panel||''}</div>`).join('');
  const st0=refStock(), anyUsed=items.some(x=>x.state==='used');
  const regain=(anyUsed&&st0===0&&!S.guest)?`<div class="jinv">${CARD_ICO}<b>1 pote invité = 1 joker</b><button class="ivc-go sm" data-a="invite" data-v="${lg.id}">Inviter</button></div>`:(n===0&&st0>0)?`<div class="help" style="margin:10px 0 0">${CARD_ICO.replace('jcard','jcard sm')} Tu as ${st0} joker${st0>1?'s':''} en stock : 1 réactivation possible par ligue.</div>`:'';
  // comment gagner des vies / points bonus
  const how=[];
  if(!c.points && +lg.lives>0) how.push([TI('heart'),'Une vie en réserve','Chaque joueur démarre avec une vie : à sa première erreur, il la perd mais reste en jeu.']);
  if(lg.redLantern&&isMerguez(lg)) how.push([TI('trophy'),'Leader','Une défaite du leader du championnat sur ton pari : +1 vie.']);
  else if(lg.redLantern) how.push([TI('lantern'),'Lanterne rouge',c.points?'Une victoire avec la dernière équipe du classement : +2 points bonus.':'Une victoire avec la dernière équipe du classement : +1 vie.']);
  const myL=!c.points&&c.lives?c.lives[S.me]||0:0, st=0;
  const howH=!how.length?'':c.points
    ? `<div class="jhow"><div class="jhow-t">Comment gagner des points bonus</div>${how.map(([i,tt,d])=>`<div class="jhow-r"><span>${i}</span><div><b>${tt}</b><small>${d}</small></div></div>`).join('')}</div>`
    : `<div class="jhow"><div class="jhow-t">Tes vies : ${myL}</div><div class="jhow-why">Pari perdu ? Une vie t’évite l’élimination : tu la perds mais tu restes en jeu.</div>${+lg.lives>0?`<div class="jhow-r"><span>${TI('heart')}</span><div><b>1 vie au départ</b><small>Chaque joueur commence la ligue avec une vie.</small></div></div>`:''}${lg.redLantern?`<div class="jhow-r"><span>${TI('lantern')}</span><div class="jhow-l">Pour gagner 1 vie, gagne avec la dernière équipe du classement.</div></div>`:''}</div>`;
  return `<details class="card coll jkc" ${op?'open':''}><summary data-a="toggle" data-v="${k}"><span class="ctitle">${JOKER_ICO}Jokers (${n})${!c.points&&how.length?` / Vies (${myL})`:''}</span>${I.chev}</summary><div class="jlist">${body}</div>${regain}${howH}</details>`;
}
// sabotage reçu : reste toujours visible dans « Mon choix »
function saboAlert(c, r){
  const lg=c.lg; if(!saboOn(lg) || !isMember(lg.id)) return '';
  const closed=t(r.deadline)<=now();
  return sabosOn(lg.id,S.me,r.k).map(x=>{ const my=pickOf(S.me,lg.id,r.k), hit=my&&effPick(S.me,lg.id,r)!==my;
    return `<div class="sbox hit"><div><b>${IC.bomb} Sabotage !</b><small><b>${esc(nameOf(x.from))}</b> t'interdit <b>${esc(x.tn||'une équipe')}</b> pour cette journée.${hit&&!closed?' Ton choix ne compte plus : change-le !':''}</small></div></div>`; }).join('');
}
function roundCard(c, r, o={}){
  const lg=c.lg, ri=c.info[r.k]||{}, closed=t(r.deadline)<=now(), can=canPick(c,r);
  const my=pickOf(S.me,lg.id,r.k);
  let h=`<div class="card round">`;
  if(o.header) h+=o.header;
  else h+=`<h3>Journée ${ri.n||(c.rounds.findIndex(x=>x.k===r.k)+1)}</h3>`;
  if(!o.noDl) h+=dlLine(r);
  if(!c.pick) return h+duelHtml(c,r,{can,closed})+roundFoot(c,r)+'</div>';
  if(!closed && o.hint!==false) h+=`<div class="hint">${isMerguez(lg)?'Choisis UNE équipe qui va <b>perdre</b>.':'Choisis UN seul match et parie dessus.'}${allowDraw(lg)?'':' Pas de match nul.'} Les équipes déjà jouées sont grisées.</div>`;
  h+=saboAlert(c,r);
  const used=usedTeams(c,S.me,r.k), ban=saboOn(lg)?new Set(sabosOn(lg.id,S.me,r.k).map(x=>x.team)):null; const dist=(closed||picksVisible(lg))?roundDist(c,r):null;
  if(dist&&dist.tot) h+=`<div class="pct-note">% = part des joueurs ayant fait ce choix.</div>`;
  if(dist&&dist.tot&&closed&&!['done','cancelled'].includes(ri.state)&&!o.compact){
    const rows=Object.entries(dist.c).map(([k,v])=>{ const [mk,pp]=k.split('|'), m=(r.matches||{})[mk]; if(!m) return null;
      const lb=pp==='D'?`Nul ${shortName(lg,m,m.h)} – ${shortName(lg,m,m.a)}`:shortName(lg,m,pp==='H'?m.h:m.a); return [lb,v]; }).filter(Boolean).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
    if(rows.length){ const mx=rows[0][1];
      h+=`<div class="wc"><div class="wc-t">Où sont partis les choix</div>${rows.map(([lb,v])=>`<div class="wc-r"><span>${esc(lb)}</span><div class="wc-b"><i class="${v>=mx*.7?'hi':''}" style="width:${Math.max(8,v*100/mx)}%"></i></div><b>${v}</b></div>`).join('')}</div>`; }
  }
  matchesOf(r).forEach(m=>{
    const res=matchResult(lg,m); const sc=matchScore(lg,m);
    const chosen=o.compact && pickSides(my).some(x=>x.m===m.k);
    h+=`<div class="match ${chosen?'chosen':''}">`;
    if(!o.compact || o.mline) h+=`<div class="mline v2 ${sc?'sc':''}"><span class="tm">${logoTag(m.h)}${teamLabel(lg,m,m.h)}</span>${sc?`<span class="vs"><span class="res">${esc(sc)}</span></span>`:''}<span class="tm r">${teamLabel(lg,m,m.a,true)}${logoTag(m.a)}</span></div>`;
    h+=`<div class="tiles ${allowDraw(lg)?'':'two'}">${tileHtml(c,r,m,'H',{can,used,dist,ban})}${allowDraw(lg)?tileHtml(c,r,m,'D',{can,used,dist,ban}):''}${tileHtml(c,r,m,'A',{can,used,dist,ban})}</div></div>`;
  });
  return h+roundFoot(c,r)+'</div>';
}
function roundFoot(c,r){
  const lg=c.lg, ri=c.info[r.k]||{}, my=pickOf(S.me,lg.id,r.k), alive=ri.aliveBefore&&ri.aliveBefore.includes(S.me), closed=t(r.deadline)<=now();
  let f='';
  if(c.points){
    if(!closed && isMember(lg.id) && !my) f=`<div class="note bad">Pas de choix = 0 point. Décide-toi avant ${fmtDT(r.deadline).split(' à ')[1]} le ${fmtD(r.deadline)} !</div>`;
    else if(!closed && my) f=`<div class="note">Ton choix est enregistré. Tu peux le modifier jusqu'à l'heure limite.</div>`;
    if(ri.state==='waiting' && closed) f+=`<div class="note">⏳ En attente des résultats${my?' — ton choix : <b>'+esc(pickLabel(lg,r,my))+'</b>':''}.</div>`;
    if(ri.bold){ const p=pickOf(ri.bold.u,lg.id,r.k); f+=`<div class="note bold">${IC.bolt} Choix le plus audacieux : <b>${esc(nameOf(ri.bold.u))}</b> avec ${esc(pickLabel(lg,r,p))} (${ri.bold.rk}e)</div>`; }
    if(closed && isMember(lg.id) && ri.pts && ri.pts[S.me]!==undefined){ const sc=ri.pts[S.me]; f+=sc===5?`<div class="note ok">${CI.lantern} Victoire sur la lanterne rouge : +5 points !</div>`:sc===3?`<div class="note ok">✓ Victoire : +3 points !</div>`:sc===1?`<div class="note">➖ Match nul : +1 point.</div>`:`<div class="note bad">✗ ${my?'Défaite':'Pas de choix'} : 0 point.</div>`; }
    return f;
  }
  if(!closed && isMember(lg.id) && c.alive.includes(S.me) && !my) f=`<div class="note bad">Pas de choix = éliminé. Décide-toi avant ${fmtDT(r.deadline).split(' à ')[1]} le ${fmtD(r.deadline)} !</div>`;
  else if(!closed && my) f=`<div class="note">Ton choix est enregistré. Tu peux le modifier jusqu'à l'heure limite.</div>`;
  if(ri.state==='waiting' && closed) f+=`<div class="note">⏳ En attente des résultats${my?' — ton choix : <b>'+esc(pickLabel(lg,r,my))+'</b>':''}.</div>`;
  if(ri.state==='cancelled') f+=`<div class="note">🛟 ${ri.rescued?'Tous les survivants ont perdu : tout le monde est repêché, la journée est annulée.':'Journée annulée : personne n\'est éliminé.'}</div>`;
  if(ri.state==='tiebreak'){ const ws=Object.keys(ri.tb||{}).filter(u=>!ri.out.includes(u)); f+=`<div class="note">⚖️ Tous les survivants sont tombés : départagés à l'audace (rang moyen des équipes jouées). ${ws.map(u=>`<b>${esc(nameOf(u))}</b> ${ri.tb[u]?'('+ri.tb[u].toFixed(1).replace('.',',')+'e de moyenne)':''}`).join(' et ')} ${ws.length>1?'gagnent':'gagne'}.</div>`; }
  if(ri.bold){ const p=pickOf(ri.bold.u,lg.id,r.k); f+=`<div class="note bold">${IC.bolt} Choix le plus audacieux : <b>${esc(nameOf(ri.bold.u))}</b> avec ${esc(pickLabel(lg,r,p))} (${ri.bold.rk}e)</div>`; }
  if((ri.state==='done'||ri.state==='tiebreak') && alive){ f+= ri.out.includes(S.me)?`<div class="note bad">✗ ${ri.rescued?'Pas de choix : tu es éliminé.':'Raté… tu es éliminé sur cette journée.'}</div>`:ri.rescued?`<div class="note">🛟 Tous les survivants ont perdu : tu es repêché !</div>`:(ri.saved&&ri.saved.includes(S.me))?`<div class="note">❤️ Raté… mais ta vie te sauve, tu restes en jeu !</div>`:`<div class="note ok">✓ Bien joué, tu restes en vie !</div>`; }
  if(ri.state==='done' && ri.out.length) f+=`<div class="note">☠️ ${ri.out.length} éliminé${ri.out.length>1?'s':''}</div>`;
  return f;
}
function pickLabel(lg,r,p){
  if(!p) return '—';
  if(!isPickMode(lg)) return p.p==='A'?r.a.n:r.b.n;
  const one=x=>{ const m=(r.matches||{})[x.m]; if(!m) return '—'; return isMerguez(lg)&&x.p!=='D'?'Défaite '+(x.p==='H'?m.h.n:m.a.n) : x.p==='H'?m.h.n : x.p==='A'?m.a.n : `Nul (${m.h.n} – ${m.a.n})`; };
  return pickSides(p).map(one).join(' + ')+(p.j&&p.m2?' (joker)':'');
}
const rankCache=new WeakMap();
const PH_COLORS=[['#E5493A','#7F1D1D'],['#2563EB','#1E1B4B'],['#16A34A','#064E3B'],['#D97706','#7C2D12'],['#7C3AED','#2E1065'],['#0891B2','#083344'],['#DB2777','#500724'],['#111827','#4B5563']];
function phColor(name, alt){ let h=0; const s=String(name||'?').toLowerCase(); for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; let i=h%PH_COLORS.length; if(alt!==undefined && i===alt) i=(i+1)%PH_COLORS.length; return i; }
function phHtml(name, idx){ const c=PH_COLORS[idx]; return `<span class="ph2" style="background:linear-gradient(150deg,${c[0]},${c[1]})"><b>${esc(initials(name||'?'))}</b></span>`; }
function sideColors(a,b){ const ia=phColor(a); return [ia, phColor(b, ia)]; }

// Photo automatique (Wikipédia, images libres) pour les questions « Tu préfères »
const imgCache={};
async function findImg(term){
  term=String(term||'').trim(); if(!term) return '';
  if(term in imgCache) return imgCache[term];
  let url='';
  for(const lang of ['fr','en']){
    try{
      const u=`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=640`;
      const j=await (await fetch(u)).json();
      const pages=Object.values((j.query||{}).pages||{}).sort((x,y)=>(x.index||0)-(y.index||0));
      const hit=pages.find(pg=>pg.thumbnail&&pg.thumbnail.source);
      if(hit){ url=hit.thumbnail.source; break; }
    }catch(e){}
  }
  imgCache[term]=url; return url;
}
async function autoSide(side, quiet){
  const name=(S.qNames[side]||'').trim(); if(!name) return false;
  const url=await findImg(name);
  if((S.qNames[side]||'').trim()!==name) return false;
  if(url){ S.tmpImg=S.tmpImg||{}; S.tmpImg[side]=url; render(); return true; }
  if(!quiet) toast(`Pas de photo trouvée pour « ${name} ».`,true);
  return false;
}
function duelEdit(a, b, actA, actB, q){
  const [ca,cb]=sideColors(a.n,b.n);
  const half=(s,act,ci,key)=>`<button class="dedit" ${act}>${s.img?`<img src="${blobUrl(s.img)}" data-fb="" alt="">`:phHtml(s.n,ci)}<span class="cta">${I.cam}${s.img?'CHANGER':'PHOTO'}</span><span class="nm" data-prev="${key}">${esc(s.n||'Option '+key.toUpperCase())}</span></button>`;
  return `<div class="duel edit"><span class="q">${esc(q||'TU PRÉFÈRES ?').toUpperCase()}</span>${half(a,actA,ca,'a')}${half(b,actB,cb,'b')}</div>`;
}
function duelHtml(c,r,o){
  const lg=c.lg, my=pickOf(S.me,lg.id,r.k), ri=c.info[r.k]||{};
  const votes=o.closed?ri.votes||roundVotes(c,r):null; const tot=votes?votes.A+votes.B:0;
  const cols=sideColors((r.a||{}).n,(r.b||{}).n);
  const side=(k)=>{ const s=r[k==='A'?'a':'b']||{n:'?'}; const sel=my&&my.p===k; let cls=sel?'sel':''; if(ri.win&&ri.win!==k) cls+=' lose';
    const img=s.img?`<img src="${blobUrl(s.img)}" data-fb="" alt="">`:phHtml(s.n,cols[k==='A'?0:1]);
    return `<button class="${cls}" ${o.can?`data-a="pick" data-v="${lg.id}|${r.k}||${k}"`:'disabled'}>${img}<span><span class="nm">${esc(s.n)}</span>${votes?`<span class="pc">${tot?Math.round(votes[k]*100/tot):0}%</span>`:''}</span></button>`; };
  return `<div class="duel"><span class="q">${esc(r.q||'TU PRÉFÈRES ?').toUpperCase()}</span>${side('A')}${side('B')}</div>`;
}
function roundVotes(c,r){ let A=0,B=0; ((c.info[r.k]||{}).aliveBefore||c.mem).forEach(u=>{ const p=pickOf(u,c.lg.id,r.k); if(p&&p.p==='A') A++; if(p&&p.p==='B') B++; }); return {A,B}; }


/* Règles en images (nouveau design) */
function rulesPics(lg){
  if(!isPickMode(lg)) return '';
  const pick=`<div class="rp-il"><div class="rp-m"><b class="on"><img src="data/logos/soccer_160.png" alt=""><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></i></b><em>N</em><b><img src="data/logos/soccer_273.png" alt=""></b></div></div>`;
  const once=`<div class="rp-il"><div class="rp-once"><b class="used"><img src="data/logos/soccer_160.png" alt=""></b><b><img src="data/logos/soccer_176.png" alt=""></b><b><img src="data/logos/soccer_175.png" alt=""></b></div></div>`;
  if(isPoints(lg)){
    const pts=`<div class="rp-il"><div class="rp-pts"><span class="w">3</span><span class="d">1</span><span class="l">0</span></div></div>`;
    const both=`<div class="rp-il dark"><div class="rp-faces"><i>·</i><i class="win"><s><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 7l5 4 4-7 4 7 5-4-2 12H5z"/></svg></s>20</i><i>·</i></div></div>`;
    return `<div class="rpics">`+
      `<div class="rp">${pick}<p>Chaque journée, choisis <b>une équipe</b></p></div>`+
      `<div class="rp">${pts}<p>Victoire <b>3 pts</b>, nul <b>1 pt</b>, défaite <b>0</b></p></div>`+
      `<div class="rp yel">${once}<p>Une équipe ne peut être choisie <b>2 fois</b></p></div>`+
      `<div class="rp">${both}<p>Le <b>1er à l’objectif</b> gagne</p></div></div>`;
  }
  const win=`<div class="rp-il"><div class="rp-res"><span class="ok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8.5-5.2-9.8-10.6C1.4 6.9 3.6 4 6.9 4c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.5 2.9 4.7 6.4C20.5 15.8 12 21 12 21z"/></svg>En vie</span><span class="ko"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>Éliminé</span></div></div>`;
  const last=`<div class="rp-il photo"><img src="img/slide-supporter.jpg" alt=""></div>`;
  return `<div class="rpics">`+
    `<div class="rp">${pick}<p>Chaque journée, choisis <b>une équipe</b></p></div>`+
    `<div class="rp">${win}<p>${isMerguez(lg)?'Elle perd':'Elle gagne'} : <b>tu survis</b>. Sinon, éliminé</p></div>`+
    `<div class="rp yel">${once}<p>Une équipe ne peut être choisie <b>2 fois</b></p></div>`+
    `<div class="rp">${last}<p>Le <b>dernier en vie</b> gagne</p></div></div>`;
}
function livesRulesHtml(lg){
  if(!isPickMode(lg)) return '';
  let h='';
  if(lg.sabotage) h+=`<p class="lrule">${CI.bomb} <b>Sabotage :</b> une fois par ligue, un joueur peut interdire une équipe à un adversaire pour une journée. La victime découvre qui l'a saboté au moment de parier.</p>`;
  if(lg.redLantern&&isMerguez(lg)) h+=`<p class="lrule">${CI.trophy||''} <b>Leader :</b> si un joueur parie sur la défaite du leader du championnat et que le leader perd, il gagne <b>1 vie bonus</b>.</p>`;
  else if(lg.redLantern) h+=`<p class="lrule">${CI.lantern} <b>Lanterne rouge :</b> si un joueur gagne avec la dernière équipe du classement, il ${isPoints(lg)?'marque <b>2 points bonus</b>':'gagne <b>1 vie supplémentaire</b>'}.</p>`;
  h+=`<p class="lrule">${picksVisible(lg)?IC.eye+' <b>Paris visibles :</b> tu peux voir les choix des autres avant l\'heure limite.':IC.eyeOff+' <b>Paris cachés :</b> les choix des autres sont dévoilés à l\'heure limite.'}</p>`;
  if(isPoints(lg)) return h;
  if(+lg.lives>0) h+=`<p class="lrule">${CI.heart} <b>Option de la ligue :</b> chaque joueur a droit à <b>une erreur</b> : si son pari est raté, il perd sa vie mais reste en jeu.</p>`;
  if(lg.joker) h+=`<p class="lrule">${JOKER_ICO}<b>Joker « double chance » :</b> une fois par ligue, un joueur peut choisir <b>2 équipes</b> sur une journée : il survit si <b>au moins une des 2 équipes</b> gagne.</p>`;
  return h;
}
// Options communes Survivor + Race : sabotage, lanterne rouge, visibilité des choix
// Réglages d'une ligue : OPTIONS (règles) / JOKERS (à utiliser par les joueurs) / PARIS DES AUTRES
function optionsBlock(lg, pts, act, lid, locked){
  lg=lg||{}; const v=lid?lid+'|':'';
  const opt=(k,on,title,desc,extra)=>`<button class="lopt-b ${on?'on':''}" ${locked?'disabled':`data-a="${act}" data-v="${v}${k}"`}><i></i><span><b>${title}</b><small>${desc}</small>${extra?`<em class="lopt-x">${extra}</em>`:''}</span></button>`;
  let o='', j='';
  if(pts){
    o+=opt('lastwins', lg.lastRule==='wins', `${TI('trophy')}Le dernier gagne aussi`, 'Le dernier du classement à la fin remporte lui aussi la ligue.', 'Deux courses en une : les joueurs décrochés ne lâchent rien et misent sur les équipes qui vont perdre. Tout le monde reste à fond jusqu’au bout.');
  } else {
    o+=opt('merguez', !!lg.merguez, `<span class="lopt-wm">${WM('merguez')}</span>`, 'Tout à l’envers : pour survivre, les joueurs doivent parier sur un club qui va PERDRE. Le nom de la ligue change en conséquence.');
    o+=opt('lives', +lg.lives>0, `${TI('heart')}Une vie en réserve`, 'Chaque joueur a droit à une erreur : si son pari est raté, il perd sa vie mais reste en jeu.');
  }
  if(!pts&&lg.merguez) o+=opt('lantern', !!lg.redLantern, `${TI('trophy')}Leader`, 'Si un joueur parie sur la défaite du leader du championnat et que le leader perd, il gagne 1 vie bonus.');
  else o+=opt('lantern', !!lg.redLantern, `${TI('lantern')}Lanterne rouge`, pts?'Si un joueur gagne avec la dernière équipe du classement, il marque 2 points bonus.':'Si un joueur gagne avec la dernière équipe du classement, il gagne 1 vie supplémentaire.');
  if(!pts) j+=opt('joker', !!lg.joker, `${TI('joker')}Double chance`, 'Une fois par ligue, un joueur peut choisir 2 équipes sur une journée : il survit si au moins une des 2 équipes gagne.');
  j+=opt('sabotage', !!lg.sabotage, `${TI('bomb')}Sabotage`, 'Une fois par ligue, un joueur peut interdire une équipe à un adversaire pour une journée. La victime découvre qui l’a saboté au moment de parier.');
  const VIS=lg.picksVis==='visible';
  return `<label class="f fbig">Options</label><div class="lopt">${o}</div>
  <label class="f fbig">Jokers</label><div class="lopt">${j}</div>
  <label class="f fbig">Paris des autres</label><div class="chips in" style="flex-wrap:wrap">
    <button class="chip ${VIS?'':'on'}" ${locked?'disabled':`data-a="${act}" data-v="${v}vis:hidden"`}>${IC.eyeOff} Cachés jusqu'à l'heure limite</button>
    <button class="chip ${VIS?'on':''}" ${locked?'disabled':`data-a="${act}" data-v="${v}vis:visible"`}>${IC.eye} Visibles tout de suite</button>
  </div>${locked?'<div class="help" style="margin:6px 0 10px">Réglages figés une fois la ligue commencée.</div>':''}`;
}
function rulesCard(lg){
  // Nouvelle présentation : 4 règles numérotées + options actives + règles perso
  const pts=isPoints(lg), draw=allowDraw(lg), pz=prizeOf(lg);
  const steps=!isPickMode(lg) ? null : pts ? [
    ['Choisis une équipe','À chaque journée, choisis UN match parmi ceux proposés et parie sur l’une des deux équipes.'],
    ['Marque des points','Ton équipe gagne : 3 pts. Match nul : 1 pt. Défaite : 0. Les points se cumulent de journée en journée.'],
    ['Une seule fois par équipe','Chaque équipe ne peut être choisie qu’une fois dans toute la ligue. Les équipes déjà jouées sont grisées.'],
    [`Premier à ${nRoundsOf(lg)} points`, 'Il gagne la ligue. En cas d’égalité : meilleur goal-average.'+(pz?` À gagner : ${esc(pz)}.`:'')],
  ] : [
    ['Choisis une équipe',draw?'À chaque journée, choisis UN match parmi ceux proposés et parie sur une équipe ou sur le match nul.':'À chaque journée, choisis UN match parmi ceux proposés et parie sur l’une des deux équipes.'],
    ['Elle gagne, tu survis',draw?'Si ton pari est bon, tu passes à la journée suivante. Sinon, tu es éliminé.':'Si ton équipe gagne, tu passes à la journée suivante. Match nul ou défaite : tu es éliminé.'],
    ['Une seule fois par équipe','Chaque équipe ne peut être choisie qu’une fois dans toute la ligue. Les équipes déjà jouées sont grisées.'],
    ['Le dernier en vie gagne', pz?`Il remporte ${esc(pz)}.`:'Il remporte la ligue.'],
  ];
  const stepsH=steps?`<ol class="rsteps">${steps.map(([tt,d],i)=>`<li><span class="rn">${i+1}</span><div><b>${tt}</b><small>${d}</small></div></li>`).join('')}</ol>`:'';
  const warn=isPickMode(lg)?`<div class="rwarn">${IC.alert} Pas de choix avant l’heure limite = ${pts?'0 point':'éliminé'}.</div>
  <div class="rinfo"><div>${IC.clock} L’heure limite, c’est le coup d’envoi du 1er match de la journée. Tu peux modifier ton choix jusque-là.</div>${pts?'':`<div>${IC.life} Si tous les survivants perdent la même journée, personne n’est éliminé : la journée est annulée pour eux et ils continuent à la suivante.</div>`}</div>`:'';
  const row=(i,tt,d)=>`<div class="rrow"><span class="ri">${i}</span><div><b>${tt}</b><small>${d}</small></div></div>`;
  // gagner des vies / points bonus
  const lv=[];
  if(!pts && +lg.lives>0) lv.push(row(TI('heart'),'Une vie en réserve','Chaque joueur démarre avec une vie : à sa première erreur, il la perd mais reste en jeu.'));
  if(lg.redLantern&&isMerguez(lg)) lv.push(row(TI('trophy'),'Leader','Si un joueur parie sur la défaite du leader du championnat et que le leader perd, il gagne 1 vie bonus.'));
  else if(lg.redLantern) lv.push(row(TI('lantern'),'Lanterne rouge',pts?'Si un joueur gagne avec la dernière équipe du classement, il marque 2 points bonus.':'Si un joueur gagne avec la dernière équipe du classement, il gagne 1 vie supplémentaire.'));
  const lvH=lv.length?`<div class="rsec">${pts?'Points bonus':'Les vies'}</div>${lv.join('')}${!pts?'<div class="rnote">Une vie sauve d’une élimination : le joueur la perd et reste en jeu.</div>':''}`:'';
  // jokers
  const jk=[];
  if(jokerOn(lg)) jk.push(row(TI('joker'),'Double chance','Un joueur choisit 2 équipes sur une journée : il survit si au moins une des 2 équipes gagne. Les 2 équipes comptent ensuite comme jouées.'));
  if(saboOn(lg)) jk.push(row(TI('bomb'),'Sabotage','Un joueur interdit une équipe à un adversaire pour une journée. La victime découvre qui l’a saboté au moment de parier. Un joueur ne peut être saboté qu’une fois par journée.'));
  const jkH=jk.length?`<div class="rsec">Les jokers</div>${jk.join('')}<div class="rnote">Chaque joker s’utilise une seule fois par ligue, depuis l’encart « Jokers » au-dessus de « Mon choix ». Il ne se récupère pas.</div>`:'';
  // options
  const o=[];
  if(pts && lg.lastRule==='wins') o.push([TI('trophy'),'Le dernier gagne aussi','Le dernier du classement remporte lui aussi la ligue.']);
  if(pts && lg.lastRule==='drink') o.push([TI('beer'),'Le dernier paie un verre','Le dernier doit un verre au premier.']);
  if(isPickMode(lg)) o.push([TI(picksVisible(lg)?'eye':'eyeOff'), picksVisible(lg)?'Paris visibles':'Paris cachés', picksVisible(lg)?'On voit les choix des autres avant l’heure limite.':'Les choix sont dévoilés à l’heure limite.']);
  if(pz) o.push([TI('gift'),'À gagner',esc(pz)]);
  const optH=(o.length?`<div class="rsec">Options de la ligue</div>${o.map(([i,tt,d])=>row(i,tt,d)).join('')}`:'')+lvH+jkH;
  const custom=(lg.rules||'').trim();
  const cH=(!steps?defaultRules(lg).split(/\n+/).map(p=>`<p class="rtxt">${esc(p)}</p>`).join(''):'');
  return `<details class="card coll" ${S.open['rules'+lg.id]?'open':''}><summary data-a="toggle" data-v="rules${lg.id}"><span class="ctitle">${I.book}Règles du jeu</span>${I.chev}</summary><div class="rules-body r2">${stepsH}${warn}${optH}${cH}${prizeRulesHtml(lg)}</div></details>`;
}
function standingsCard(lg, openDefault){
  const key=lg.comp; if(!key) return '';
  const f=S.feeds[key]; if(!f) { loadFeed(key); return ''; }
  if(f.missing || !f.standings || !f.standings.length) return '';
  const myTeams=new Set(); roundsOf(lg).forEach(r=>{ const p=pickOf(S.me,lg.id,r.k); if(p&&p.p!=='D'&&r.matches&&r.matches[p.m]){ const m=r.matches[p.m]; myTeams.add(String(p.p==='H'?m.h.id:m.a.id)); } });
  const groups=f.standings.map(g=>`<table class="tbl">${g.g&&f.standings.length>1?`<caption>${esc(g.g)}</caption>`:''}<thead><tr><th class="r">#</th><th>ÉQUIPE</th><th class="n">J</th><th class="n">DIFF</th><th class="n">${esc(f.ptsLabel||'PTS')}</th></tr></thead><tbody>`+
    g.rows.map((row,i)=>{ const tm=teamOf(f,row.t); const gd=row.gd>0?'+'+row.gd:row.gd; return `<tr class="${myTeams.has(String(row.t))?'me':''}"><td class="r">${row.rank||i+1}</td><td><div class="team">${logoOf(tm)?`<img src="${esc(logoOf(tm))}" data-fb="" alt="">`:''}<span>${esc(tm.n)}</span></div></td><td class="n">${row.gp??''}</td><td class="n">${gd??''}</td><td class="n pts">${row.pts??''}</td></tr>`; }).join('')+`</tbody></table>`).join('');
  if(openDefault==='body') return `<div class="ssec"><div class="stitle">${I.chart}Classement ${esc(COMP_NAMES[key]||f.name||'')}</div>${groups}${f.standings[0]&&f.standings[0].calc?'<div class="muted" style="font-size:12px;margin-top:8px">Classement calculé d’après les résultats (victoire 4 pts, nul 2, bonus défensif inclus, bonus offensif non pris en compte).</div>':''}<div class="muted" style="font-size:12px;margin-top:10px">Mis à jour le ${fmtDT(f.updatedAt)}</div></div>`;
  return `<details class="card coll" ${(openDefault? S.open['st'+lg.id]!==false : S.open['st'+lg.id])?'open':''}><summary data-a="toggle" data-v="st${lg.id}"><span class="ctitle">${I.chart}Classement ${esc(COMP_NAMES[key]||f.name||'')}</span>${I.chev}</summary>${groups}<div class="muted" style="font-size:12px;margin-top:10px">Mis à jour le ${fmtDT(f.updatedAt)}</div></details>`;
}

function teamForm(f){
  // per team: ordered post results (newest first) from the feed window
  const res={};
  Object.values(f.events||{}).filter(e=>e.st==='post'&&e.hs!=null).sort((a,b)=>t(b.d)-t(a.d)).forEach(e=>{
    const hs=+e.hs, as=+e.as; const rh=hs>as?'W':hs<as?'L':'D', ra=hs<as?'W':hs>as?'L':'D';
    (res[e.h]=res[e.h]||[]).push(rh); (res[e.a]=res[e.a]||[]).push(ra);
  });
  return res;
}
function statRow(f, tid, right, sub){ const tm=teamOf(f,tid); return `<div class="srow">${logoOf(tm)?`<img src="${esc(logoOf(tm))}" data-fb="" alt="">`:'<span class="sdot"></span>'}<div class="sn">${esc(tm.n)}${sub?`<small>${sub}</small>`:''}</div><div class="sv">${right}</div></div>`; }
function formDots(arr){ return `<span class="fdots">${arr.slice(0,5).reverse().map(r=>`<i class="f${r}">${r==='W'?'V':r==='L'?'D':'N'}</i>`).join('')}</span>`; }
function trendSection(c){
  const lg=c.lg;
  const closed=c.rounds.filter(r=>t(r.deadline)<=now());
  const next=c.rounds.find(r=>t(r.deadline)>now());
  const r=closed[closed.length-1];
  if(!r && !next) return '';
  let h=`<div class="ssec"><div class="stitle">${I.users}Choix de la journée</div>`;
  if(!r) return '';
  const ri=c.info[r.k]||{}; const voters=ri.aliveBefore||c.mem;
  const cnt={}; let tot=0;
  voters.forEach(u=>{ const p=pickOf(u,lg.id,r.k); if(!p) return; const k=c.pick?p.m+'|'+p.p:p.p; (cnt[k]=cnt[k]||{p,n:0}).n++; tot++; });
  const res=ri.res||{};
  const rows=Object.values(cnt).sort((a,b)=>b.n-a.n).slice(0,5).map(({p,n})=>{
    const pct=Math.round(n*100/tot); let logo='', ok='';
    if(c.pick){ const m=(r.matches||{})[p.m]; const sd=m&&(p.p==='H'?m.h:p.p==='A'?m.a:null); if(sd&&logoOf(sd)) logo=`<img src="${esc(logoOf(sd))}" data-fb="" alt="">`; if(res[p.m]) ok=pickOk(lg,res[p.m],p.p)?' ✓':' ✗'; }
    else if(ri.win){ ok=ri.win===p.p?' ✓':' ✗'; }
    return `<div class="trow">${logo||'<span class="sdot"></span>'}<div class="tn">${esc(pickLabel(lg,{...r,k:r.k},p))}${ok?`<span class="${ok.includes('✓')?'green':'red'}">${ok}</span>`:''}<div class="tbar"><span style="width:${pct}%"></span></div></div><div class="tp"><b>${pct}%</b><span>${n} joueur${n>1?'s':''}</span></div></div>`;
  }).join('');
  const nob=voters.length-tot;
  h+=`<div class="help" style="margin:4px 0 6px;font-size:13px">${c.pick?'Journée':'Question'} ${ri.n||''} · ${tot} choix sur ${voters.length} survivant${voters.length>1?'s':''}${nob?` (${nob} sans choix)`:''}</div>${rows||'<div class="muted">Aucun choix.</div>'}`;
  if(next) h+=`<div class="muted" style="font-size:12px;margin-top:8px">Prochains choix révélés le ${fmtDT(next.deadline)}.</div>`;
  return h+'</div>';
}
// Confrontations directes (5 dernières) pour les matchs de la prochaine journée
// 5 derniers matchs de chaque club de la prochaine journée : adversaire (logo), score, domicile / extérieur
function lastFiveSection(c, f){
  if(!f||!f.events) return '';
  const r=c.rounds.find(r=>t(r.deadline)>now()); if(!r) return '';
  const past=Object.values(f.events).filter(e=>e.st==='post'&&e.hs!=null).sort((a,b)=>t(b.d)-t(a.d));
  const team=id=>{ const tm=(f.teams||{})[id]||{}; return {id, n:tm.n||'', logo:tm.logo}; };
  const line=(side)=>{
    const id=String(side.id||''); if(!id) return '';
    const L=past.filter(e=>e.h===id||e.a===id).slice(0,5); if(!L.length) return '';
    const chips=L.map(e=>{ const home=e.h===id, me=home?+e.hs:+e.as, op=home?+e.as:+e.hs, res=me>op?'W':me<op?'L':'D', o=team(home?e.a:e.h);
      return `<span class="l5 ${res}" title="${esc(o.n)} · ${esc(fmtDT(e.d))}">${logoTag(o,'l5lg')||`<b class="l5n">${esc((o.n||'?')[0])}</b>`}<b>${me}-${op}</b><small>${home?'DOM':'EXT'}</small></span>`; }).join('');
    return `<div class="l5row"><div class="l5t">${logoTag(side)}<b>${esc(side.n)}</b></div><div class="l5l">${chips}</div></div>`;
  };
  const rows=matchesOf(r).map(m=>{ const x=line(m.h)+line(m.a); return x?`<div class="l5m">${x}</div>`:''; }).join('');
  return rows?`<div class="ssec"><div class="stitle">${I.chart||IC.chart}5 derniers matchs</div><div class="muted" style="font-size:12px;margin:-4px 0 8px">Du plus récent au plus ancien · score du club en premier.</div>${rows}</div>`:'';
}
// Cotes 1 / N / 2 des matchs de la prochaine journée (DraftKings via ESPN)
function oddsSection(c, f){
  if(!f||!f.odds) return '';
  const r=c.rounds.find(r=>t(r.deadline)>now()); if(!r) return '';
  const fx=v=>v?v.toFixed(2).replace('.',','):'–'; let prov='';
  const rows=matchesOf(r).map(m=>{
    const o=f.odds[String(m.h.id||'')+'_'+String(m.a.id||'')]; if(!o) return ''; prov=prov||o.p;
    const vals=[o.h,o.n,o.a].filter(Boolean), min=Math.min(...vals);
    const cell=(lbl,v)=>v?`<span class="oc ${v===min?'fav':''}">${fx(v)}</span>`:'';
    return `<div class="odd"><div class="odd-t">${logoTag(m.h)}<b>${esc(m.h.n)}</b><span class="vs">–</span><b>${esc(m.a.n)}</b>${logoTag(m.a)}</div><div class="odd-l">${cell('1',o.h)}${cell('N',o.n)}${cell('2',o.a)}</div></div>`;
  }).join('');
  return rows?`<div class="ssec"><div class="stitle">${IC.chart}Cotes</div>${rows}</div>`:'';
}
function h2hSection(c, f){
  if(!f||!f.h2h) return '';
  const r=c.rounds.find(r=>t(r.deadline)>now()); if(!r) return '';
  const rows=matchesOf(r).map(m=>{
    const hid=String(m.h.id||''), aid=String(m.a.id||''); if(!hid||!aid) return '';
    const L=f.h2h[[hid,aid].sort().join('_')]; if(!L||!L.length) return '';
    let w=0,d=0,l=0; const dots=L.map(x=>{ const hg=x.h===hid?x.hs:x.as, ag=x.h===hid?x.as:x.hs; const res=hg>ag?'W':hg<ag?'L':'D'; if(res==='W') w++; else if(res==='L') l++; else d++;
      return `<span class="hs ${res}" title="${esc(x.d)}">${x.h===hid?`${x.hs}-${x.as}`:`${x.as}-${x.hs}`}</span>`; }).join('');
    return `<div class="h2h"><div class="h2h-t">${logoTag(m.h)}<b>${esc(m.h.n)}</b><span class="vs">VS</span><b>${esc(m.a.n)}</b>${logoTag(m.a)}</div><div class="h2h-l">${dots}</div></div>`;
  }).join('');
  return rows?`<div class="ssec"><div class="stitle">${I.flash}Confrontations directes</div><div class="muted" style="font-size:12px;margin:-4px 0 8px">5 derniers matchs entre les 2 équipes.</div>${rows}</div>`:'';
}
// DATA : chaque section (classement, cotes…) devient dépliable
function dsecs(html, lid){
  const tp=document.createElement('template'); tp.innerHTML=html;
  tp.content.querySelectorAll('.ssec').forEach(sec=>{ const tt=sec.querySelector('.stitle'); if(!tt) return;
    const key='ds'+lid+'_'+tt.textContent.trim().replace(/\s+/g,'').slice(0,14);
    const d=document.createElement('details'); d.className='ssec dsec'; if(S.open[key]) d.open=true;
    const sm=document.createElement('summary'); sm.className='stitle'; sm.dataset.a='toggle'; sm.dataset.v=key; sm.innerHTML=tt.innerHTML+'<span class="dchev">'+I.chev+'</span>';
    tt.remove(); const body=document.createElement('div'); body.className='dsec-b'; body.append(...sec.childNodes); d.append(sm,body); sec.replaceWith(d); });
  return tp.innerHTML;
}
function statsCard(c){
  const lg=c.lg; const key=lg.comp;
  const trend='';
  const f=key?S.feeds[key]:null; if(key&&!f) loadFeed(key);
  const tbl=c.lg.category==='tuprefere'?'':standingsCard(lg,'body');
  const wrap=body=>`<details class="card coll" ${S.open['sx'+lg.id]?'open':''}><summary data-a="toggle" data-v="sx${lg.id}"><span class="ctitle">${I.data}Data ${esc(COMP_NAMES[lg.comp]||stripPrefix(lg.name)||'')}</span>${I.chev}</summary>${dsecs(body,lg.id)}</details>`;
  if(!f||f.missing||c.lg.category==='tuprefere'){ { const hh=oddsSection(c,f)+lastFiveSection(c,f)+h2hSection(c,f); if(!trend&&!tbl&&!hh) return ''; return wrap(trend+tbl+hh); } return `<details class="card coll" ${S.open['sx'+lg.id]?'open':''}><summary data-a="toggle" data-v="sx${lg.id}"><span class="ctitle">${I.data}Data ${esc(COMP_NAMES[lg.comp]||stripPrefix(lg.name)||'')}</span>${I.chev}</summary>${trend}</details>`; }
  const form=teamForm(f);
  const pts=Object.keys(form).map(id=>[id, form[id].slice(0,5).reduce((a,r)=>a+(r==='W'?3:r==='D'?1:0),0), Math.min(5,form[id].length)]).filter(x=>x[2]>=2);
  if(pts.length<6){ { const hh=oddsSection(c,f)+lastFiveSection(c,f)+h2hSection(c,f); if(!trend&&!tbl&&!hh) return ''; return wrap(trend+tbl+hh); } return `<details class="card coll" ${S.open['sx'+lg.id]?'open':''}><summary data-a="toggle" data-v="sx${lg.id}"><span class="ctitle">${I.data}Data ${esc(COMP_NAMES[lg.comp]||stripPrefix(lg.name)||'')}</span>${I.chev}</summary>${trend}</details>`; }
  const best=pts.slice().sort((a,b)=>b[1]-a[1]||a[2]-b[2]).slice(0,3), worst=pts.slice().sort((a,b)=>a[1]-b[1]||b[2]-a[2]).slice(0,3);
  const row=([id,p,n])=>statRow(f,id,`<b>${p}</b><span>pts</span>`,formDots(form[id]));
  const maxN=Math.max(...pts.map(x=>x[2]));
  let h=trend+`<div class="ssec"><div class="stitle">${I.flash}Les plus en forme</div><div class="slist">${best.map(row).join('')}</div><div class="muted" style="font-size:12px;margin-top:12px">Points pris sur les ${maxN} dernières journées.</div></div>`;
  h+=`<div class="ssec"><div class="stitle">${I.down}À la peine</div><div class="slist">${worst.map(row).join('')}</div><div class="muted" style="font-size:12px;margin-top:12px">Points pris sur les ${maxN} dernières journées.</div></div>`;
  h+=tbl+oddsSection(c,f)+lastFiveSection(c,f)+h2hSection(c,f);
  return `<details class="card coll" ${S.open['sx'+lg.id]?'open':''}><summary data-a="toggle" data-v="sx${lg.id}"><span class="ctitle">${I.data}Data ${esc(COMP_NAMES[lg.comp]||stripPrefix(lg.name)||'')}</span>${I.chev}</summary>${dsecs(h,lg.id)}</details>`;
}
// Final/ongoing ranking: survivors share the top; the eliminated are ranked by elimination day
// (later = better), then by boldness of the losing pick (weaker team = better).
// STATS : paris de la prochaine journée (option « Paris visibles »)
// « Les plus choisies » : barres de progression avec logos
function top3Bars(items, extra='', jn=''){
  return `<div class="t3"><div class="t3-t">${IC.flame}${jn?'J'+jn+' : ':''}Les plus choisis</div>${items.map(([nm,pc,sides],i)=>`<div class="t3-r ${i?'':'first'}"><span class="t3-lg">${sides.map(sd=>logoTag(sd,'t3-im')).join('')||'<i></i>'}</span><div class="t3-l"><b>${esc(nm)}</b><div class="t3-bar"><i style="width:${Math.max(3,pc)}%"></i></div></div><em>${pc} %</em></div>`).join('')}${extra}</div>`;
}
// Onglet SURVIVANTS : survivants + leur choix de la prochaine journée, puis éliminés
function pickPill(c, r, p, blur){
  if(!p) return `<span class="spk none">Pas encore choisi</span>`;
  const parts=pickSides(p).map(x=>{ const m=(r.matches||{})[x.m]; if(!m) return ''; if(x.p==='D') return `<span class="spk">${logoTag(m.h,'spk-im')}${logoTag(m.a,'spk-im')}<span>Nul</span></span>`; const sd=x.p==='H'?m.h:m.a; return `<span class="spk">${logoTag(sd,'spk-im')}<span>${esc(sd.n)}</span></span>`; }).join('');
  return `<span class="spks">${parts}</span>`;
}
// Onglet CLASSEMENT d'une Race : tableau (rang, joueur, points, pari de la prochaine journée) puis « Les plus choisies »
const LOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
function raceRanking(c){
  const lg=c.lg, lid=lg.id, r=pendR(c)||c.rounds.find(r=>t(r.deadline)>now()), vis=picksVisible(lg)||(!!r&&t(r.deadline)<=now());
  const n=r?((c.info[r.k]||{}).n||(c.rounds.indexOf(r)+1)):0;
  const done=c.rounds.filter(x=>['done','cancelled'].includes((c.info[x.k]||{}).state)).length;
  const sides=[]; if(r) matchesOf(r).forEach(m=>{ sides.push(m.h, m.a); }); const F=i=>sides[i%Math.max(1,sides.length)]||{n:'Équipe'};
  const showPk=r && c.status!=='finished';
  const pill=(u,i)=>{ const p=pickOf(u,lid,r.k); if(!p) return `<span class="rpk none">–</span>`;
    if(!vis && u!==S.me) return `<span class="rpk hid" title="Parié">${LOCK}</span>`;
    const x=pickSides(p)[0]; const m=(r.matches||{})[x.m]; if(!m) return `<span class="rpk none">–</span>`;
    if(x.p==='D') return `<span class="rpk dr" title="Nul ${esc(m.h.n)} – ${esc(m.a.n)}">${logoTag(m.h,'rpk-im')}<b>=</b>${logoTag(m.a,'rpk-im')}</span>`;
    const sd=x.p==='H'?m.h:m.a; return `<span class="rpk" title="${esc(sd.n)}">${logoTag(sd,'rpk-im')||`<span>${esc(shortName(lg,m,sd))}</span>`}</span>`; };
  let top='';
  if(showPk && vis){ const cnt={}, lk={}; let tot=0;
    c.mem.forEach(u=>{ const p=pickOf(u,lid,r.k); if(!p) return; tot++; pickSides(p).forEach(x=>{ const m=(r.matches||{})[x.m]; if(!m) return; const k=x.p==='D'?'Nul '+m.h.n+' – '+m.a.n:(x.p==='H'?m.h:m.a).n; cnt[k]=(cnt[k]||0)+1; if(!lk[k]) lk[k]=x.p==='D'?[m.h,m.a]:[x.p==='H'?m.h:m.a]; }); });
    const t3=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3);
    if(t3.length) top=`<div class="card">${top3Bars(t3.map(([k,v])=>[k,Math.round(v*100/tot),lk[k]]),'',n)}</div>`; }
  let h=top+`<div class="card rk-card ${showPk?'':'nopk'}"><div class="sv-h"><span>${IC.trophy}Classement</span><small>Le premier à ${c.N} points gagne</small></div>`;
  h+=`<div class="rk-th"><span>#</span><span></span><span>Joueur</span><span>GA</span><span>Pts</span>${showPk?`<span>Pari J${n}</span>`:''}</div>`;
  h+=c.ranking.map((x,i)=>`<div class="rk-tr ${x.pos===1?'first':''}"><div class="rk-pos">${x.pos}</div>${avatarOf(x.u)}<div class="rk-nm"><b>${esc(nameOf(x.u))}${x.u===S.me?'<span class="toi">TOI</span>':''}</b></div><div class="rk-ga ${x.ga>0?'p':x.ga<0?'n':''}">${x.ga>0?'+':''}${x.ga||0}</div><div class="rk-pts">${c.pts[x.u]||0}</div>${showPk?`<div class="rk-pk">${pill(x.u,i)}</div>`:''}</div>`).join('');
  if(showPk && !vis) h+=`<div class="rk-note">Les paris de la J${n} seront révélés le ${fmtDT(r.deadline)}. Tu vois seulement le tien.</div>`;
  h+=`</div>`;

  return h;
}
// Équipes déjà utilisées par les survivants (avant la journée r)
const lg_comp = c => c.lg.comp || '';
function usedBoard(c, r){
  const lid=c.lg.id, alive=c.status==='upcoming'?c.mem:c.alive, map={};
  const r0t=r?t(r.deadline):Infinity;
  alive.forEach(u=>{ c.rounds.forEach(rr=>{ if(t(rr.deadline)>=r0t) return; pickSides(pickOf(u,lid,rr.k)).forEach(x=>{ if(x.p==='D') return; const m=(rr.matches||{})[x.m]; if(!m) return; const sd=x.p==='H'?m.h:m.a, k=teamKey(sd); (map[k]=map[k]||{sd,us:new Set()}).us.add(u); }); }); });
  // clubs pas encore choisis : toutes les équipes de la compétition (flux) + celles des journées de la ligue
  const nk=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g,''), seen=new Set(Object.values(map).map(o=>nk(o.sd.n)));
  const add=sd=>{ const k=teamKey(sd), q=nk(sd&&sd.n); if(k && !map[k] && !seen.has(q)){ map[k]={sd,us:new Set()}; seen.add(q); } };
  c.rounds.forEach(rr=>matchesOf(rr).forEach(m=>{ add(m.h); add(m.a); }));
  const f=S.feeds[lg_comp(c)]; if(f&&f.events&&f.teams){ const ids=new Set(); Object.values(f.events).forEach(e=>{ if(e.h) ids.add(String(e.h)); if(e.a) ids.add(String(e.a)); }); ids.forEach(id=>{ const tm=f.teams[id]; if(tm&&tm.n) add({n:tm.n,id,logo:logoOf(tm)}); }); }
  return {rows:Object.values(map).map(o=>({sd:o.sd,us:[...o.us]})).sort((a,b)=>b.us.length-a.us.length||a.sd.n.localeCompare(b.sd.n)), n:alive.length};
}
function svCard(key, defOpen, head, body){
  const open=defOpen?!S.open[key]:!!S.open[key];
  return `<details class="card sv svc" ${open?'open':''}><summary data-a="toggle" data-v="${key}">${head}<span class="svc-ch">${I.chev}</span></summary>${body}</details>`;
}
function myUsedLine(c, r){
  if(!c.pick||c.points||!isMember(c.lg.id)) return '';
  const seen={}, list=[]; c.rounds.forEach(rr=>{ if(t(rr.deadline)>=t(r.deadline)) return; pickSides(pickOf(S.me,c.lg.id,rr.k)).forEach(x=>{ if(x.p==='D') return; const m=(rr.matches||{})[x.m]; if(!m) return; const sd=x.p==='H'?m.h:m.a, k=teamKey(sd); if(!seen[k]){ seen[k]=1; list.push(sd); } }); });
  if(!list.length) return '';
  return `<button class="myused" data-a="myUsed" data-v="${c.lg.id}"><span>Déjà joués</span><span class="mu-lg">${list.map(sd=>logoTag(sd,'mu-im')||`<b>${esc((sd.n||'?').slice(0,3))}</b>`).join('')}</span><em>›</em></button>`;
}
const CLK='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
function survivorsView(c){
  const lg=c.lg, lid=lg.id; let h='';
  const r=pendR(c)||c.rounds.find(r=>t(r.deadline)>now());
  const n=r?((c.info[r.k]||{}).n||(c.rounds.indexOf(r)+1)):0;
  const alive=c.status==='upcoming'?c.mem:c.alive, vis=picksVisible(lg)||(!!r&&t(r.deadline)<=now());
  const heart='<svg class="ic" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9C.9 8.8 2.8 4.5 6.7 4.5c2.2 0 3.7 1.3 5.3 3.2 1.6-1.9 3.1-3.2 5.3-3.2 3.9 0 5.8 4.3 4.3 7.5C19.5 16.4 12 21 12 21z" fill="#1E9E54"/></svg>';
  const sides=[]; if(r) matchesOf(r).forEach(m=>{ sides.push(m.h, m.a); }); const F=i=>sides[i%Math.max(1,sides.length)]||{n:'Équipe'};
  // podium
  let top='';
  if(r && vis){ const cnt={}, lk={}; let tot=0;
    alive.forEach(u=>{ const p=pickOf(u,lid,r.k); if(!p) return; tot++; pickSides(p).forEach(x=>{ const m=(r.matches||{})[x.m]; if(!m) return; const k=x.p==='D'?'Nul '+m.h.n+' – '+m.a.n:(x.p==='H'?m.h:m.a).n; cnt[k]=(cnt[k]||0)+1; if(!lk[k]) lk[k]=x.p==='D'?[m.h,m.a]:[x.p==='H'?m.h:m.a]; }); });
    const t3=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3); if(t3.length) top=top3Bars(t3.map(([k,v])=>[k,Math.round(v*100/tot),lk[k]]),'',n);
  }
  const title=c.status==='finished'?'Vainqueur'+(c.winners.length>1?'s':''):c.status==='upcoming'?'Inscrits':`En vie${n?' · J'+n:''}`;
  const headA=`<div class="sv-h"><span>${c.status==='finished'?IC.trophy:heart}${title}</span><small>${c.status==='finished'?'':`${alive.length} sur ${c.mem.length}`}</small></div>`; let hb='';
  if(r && !vis && c.status!=='finished') hb+=`<div class="sv-lock">${IC.eyeOff}Choix révélés le ${fmtDT(r.deadline)}</div>`;
  hb+=top;
  let list=c.status==='finished'?c.winners:alive;
  // Journée en cours : suivi (qualifiés / éliminés / à jouer) + état de chaque choix, trié par heure du match
  const pkSt={};
  const PI={won:`<span class="jpi won">${IC.check}</span>`, lost:`<span class="jpi lost">${IC.x}</span>`, todo:`<span class="jpi todo">${IC.clock||CLK}</span>`};
  if(r && vis && c.status!=='finished'){
    list.forEach(u=>{ const p=pickOf(u,lid,r.k); if(!p){ pkSt[u]={k:'none',d:Infinity}; return; }
      const x=pickSides(p)[0], m=(r.matches||{})[x.m]; if(!m){ pkSt[u]={k:'none',d:Infinity}; return; }
      const res=matchResult(lg,m), d=t(m.d)||Infinity;
      pkSt[u]= res ? {k:pickOk(lg,res.r,x.p)?'won':'lost',d,sc:res.hs!=null&&res.as!=null?`${res.hs} – ${res.as}`:''} : {k:'todo',d}; });
    list=[...list].sort((a,b)=>{ const o=k=>k==='todo'?1:k==='none'?2:0; return (o(pkSt[a].k)-o(pkSt[b].k))||(pkSt[a].d-pkSt[b].d)||nameOf(a).localeCompare(nameOf(b)); });
    const nb=k=>list.filter(u=>pkSt[u].k===k).length, W=nb('won'), Lo=nb('lost')+nb('none'), T=nb('todo'), N=Math.max(1,list.length);
    const ln=(k,lb,v)=>`<div class="js-r">${PI[k]}<div class="js-l"><b>${lb}</b><div class="js-bar"><i class="${k}" style="width:${v?Math.max(3,v*100/N):0}%"></i></div></div><em>${v}</em></div>`;
    hb=`<div class="js"><div class="js-t">Suivi de la J${n}</div>${ln('won','Qualifiés',W)}${ln('lost','Éliminés',Lo)}${ln('todo','À jouer',T)}</div>`+hb;
  }
  const stTag=u=>{ const s=pkSt[u]; if(!s) return '';
    if(s.k==='none') return `<span class="jres"><span class="jsc todo">Pas de pari</span>${PI.lost}</span>`;
    if(s.k==='todo') return `<span class="jres"><span class="jsc todo">À jouer</span>${PI.todo}</span>`;
    return `<span class="jres"><span class="jsc">${s.sc||(s.k==='won'?'Gagné':'Perdu')}</span>${PI[s.k]}</span>`; };
  const showPk=r && c.status!=='finished';
  const nPk=r?((c.info[r.k]||{}).n||(c.rounds.indexOf(r)+1)):'';
  if(showPk) hb+=`<div class="sv-th"><span></span><span>Pari J${nPk}</span></div>`;
  hb+=list.map(u=>{ const lv=c.lives?c.lives[u]||0:0;
    let right='';
    if(showPk){ const p=pickOf(u,lid,r.k);
      if(!p) right=pkSt[u]?'':`<span class="sv-none">–</span>`;
      else if(!vis && u!==S.me) right=`<span class="rpk hid" title="Parié">${LOCK}</span>`;
      else { const x=pickSides(p)[0], m=(r.matches||{})[x.m];
        right=!m?'<span class="sv-none">–</span>':x.p==='D'?`<span class="sv-pk dr" title="Nul">${logoTag(m.h,'sv-im')}<b>=</b>${logoTag(m.a,'sv-im')}</span>`:(()=>{ const sd=x.p==='H'?m.h:m.a; return `<span class="sv-pk" title="${esc(sd.n)}">${logoTag(sd,'sv-im')||`<b>${esc((sd.n||'?').slice(0,3))}</b>`}</span>`; })(); } }
    return `<div class="sv-r2${pkSt[u]?' pk-'+pkSt[u].k:''}">${avatarOf(u)}<div class="sv-n">${esc(nameOf(u))}${u===S.me?'<span class="toi">TOI</span>':''}${lv?`<small>${CI.heart} ${lv} vie${lv>1?'s':''}</small>`:''}</div><div class="sv-c">${right}${stTag(u)}</div></div>`; }).join('');
  h+=svCard('svA'+lid,true,headA,hb);
  { const ub=usedBoard(c, r&&t(r.deadline)<=now()?{deadline:new Date(t(r.deadline)+1).toISOString()}:(r||c.rounds[c.rounds.length-1]));
    if(ub.rows.some(x=>x.us.length) && c.status!=='finished'){
      const rows=ub.rows.map(x=>{ const mine=x.us.includes(S.me), others=x.us.filter(u=>u!==S.me);
        const avs=(mine?[`<span class="ub-av me">${avatarOf(S.me)}</span>`]:[]).concat(others.slice(0,mine?3:4).map(u=>`<span class="ub-av">${avatarOf(u)}</span>`)).join('');
        return `<div class="ub-r${x.us.length?'':' zero'}">${logoTag(x.sd,'ub-lg')||'<span class="ub-lg"></span>'}<b>${esc(x.sd.n)}</b><span class="ub-who">${avs}<em>${x.us.length}/${ub.n}</em></span></div>`; }).join('');
      h+=svCard('svU'+lid,true,`<div class="sv-h"><span>${IC.x}Clubs déjà choisis</span><small>${ub.n} survivant${ub.n>1?'s':''}</small></div>`,`<div class="ub-note">Un club déjà choisi ne peut plus être rejoué par ce joueur. Ta photo, cerclée de jaune, indique les tiens.</div>`+rows).replace('class="card sv svc"','class="card sv svc ub-card"');
    } }
  if(c.status!=='upcoming') h+=chambrageCard(c);
  // éliminés : du dernier tombé au premier, avec la journée d'élimination
  const dead=standingRows(c).filter(x=>!c.alive.includes(x.u)&&!c.winners.includes(x.u));
  if(dead.length && c.status!=='upcoming'){
    h+=svCard('svD'+lid,true,`<div class="sv-h"><span>${IC.skull}Éliminés</span><small>${dead.length}</small></div>`,`<div class="sv-th"><span></span><span>Journée</span></div>`+dead.map(x=>{ const u=x.u, jn=(c.info[c.elimAt[u]]||{}).n||'?';
      return `<div class="sv-r2 dead">${avatarOf(u,'dead')}<div class="sv-n">${esc(nameOf(u))}${u===S.me?'<span class="toi">TOI</span>':''}</div><div class="sv-c"><span class="sv-j">J${jn}</span></div></div>`; }).join(''));
  }
  return h;
}

/* ===== Récap de journée, joueur éliminé, chambrage ===== */
function lastDoneRound(c){ if(!c||!c.pick||c.points) return null; const d=c.rounds.filter(r=>(c.info[r.k]||{}).state==='done'); return d.length?d[d.length-1]:null; }
function pickSide(r,p){ if(!p||!r.matches) return null; const m=r.matches[p.m]; if(!m) return null; return {m, sd:p.p==='H'?m.h:p.p==='A'?m.a:null, opp:p.p==='H'?m.a:p.p==='A'?m.h:null}; }
function scoreNums(lg,m){ const s=matchScore(lg,m); const x=s.match(/(\d+)\s*-\s*(\d+)/); return x?[+x[1],+x[2]]:null; }
function recapData(c){
  const r=lastDoneRound(c); if(!r) return null; const lg=c.lg, ri=c.info[r.k]||{};
  const before=ri.aliveBefore||[], out=ri.out||[], surv=before.filter(u=>!out.includes(u));
  const cnt={}, keyOf=x=>x.sd?String(x.sd.id||x.sd.n):null;
  before.forEach(u=>{ const x=pickSide(r,pickOf(u,lg.id,r.k)); const k=x&&keyOf(x); if(k) cnt[k]=(cnt[k]||{n:0,sd:x.sd,m:x.m}), cnt[k].n++; });
  let bold=null; surv.forEach(u=>{ const p=pickOf(u,lg.id,r.k), x=pickSide(r,p); if(!x||!x.sd) return; const rk=pickRank(lg,r,p)||0; if(!rk) return; if(!bold||(isMerguez(lg)?rk<bold.rk:rk>bold.rk)) bold={u,rk,x,alone:(cnt[keyOf(x)]||{}).n===1}; });
  if(bold&&!bold.rk) bold=null;
  let mir=null; surv.forEach(u=>{ if(bold&&u===bold.u) return; const x=pickSide(r,pickOf(u,lg.id,r.k)); if(!x||!x.sd) return; const sc=scoreNums(lg,x.m); if(!sc) return; if(Math.abs(sc[0]-sc[1])===1&&!mir) mir={u,x,sc}; });
  const top=Object.values(cnt).sort((a,b)=>b.n-a.n)[0]||null;
  const next=c.rounds.find(x=>t(x.deadline)>now());
  return {r,ri,n:ri.n||(c.rounds.findIndex(x=>x.k===r.k)+1),before,out,surv,bold,mir,top,next};
}
function elimLine(c,r,u){ const lg=c.lg, x=pickSide(r,pickOf(u,lg.id,r.k)); if(!x) return 'Pas de pari'; const sc=matchScore(lg,x.m).replace(/\s/g,''); return `${shortName(lg,x.m,x.m.h)} ${sc||'–'} ${shortName(lg,x.m,x.m.a)}`; }
function recapTeaser(c){ const d=recapData(c); if(!d) return ''; const k=d.out.length;
  return `<div class="rcp-tz" data-a="recap" data-v="${c.lg.id}"><div class="rcp-tzl"><span>Récap de la J${d.n}</span><b>${k?`${k} éliminé${k>1?'s':''}`:'Aucun éliminé'}</b></div><span class="rcp-go">Voir</span></div>`; }
function recapHtml(lid){
  const c=C(lid); const d=c&&recapData(c); if(!d) return ''; const lg=c.lg, k=d.out.length;
  const title=k===0?`Personne n'est <em>tombé</em>`:(k>=3&&k*4>=d.before.length)?`Hécatombe :<br><em>${k} éliminés</em> cette journée`:`<em>${k} éliminé${k>1?'s':''}</em> cette journée`;
  const dead=c.mem.filter(u=>!d.before.includes(u)).length;
  const meter=`<div class="rcp-m">${d.surv.map(()=>'<i></i>').join('')}${d.out.map(()=>'<i class="x"></i>').join('')}${Array(dead).fill('<i class="d"></i>').join('')}</div>`;
  const wm=(leagueTitle(lg.name).match(/<img[^>]*>/)||[''])[0].replace(/src="img\/(survivor|race|oneshot|merguez|x)\.png/,'src="img/$1-white.png');
  let h=`<div class="rcp"><div class="rcp-top">${wm||''}<span>${esc(((splitBrand(lg.name)||{}).rest||lg.name).replace(/^\s*X\s+/i,''))} · Journée ${d.n}</span></div><h3>${title}</h3><p class="rcp-k">${c.mem.length} joueurs au départ · ${d.surv.length} encore en vie</p>${meter}`;
  if(k) h+=`<div class="rcp-b"><div class="rcp-t">💀 Les éliminés</div>${d.out.map(u=>{ const x=pickSide(d.r,pickOf(u,lid,d.r.k)); return `<div class="rcp-r">${avatarOf(u)}<b>${esc(nameOf(u))}</b>${x&&x.sd?logoTag(x.sd,'rcp-lg'):''}<span class="rcp-sc">${esc(x?(x.sd?shortName(lg,x.m,x.sd)+' ':'Nul ')+(matchScore(lg,x.m).replace(/\s/g,'')||''):'Pas de pari')}</span></div>`; }).join('')}</div>`;
  if(d.bold){ const b=d.bold; h+=`<div class="rcp-b hl"><div class="rcp-t">🎯 Le pari le plus audacieux</div><div class="rcp-au">${avatarOf(b.u)}${logoTag(b.x.sd,'rcp-al')}</div><p class="rcp-p">${esc(nameOf(b.u))} a misé sur ${isMerguez(lg)?'la défaite de ':''}${esc(shortName(lg,b.x.m,b.x.sd))} (${b.rk}${b.rk===1?'er':'e'}) contre ${esc(shortName(lg,b.x.m,b.x.opp))}. ${b.alone?'Personne d’autre ne l’avait joué… et ça passe !':'Et ça passe !'}</p></div>`; }
  if(d.top&&d.top.n>1) h+=`<div class="rcp-b"><div class="rcp-t">📊 Club le plus joué</div><div class="rcp-r">${logoTag(d.top.sd,'rcp-lg')}<b>${esc(shortName(lg,d.top.m,d.top.sd))}</b><small>${d.top.n} joueurs sur ${d.before.length}</small></div></div>`;
  if(d.surv.length) h+=`<div class="rcp-b"><div class="rcp-t">💚 Les survivants</div>${d.surv.map(u=>{ const x=pickSide(d.r,pickOf(u,lid,d.r.k)); return `<div class="rcp-r">${avatarOf(u)}<b>${esc(nameOf(u))}</b>${x&&x.sd?logoTag(x.sd,'rcp-lg'):''}<span class="rcp-sc">${esc(x?(x.sd?shortName(lg,x.m,x.sd)+' ':'Nul ')+(matchScore(lg,x.m).replace(/\s/g,'')||''):'Pas de pari')}</span></div>`; }).join('')}</div>`;
  h+=`<div class="rcp-ft"><span>surviivor.github.io</span><span>${d.next?'Prochaine journée : '+fmtDT(d.next.deadline):''}</span></div></div>`;
  return `<div class="modal rcp-ov"><div class="vd-bg" data-a="recapClose"></div><div class="rcp-w">${h}<button class="btn line rcp-x" data-a="recapClose">Fermer</button></div></div>`;
}
function elimCard(c){
  const lg=c.lg; if(c.points||!c.pick||!isMember(lg.id)||c.alive.includes(S.me)||c.winners.includes(S.me)||c.status!=='live') return '';
  const rk=c.elimAt[S.me]; const r=c.rounds.find(x=>x.k===rk); if(!r) return ''; const n=(c.info[rk]||{}).n||'?';
  const open=Object.keys(S.leagues).filter(l=>shownL(l)&&!isMember(l)&&!(S.leagues[l]||{}).private).map(C).filter(x=>x&&x.status==='upcoming').sort((a,b)=>t(a.lg.startAt)-t(b.lg.startAt));
  const op=!!S.open['elj'+lg.id];
  let h=`<div class="elc"><div class="elc-h"><div class="elc-ic">💀</div><div><b>Éliminé à la J${n}</b><small>${esc(elimLine(c,r,S.me))}. Ça arrive aux meilleurs.</small></div></div>`;
  h+=`<button class="btn elc-b" data-a="toggle" data-v="elj${lg.id}">Rejoindre une autre ligue <em>${op?'⌃':'›'}</em></button></div>`;
  if(op){ h+=`<div class="elc-lt">Ligues ouvertes</div>`;
    h+=open.length?open.map(x=>{ const sb=splitBrand(x.lg.name); return `<div class="elc-o"><div class="elc-tx"><div class="mp-nm">${sb?`${WM(sb.k)}<span>${xify(esc(sb.rest))}</span>`:`<span>${esc(x.lg.name)}</span>`}</div><small>Début ${until(x.lg.startAt)?'dans '+until(x.lg.startAt):fmtD(x.lg.startAt)} · ${x.mem.length} inscrit${x.mem.length>1?'s':''}</small></div><button class="elc-j" data-a="join" data-v="${x.lg.id}">Rejoindre</button></div>`; }).join(''):`<div class="card muted" style="text-align:center;font-size:14px">Aucune ligue ouverte pour l'instant. Reviens bientôt !</div>`;
  }
  return h;
}
const RX_E=['😂','🔥','💀','🍀','🤡','🐐','😱'];
const RX_Q={ok:['Quelle chance 🍀','Respect 🫡','Tu vas tomber 😈'], ko:['Bien tenté 😅','Fallait pas 🤡','RIP 🪦']};
S.reacts=S.reacts||{};
function reactsOf(lid,rk,to){ return Object.values(S.reacts).filter(x=>x.lid===lid&&x.rk===rk&&x.to===to); }
function chambrageCard(c){
  const r=lastDoneRound(c); if(!r) return ''; const lg=c.lg, lid=lg.id, ri=c.info[r.k]||{}, n=ri.n||(c.rounds.findIndex(x=>x.k===r.k)+1);
  const who=ri.aliveBefore||[]; if(!who.length) return '';
  const rows=who.map(u=>{ const out=(ri.out||[]).includes(u), x=pickSide(r,pickOf(u,lid,r.k)), rx=reactsOf(lid,r.k,u);
    const cnt={}; rx.forEach(a=>{ if(a.e) cnt[a.e]=(cnt[a.e]||0)+1; }); const mine=rx.find(a=>a.uid===S.me)||{};
    const chips=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([e,k])=>`<button class="rx ${mine.e===e?'me':''}" data-a="react" data-v="${lid}|${r.k}|${u}|e|${e}">${e} ${k}</button>`).join('');
    const self=u===S.me, key=`${lid}|${r.k}|${u}`, open=S.view.rx===key;
    const add=self||S.guest?'':`<button class="rx add ${chips?'':'sm'}" data-a="rxOpen" data-v="${key}">＋${chips?'':' Réagir'}</button>`;
    const logo=x?(x.sd?logoTag(x.sd,'rx-lg'):`<span class="rx-nul">Nul</span>`):'';
    let h=`<div class="rx-r"><div class="rx-t">${avatarOf(u)}<b>${esc(nameOf(u))}</b>${logo}<span class="rx-st ${out?'ko':'ok'}">${out?'ÉLIMINÉ':'EN VIE'}</span>${chips?'':add}</div>`;
    if(chips) h+=`<div class="rx-c">${chips}${add}</div>`;
    if(open){ const qs=RX_Q[out?'ko':'ok']; h+=`<div class="rx-bar">${RX_E.map(e=>`<span data-a="react" data-v="${key}|e|${e}">${e}</span>`).join('')}</div><div class="rx-q">${qs.map((q,i)=>`<span class="${mine.q===q?'me':''}" data-a="react" data-v="${key}|q|${q}">${esc(q)}</span>`).join('')}</div>`; }
    h+=rx.filter(a=>a.q).map(a=>`<div class="rx-m"><b>${esc(nameOf(a.uid))}</b>${esc(a.q)}</div>`).join('');
    return h+'</div>'; }).join('');
  return svCard('svR'+lid,true,`<div class="sv-h"><span>${IC.chat||''}Paris de la J${n}</span><small>Réagis aux paris</small></div>`,rows);
}

const refCode = u => String(u||'').replace(/[^a-z0-9]/gi,'').slice(0,6).toUpperCase();
const hasAnyPick = p => !!(p&&p.picks&&Object.values(p.picks).some(o=>o&&Object.keys(o).length));
const refsOf = u => Object.entries(S.players).filter(([x,p])=>p&&p.refBy===u&&x!==u);
function refStock(u=S.me){ const earned=refsOf(u).filter(([,p])=>hasAnyPick(p)).length, used=Object.keys(((S.players[u]||{}).xj)||{}).length; return Math.max(0,Math.min(3,earned-used)); }
const xjOf = (u,lid) => (((S.players[u]||{}).xj)||{})[lid]||null;
const CARD_ICO='<svg class="jcard" viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="3" width="18" height="26" rx="4" fill="#fff" stroke="#5B4BC4" stroke-width="2.2"/><path d="M16 9.5l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="#F2C94C" stroke="#5B4BC4" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const CHEV_RND=up=>`<span class="cvr ${up?'up':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>`;
const REF_RULES=`<div class="rfr"><p><span>1</span><span><b>Invite un pote</b> avec le bouton « Inviter » : ton code parrainage est inclus dans le message.</span></p><p><span>2</span><span><b>Il s'inscrit avec ton code</b> &amp; <b>participe à une ligue</b> : tu gagnes <b>1 joker</b>.</span></p><p><span>3</span><span><b>Ton joker</b> (Sabotage ou Double chance) s'utilise dans une ligue qui accepte les jokers.</span></p><p><span>4</span><span><b>1 joker par ligue</b> au maximum, et <b>3 jokers</b> maximum en stock.</span></p><small>Ton code ne marche que pour les nouveaux inscrits, et tu ne peux pas l'utiliser toi-même.</small></div>`;
function inviteCard(c){
  if(c.status!=='upcoming') return ''; const lg=c.lg, k='ivh'+lg.id, op=!!S.open[k];
  const ico='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>';
  return `<div class="iva"><div class="iva-c"><div class="iva-r"><span class="iva-jk">${CARD_ICO}</span><div class="iva-tx"><b>Ramène tes potes</b><b class="j">et gagne des jokers</b></div><button class="ivc-go" data-a="invite" data-v="${lg.id}">${ico}Inviter</button></div>${op?`<div class="iva-b">${REF_RULES}</div>`:''}</div><button class="iva-m" data-a="toggle" data-v="${k}">${op?'Masquer':'Comment ça marche ?'}</button></div>`;
}
function nextVotesCard(c){
  const lg=c.lg; if(!c.pick) return '';
  const r=c.rounds.find(r=>t(r.deadline)>now()); if(!r) return '';
  const who=(c.status==='upcoming'?c.mem:c.alive); if(!who.length) return '';
  const n=((c.info[r.k]||{}).n||(c.rounds.findIndex(x=>x.k===r.k)+1));
  if(!picksVisible(lg)){
    // Paris cachés : même encadré, joueurs visibles, choix et podium floutés (données factices : les vrais choix ne sont pas mis dans la page)
    const sides=[]; matchesOf(r).forEach(m=>{ sides.push(m.h, m.a); }); const F=i=>sides[i%Math.max(1,sides.length)]||{n:'Équipe'};
    const top=top3Bars([0,3,6].map((k,i)=>[F(k).n,[42,25,13][i],[F(k)]]),'',n);
    const list=who.map((u,i)=>{ const sd=F(i*5+1); return `<div class="nv-r">${avatarOf(u)}<span class="nv-n">${esc(nameOf(u))}${u===S.me?' <em>(toi)</em>':''}</span><span class="nv-p nv-bl" aria-hidden="true">${logoTag(sd,'nv-lg')}<b>${esc(sd.n)}</b></span></div>`; }).join('');
    return `<div class="card nv nv-hid"><div class="stitle">${IC.eye} Paris de la journée ${n}</div><div class="nv-fh"><div class="nv-bl" aria-hidden="true">${top}</div><div class="nv-lock">${IC.eyeOff}<b>Les choix de la journée seront révélés le ${fmtDT(r.deadline)}</b></div></div><div class="nv-list">${list}</div></div>`;
  }

  const rows=[], cnt={}, none=[], logoK={}; let bold=null;
  who.forEach(u=>{ const p=pickOf(u,lg.id,r.k);
    if(!p){ none.push(u); return; }
    pickSides(p).forEach(x=>{ const m=(r.matches||{})[x.m]; if(!m) return; const sd=x.p==='H'?m.h:x.p==='A'?m.a:null; const key=x.p==='D'?'Nul '+m.h.n+' – '+m.a.n:sd.n; cnt[key]=(cnt[key]||0)+1; if(!logoK[key]) logoK[key]=x.p==='D'?[m.h,m.a]:[sd];
      if(sd){ const rk=sideRank(lg,m,sd); if(rk){ if(!bold||rk>bold.rk) bold={rk,n:sd.n,us:[u]}; else if(rk===bold.rk && !bold.us.includes(u)) bold.us.push(u); } } });
    rows.push([u,p]); });
  const me=pickOf(S.me,lg.id,r.k), sameU=me?rows.filter(([u,p])=>u!==S.me&&p.m===me.m&&p.p===me.p).map(([u])=>u):[], same=sameU.length;
  const names=us=>us.map(u=>`<b>${esc(nameOf(u))}</b>`).join(', ').replace(/, ([^,]*)$/,' et $1');
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
  const fun=[];
  const tot=rows.length; const top3=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3);
  if(top3.length) fun.push(['top3',top3Bars(top3.map(([k,v])=>[k,Math.round(v*100/tot),logoK[k]||[]]),'',n)]);
  const list=rows.map(([u,p])=>`<div class="nv-r">${avatarOf(u)}<span class="nv-n">${esc(nameOf(u))}${u===S.me?' <em>(toi)</em>':''}</span><span class="nv-p">${pickSides(p).map(x=>{ const m=(r.matches||{})[x.m]; if(!m) return ''; const sd=x.p==='H'?m.h:x.p==='A'?m.a:null; return sd?`${logoTag(sd)}<b>${esc(sd.n)}</b>`:(logoOf(m.h)&&logoOf(m.a)?`${logoTag(m.h)}<b>Nul</b>${logoTag(m.a)}`:`<b>Nul</b> <small>(${esc(m.h.n)} – ${esc(m.a.n)})</small>`); }).join('<i>+</i>')}</span></div>`).join('')
    + none.map(u=>`<div class="nv-r off">${avatarOf(u)}<span class="nv-n">${esc(nameOf(u))}</span><span class="nv-p"><small>pas encore choisi</small></span></div>`).join('');
  return `<div class="card nv"><div class="stitle">${IC.eye} Paris de la journée ${n}</div>${fun.map(([k,v])=>v).join('')}<div class="nv-list">${list}</div><div class="muted" style="font-size:12px;margin-top:8px">Les choix peuvent encore changer jusqu’à l’heure limite (${fmtDT(r.deadline)}).</div></div>`;
}
function journeyData(c,u){
  const lg=c.lg; const out=[];
  for(const r of c.rounds){ if(t(r.deadline)>now()) break; const ri=c.info[r.k]||{}; if(!ri.aliveBefore||!ri.aliveBefore.includes(u)) continue;
    const p=pickOf(u,lg.id,r.k); let ok=null;
    if(c.points){ const sc=(ri.pts||{})[u]; ok=sc===3?true:sc===1?'c':sc===0?false:null; }
    else if(ri.state==='done'||ri.state==='tiebreak') ok=!ri.out.includes(u); else if(ri.state==='cancelled') ok='c';
    let logo=''; if(c.pick&&p&&r.matches&&r.matches[p.m]){ const m=r.matches[p.m]; const sd=p.p==='H'?m.h:p.p==='A'?m.a:null; logo=sd&&logoOf(sd)||''; }
    out.push({n:ri.n||(c.rounds.findIndex(x=>x.k===r.k)+1), label:p?pickLabel(lg,r,p):'Pas de choix', logo, ok, rk:c.pick?pickRank(lg,r,p):null});
  }
  return out;
}
function journey(c,u,o={}){
  const items=journeyData(c,u);
  const st=c.points?(c.firsts.includes(u)?'🏆 Vainqueur':(c.lastRule==='wins'&&c.lasts.includes(u))?'🏆 Vainqueur (dernier)':(c.lastRule==='drink'&&c.lasts.includes(u))?'🍺 Dernier · doit un verre':`${(c.rankOf[u]||{}).pos||'–'}${(c.rankOf[u]||{}).pos===1?'er':'e'} · ${c.pts[u]||0} pt${(c.pts[u]||0)>1?'s':''}`):c.winners.includes(u)?'🏆 Vainqueur':c.alive.includes(u)?'💚 Toujours en vie':`☠️ Éliminé à la J${(c.info[c.elimAt[u]]||{}).n||'?'}`;
  let h=`<div class="card jcard"><div class="jhead"><div>${o.title?`<div class="jt">${leagueTitle(c.lg.name)}</div>`:''}<div class="jst">${esc(nameOf(u))} · ${st}</div></div>${o.share?`<button class="btn sm ghost" data-a="shareJourney" data-v="${c.lg.id}">${I.share} PARTAGER</button>`:''}</div>`;
  if(!items.length) return h+`<div class="muted" style="margin-top:10px">Aucune journée jouée pour l'instant.</div></div>`;
  h+=`<div class="frise">${items.map(x=>`<div class="fj ${x.ok===true?'ok':x.ok===false?'ko':x.ok==='c'?'cx':'wait'}"><span class="fn">J${x.n}</span><span class="fl">${x.logo?`<img src="${esc(x.logo)}" data-fb="" alt="">`:esc(initials(x.label).slice(0,2))}</span><span class="fm">${x.ok===true?'✓':x.ok===false?'✗':x.ok==='c'?'=':'…'}</span><span class="ft">${esc(x.label)}${x.rk?` <em>${x.rk}e</em>`:''}</span></div>`).join('')}</div></div>`;
  return h;
}
function journeyText(c,u){
  const items=journeyData(c,u);
  const st=c.points?`${(c.rankOf[u]||{}).pos||'–'}${(c.rankOf[u]||{}).pos===1?'er':'e'} avec ${c.pts[u]||0} pts`:c.winners.includes(u)?'🏆 vainqueur':c.alive.includes(u)?'toujours en vie 💚':`éliminé à la J${(c.info[c.elimAt[u]]||{}).n||'?'} ☠️`;
  return `Mon parcours ${c.lg.name} : `+items.map(x=>`J${x.n} ${x.label} ${x.ok===true?'✅':x.ok===false?'❌':x.ok==='c'?'➖':'⏳'}`).join(' · ')+` — ${st}`;
}
function standingRows(c){
  const lg=c.lg, order={}; c.rounds.forEach((r,i)=>order[r.k]=i);
  const score=u=>{ if(c.alive.includes(u)) return [1e6, c.winners.includes(u)?1:0]; const rk=c.elimAt[u]; const r=lg.rounds[rk]; const pr=r?pickRank(lg,{...r,k:rk},pickOf(u,lg.id,rk)):null; return [order[rk]??-1, pr||0]; };
  const list=c.mem.map(u=>({u,s:score(u)}));
  list.sort((a,b)=>b.s[0]-a.s[0]||b.s[1]-a.s[1]||nameOf(a.u).localeCompare(nameOf(b.u)));
  return list.map(x=>{ const better=list.filter(y=>y.s[0]>x.s[0]||(y.s[0]===x.s[0]&&y.s[1]>x.s[1])).length; const tie=list.filter(y=>y!==x&&y.s[0]===x.s[0]&&y.s[1]===x.s[1]).length>0; return {u:x.u,pos:better+1,tie}; });
}
// En-tête de page ligue : carte noire (retour, gérer, titre, 3 infos, jauge)
function leagueHero(c, lid){
  const lg=c.lg, mine=isMember(lid), alive=c.alive.includes(S.me);
  const title=leagueTitle(lg.name).replace(/src="img\/(survivor|race|oneshot|merguez|x)\.png/g,'src="img/$1-white.png');
  const curR=c.rounds.find(r=>t(r.deadline)>now())||c.rounds[c.rounds.length-1];
  const jn=curR?((c.info[curR.k]||{}).n||(c.rounds.indexOf(curR)+1)):0;
  const cal='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
  const n=c.mem.length, chips=[]; let gauge='';
  const G=(w,l,r)=>`<div class="lh-g"><div class="bar"><i style="width:${Math.max(2,Math.min(100,w))}%"></i></div><small><span>${l}</span><span>${r||''}</span></small></div>`;
  if(c.status==='upcoming'){
    if(mine) chips.push(['ok',`${IC.check}Inscrit`]);
    chips.push(['pl',`${n} joueur${n>1?'s':''}`],['',`${IC.clock}${shortDur(t(lg.startAt))}`]);
  } else if(c.points){
    const me=c.rankOf[S.me]||{};
    if(c.status==='finished') chips.push(['ok',wonBy(c,S.me)?`${IC.trophy}Gagnant`:'Terminée']);
    else if(mine) chips.push(['ok',`${me.pos||'–'}${me.pos===1?'er':'e'}`]);
    if(mine) chips.push(['pl',`${me.pts||0} / ${c.N} pts`]); else chips.push(['pl',`${n} joueurs`]);
    if(c.status!=='finished') chips.push(['',`${cal}J${jn}`]);
    if(mine && c.status!=='finished'){ const lead=Math.max(0,...Object.values(c.pts||{})); gauge=G((me.pts||0)*100/c.N,`<b>${me.pts||0} pts</b> sur ${c.N} pour gagner`,`le 1er a ${lead} pt${lead>1?'s':''}`); }
  } else {
    if(c.status==='finished') chips.push(['ok',c.winners.includes(S.me)?`${IC.trophy}Gagnant`:'Terminée']);
    else if(mine) chips.push(alive?['ok','En vie']:['bad',`Éliminé J${(c.info[c.elimAt[S.me]]||{}).n||'?'}`]);
    if(mine && alive && c.status!=='finished' && (+lg.lives>0||lg.redLantern)) chips.push(['',`${CI.heart}${(c.lives||{})[S.me]||0}`]);
    else chips.push(['pl',`${n} joueurs`]);
    if(c.status!=='finished') chips.push(['',`${cal}J${jn}`]);
    const done=c.rounds.filter(r=>['done','cancelled'].includes((c.info[r.k]||{}).state)).length;
    gauge=G(c.alive.length*100/Math.max(1,n),`<b>${c.alive.length} survivant${c.alive.length>1?'s':''}</b> sur ${n}`,done?`après ${done} journée${done>1?'s':''}`:'');
  }
  return `<div class="lh-backw"><button class="lh-back" data-a="back" aria-label="Retour">${I.back}</button></div><div class="lhero ${canManage(lg)?'adm':''}">${canManage(lg)?`<button class="lh-c lh-gear" data-a="manage" data-v="${lid}" aria-label="Gérer la ligue">${I.gear}</button>`:''}${title}<div class="lh-chips" style="grid-template-columns:repeat(${chips.length},1fr)">${chips.map(([k,x])=>k==='pl'?`<button class="lh-chip pl" data-a="ltab" data-v="surv">${x}</button>`:`<span class="lh-chip ${k}">${x}</span>`).join('')}</div>${gauge}</div>`;
}
function viewLeague(lid){
  const c=C(lid);
  if(!c) return `<div class="empty"><div class="ico">🤷</div><h3>LIGUE INTROUVABLE</h3><p>Elle a peut-être été supprimée.</p><button class="btn" data-a="back">RETOUR</button></div>`;
  const lg=c.lg, mine=isMember(lid), alive=c.alive.includes(S.me);
  let pill='';
  const me_=c.points&&c.rankOf[S.me];
  if(c.points && mine && c.status!=='upcoming') pill = wonBy(c,S.me)?'<span class="pill round" style="background:var(--brand)">🏆 GAGNANT</span>':`<span class="pill round">${me_.pos}${me_.pos===1?'er':'e'} · ${me_.pts} PT${me_.pts>1?'S':''}</span>`;
  else if(mine && c.status!=='upcoming') pill = wonBy(c,S.me)?'<span class="pill round" style="background:var(--brand)">🏆 GAGNANT</span>':alive?'<span class="pill round green"><span class="dot"></span>EN VIE</span>':'<span class="pill round red"><span class="dot"></span>ÉLIMINÉ</span>';
  else if(mine) pill='<span class="pill round green">INSCRIT</span>';
  let h=leagueHero(c,lid);
  if(c.points && c.status==='finished') h+= c.firsts.includes(S.me)?`<div class="banner win"><span class="ico">🏆</span>Tu es le premier à ${c.N} points : tu gagnes la ligue !</div>`:`<div class="banner dead"><span class="ico">🏁</span>Ligue terminée · ${c.firsts.map(w=>esc(nameOf(w))).join(' & ')} ${c.firsts.length>1?'gagnent':'gagne'} en atteignant ${c.N} points</div>`;
  else if(c.status==='finished') h+= c.winners.includes(S.me)?`<div class="banner win"><span class="ico">🏆</span>${c.winners.length>1?'Tu fais partie des 2 derniers survivants !':'Tu es le grand gagnant !'}</div>`:`<div class="banner dead"><span class="ico">🏁</span>Ligue terminée · ${c.winners.map(w=>esc(nameOf(w))).join(' & ')} ${c.winners.length>1?'gagnent':'gagne'}</div>`;
  else if(!mine) h+= c.status==='upcoming'?`<div class="banner info"><span class="ico">🎟️</span><div style="flex:1">Inscriptions ouvertes jusqu'au ${fmtDT(lg.startAt)}</div><button class="btn sm green" data-a="join" data-v="${lid}">JE M'INSCRIS</button></div>`:`<div class="banner info"><span class="ico">🔒</span>Inscriptions closes. Tu suis la ligue en spectateur.</div>`;
  h+=lastBanner(c);
  h+=prizeTicket(lg)+inviteCard(c)+elimCard(c)+recapTeaser(c);
  const tab=S.view.ltab==='hist'?'surv':S.view.ltab;
  h+=`<div class="seg"><button class="${tab==='paris'?'on':''}" data-a="ltab" data-v="paris">${c.pick?'Paris':'Vote'}</button><button class="${tab==='surv'?'on':''}" data-a="ltab" data-v="surv">${c.points?'Classement':'Survivants'}</button></div>`;
  if(tab==='paris'){
    const open=[openR(c)].filter(Boolean);
    const waiting=c.rounds.filter(r=>t(r.deadline)<=now() && ['waiting'].includes((c.info[r.k]||{}).state));
    if(c.status==='finished') h+=`<div class="empty"><div class="ico">🏁</div><h3>C'EST FINI</h3><p>Revis la ligue dans l'historique.</p></div>`+rulesCard(lg);
    else {
      if(open.length) h+=open.map(r=>`<div class="jbig">${c.pick?'Journée':'Question'} ${((c.info[r.k]||{}).n||(c.rounds.findIndex(x=>x.k===r.k)+1))}</div><div class="jsub">${I.clock}<span>Choix ouvert jusqu'au ${fmtDT(r.deadline)}</span></div>`+(c.pick?statsCard(c):'')+jokersCard(c,r)+myUsedLine(c,r)+roundCard(c,r,{header:`<h3>${c.pick?'Mon choix':'Mon vote'}</h3>`, noDl:true})).join('');
      else if(pendR(c)&&c.rounds.some(r=>t(r.deadline)>now())) h+=`<div class="card muted" style="text-align:center;font-size:15px">⏳ La prochaine journée s'ouvrira dès que les résultats de la journée en cours seront connus.</div>`;
      else h+=(c.pick?statsCard(c):'')+`<div class="card muted" style="text-align:center;font-size:15px">Pas de journée ouverte pour l'instant.${canManage(lg)?' Importe la prochaine depuis « Gérer la ligue ».':' La prochaine arrive bientôt !'}</div>`;
      h+=rulesCard(lg);
      if(waiting.length) h+=`<div class="sec2">EN ATTENTE DES RÉSULTATS</div>`+waiting.map(r=>roundCard(c,r)).join('');
    }
  } else if(tab==='surv' && c.points){
    h+=prizeBand(lg,'big')+raceRanking(c);
  } else if(tab==='surv'){
    h+=prizeBand(lg,'big')+survivorsView(c);
  } else {
    h+=nextVotesCard(c);
    const tr=trendSection(c); if(tr) h+=`<div class="card">${tr}</div>`;
    const past=c.rounds.filter(r=>t(r.deadline)<=now()).reverse();
    if(!past.length) h+=`<div class="empty"><h3>RIEN POUR L'INSTANT</h3><p>Les journées passées apparaîtront ici.</p></div>`;
    past.forEach(r=>{
      h+=roundCard(c,r,{hint:false});
      const ri=c.info[r.k]||{}; const voters=(ri.aliveBefore||[]);
      if(voters.length) h+=`<div class="card" style="margin-top:-6px"><span class="lbl">Choix des joueurs</span>`+voters.map(u=>{ const p=pickOf(u,lid,r.k); const res=c.pick&&p?(ri.res||{})[p.m]:null; const ok=c.pick?(p&&res&&res===p.p):(p&&ri.win?p.p===ri.win:null); return `<div class="prow">${avatarOf(u)}<div class="nm">${esc(nameOf(u))}<small>${p?esc(pickLabel(lg,r,p)):'pas de choix'}</small></div>${c.points?(ri.pts&&ri.pts[u]!==undefined?`<span class="pill ${ri.pts[u]===3?'green':ri.pts[u]===1?'grey':'red'}">+${ri.pts[u]}</span>`:''):ri.state==='done'?(ri.out.includes(u)?'<span class="pill red">Éliminé</span>':'<span class="pill green">OK</span>'):ok===null||ri.state!=='done'?'':''}</div>`; }).join('')+'</div>';
    });
  }
  return h;
}

function viewParis(){
  let h=`<div class="ptitle">${titleImg('title-mes-paris.png','MES PARIS')}</div>`;
  const my=Object.keys(S.leagues).filter(lid=>isMember(lid)&&shownL(lid)).map(C).filter(Boolean);
  if(!my.length) return h+`<div class="empty"><div class="ico">🎟️</div><h3>AUCUNE LIGUE</h3><p>Inscris-toi à une ligue pour jouer.</p><button class="btn" data-a="tab" data-v="ligues">VOIR LES LIGUES</button></div>`;
  const next=[], wait=[], hist=[];
  my.forEach(c=>{
    const alive=c.alive.includes(S.me);
    const open=openR(c);
    if(open && alive && c.status!=='finished') next.push([c,open]);
    c.rounds.forEach(r=>{ const ri=c.info[r.k]||{}; const p=pickOf(S.me,c.lg.id,r.k); if(t(r.deadline)<=now() && p){ if(ri.state==='waiting') wait.push([c,r]); else if(ri.state==='done'||ri.state==='cancelled') hist.push([c,r,p,ri]); } });
  });
  next.sort((a,b)=>t(a[1].deadline)-t(b[1].deadline));
  const hdr=(c,r)=>{ const n=(c.info[r.k]||{}).n; const sb=splitBrand(c.lg.name), m=sb?[0,sb.rest]:null;
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px"><span style="font-family:var(--bold);font-weight:800;font-size:16px;display:flex;align-items:center;gap:8px;min-width:0">${m?`<span style="font-size:15px">${WM(sb.k)}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-flex;align-items:center">${xify(esc(m[1]))}</span>`:esc(c.lg.name)}</span><span class="muted hdr-r" style="font-size:14px;white-space:nowrap">${c.pick?'JOURNÉE':'QUESTION'} ${n||''} · ${fmtD(r.deadline)}</span></div>`; };
  h+=`<div class="sec" style="margin-top:4px">Prochaine journée (${next.length})</div>`;
  if(!next.length) h+=`<div class="card muted" style="text-align:center;font-size:15px">Rien à jouer pour le moment 👌</div>`;
  next.forEach(([c,r])=>{
    const my=pickOf(S.me,c.lg.id,r.k); const nm=c.pick?matchesOf(r).length:0;
    const info=`<div class="dl open mdl" style="font-size:15px">Modifiable jusqu'au ${fmtDT(r.deadline)}</div>`;
    let card=roundCard(c,r,{header:`<h3>${c.pick?'Mon choix':'Mon vote'}</h3>`+info, compact:true, mline:true, hint:false});
    card=card.replace(/<div class="dl open">[\s\S]*?<\/div>/,''); // header already shows deadline
    // Encart déroulant par ligue : ouvert par défaut tant que le choix n'est pas fait
    const k='mp'+c.lg.id, todo=!my, op=(k in S.open)?S.open[k]:todo;
    const pkLogos=(!todo&&c.pick)?pickSides(my).map(x=>{ const m=(r.matches||{})[x.m]; if(!m) return ''; return x.p==='D'?logoTag(m.h,'mp-lg')+logoTag(m.a,'mp-lg'):logoTag(x.p==='H'?m.h:m.a,'mp-lg'); }).join(''):'';
    const pill=todo?`<span class="mp-st todo">À valider · ${until(r.deadline)||"1 min"}</span>`:`<span class="mp-st ok">✓ Choix fait${pkLogos?`<span class="mp-lgs">${pkLogos}</span>`:''}</span>`;
    h+=`<details class="mpl" ${op?'open':''}><summary class="mp-sum" data-a="mpTog" data-v="${c.lg.id}|${todo?1:0}"><div class="mp-nm">${(()=>{const sb=splitBrand(c.lg.name);return sb?`${WM(sb.k)}<span>${xify(esc(sb.rest))}</span>`:`<span>${esc(c.lg.name)}</span>`})()}</div><div class="mp-row">${pill}${(()=>{ const n=(jokerOn(c.lg)&&!jokerRound(c.lg.id,S.me)?1:0)+(saboOn(c.lg)&&!mySabo(c.lg.id)?1:0); return n?'<span class="mp-st jk" title="Jokers disponibles">'+JOKER_ICO+n+' joker'+(n>1?'s':'')+'</span>':''; })()}<span class="mp-d">${c.pick?'J':'Q'}${((c.info[r.k]||{}).n||(c.rounds.findIndex(x=>x.k===r.k)+1))} · ${fmtD(r.deadline).slice(0,5)}</span>${I.chev}</div></summary><div class="mp-body">${c.pick?statsCard(c):''}${jokersCard(c,r)}${card}</div></details>`;
  });
  if(wait.length){ h+=`<div class="sec2">EN ATTENTE DES RÉSULTATS</div>`; wait.forEach(([c,r])=>{ h+=`<div class="card"><div class="mp-nm wt">${(()=>{const sb=splitBrand(c.lg.name);return sb?`${WM(sb.k)}<span>${xify(esc(sb.rest))}</span>`:esc(c.lg.name);})()}</div><div style="font-family:var(--bold);font-weight:700;font-size:14px;margin-top:6px">Journée ${((c.info[r.k]||{}).n||(c.rounds.findIndex(x=>x.k===r.k)+1))}</div><div class="muted" style="margin-top:4px">Ton choix : <b style="color:var(--on)">${esc(pickLabel(c.lg,r,pickOf(S.me,c.lg.id,r.k)))}</b></div></div>`; }); }
  return h;
}


function fmtBlock(fmt, act, lid, nr, locked){
  const v=lid?lid+'|':'';
  return `<label class="f fbig">Format</label><div class="chips in" style="flex-wrap:wrap"><button class="chip sm fmtchip ${fmt!=='points'?'on':''}" ${locked?'disabled':`data-a="${act}" data-v="${v}survivor"`} aria-label="Survivor">${WM('survivor', fmt!=='points')}</button><button class="chip sm fmtchip ${fmt==='points'?'on':''}" ${locked?'disabled':`data-a="${act}" data-v="${v}points"`} aria-label="Race">${WM('oneshot', fmt==='points')}</button></div>`+
    (fmt==='points'?`<div class="help" style="margin:-4px 0 10px">Chaque journée, on choisit une équipe : victoire 3 pts, nul 1 pt, défaite 0. Jamais 2 fois la même équipe. Le premier à atteindre l'objectif gagne ; égalité = meilleur goal-average.</div><label class="f">Points à atteindre pour gagner</label><div class="nrange"><input type="range" min="10" max="40" step="1" id="${lid?'ei-nr':'nl-nr'}" value="${Math.min(40,Math.max(10,+nr||POINTS_N))}" ${locked?'disabled':''} oninput="this.nextElementSibling.firstChild.textContent=this.value"><b>${Math.min(40,Math.max(10,+nr||POINTS_N))}<small> pts</small></b></div><div class="help" style="margin:-2px 0 10px">Entre 10 et 40 points.</div>`
      :`<div class="help" style="margin:-4px 0 10px">Un mauvais pari et tu es éliminé. Le dernier en vie gagne.</div>`);
}
function viewAdmin(){
  if(S.view.manage) return viewManage(S.view.manage);
  const owner=S.isOwner;
  let h=`<div class="ptitle">${owner?titleImg('title-admin.png','ADMIN'):titleImg('title-ma-ligue.png','MA LIGUE')}<div class="sub">${owner?'Crée et gère les ligues.':'Crée ta ligue : tous les joueurs la verront, et tu peux aussi inviter tes proches avec son code.'}</div></div>`;
  const mineL = (owner ? Object.values(S.leagues) : Object.values(S.leagues).filter(l=>l.id===S.me)).filter(l=>shownL(l.id));
  if(owner || !mineL.length){
    const d=new Date(now()+864e5); d.setHours(20,0,0,0);
    const k=S.view.newCat, cc=cat(k);
    h+=`<div class="card"><div class="ctitle" style="margin-bottom:18px">Créer une ligue</div>
      <label class="f">Nom</label>${pfxInput('nl-name','','','Ligue des potes', (cc.mode==='pick'&&S.view.newFmt==='points')?'oneshot':(cc.mode==='pick'&&S.view.newMerguez)?'merguez':'survivor')}
      <label class="f fbig">Catégories</label><div class="chips in">${Object.entries(CATS).filter(([kk])=>!HIDDEN_CATS.includes(kk)).map(([kk,v])=>`<button class="chip ${kk===k?'on':''}" data-a="newCat" data-v="${kk}">${esc(v.label)}</button>`).join('')}</div>
      <div class="help" style="margin:0">${cc.mode==='pick'?`Chaque joueur choisit UN seul match par journée et parie dessus. Interdit de reprendre une équipe déjà jouée.${cc.draw&&S.view.newFmt!=='points'&&!S.view.newMerguez?' Le match nul peut être parié.':''}`:'Chaque question oppose 2 options : ceux qui votent comme la minorité sont éliminés.'}</div>
      ${cc.mode==='pick'?fmtBlock(S.view.newFmt,'newFmt',null,POINTS_N,false):''}
      ${cc.mode==='pick'?optionsBlock({merguez:S.view.newMerguez&&S.view.newFmt!=='points',lastRule:S.view.newLast,lives:S.view.newLives,joker:S.view.newJoker,sabotage:S.view.newSabotage,redLantern:S.view.newLantern,picksVis:S.view.newVis},S.view.newFmt==='points','newLives',null,false):''}
      <label class="f">Fin des inscriptions (date + heure)</label><div class="row2"><input class="in" type="date" id="nl-date" value="${dateIn(d)}"><input class="in" type="time" id="nl-time" value="20:00"></div>
      <button class="btn pop full" style="margin-top:18px" data-a="createLeague">CRÉER LA LIGUE</button></div>`;
  }
  if(mineL.length){
    if(owner) h+=`<div class="card exp"><div><b>📧 E-mails des joueurs</b><small>Télécharge la liste des inscrits (pseudo, e-mail, ligues) au format CSV, pour Excel ou Google Sheets.</small></div><button class="btn sm brand" data-a="exportEmails">Exporter</button></div>`;
    h+=`<div class="sec">${owner?'Gérer les ligues':'Ma ligue'}</div>`;
    mineL.map(l=>C(l.id)).filter(Boolean).sort((a,b)=>(+(b.lg.pin||0))-(+(a.lg.pin||0)) || t(b.lg.createdAt)-t(a.lg.createdAt)).forEach(c=>{
      const todo=c.rounds.filter(r=>(c.info[r.k]||{}).state==='waiting').length;
      h+=`<button class="lrow" data-a="manage" data-v="${c.lg.id}"><span class="th">${coverHtml(c.lg)}</span><span class="x">${leagueTitle(c.lg.name)}<small>${c.lg.pin?'⭐ En premier · ':''}${c.mem.length} joueurs · ${c.rounds.length} journées · code ${esc(c.lg.code||'')}${c.lg.createdBy&&c.lg.createdBy!==S.me?`<em class="byu">Créée par ${esc(nameOf(c.lg.createdBy))}</em>`:''}</small></span>${todo?'<span class="pill orange">Résultats</span>':statusPill(c)}</button>`;
    });
  }
  return h;
}

function viewManage(lid){
  const c=C(lid); if(!c||!canManage(c.lg)){ S.view.manage=null; return viewAdmin(); }
  const lg=c.lg, cc=cat(lg.category);
  let h=`<div class="mhead"><button class="back" data-a="unmanage">${I.back}</button><div class="grow" style="min-width:0"><div class="cat">${esc(cc.label)}</div>${leagueTitle(lg.name,'inline')}</div></div>`;
  h+=`<div class="card codebox"><div class="lbl">Code de la ligue</div><div class="code">${esc(lg.code||'—')}</div><div class="help" style="margin:0 0 16px">Partage ce code à tes proches pour qu'ils rejoignent la ligue.</div><button class="btn pop" data-a="shareCode" data-v="${lid}">${I.share} PARTAGER LE CODE</button></div>`;
  if(S.isOwner) h+=`<div class="card"><label class="auto-sw" style="margin:0"><input type="checkbox" ${lg.pin?'checked':''} data-a="togglePin" data-v="${lid}"> ⭐ Afficher en premier sur l'accueil</label><div class="help" style="margin:8px 0 0">La ligue passe en tête de la liste « Les ligues ». Si plusieurs ligues sont cochées, la dernière cochée est la première.</div></div>`;
  // info
  const sd=new Date(lg.startAt);
  h+=`<div class="card"><div class="h-disp">NOM &amp; RÉGLAGES</div>
    <label class="f">Nom de la ligue</label>${pfxInput('ei-name','w',stripPrefix(lg.name),'Ligue 1', isPoints(lg)?'oneshot':isMerguez(lg)?'merguez':'survivor')}
    ${S.isOwner&&!lg.private?`<label class="f">Lot à gagner (optionnel)</label><div style="display:flex;gap:8px"><input class="in" style="width:90px;flex:none" id="ei-prizev" maxlength="10" placeholder="50€" value="${esc(prizeValOf(lg))}"><input class="in w" id="ei-prize" maxlength="80" placeholder="en bon d'achat Decathlon" value="${esc(prizeOf(lg))}"></div><div class="help" style="margin:-4px 0 12px">Montant (ex. 50€) et lot (ex. en bon d'achat Decathlon) : affichés dans un ticket sur la page de la ligue et sur sa vignette.</div>`:''}
    ${c.status==='upcoming'?`<label class="f">Date de début (fin des inscriptions)</label><div class="row2"><input class="in w" type="date" id="ei-date" value="${dateIn(sd)}"><input class="in w" type="time" id="ei-time" value="${timeIn(sd)}"></div><div class="help">La ligue démarre le ${fmtDT(lg.startAt)}.</div>`:''}
    ${isPickMode(lg)?fmtBlock(isPoints(lg)?'points':'survivor','setFmt',lid,lg.target,c.rounds.some(r=>t(r.deadline)<=now())):''}
    ${isPickMode(lg)?optionsBlock(lg,isPoints(lg),'setLives',lid,c.status!=='upcoming'):''}
    <label class="f fbig">Catégories</label><div class="chips in" style="flex-wrap:wrap">${Object.entries(CATS).filter(([kk])=>!HIDDEN_CATS.includes(kk)).map(([k,v])=>`<button class="chip sm ${k===lg.category?'on':''}" ${c.rounds.length?'disabled title="Catégorie figée après la 1re journée"':`data-a="setCat" data-v="${lid}|${k}"`}>${esc(v.label)}</button>`).join('')}</div>
    ${cc.comps.length?`<label class="f">Championnat</label><div class="chips in" style="flex-wrap:wrap">${cc.comps.map(k=>`<button class="chip sm ${k===lg.comp?'on':''}" data-a="setComp" data-v="${lid}|${k}">${esc(COMP_NAMES[k])}</button>`).join('')}</div><div class="help" style="margin:-4px 0 12px;font-size:13px">Sert pour le classement, les stats et l'import des journées.</div>`:''}
    <button class="btn pop full" style="margin-top:6px" data-a="saveInfo" data-v="${lid}">ENREGISTRER</button></div>`;
  // cover
  const cur=lg.cover||'auto', shown=coverKey(lg);
  h+=`<div class="card"><div class="h-disp" style="font-size:24px">PHOTO DE LA LIGUE</div><div class="bigcover">${coverHtml(lg)}</div>${isPhoto(shown)?`<div class="credit">${creditLine(shown)}</div>`:''}
    <div class="covers"><button class="auto ${cur==='auto'?'on':''}" data-a="setCover" data-v="${lid}|auto">${I.sparkle}AUTO</button>${PHOTOS.map(p=>`<button class="${cur===p.k?'on':''}" data-a="setCover" data-v="${lid}|${p.k}">${coverImg(p.k)}${esc(p.label)}</button>`).join('')}</div>
    <div class="help" style="margin:-4px 0 12px;font-size:13px">« Auto » attribue une de ces photos à la ligue.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn line full" data-a="cropCover" data-v="${lid}">${I.crop} RECADRER</button><button class="btn line full" data-a="uploadCover" data-v="${lid}">${I.image} IMPORTER</button></div></div>`;
  // import
  if(c.pick && cc.comps.length){
    const comp=S.view.comp && cc.comps.includes(S.view.comp) ? S.view.comp : cc.comps[0];
    if(S.view.comp!==comp){ S.view.comp=comp; }
    loadFeed(comp);
    const f=S.feeds[comp];
    h+=`<div class="card"><div class="h-disp">JOURNÉES</div><div class="help" style="margin:-4px 0 12px">Les journées du championnat s'ajoutent <b>automatiquement</b>, jusqu'à 3 semaines à l'avance, avec une heure limite au premier match. Les résultats se remplissent tout seuls. Tu peux aussi en ajouter une à la main ci-dessous.</div>
      <label class="auto-sw"><input type="checkbox" ${lg.autoImport===false?'':'checked'} data-a="toggleAuto" data-v="${lid}"> Ajout automatique des journées</label>
      <div class="chips in">${cc.comps.map(k=>`<button class="chip sm ${k===comp?'on':''}" data-a="comp" data-v="${k}">${esc(COMP_NAMES[k])}</button>`).join('')}</div>`;
    if(!f) h+=`<div class="spin" style="margin:20px auto"></div>`;
    else if(f.missing||!f.rounds) h+=`<div class="muted">Calendrier indisponible pour cette compétition.</div>`;
    else {
      const rs=f.rounds.filter(r=>t(r.e)>now()-6*36e5).slice(0,8);
      if(!rs.length) h+=`<div class="muted">Aucune journée à venir dans le calendrier.</div>`;
      rs.forEach(r=>{
        const rk=(comp+'_'+r.k).replace(/[^A-Za-z0-9_-]/g,'_'); const done=lg.rounds&&lg.rounds[rk]; const started=t(r.s)<=now();
        h+=`<div class="imp"><div class="x"><b>${r.n?'J'+r.n+' · ':''}${esc(fmtShort(r.s))} → ${esc(fmtShort(r.e))}</b><span>${r.ev.length} matchs · <a data-a="peek" data-v="${esc(r.k)}">voir</a></span>
          ${S.open['peek'+r.k]?`<ul class="imp-list">${r.ev.map(id=>{ const e=f.events[id]||{}; const a=teamOf(f,e.h), b=teamOf(f,e.a); return `<li>${logoOf(a)?`<img src="${esc(logoOf(a))}" data-fb="" alt="">`:''}${esc(a.n)} – ${esc(b.n)}${logoOf(b)?`<img src="${esc(logoOf(b))}" data-fb="" alt="">`:''}<span class="muted">${esc(fmtShort(e.d))}</span></li>`; }).join('')}</ul>`:''}</div>
          ${done?'<span class="done">IMPORTÉE ✓</span>':started?'<span class="done" style="color:var(--muted)">COMMENCÉE</span>':`<button class="btn" data-a="importRound" data-v="${lid}|${esc(r.k)}">IMPORTER</button>`}</div>`;
      });
      h+=`<div class="muted" style="font-size:12px;margin-top:6px">Calendrier mis à jour le ${fmtDT(f.updatedAt)}</div>`;
    }
    h+=`</div>`;
  }
  // rules
  // registrations
  h+=`<div class="card"><div class="h-disp" style="font-size:24px">INSCRIPTIONS</div>${c.status==='upcoming'?`<div class="help green" style="margin:0 0 14px">Ouvertes jusqu'au ${fmtDT(lg.startAt)} · ${c.mem.length} inscrit${c.mem.length>1?'s':''}</div><button class="btn line full" data-a="startNow" data-v="${lid}">DÉMARRER MAINTENANT (CLÔTURER)</button>`:`<div class="help" style="margin:0">Closes depuis le ${fmtDT(lg.startAt)} · ${c.mem.length} inscrit${c.mem.length>1?'s':''}</div>`}</div>`;
  // manual create
  const d=new Date(now()+864e5); d.setHours(21,0,0,0);
  if(c.pick){
    const futureRounds=c.rounds.filter(r=>t(r.deadline)>now());
    h+=`<div class="card"><div class="h-disp" style="font-size:24px">CRÉER UN MATCH</div>
      <div class="row2 eq"><div><label class="f">Domicile</label><input class="in w" id="am-h" maxlength="40" placeholder="PSG"></div><div><label class="f">Extérieur</label><input class="in w" id="am-a" maxlength="40" placeholder="OM"></div></div>
      <label class="f">Date et heure du match</label><div class="row2"><input class="in w" type="date" id="am-d" value="${dateIn(d)}"><input class="in w" type="time" id="am-t" value="21:00"></div>
      <label class="f">Ajouter à</label><select class="in w" id="am-r"><option value="new">Nouvelle journée</option>${futureRounds.map(r=>`<option value="${r.k}">Journée ${((c.info[r.k]||{}).n||(c.rounds.findIndex(x=>x.k===r.k)+1))} (${fmtD(r.deadline)})</option>`).join('')}</select>
      <button class="btn pop full" style="margin-top:16px" data-a="addMatch" data-v="${lid}">AJOUTER LE MATCH</button></div>`;
  } else {
    const ti=S.tmpImg||{};
    h+=`<div class="card"><div class="h-disp" style="font-size:24px">CRÉER UNE QUESTION</div>
      <label class="f">Question</label><input class="in w" id="aq-q" maxlength="80" placeholder="Tu préfères ?">
      <div class="row2 eq"><div><label class="f">Option A</label><input class="in w" id="aq-a" maxlength="40" placeholder="Zidane"></div><div><label class="f">Option B</label><input class="in w" id="aq-b" maxlength="40" placeholder="Henry"></div></div>
      <label class="f">Photos (trouvées automatiquement, ou touche une moitié pour mettre la tienne)</label>
      ${duelEdit({n:S.qNames.a,img:ti.a},{n:S.qNames.b,img:ti.b},'data-a="qImg" data-v="a"','data-a="qImg" data-v="b"',S.qNames.q)}
      <button class="btn line sm full" style="margin-top:10px" data-a="autoImg">${I.sparkle}PHOTOS AUTOMATIQUES</button>
      <label class="f">Date limite du vote</label><div class="row2"><input class="in w" type="date" id="aq-d" value="${dateIn(d)}"><input class="in w" type="time" id="aq-t" value="20:00"></div>
      <button class="btn pop full" style="margin-top:16px" data-a="addQuestion" data-v="${lid}">AJOUTER LA QUESTION</button></div>`;
  }
  // rounds list
  if(c.rounds.length){
    h+=`<div class="sec">${c.pick?'Journées & résultats':'Questions'}</div>`;
    c.rounds.slice().reverse().forEach(r=>{
      const ri=c.info[r.k]||{}; const st={open:'<span class="pill">Ouverte</span>',waiting:'<span class="pill orange">Résultats</span>',done:'<span class="pill green">Terminée</span>',cancelled:'<span class="pill grey">Annulée</span>',after:'<span class="pill grey">—</span>'}[ri.state]||'';
      h+=`<div class="adm-round"><div class="t"><span>${c.pick?'Journée':'Question'} ${ri.n||''} · ${fmtShort(r.deadline)}</span>${st}</div>`;
      if(c.pick){
        matchesOf(r).forEach(m=>{
          const res=matchResult(lg,m); const sc=matchScore(lg,m);
          h+=`<div class="adm-m"><div class="mm">${logoTag(m.h,'')}${esc(m.h.n)} – ${esc(m.a.n)}${logoTag(m.a,'')} ${sc?`<b style="margin-left:auto">${esc(sc)}</b>`:''}</div>`;
          if(t(m.d)<=now()) h+=`<div class="res3">${['H','D','A'].filter(k=>k!=='D'||allowDraw(lg)).map(k=>`<button class="${m.result===k?'on':''} ${!m.result&&res&&res.auto&&res.r===k?'auto':''}" data-a="setRes" data-v="${lid}|${r.k}|${m.k}|${k}">${k==='H'?esc(m.h.n):k==='A'?esc(m.a.n):'Nul'}</button>`).join('')}</div>${res&&res.auto&&!m.result?'<div class="muted" style="font-size:11px;margin-top:4px">Résultat officiel automatique</div>':''}`;
          if(t(r.deadline)>now()) h+=`<button class="link grey" style="font-size:11px;margin-top:6px" data-a="delMatch" data-v="${lid}|${r.k}|${m.k}">${I.trash.replace('<svg','<svg width="14" height="14"')} retirer</button>`;
          h+=`</div>`;
        });
      } else {
        h+=`<div class="adm-m"><div class="mm">${esc(r.q||'')} : ${esc(r.a.n)} / ${esc(r.b.n)}</div>${ri.votes?`<div class="muted" style="font-size:12px;margin-top:4px">Votes : ${ri.votes.A} / ${ri.votes.B}</div>`:''}${duelEdit(r.a||{},r.b||{},`data-a="qImgFor" data-v="${lid}|${r.k}|a"`,`data-a="qImgFor" data-v="${lid}|${r.k}|b"`,r.q)}<button class="btn line sm full" style="margin-top:8px" data-a="autoImgFor" data-v="${lid}|${r.k}">${I.sparkle}PHOTOS AUTO</button></div>`;
      }
      if(t(r.deadline)>now()) h+=`<button class="link" style="font-size:12px;margin-top:10px" data-a="delRound" data-v="${lid}|${r.k}">${I.trash.replace('<svg','<svg width="14" height="14"')} Supprimer</button>`;
      h+=`</div>`;
    });
  }
  h+=`<button class="btn danger full" style="margin-top:22px" data-a="delLeague" data-v="${lid}">SUPPRIMER LA LIGUE</button>`;
  return h;
}

// ---------- Sondages (questions de l'organisateur ; ajouter les nouvelles en haut de la liste)
const POLLS=[
  {id:'looser', q:'Pouvoir créer des ligues LOOSER : tu dois parier sur une équipe qui va perdre pour survivre.', a:[['J’aime l’idée !','thumb'],['Non merci','x']]},
  {id:'formats', q:'As-tu vu qu’il y avait des ligues SUR​VIVOR (tu rates, tu sors) et des ligues RA​CE, où le premier à X points gagne la ligue ?', a:[['Ja','thumb'],['Nein','x']]},
  {id:'vis', q:'Les paris des autres joueurs…', a:[['Je veux pouvoir les voir tout de suite','eye'],['C’est mieux de les garder secrets jusqu’au début de la journée','eyeOff']]},
];
S.votes=S.votes||{};
const myVote=pid=>{ const v=S.votes[pid+'__'+S.me]; return v?v.a:null; };
const pollTodo=()=>S.guest||!S.me?0:POLLS.filter(p=>myVote(p.id)===null).length;
function pollCard(p){
  const mine=myVote(p.id), done=mine!==null;
  const votes=Object.values(S.votes).filter(v=>v.poll===p.id), n=votes.length;
  const cnt=p.a.map((_,i)=>votes.filter(v=>v.a===i).length), max=Math.max(...cnt);
  const ic=k=>IC[k]||'';
  let body;
  if(!done) body=p.a.map(([l,k],i)=>`<button class="po-op" data-a="vote" data-v="${p.id}|${i}"><i>${ic(k)}</i><span>${esc(l)}</span></button>`).join('')+`<div class="po-ft">Vote pour voir les résultats${n?` · ${n} vote${n>1?'s':''}`:''}</div>`;
  else body=p.a.map(([l,k],i)=>{ const pc=n?Math.round(cnt[i]*100/n):0; return `<button class="po-rr" data-a="vote" data-v="${p.id}|${i}"><div class="po-rl"><i>${ic(k)}</i><span>${esc(l)}${mine===i?`<span class="po-me" aria-label="Ton vote">${IC.heart}</span>`:''}</span><b>${pc} %</b></div><div class="po-rb"><span class="${cnt[i]===max&&cnt[i]>0?'w':''}" style="width:${pc}%"></span></div></button>`; }).join('')+`<div class="po-ft">${n} vote${n>1?'s':''} · touche une autre réponse pour changer d'avis</div>`;
  return `<div class="po ${done?'done':''}"><div class="po-q">${esc(p.q)}</div>${body}</div>`;
}
function viewSondage(){
  if(S.mode==='demo' && !S.votesSeeded){ S.votesSeeded=true; Object.keys(S.players).filter(u=>u!==S.me).forEach((u,i)=>{ POLLS.forEach((p,j)=>{ S.votes[p.id+'__'+u]={poll:p.id,uid:u,a:(i*7+j*3)%5<3?0:1,at:0}; }); }); }
  let h=`<div class="ptitle">${titleImg('title-feedback.png','FEEDBACK')}</div><div class="po-sub">Ton avis pour améliorer le jeu.</div>`;
  if(S.guest) h+=`<div class="card" style="font-size:14px">Connecte-toi pour voter et voir les résultats.</div>`;
  const todo=POLLS.filter(p=>myVote(p.id)===null), done=POLLS.filter(p=>myVote(p.id)!==null);
  if(todo.length) h+=`<div class="pf-sec">À toi de voter (${todo.length})</div>`+todo.map(pollCard).join('');
  if(done.length) h+=`<div class="pf-sec">Déjà votés</div>`+done.map(pollCard).join('');
  return h;
}
function viewProfil(){
  const me=S.players[S.me]||{}; const name=nameOf(S.me);
  const row=(act,ic,bg,col,t,sub,cls='',extra='')=>`<button class="pf-it ${cls}" data-a="${act}" ${extra}><span class="pf-ic" style="background:${bg};color:${col}">${ic}</span><span class="pf-tx">${t}${sub?`<small>${sub}</small>`:''}</span><em>›</em></button>`;
  let h=`<div class="ptitle">${titleImg('title-profil.png','PROFIL')}</div>`;
  h+=`<div class="pf-hero"><button class="pf-av" data-a="photoMenu" aria-label="Changer la photo"><img src="${me.avatar?blobUrl(me.avatar):DEFAULT_AVATAR}" data-fb="${esc(initials(name))}" alt=""><i>${I.cam}</i></button><div class="pf-id"><b>${esc(name)}</b>${S.email?`<small>${esc(S.email)}</small>`:''}${S.isOwner?`<span class="pf-chip">${I.shield}ADMIN</span>`:''}</div><button class="pf-ed" data-a="editName" aria-label="Modifier le nom">${I.edit}</button></div>`;
  if(S.mode==='demo') h+=`<div class="card" style="font-size:14px;line-height:1.5;margin-top:14px"><b>Site de test.</b> Nouveau design avec des données fictives : rien n'est enregistré.</div>`;
  if(S.readOnly) h+=`<div class="card" style="background:var(--brand-soft);font-size:14px;line-height:1.5;margin-top:14px"><b>Lecture seule.</b> Pour jouer, l'organisateur doit t'inviter sur le site avec le rôle Éditeur.</div>`;
  if(!S.guest && S.mode!=='demo' || S.mode==='demo'){ const st=refStock(), refs=refsOf(S.me), ok=refs.filter(([,p])=>hasAnyPick(p)).length, op=!!S.open.pfRef;
    h+=`<div class="pf-sec">Parrainage</div><div class="pfj"><div class="pfj-h"><b>Mes jokers en stock</b><span>${st} / 3</span></div><div class="pfj-s">${[0,1,2].map(i=>`<i class="${i<st?'':'e'}">${CARD_ICO}</i>`).join('')}</div>
      <div class="pfj-c"><div><small>MON CODE PARRAINAGE</small><b>${refCode(S.me)}</b></div><button data-a="refShare">Partager</button></div>
      <p class="pfj-n">${ok?`${ok} pote${ok>1?'s ont':' a'} rejoint une ligue et parié avec ton code.`:'Aucun pote parrainé pour l’instant.'}${refs.length>ok?` ${refs.length-ok} inscrit${refs.length-ok>1?'s':''} en attente de son premier pari.`:''}</p>
      ${!me.refBy&&!hasAnyPick(me)?`<div class="pfj-in"><input class="in" id="pf-ref" maxlength="6" placeholder="Code de ton parrain"><button data-a="refApply">Valider</button></div>`:me.refBy?`<p class="pfj-n">Parrainé par <b>${esc(nameOf(me.refBy))}</b>.</p>`:''}
      <button class="ivx-m pfj-m" data-a="toggle" data-v="pfRef">Comment ça marche ?${CHEV_RND(op)}</button>${op?`<div class="ivx-b" style="padding:6px 0 0">${REF_RULES}</div>`:''}</div>`; }
  h+=`<div class="pf-sec">Une idée ?</div><a class="pf-fb" href="https://wa.me/33650710675?text=${encodeURIComponent('Salut ! Une remarque / idée pour Survivor : ')}" target="_blank" rel="noopener"><span class="pf-ic">${IC.chat}</span><span class="pf-tx">Donner mon feedback</span><em>›</em></a>`;
  const inst=installCard('profil');
  h+=`<div class="pf-sec">Réglages</div><div class="pf-list">${row('photoMenu',I.cam,'#FFF3C4','#16181D','Changer la photo',me.avatar?'Nouvelle photo ou recadrage':'')}${inst?row('toggle',IC.phone||I.phone||IC.chat,'#E0EEFF','#2F6FD6',"Installer l’appli","Sur l’écran d’accueil de ton téléphone",'','data-v="pfInst"'):''}</div>`;
  if(inst && S.open.pfInst) h+=`<div style="margin-top:10px">${inst}</div>`;
  h+=`<div class="pf-list" style="margin-top:10px">${window.survivorLogout?row('logout',I.logout,'#EEF0F2','#16181D','Se déconnecter'):''}${row(window.survivorDeleteAccount?'deleteAccount':'wipe',I.trash,'#FDECEC','#C0392B',window.survivorDeleteAccount?'Supprimer mon compte':'Supprimer mes données','','red')}</div>`;
  if(CREDITS && Object.keys(CREDITS).length) h+=`<details class="card coll" style="margin-top:14px"><summary><span class="lbl">Crédits photos</span>${I.chev}</summary><div class="credits">${PHOTOS.filter(p=>CREDITS[p.k]).map(p=>`<p><b>${esc(p.label)}</b> — ${creditLine(p.k)}</p>`).join('')}</div></details>`;
  return h;
}

/* ================================================================ Render */
// Journée en cours (date limite passée, résultats pas encore connus)
const pendR = c => c.rounds.find(r=>(c.info[r.k]||{}).state==='waiting')||null;
// Prochaine journée à parier : on attend la fin de la journée en cours
// (sauf si la prochaine date limite arrive dans moins de 12 h, pour ne pas bloquer les joueurs).
const openR = c => { const r=c.rounds.find(x=>t(x.deadline)>now()); if(!r) return null; if(pendR(c) && t(r.deadline)-now()>12*3600e3) return null; return r; };
function countTodo(){ let n=0; Object.keys(S.leagues).filter(lid=>isMember(lid)&&shownL(lid)).forEach(lid=>{ const c=C(lid); if(!c||c.status==='finished'||!c.alive.includes(S.me)) return; const r=openR(c); if(r && !pickOf(S.me,lid,r.k)) n++; }); return n; }
// ---------- Écran « verdict » : résultat de la dernière journée, montré une seule fois
const vKey=(lid,rk)=>'survivor-verdict-'+lid+'-'+rk;
const vSeen=(lid,rk)=>{ try{ return !!localStorage.getItem(vKey(lid,rk)); }catch(e){ return true; } };
function findVerdict(){
  if(S.guest || !S.me) return null; const lim=now()-10*86400000; let best=null;
  Object.keys(S.leagues).filter(lid=>isMember(lid)&&shownL(lid)).forEach(lid=>{ const c=C(lid); if(!c||!c.pick) return;
    const done=c.rounds.filter(r=>{ const ri=c.info[r.k]||{}; return ['done','cancelled'].includes(ri.state) && t(r.deadline)>lim && (c.points || !c.elimAt[S.me] || c.elimAt[S.me]===r.k); });
    const r=done[done.length-1]; if(!r || vSeen(lid,r.k)) return;
    if(!best || t(r.deadline)>t(best.r.deadline)) best={lid,r}; });
  return best;
}
function verdictHtml(v){
  const c=C(v.lid); if(!c) return ''; const r=v.r, ri=c.info[r.k]||{}, n=ri.n||(c.rounds.findIndex(x=>x.k===r.k)+1);
  const names=us=>{ const L=us.map(u=>esc(nameOf(u))); return L.length>6?L.slice(0,6).join(', ')+` et ${L.length-6} autre${L.length-6>1?'s':''}`:L.join(', ').replace(/, ([^,]*)$/,' et $1'); };
  let ico, title, body='';
  if(c.points){
    const me=c.rankOf[S.me]||{}, sc=(ri.pts||{})[S.me];
    ico=sc>=3?IC.check:sc===1?IC.minus:IC.x; title=sc>=3?`+${sc} points !`:sc===1?'+1 point':'0 point cette fois';
    body=`<p>Tu es <b>${me.pos||'?'}${me.pos===1?'er':'e'}</b> avec <b>${me.pts||0} pts</b> sur ${c.N}.</p>`;
    if(c.status==='finished') body+=`<p class="vd-win">${IC.trophy} ${c.firsts.map(u=>esc(nameOf(u))).join(' & ')} gagne${c.firsts.length>1?'nt':''} la ligue !</p>`;
  } else {
    const out=ri.out||[], meOut=out.includes(S.me), saved=(ri.saved||[]).includes(S.me);
    if(meOut){ ico=IC.skull; title='Tu es éliminé…'; }
    else if(ri.rescued){ ico=IC.life; title='Tout le monde est repêché !'; }
    else if(saved){ ico=IC.heart; title='Ta vie t’a sauvé !'; }
    else { ico=IC.check; title='Tu es toujours là !'; }
    const others=out.filter(u=>u!==S.me);
    body=out.length?`<p><b>${out.length} joueur${out.length>1?'s sont tombés':' est tombé'}</b>${others.length?' : '+names(others):''}${meOut&&others.length?', et toi':''}.</p>`:`<p>Personne n’est tombé sur cette journée.</p>`;
    body+=`<div class="vd-meter">${survMeter(c,true)}</div>`;
    if(c.status==='finished') body+=`<p class="vd-win">${IC.trophy} ${c.winners.map(u=>esc(nameOf(u))).join(' & ')} remporte${c.winners.length>1?'nt':''} la ligue !</p>`;
  }
  return `<div class="modal vd"><div class="vd-bg" data-a="verdictClose"></div><div class="sheet vd-sheet"><div class="vd-k">Journée ${n} · ${esc(c.lg.name.replace(/^\s*(survivor|race)\s*/i,''))}</div><div class="vd-ico">${ico}</div><h3>${title}</h3>${body}<div class="acts"><button class="btn line" data-a="verdictClose">Fermer</button><button class="btn" data-a="verdictOpen">Voir la ligue</button></div></div></div>`;
}
const EMO2IC={'🏆':'trophy','☠️':'skull','☠':'skull','🍺':'beer','🎟️':'ticket','🎟':'ticket','👕':'shirt','💚':'heart','❤️':'heart','📊':'chart','🛟':'life','💸':'money','💣':'bomb','⏰':'clock','🎁':'gift','🔥':'flame','👀':'eye','🙈':'eyeOff','🦁':'bolt','🤝':'users','🔴':'lantern'};
const EMO_RE=new RegExp(Object.keys(EMO2IC).sort((a,b)=>b.length-a.length).join('|'),'g');
function deEmoji(html){ return html.split(/(<[^>]*>)/).map(x=>x[0]==='<'?x:x.replace(EMO_RE,m=>IC[EMO2IC[m]])).join(''); }
function render(){
  const app=document.getElementById('app');
  if(S.mode==='loading'||(S.mode==='live'&&!(S.loaded.leagues&&S.loaded.players))){ app.innerHTML='<div class="spin"></div>'; return; }
  const keep={}; app.querySelectorAll('input,textarea,select').forEach(el=>{ if(el.id) keep[el.id]=el.value; });
  const focusId=document.activeElement&&document.activeElement.id;
  try{ const rp=new URLSearchParams(location.search).get('r'); if(rp) localStorage.setItem('svRef',rp.toUpperCase()); }catch(e){}
  try{ if(S.me&&!S.guest&&S.mode!=='demo'&&!S._refDone&&S.players[S.me]){ const code=localStorage.getItem('svRef'), me=S.players[S.me]; S._refDone=1; if(code&&!me.refBy&&!hasAnyPick(me)){ const u=Object.keys(S.players).find(x=>x!==S.me&&refCode(x)===code); if(u){ writeMe({refBy:u}); localStorage.removeItem('svRef'); } } } }catch(e){}
  try{ const dl=new URLSearchParams(location.search).get('l'); if(dl && !S._dl && S.leagues[dl]){ S._dl=1; S.view.tab='ligues'; S.view.league=dl; history.replaceState(null,'',location.pathname); } }catch(e){}
  const v=S.view; let body;
  if(v.tab==='ligues'&&v.league) body=viewLeague(v.league);
  else if(v.tab==='ligues') body=viewHome();
  else if(v.tab==='paris') body=viewParis();
  else if(v.tab==='admin') body=viewAdmin();
  else if(v.tab==='sondage') body=viewSondage();
  else body=viewProfil();
  const todo=countTodo();
  const tabs=[['ligues','Ligues',I.trophy],['paris','Mes paris',I.paris],['sondage','Feedback',IC.qmark],['admin',S.isOwner?'Admin':'Ma ligue',S.isOwner?I.gear:I.plus],['profil','Profil',I.user]];
  const ptodo=pollTodo();
  app.innerHTML=deEmoji((S.mode==='demo'?`<div class="demo"><span><b>MODE DÉMO</b> · données fictives, rien n'est enregistré.</span></div>`:'')+
    (S.stale?`<div class="demo">⚠️ <span>Connexion lente : les données peuvent ne pas être à jour.</span><button class="demo-btn" data-a="reload">Réessayer</button></div>`:'')+
    (()=>{ if(S.verdict===undefined){ S.verdict=findVerdict(); } return S.verdict?verdictHtml(S.verdict):''; })()+(S.recap?recapHtml(S.recap):'')+`<div class="page">${body}</div><nav class="bottom">${tabs.map(([k,l,ic])=>`<button class="${v.tab===k?'on':''}" data-a="tab" data-v="${k}">${ic}${l}${k==='paris'&&todo?`<span class="nbadge">${todo}</span>`:''}${k==='sondage'&&ptodo?`<span class="nbadge">${ptodo}</span>`:''}</button>`).join('')}</nav>`);
  Object.entries(keep).forEach(([id,val])=>{ const el=document.getElementById(id); if(el&&el.type!=='file') el.value=val; });
  if(focusId){ const el=document.getElementById(focusId); if(el) el.focus(); }
  wmify(app);
  tickCountdowns();
  syncSlider();
}
document.addEventListener('change',e=>{
  const m=/^aq-(a|b)$/.exec(e.target.id||''); if(!m) return; const k=m[1];
  S.qNames[k]=e.target.value; if(!(S.tmpImg||{})[k]) autoSide(k,true);
});
document.addEventListener('input',e=>{
  const id=e.target.id; if(!/^aq-(a|b|q)$/.test(id)) return; const k=id.slice(3); S.qNames[k]=e.target.value;
  if(k==='q'){ const q=document.querySelector('.duel.edit .q'); if(q) q.textContent=(e.target.value||'TU PRÉFÈRES ?').toUpperCase(); return; }
  const el=document.querySelector('.duel.edit [data-prev="'+k+'"]'); if(el) el.textContent=e.target.value||'Option '+k.toUpperCase();
  const ph=el&&el.parentElement.querySelector('.ph2 b'); if(ph) ph.textContent=initials(e.target.value||'?');
});
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]'); if(!el||el.disabled) return;
  const a=el.dataset.a, v=el.dataset.v;
  if(S.guest && !GUEST_OK.has(a) && !(a==='tab'&&v==='ligues')){ e.preventDefault(); return askLogin(a,v); }
  if(el.tagName==='SUMMARY') e.preventDefault();
  if(a==='pick'){ const [l,r,m,p]=v.split('|'); return A.pick(l,r,m,p); }
  if(a==='setCat'){ const [l,k]=v.split('|'); return A.setCat(l,k); }
  if(a==='setCover'){ const [l,k]=v.split('|'); return A.setCover(l,k); }
  if(a==='setComp'){ const [l,k]=v.split('|'); return A.setComp(l,k); }
  if(a==='importRound'){ const i=v.indexOf('|'); return A.importRound(v.slice(0,i), v.slice(i+1)); }
  if(A[a]) A[a](v);
});
_obs.observe(document.body,{childList:true});
boot();
})();
