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
const DEFAULT_RULES = {
  pick:"À chaque journée, choisis UN seul match et parie sur l'équipe ou le résultat de ton choix.\nSi ton pari se réalise, tu restes en vie.\nSinon, tu es éliminé… (pas de pari = éliminé)\nLe dernier joueur en vie remporte la ligue.\nAttention : tu ne peux miser qu'une seule fois sur la même équipe. Les équipes sur lesquelles tu as déjà parié seront grisées pour les prochaines journées.\nLes choix restent secrets jusqu'à l'heure limite. Tu peux ensuite retrouver les choix de chacun dans l'onglet « HISTORIQUE ».\nSi tous les survivants tombent la même journée, ils sont départagés à l'audace : gagne celui qui a joué, en moyenne depuis le début, les équipes les moins bien classées avant chaque journée.",
  majority:"À chaque question, vote pour l'option de ton choix.\nTu restes en vie si tu votes comme la majorité des survivants.\nSi tu votes comme la minorité, ou si tu ne votes pas, tu es éliminé…\nLes votes restent secrets jusqu'à l'heure limite. Tu peux ensuite retrouver le résultat dans l'onglet « HISTORIQUE ».\nEn cas d'égalité parfaite entre les 2 options, personne parmi les votants n'est éliminé.\nLes 2 derniers survivants remportent la ligue."
};

const I = {
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

const WM = () => `<img class="wm" src="img/survivor.png" data-fb="${esc('<span class="wm-txt">SURVIVOR</span>')}" alt="Survivor">`;
const WM_RE=/survivor/i;
function isLight(el){ try{ const c=getComputedStyle(el).color.match(/\d+(\.\d+)?/g); if(!c) return false; const [r,g,b]=c.map(Number); return (0.299*r+0.587*g+0.114*b)>160; }catch(e){ return false; } }
function wmify(root){
  if(!root) return;
  const tw=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode:n=>{ const p=n.parentElement; if(!p||/^(SCRIPT|STYLE|OPTION|SELECT|TEXTAREA|TITLE)$/.test(p.tagName)||p.closest('.wm-txt')) return NodeFilter.FILTER_REJECT; return WM_RE.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP; }});
  const nodes=[]; while(tw.nextNode()) nodes.push(tw.currentNode);
  nodes.forEach(n=>{
    const light=isLight(n.parentElement); const parts=n.nodeValue.split(/(survivor)/i); const frag=document.createDocumentFragment();
    parts.forEach(pt=>{ if(/^survivor$/i.test(pt)){ const img=document.createElement('img'); img.className='wm in'; img.alt='Survivor'; img.src=light?'img/survivor-white.png':'img/survivor.png'; img.dataset.fb='<span class="wm-txt">SURVIVOR</span>'; frag.appendChild(img); } else if(pt) frag.appendChild(document.createTextNode(pt)); });
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
const stripPrefix = n => String(n||'').replace(/^\s*survivor\s*(x\b)?\s*/i,'').trim();
const fullName = rest => 'Survivor X '+stripPrefix(rest);
const XI = () => `<img class="xm" src="img/x.png" data-fb="X" alt="X">`;
const xify = h => { const m=String(h).match(/^\s*x(\s+|$)(.*)$/i); return m ? `${XI()}<span>${m[2]}</span>` : h; };
const pfxInput = (id, cls, val, ph) => `<div class="pfx-in ${cls}"><span class="pfx">${WM()}${XI()}</span><input class="in ${cls}" id="${id}" maxlength="48" value="${esc(val||'')}" placeholder="${esc(ph)}"></div>`;
function leagueTitle(name, cls=''){
  const n=String(name||'');
  const m=n.match(/^\s*survivor\b\s*(.*)$/i);
  if(m) return `<div class="ltitle ${cls}">${WM()}<span class="rest">${xify(esc(m[1]).toUpperCase())}</span></div>`;
  return `<div class="ltitle ${cls}"><span class="rest" style="margin-top:0">${esc(n).toUpperCase()}</span></div>`;
}
const titleImg = (file, text) => `<img class="big" src="img/${file}" data-fb="${esc('<span class="big">'+text+'</span>')}" alt="${esc(text)}">`;

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
function coverHtml(lg){
  const k=coverKey(lg);
  if(k.startsWith && k.startsWith('asset:')) return `<img src="${blobUrl(k.slice(6))}" alt="">`;
  return coverImg(k, cat(lg.category).emo);
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
function avatarOf(id, cls=''){ const p=S.players[id]; const ini=esc(initials(nameOf(id))); return p && p.avatar ? `<div class="av ${cls}"><img src="${blobUrl(p.avatar)}" data-fb="${ini}" alt=""></div>` : `<div class="av ${cls}">${ini}</div>`; }
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
  feedReq[key]=fetch('data/feeds/'+encodeURIComponent(key)+'.json').then(r=>r.ok?r.json():null).then(j=>{ S.feeds[key]=j||{missing:true}; render(); setTimeout(autoImportAll,300); }).catch(()=>{ S.feeds[key]={missing:true}; render(); });
}
function loadFeedIndex(){
  if(S.feedIndex) return;
  S.feedIndex={loading:true};
  fetch('data/feeds/index.json').then(r=>r.ok?r.json():null).then(j=>{ S.feedIndex=j||{comps:[]}; render(); }).catch(()=>{ S.feedIndex={comps:[]}; render(); });
}
const teamOf = (feed,id) => (feed && feed.teams && feed.teams[id]) || {n:'?'};
function logoTag(side, cls='lg'){ return side && side.logo ? `<img class="${cls}" src="${esc(side.logo)}" data-fb="" alt="">` : ''; }

/* ================================================================ Game logic */
const isPickMode = lg => (lg.mode||cat(lg.category).mode)==='pick';
const allowDraw = lg => lg.allowDraw!==undefined ? lg.allowDraw : cat(lg.category).draw;
const roundsOf = lg => Object.entries(lg.rounds||{}).map(([k,r])=>({...r,k})).sort((a,b)=>t(a.deadline)-t(b.deadline)||a.k.localeCompare(b.k));
const matchesOf = r => Object.entries(r.matches||{}).map(([k,m])=>({...m,k})).sort((a,b)=>t(a.d)-t(b.d)||a.k.localeCompare(b.k));
const teamKey = side => side ? String(side.id || side.n || '').toLowerCase() : '';
function pickOf(uid, lid, rk){ const p=S.players[uid]; return p && p.picks && p.picks[lid] && p.picks[lid][rk] ? p.picks[lid][rk] : null; }
const members = lid => Object.keys(S.players).filter(id=>S.players[id].leagues && S.players[id].leagues[lid]);
const isMember = lid => !!(S.me && S.players[S.me] && S.players[S.me].leagues && S.players[S.me].leagues[lid]);
const canManage = lg => !!lg && (S.isOwner || lg.id===S.me);

function feedEvent(lg, m){
  if(!m.ev) return null;
  const f=S.feeds[m.comp||lg.comp]; if(!f || !f.events) return null;
  return f.events[m.ev]||null;
}
function matchResult(lg, m){
  if(m.result) return {r:m.result, manual:true};
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
  let alive=new Set(mem); const elimAt={}; const info={}; let finished=false, blocked=false, n=0;
  for(const r of rounds){
    n++; const ri={n:r.n||n, aliveBefore:[...alive], state:'open'}; info[r.k]=ri;
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
      const correct=A.filter(u=>{ const p=pickOf(u,lid,r.k); return p && res[p.m]===p.p; });
      const anyPick=A.some(u=>pickOf(u,lid,r.k));
      if(!anyPick){ ri.state='cancelled'; ri.out=[]; }
      else if(!correct.length && A.length>=2){
        // everyone left falls on the same day: the boldest picker over the league wins
        ri.state='tiebreak'; const sc={}; A.forEach(u=>sc[u]=audacity(lg,rounds,info,u,r.k)); ri.tb=sc;
        const best=Math.max(...A.map(u=>sc[u]??-1));
        const keep=best>0?A.filter(u=>(sc[u]??-1)===best):A;
        const out=A.filter(u=>!keep.includes(u)); out.forEach(u=>elimAt[u]=r.k); alive=new Set(keep); ri.out=out; finished=true;
      }
      else if(!correct.length){ ri.state='cancelled'; ri.out=[]; }
      else { const out=A.filter(u=>!correct.includes(u)); out.forEach(u=>elimAt[u]=r.k); alive=new Set(correct); ri.state='done'; ri.out=out; }
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
    status: !started?'upcoming':finished?'finished':'live', winners: finished?[...alive]:[]};
}
const C = lid => compute(lid);
function usedTeams(c, uid, rk){
  const set=new Set(); const r0=c.lg.rounds[rk]; if(!r0) return set;
  c.rounds.forEach(r=>{ if(r.k===rk || t(r.deadline)>=t(r0.deadline)) return; const p=pickOf(uid,c.lg.id,r.k); if(!p||p.p==='D') return; const m=(r.matches||{})[p.m]; if(m) set.add(teamKey(p.p==='H'?m.h:m.a)); });
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
  render(); setInterval(render,30000);
}

/* ---------- Visiteurs non connectés ---------- */
const GUEST_OK=new Set(['reload','hview','toLeagues','slide','install','hideInstall','filter','open','back','ltab','toggle','comp','peek']);
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
    L4:{id:'L4',name:'Survivor X NBA',category:'basket',mode:'pick',comp:'nba',startAt:iso(n+D+6*H),createdAt:iso(n-D),code:'NBA777',private:false,cover:'auto',rounds:{}}
  };
  const P=(id,pseudo,lg,picks)=>({id,pseudo,leagues:Object.fromEntries(lg.map(l=>[l,iso(n-10*D)])),picks});
  S.players={
    moi:P('moi','Rémy',['L1','L2','L3'],{L1:{r12:{m:'r12m0',p:'H'},r13:{m:'r13m0',p:'H'}},L2:{t1:{m:'t1m2',p:'H'}},L3:{q1:{p:'A'}}}),
    p1:P('p1','Karim',['L1','L3'],{L1:{r12:{m:'r12m1',p:'D'},r13:{m:'r13m2',p:'A'}},L3:{q1:{p:'A'},q2:{p:'B'}}}),
    p2:P('p2','Léa',['L1','L3','L4'],{L1:{r12:{m:'r12m2',p:'A'}},L3:{q1:{p:'B'}}}),
    p3:P('p3','Hugo',['L1'],{L1:{r12:{m:'r12m0',p:'A'}}}),
    p4:P('p4','Inès',['L1','L3'],{L1:{r12:{m:'r12m0',p:'H'},r13:{m:'r13m3',p:'H'}},L3:{q1:{p:'A'}}})
  };
  afterData(); render(); setInterval(render,30000);
}


/* ---------- Installer l'appli (écran d'accueil du téléphone) ---------- */
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; render(); });
window.addEventListener('appinstalled',()=>{ installEvt=null; toast('Survivor est installé sur ton téléphone !'); render(); });
const isStandalone=()=>{ try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone===true; }catch(e){ return false; } };
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
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
  evs.forEach((e,i)=>{ const h=teamOf(f,e.h), a=teamOf(f,e.a); const hs={n:h.n,id:e.h,logo:h.logo||''}, as={n:a.n,id:e.a,logo:a.logo||''}; if(rmap[e.h]) hs.rk=rmap[e.h]; if(rmap[e.a]) as.rk=rmap[e.a]; matches['m'+i+'_'+e.id]={h:hs,a:as,d:e.d,ev:e.id,comp,result:null}; });
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
  f.rounds.filter(r=>t(r.s)>now() && t(r.s)>=start && t(r.s)<=horizon).forEach(fr=>{
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
  slide(i){ slideClock=Date.now(); const el=document.getElementById('slides'); if(el) el.scrollTo({left:el.clientWidth*(+i),behavior:'smooth'}); },
  install(){ if(!installEvt) return; installEvt.prompt(); installEvt.userChoice.finally(()=>{ installEvt=null; render(); }); },
  hideInstall(){ try{ localStorage.setItem('survivor-install-hide','1'); }catch(e){} render(); },
  logout(){ if(window.survivorLogout) window.survivorLogout(); },
  tab(v){ S.view.tab=v; S.view.league=null; S.view.manage=null; render(); scrollTo(0,0); },
  filter(v){ S.view.filter=v; render(); },
  open(v){ S.view.league=v; S.view.ltab='paris'; S.view.hv='days'; S.view.tab='ligues'; render(); scrollTo(0,0); celebrate(v); },
  back(){ S.view.league=null; render(); scrollTo(0,0); },
  ltab(v){ S.view.ltab=v; S.view.hv='days'; render(); },
  manage(v){ S.view.manage=v; const lg=S.leagues[v]; S.view.comp=(lg&&lg.comp)||cat(lg&&lg.category).comps[0]||null; if(S.view.comp) loadFeed(S.view.comp); render(); scrollTo(0,0); },
  unmanage(){ S.view.manage=null; render(); scrollTo(0,0); },
  join(lid){
    const c=C(lid); if(!c) return;
    if(c.started) return toast('Inscriptions closes : la ligue a commencé.',true);
    if(guard()) return;
    writeMe({leagues:{[lid]:new Date().toISOString()}}).then(()=>toast('Tu es inscrit ! Bonne chance 🍀'));
  },
  joinCode(){
    modal(`<h3>REJOINDRE UNE LIGUE</h3><div class="muted" style="font-size:15px">Entre le code à 6 caractères donné par le créateur.</div><input class="in" id="jc" maxlength="6" style="margin-top:14px;text-transform:uppercase;letter-spacing:6px;font-size:24px;text-align:center" placeholder="ABC123">`,'REJOINDRE',()=>{
      const code=(document.getElementById('jc').value||'').trim().toUpperCase();
      const lg=Object.values(S.leagues).find(l=>(l.code||'').toUpperCase()===code);
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
    if(c.pick && p!=='D'){ const m=r.matches[mk]; if(usedTeams(c,S.me,rk).has(teamKey(p==='H'?m.h:m.a))) return toast('Tu as déjà joué cette équipe.',true); }
    const cur=pickOf(S.me,lid,rk); if(cur && cur.m===mk && cur.p===p) return;
    writeMe({picks:{[lid]:{[rk]:{m:mk||null,p,at:new Date().toISOString()}}}}).then(()=>toast(cur?'Choix modifié !':'Choix enregistré !'));
  },
  toggle(v){ S.open[v]=!S.open[v]; render(); },
  newCat(v){ S.view.newCat=v; render(); },
  createLeague(){
    const g=id=>document.getElementById(id);
    const rest=stripPrefix(g('nl-name').value), name=fullName(rest), desc=g('nl-desc').value.trim(), d=g('nl-date').value, h=g('nl-time').value||'20:00';
    if(rest.length<2) return toast('Complète le nom après « Survivor X ».',true);
    if(!d) return toast('Choisis la date de fin des inscriptions.',true);
    if(!S.isOwner && S.leagues[S.me]) return toast('Tu as déjà créé ta ligue.',true);
    if(guard()) return;
    const k=S.view.newCat, cc=cat(k);
    const id=S.isOwner ? 'l'+rid() : S.me;
    const lg={name:name.slice(0,60),description:desc.slice(0,300),category:k,mode:cc.mode,comp:(cc.comps.includes(compFromName(name))?compFromName(name):cc.comps[0])||null,startAt:new Date(d+'T'+h).toISOString(),createdAt:new Date().toISOString(),createdBy:S.me,private:!S.isOwner,code:genCode(),cover:'auto',rules:'',rounds:{}};
    writeLeague(id,lg,'set').then(()=>{ if(!isMember(id)) writeMe({leagues:{[id]:new Date().toISOString()}}); toast('Ligue créée ! Code : '+lg.code); A.manage(id); setTimeout(()=>autoImport(id),400); });
  },
  saveInfo(lid){
    const g=id=>document.getElementById(id);
    const rest=stripPrefix(g('ei-name').value); if(rest.length<2) return toast('Complète le nom après « Survivor X ».',true); const name=fullName(rest);
    const patch={name:name.slice(0,60),description:g('ei-desc').value.trim().slice(0,300)};
    const cf=compFromName(name), lgx=S.leagues[lid]; if(cf && cat(lgx.category).comps.includes(cf) && cf!==lgx.comp){ patch.comp=cf; S.view.comp=cf; loadFeed(cf); }
    const d=g('ei-date'), h=g('ei-time'); if(d && d.value) patch.startAt=new Date(d.value+'T'+(h.value||'20:00')).toISOString();
    writeLeague(lid,patch).then(()=>{ toast('Ligue mise à jour.'); autoImport(lid); });
  },
  setCat(lid,k){ const cc=cat(k); writeLeague(lid,{category:k,mode:cc.mode,comp:cc.comps[0]||null}); S.view.comp=cc.comps[0]||null; if(S.view.comp) loadFeed(S.view.comp); },
  setComp(lid,k){ S.view.comp=k; loadFeed(k); writeLeague(lid,{comp:k}).then(()=>{ toast('Championnat : '+COMP_NAMES[k]); autoImport(lid); }); },
  setCover(lid,k){ writeLeague(lid,{cover:k}).then(()=>toast('Photo mise à jour.')); },
  uploadCover(lid){ pickFile(async f=>{ const a=await upload(f); if(a) writeLeague(lid,{cover:'asset:'+a.id}).then(()=>toast('Photo importée !')); }); },
  uploadAvatar(){ if(guard()) return; pickFile(async f=>{ const a=await upload(f); if(a) writeMe({avatar:a.id}).then(()=>toast('Photo de profil mise à jour !')); }); },
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
  defRules(lid){ const lg=S.leagues[lid]; document.getElementById('ru-txt').value=DEFAULT_RULES[isPickMode(lg)?'pick':'majority']; },
  startNow(lid){ modal('<h3>DÉMARRER MAINTENANT ?</h3><div class="muted">Les inscriptions seront closes immédiatement.</div>','DÉMARRER',()=>{ writeLeague(lid,{startAt:new Date().toISOString()}).then(()=>toast('La ligue a démarré !')); }); },
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
const visible = lg => !lg.private || isMember(lg.id) || canManage(lg);


/* Lot : maillot rétro du championnat (ligues de football) */
function prizeBand(lg, cls){
  if((lg.category||'football')!=='football' || !lg.comp || !COMP_NAMES[lg.comp]) return '';
  return `<div class="prize ${cls||''}"><span class="pz-i">👕</span><span>Le dernier survivant de cette ligue gagne <b>un maillot rétro de ${esc(COMP_NAMES[lg.comp])}</b></span></div>`;
}
function viewHome(){
  const all=Object.values(S.leagues).filter(visible).map(l=>C(l.id)).filter(Boolean);
  const order={upcoming:0,live:1,finished:2};
  all.sort((a,b)=>(+(b.lg.pin||0))-(+(a.lg.pin||0)) || order[a.status]-order[b.status] || (a.status==='upcoming'?t(a.lg.startAt)-t(b.lg.startAt):t(b.lg.createdAt)-t(a.lg.createdAt)));
  const cats=[...new Set(all.map(c=>c.lg.category||'football'))];
  const f=S.view.filter;
  const list=all.filter(c=> f==='all'?true : f==='mine'?isMember(c.lg.id) : (c.lg.category||'football')===f);
  const myL=Object.keys(S.leagues).filter(isMember).map(C).filter(Boolean);
  const aliveIn=myL.filter(c=>c.status==='live'&&c.alive.includes(S.me)).length, soon=myL.filter(c=>c.status==='upcoming').length, todo=countTodo();
  const me=S.players[S.me]||{}, nm=nameOf(S.me);
  let line, cta;
  if(!myL.length){ line='Rejoins une ligue et tiens le plus longtemps possible.'; cta=`<button class="btn brand" data-a="joinCode">${I.key} J'AI UN CODE</button>`; }
  else {
    const bits=[]; if(aliveIn) bits.push(`en vie dans <b>${aliveIn}</b> ligue${aliveIn>1?'s':''}`); if(soon) bits.push(`<b>${soon}</b> ligue${soon>1?'s':''} à venir`);
    line=(bits.length?'Tu es '+bits.join(' · '):'Aucune ligue en cours pour toi.')+(todo?` · <b class="hot">${todo} choix à faire</b>`:'');
    cta=`<button class="btn ${todo?'brand':'light'}" data-a="tab" data-v="paris">${todo?'À TOI DE JOUER':'MES PARIS'} ${I.arrow}</button>`;
  }
  let h=`<div class="topbar"><span class="tb-logo">${WM()}</span><button class="tb-av" data-a="tab" data-v="profil" aria-label="Profil">${me.avatar?`<img src="${blobUrl(me.avatar)}" data-fb="${esc(initials(nm))}" alt="">`:esc(initials(nm))}</button></div>
  <div class="slider"><div class="slides" id="slides">
    <div class="hero slide"><div class="hero-ph shot"><img src="img/slide-pari.jpg" alt=""></div><div class="hero-in"><div class="hero-k">1 / 4</div><div class="hero-h sm">CHAQUE<br>JOURNÉE,<br>PARIE SUR<br><span>L'ÉQUIPE<br>DE TON CHOIX.</span></div><button class="btn light" data-a="slide" data-v="1">SUIVANT ${I.arrow}</button></div></div>
    <div class="hero slide"><div class="hero-ph" style="--op:50% 20%"><img src="img/slide-supporter.jpg" alt=""></div><div class="hero-in"><div class="hero-k">2 / 4</div><div class="hero-h sm">ELLE GAGNE&nbsp;→<br><span>TU SURVIS.</span><br>ELLE PERD&nbsp;→<br><span>TU ES ÉLIMINÉ.</span></div><button class="btn light" data-a="slide" data-v="2">SUIVANT ${I.arrow}</button></div></div>
    <div class="hero slide red"><div class="hero-ph" style="--op:52% 30%"><img src="img/slide-dembele.jpg" alt=""></div><div class="hero-in"><div class="hero-k">3 / 4</div><div class="hero-h sm">INTERDIT DE<br>PARIER 2 FOIS<br>SUR LA MÊME<br>ÉQUIPE.</div><button class="btn light" data-a="slide" data-v="3">SUIVANT ${I.arrow}</button></div></div>
    <div class="hero slide"><div class="hero-ph trophy"><img src="img/covers/trophee.jpg" alt=""></div><div class="hero-in"><div class="hero-k">4 / 4</div><div class="hero-h sm">LE DERNIER<br>EN VIE GAGNE<br><span>UN MAILLOT<br>DE FOOT RÉTRO.</span></div><button class="btn brand hero-go" data-a="toLeagues">À TOI DE JOUER ${I.arrow}</button></div></div>
  </div><div class="sdots">${[0,1,2,3].map(i=>`<button data-a="slide" data-v="${i}" aria-label="Écran ${i+1}"></button>`).join('')}</div></div>
  ${installCard('home')}
  <div class="sec" id="ligues" style="margin:26px 0 12px;scroll-margin-top:16px">Les ligues</div>`;
  h+=`<div class="chips"><button class="chip ${f==='all'?'on':''}" data-a="filter" data-v="all">Toutes</button><button class="chip ${f==='mine'?'on':''}" data-a="filter" data-v="mine">Mes ligues</button>`+cats.map(k=>`<button class="chip ${f===k?'on':''}" data-a="filter" data-v="${k}">${esc(cat(k).label)}</button>`).join('')+`</div>`;
  if(!list.length){
    h+=`<div class="empty"><div class="ico">${f==='mine'?'🎟️':'🏟️'}</div><h3>${f==='mine'?'AUCUNE LIGUE':'PAS ENCORE DE LIGUE'}</h3><p>${f==='mine'?'Inscris-toi à une ligue ou entre un code privé.':'Crée la première ligue !'}</p></div>`;
  }
  list.forEach(c=>{
    const lg=c.lg, mine=isMember(lg.id), cd=c.status==='upcoming'?until(lg.startAt):null;
    let act='';
    if(c.status==='upcoming') act = mine?`<button class="btn sm" data-a="open" data-v="${lg.id}">INSCRIT ✓</button>`:`<button class="btn sm green" data-a="join" data-v="${lg.id}">JE M'INSCRIS</button>`;
    else act=`<button class="btn" data-a="open" data-v="${lg.id}">VOIR ${I.arrow}</button>`;
    if(c.status==='upcoming') act+=`<button class="btn sm ghost" data-a="open" data-v="${lg.id}">VOIR</button>`;
    h+=`<div class="lcard"><div class="cover">${coverHtml(lg)}</div><div class="body">
      <div class="tags">${catTag(lg.category)}${lg.private?'<span class="tag priv">Privée</span>':''}</div>
      <div class="tags">${statusPill(c)}</div>
      ${leagueTitle(lg.name)}
      ${cd?`<div class="cd">Début dans ${cd}</div>`:''}
      ${c.winners.length?`<div class="win">🏆 ${c.winners.map(w=>esc(nameOf(w))).join(' & ')}</div>`:''}
      <div class="stats"><span>${I.users}<b>${c.mem.length}</b> joueurs</span><span>${I.heart}<b>${c.status==='upcoming'?c.mem.length:c.alive.length}</b> en vie</span></div>
      <div class="actions">${act}</div></div></div>`;
  });
  h+=`<button class="btn line full" style="margin-top:6px" data-a="joinCode">${I.key} REJOINDRE UNE LIGUE PRIVÉE</button>`;
  return h;
}

function dlLine(r){
  const closed=t(r.deadline)<=now();
  return closed ? `<div class="dl closed">${I.clock}Choix clos depuis le ${fmtDT(r.deadline)}</div>` : `<div class="dl open">${I.clock}<span>Choix ouvert jusqu'au ${fmtDT(r.deadline)} · <b class="cdl" data-t="${t(r.deadline)}">${cdText(t(r.deadline))}</b></span></div>`;
}
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
  const lg=c.lg, my=pickOf(S.me,lg.id,r.k), sel=my&&my.m===m.k&&my.p===side;
  const res=matchResult(lg,m); const can=opts.can;
  const sd = side==='H'?m.h : side==='A'?m.a : null;
  const used = side!=='D' && opts.used && opts.used.has(teamKey(sd));
  let cls='tile'; if(sel) cls+=' sel'; if(!can && !sel) cls+=' off'; if(used && !sel) cls+=' used';
  if(res){ if(res.r===side) cls+=' win'; else if(sel) cls+=' lose'; }
  const bd = side==='D' ? 'N' : (sd.logo?`<img src="${esc(sd.logo)}" data-fb="${esc(initials(sd.n).slice(0,1))}" alt="">`:esc(initials(sd.n).slice(0,1)));
  const name = side==='D' ? 'Match nul' : esc(sd.n);
  let pct=''; if(opts.dist){ const tot=opts.dist.tot; const k=m.k+'|'+side; pct=`<span class="pct">${tot?Math.round((opts.dist.c[k]||0)*100/tot):0}%</span>`; }
  const act = can && !used ? `data-a="pick" data-v="${lg.id}|${r.k}|${m.k}|${side}"` : 'disabled';
  return `<button class="${cls}" ${act}>${sel?`<span class="ck">${I.check}</span>`:''}<span class="bd">${bd}</span><span class="nm">${name}</span>${pct}</button>`;
}
function roundDist(c, r){
  const voters=(c.info[r.k]&&c.info[r.k].aliveBefore)||c.mem; const cnt={}; let tot=0;
  voters.forEach(u=>{ const p=pickOf(u,c.lg.id,r.k); if(p){ cnt[(p.m||'')+'|'+p.p]=(cnt[(p.m||'')+'|'+p.p]||0)+1; tot++; } });
  return {c:cnt,tot};
}
function rankTag(lg, m, side){
  const r=sideRank(lg, m, side); return r?`<span class="rk">${r}<sup>${r===1?'er':'e'}</sup></span>`:'';
}
function roundCard(c, r, o={}){
  const lg=c.lg, ri=c.info[r.k]||{}, closed=t(r.deadline)<=now(), can=canPick(c,r);
  const my=pickOf(S.me,lg.id,r.k);
  let h=`<div class="card round">`;
  if(o.header) h+=o.header;
  else h+=`<h3>Journée ${ri.n||r.n||''}</h3>`;
  h+=dlLine(r);
  if(!c.pick) return h+duelHtml(c,r,{can,closed})+roundFoot(c,r)+'</div>';
  if(!closed && o.hint!==false) h+=`<div class="hint">Choisis UN seul match et parie dessus.${allowDraw(lg)?'':' Pas de match nul.'} Les équipes déjà jouées sont grisées.</div>`;
  const used=usedTeams(c,S.me,r.k); const dist=closed?roundDist(c,r):null;
  matchesOf(r).forEach(m=>{
    const res=matchResult(lg,m); const sc=matchScore(lg,m);
    const chosen=o.compact && my && my.m===m.k;
    h+=`<div class="match ${chosen?'chosen':''}">`;
    if(!o.compact) h+=`<div class="mline"><span class="tm">${logoTag(m.h)}<span>${esc(m.h.n)}</span>${rankTag(lg,m,m.h)}</span><span class="vs">${sc?`<span class="res">${esc(sc)}</span>`:'VS'}</span><span class="tm r">${logoTag(m.a)}<span>${esc(m.a.n)}</span>${rankTag(lg,m,m.a)}</span></div>`;
    h+=`<div class="tiles ${allowDraw(lg)?'':'two'}">${tileHtml(c,r,m,'H',{can,used,dist})}${allowDraw(lg)?tileHtml(c,r,m,'D',{can,used,dist}):''}${tileHtml(c,r,m,'A',{can,used,dist})}</div></div>`;
  });
  return h+roundFoot(c,r)+'</div>';
}
function roundFoot(c,r){
  const lg=c.lg, ri=c.info[r.k]||{}, my=pickOf(S.me,lg.id,r.k), alive=ri.aliveBefore&&ri.aliveBefore.includes(S.me), closed=t(r.deadline)<=now();
  let f='';
  if(!closed && isMember(lg.id) && c.alive.includes(S.me) && !my) f=`<div class="note bad">Pas de choix = éliminé. Décide-toi avant ${fmtDT(r.deadline).split(' à ')[1]} le ${fmtD(r.deadline)} !</div>`;
  else if(!closed && my) f=`<div class="note">Ton choix est enregistré. Tu peux le modifier jusqu'à l'heure limite.</div>`;
  if(ri.state==='waiting' && closed) f+=`<div class="note">⏳ En attente des résultats${my?' — ton choix : <b>'+esc(pickLabel(lg,r,my))+'</b>':''}.</div>`;
  if(ri.state==='cancelled') f+=`<div class="note">🛟 Journée annulée : personne n'est éliminé.</div>`;
  if(ri.state==='tiebreak'){ const ws=Object.keys(ri.tb||{}).filter(u=>!ri.out.includes(u)); f+=`<div class="note">⚖️ Tous les survivants sont tombés : départagés à l'audace (rang moyen des équipes jouées). ${ws.map(u=>`<b>${esc(nameOf(u))}</b> ${ri.tb[u]?'('+ri.tb[u].toFixed(1).replace('.',',')+'e de moyenne)':''}`).join(' et ')} ${ws.length>1?'gagnent':'gagne'}.</div>`; }
  if(ri.bold){ const p=pickOf(ri.bold.u,lg.id,r.k); f+=`<div class="note bold">🦁 Choix le plus audacieux : <b>${esc(nameOf(ri.bold.u))}</b> avec ${esc(pickLabel(lg,r,p))} (${ri.bold.rk}e)</div>`; }
  if((ri.state==='done'||ri.state==='tiebreak') && alive){ f+= ri.out.includes(S.me)?`<div class="note bad">✗ Raté… tu es éliminé sur cette journée.</div>`:`<div class="note ok">✓ Bien joué, tu restes en vie !</div>`; }
  if(ri.state==='done' && ri.out.length) f+=`<div class="note">☠️ ${ri.out.length} éliminé${ri.out.length>1?'s':''}</div>`;
  return f;
}
function pickLabel(lg,r,p){
  if(!p) return '—';
  if(!isPickMode(lg)) return p.p==='A'?r.a.n:r.b.n;
  const m=(r.matches||{})[p.m]; if(!m) return '—';
  return p.p==='H'?m.h.n : p.p==='A'?m.a.n : `Nul (${m.h.n} – ${m.a.n})`;
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

function rulesCard(lg){
  const txt=(lg.rules||'').trim()||DEFAULT_RULES[isPickMode(lg)?'pick':'majority'];
  const extra=lg.description?`<p><b>${esc(lg.description)}</b></p>`:'';
  return `<details class="card coll" ${S.open['rules'+lg.id]?'open':''}><summary data-a="toggle" data-v="rules${lg.id}"><span class="ctitle">${I.book}Règles du jeu</span>${I.chev}</summary><div class="rules-body">${extra}${txt.split(/\n+/).map(p=>`<p>${esc(p)}</p>`).join('')}</div></details>`;
}
function standingsCard(lg, openDefault){
  const key=lg.comp; if(!key) return '';
  const f=S.feeds[key]; if(!f) { loadFeed(key); return ''; }
  if(f.missing || !f.standings || !f.standings.length) return '';
  const myTeams=new Set(); roundsOf(lg).forEach(r=>{ const p=pickOf(S.me,lg.id,r.k); if(p&&p.p!=='D'&&r.matches&&r.matches[p.m]){ const m=r.matches[p.m]; myTeams.add(String(p.p==='H'?m.h.id:m.a.id)); } });
  const groups=f.standings.map(g=>`<table class="tbl">${g.g&&f.standings.length>1?`<caption>${esc(g.g)}</caption>`:''}<thead><tr><th class="r">#</th><th>ÉQUIPE</th><th class="n">J</th><th class="n">DIFF</th><th class="n">${esc(f.ptsLabel||'PTS')}</th></tr></thead><tbody>`+
    g.rows.map((row,i)=>{ const tm=teamOf(f,row.t); const gd=row.gd>0?'+'+row.gd:row.gd; return `<tr class="${myTeams.has(String(row.t))?'me':''}"><td class="r">${row.rank||i+1}</td><td><div class="team">${tm.logo?`<img src="${esc(tm.logo)}" data-fb="" alt="">`:''}<span>${esc(tm.n)}</span></div></td><td class="n">${row.gp??''}</td><td class="n">${gd??''}</td><td class="n pts">${row.pts??''}</td></tr>`; }).join('')+`</tbody></table>`).join('');
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
function statRow(f, tid, right, sub){ const tm=teamOf(f,tid); return `<div class="srow">${tm.logo?`<img src="${esc(tm.logo)}" data-fb="" alt="">`:'<span class="sdot"></span>'}<div class="sn">${esc(tm.n)}${sub?`<small>${sub}</small>`:''}</div><div class="sv">${right}</div></div>`; }
function formDots(arr){ return `<span class="fdots">${arr.slice(0,5).reverse().map(r=>`<i class="f${r}">${r==='W'?'V':r==='L'?'D':'N'}</i>`).join('')}</span>`; }
function trendSection(c){
  const lg=c.lg;
  const closed=c.rounds.filter(r=>t(r.deadline)<=now());
  const next=c.rounds.find(r=>t(r.deadline)>now());
  const r=closed[closed.length-1];
  if(!r && !next) return '';
  let h=`<div class="ssec"><div class="stitle">${I.users}Choix de la journée</div>`;
  if(!r){ return h+`<div class="muted" style="margin-top:8px;font-size:14px">Les choix seront révélés le ${fmtDT(next.deadline)}.</div></div>`; }
  const ri=c.info[r.k]||{}; const voters=ri.aliveBefore||c.mem;
  const cnt={}; let tot=0;
  voters.forEach(u=>{ const p=pickOf(u,lg.id,r.k); if(!p) return; const k=c.pick?p.m+'|'+p.p:p.p; (cnt[k]=cnt[k]||{p,n:0}).n++; tot++; });
  const res=ri.res||{};
  const rows=Object.values(cnt).sort((a,b)=>b.n-a.n).slice(0,5).map(({p,n})=>{
    const pct=Math.round(n*100/tot); let logo='', ok='';
    if(c.pick){ const m=(r.matches||{})[p.m]; const sd=m&&(p.p==='H'?m.h:p.p==='A'?m.a:null); if(sd&&sd.logo) logo=`<img src="${esc(sd.logo)}" data-fb="" alt="">`; if(res[p.m]) ok=res[p.m]===p.p?' ✓':' ✗'; }
    else if(ri.win){ ok=ri.win===p.p?' ✓':' ✗'; }
    return `<div class="trow">${logo||'<span class="sdot"></span>'}<div class="tn">${esc(pickLabel(lg,{...r,k:r.k},p))}${ok?`<span class="${ok.includes('✓')?'green':'red'}">${ok}</span>`:''}<div class="tbar"><span style="width:${pct}%"></span></div></div><div class="tp"><b>${pct}%</b><span>${n} joueur${n>1?'s':''}</span></div></div>`;
  }).join('');
  const nob=voters.length-tot;
  h+=`<div class="help" style="margin:4px 0 6px;font-size:13px">${c.pick?'Journée':'Question'} ${ri.n||''} · ${tot} choix sur ${voters.length} survivant${voters.length>1?'s':''}${nob?` (${nob} sans choix)`:''}</div>${rows||'<div class="muted">Aucun choix.</div>'}`;
  if(next) h+=`<div class="muted" style="font-size:12px;margin-top:8px">Prochains choix révélés le ${fmtDT(next.deadline)}.</div>`;
  return h+'</div>';
}
function statsCard(c){
  const lg=c.lg; const key=lg.comp;
  const trend=trendSection(c);
  const f=key?S.feeds[key]:null; if(key&&!f) loadFeed(key);
  if(!f||f.missing||c.lg.category==='tuprefere'){ if(!trend) return ''; return `<details class="card coll" ${S.open['sx'+lg.id]?'open':''}><summary data-a="toggle" data-v="sx${lg.id}"><span class="ctitle">${I.flash}Statistiques</span>${I.chev}</summary>${trend}</details>`; }
  const form=teamForm(f);
  const pts=Object.keys(form).map(id=>[id, form[id].slice(0,5).reduce((a,r)=>a+(r==='W'?3:r==='D'?1:0),0), Math.min(5,form[id].length)]).filter(x=>x[2]>=2);
  if(pts.length<6){ if(!trend) return ''; return `<details class="card coll" ${S.open['sx'+lg.id]?'open':''}><summary data-a="toggle" data-v="sx${lg.id}"><span class="ctitle">${I.flash}Statistiques</span>${I.chev}</summary>${trend}</details>`; }
  const best=pts.slice().sort((a,b)=>b[1]-a[1]||a[2]-b[2]).slice(0,3), worst=pts.slice().sort((a,b)=>a[1]-b[1]||b[2]-a[2]).slice(0,3);
  const row=([id,p,n])=>statRow(f,id,`<b>${p}</b><span>pts</span>`,formDots(form[id]));
  const maxN=Math.max(...pts.map(x=>x[2]));
  let h=trend+`<div class="ssec"><div class="stitle">${I.flash}Les plus en forme</div><div class="slist">${best.map(row).join('')}</div></div>`;
  h+=`<div class="ssec"><div class="stitle">${I.down}À la peine</div><div class="slist">${worst.map(row).join('')}</div></div>`;
  h+=`<div class="muted" style="font-size:12px;margin-top:14px">Points pris sur les ${maxN} dernières journées${maxN<5?' (seules celles-ci sont disponibles pour l\'instant)':''}. Données du ${fmtDT(f.updatedAt)}.</div>`;
  return `<details class="card coll" ${S.open['sx'+lg.id]?'open':''}><summary data-a="toggle" data-v="sx${lg.id}"><span class="ctitle">${I.flash}Statistiques</span>${I.chev}</summary>${h}</details>`;
}
// Final/ongoing ranking: survivors share the top; the eliminated are ranked by elimination day
// (later = better), then by boldness of the losing pick (weaker team = better).
function journeyData(c,u){
  const lg=c.lg; const out=[];
  for(const r of c.rounds){ if(t(r.deadline)>now()) break; const ri=c.info[r.k]||{}; if(!ri.aliveBefore||!ri.aliveBefore.includes(u)) continue;
    const p=pickOf(u,lg.id,r.k); let ok=null;
    if(ri.state==='done'||ri.state==='tiebreak') ok=!ri.out.includes(u); else if(ri.state==='cancelled') ok='c';
    let logo=''; if(c.pick&&p&&r.matches&&r.matches[p.m]){ const m=r.matches[p.m]; const sd=p.p==='H'?m.h:p.p==='A'?m.a:null; logo=sd&&sd.logo||''; }
    out.push({n:ri.n||r.n, label:p?pickLabel(lg,r,p):'Pas de choix', logo, ok, rk:c.pick?pickRank(lg,r,p):null});
  }
  return out;
}
function journey(c,u,o={}){
  const items=journeyData(c,u);
  const st=c.winners.includes(u)?'🏆 Vainqueur':c.alive.includes(u)?'💚 Toujours en vie':`☠️ Éliminé à la J${(c.info[c.elimAt[u]]||{}).n||'?'}`;
  let h=`<div class="card jcard"><div class="jhead"><div>${o.title?`<div class="jt">${leagueTitle(c.lg.name)}</div>`:''}<div class="jst">${esc(nameOf(u))} · ${st}</div></div>${o.share?`<button class="btn sm ghost" data-a="shareJourney" data-v="${c.lg.id}">${I.share} PARTAGER</button>`:''}</div>`;
  if(!items.length) return h+`<div class="muted" style="margin-top:10px">Aucune journée jouée pour l'instant.</div></div>`;
  h+=`<div class="frise">${items.map(x=>`<div class="fj ${x.ok===true?'ok':x.ok===false?'ko':x.ok==='c'?'cx':'wait'}"><span class="fn">J${x.n}</span><span class="fl">${x.logo?`<img src="${esc(x.logo)}" data-fb="" alt="">`:esc(initials(x.label).slice(0,2))}</span><span class="fm">${x.ok===true?'✓':x.ok===false?'✗':x.ok==='c'?'=':'…'}</span><span class="ft">${esc(x.label)}${x.rk?` <em>${x.rk}e</em>`:''}</span></div>`).join('')}</div></div>`;
  return h;
}
function journeyText(c,u){
  const items=journeyData(c,u);
  const st=c.winners.includes(u)?'🏆 vainqueur':c.alive.includes(u)?'toujours en vie 💚':`éliminé à la J${(c.info[c.elimAt[u]]||{}).n||'?'} ☠️`;
  return `Mon parcours ${c.lg.name} : `+items.map(x=>`J${x.n} ${x.label} ${x.ok===true?'✅':x.ok===false?'❌':x.ok==='c'?'➖':'⏳'}`).join(' · ')+` — ${st}`;
}
function standingRows(c){
  const lg=c.lg, order={}; c.rounds.forEach((r,i)=>order[r.k]=i);
  const score=u=>{ if(c.alive.includes(u)) return [1e6, c.winners.includes(u)?1:0]; const rk=c.elimAt[u]; const r=lg.rounds[rk]; const pr=r?pickRank(lg,{...r,k:rk},pickOf(u,lg.id,rk)):null; return [order[rk]??-1, pr||0]; };
  const list=c.mem.map(u=>({u,s:score(u)}));
  list.sort((a,b)=>b.s[0]-a.s[0]||b.s[1]-a.s[1]||nameOf(a.u).localeCompare(nameOf(b.u)));
  return list.map(x=>{ const better=list.filter(y=>y.s[0]>x.s[0]||(y.s[0]===x.s[0]&&y.s[1]>x.s[1])).length; const tie=list.filter(y=>y!==x&&y.s[0]===x.s[0]&&y.s[1]===x.s[1]).length>0; return {u:x.u,pos:better+1,tie}; });
}
function viewLeague(lid){
  const c=C(lid);
  if(!c) return `<div class="empty"><div class="ico">🤷</div><h3>LIGUE INTROUVABLE</h3><p>Elle a peut-être été supprimée.</p><button class="btn" data-a="back">RETOUR</button></div>`;
  const lg=c.lg, mine=isMember(lid), alive=c.alive.includes(S.me);
  let pill='';
  if(mine && c.status!=='upcoming') pill = c.winners.includes(S.me)?'<span class="pill round" style="background:var(--brand)">🏆 GAGNANT</span>':alive?'<span class="pill round green"><span class="dot"></span>EN VIE</span>':'<span class="pill round red"><span class="dot"></span>ÉLIMINÉ</span>';
  else if(mine) pill='<span class="pill round green">INSCRIT</span>';
  let h=`<div class="lhead"><button class="cback" data-a="back" aria-label="Retour">${I.back}</button><div class="grow">${leagueTitle(lg.name)}</div>${pill}</div>`;
  h+=prizeBand(lg,'big');
  if(canManage(lg)) h+=`<button class="link grey" style="margin:-4px 0 14px" data-a="manage" data-v="${lid}">${I.gear.replace('<svg','<svg width="18" height="18"')} Gérer la ligue</button>`;
  if(c.status==='finished') h+= c.winners.includes(S.me)?`<div class="banner win"><span class="ico">🏆</span>${c.winners.length>1?'Tu fais partie des 2 derniers survivants !':'Tu es le grand gagnant !'}</div>`:`<div class="banner dead"><span class="ico">🏁</span>Ligue terminée · ${c.winners.map(w=>esc(nameOf(w))).join(' & ')} ${c.winners.length>1?'gagnent':'gagne'}</div>`;
  else if(!mine) h+= c.status==='upcoming'?`<div class="banner info"><span class="ico">🎟️</span><div style="flex:1">Inscriptions ouvertes jusqu'au ${fmtDT(lg.startAt)}</div><button class="btn sm green" data-a="join" data-v="${lid}">JE M'INSCRIS</button></div>`:`<div class="banner info"><span class="ico">🔒</span>Inscriptions closes. Tu suis la ligue en spectateur.</div>`;
  else if(c.status==='upcoming') h+=`<div class="banner alive"><span class="ico svgico">${I.clock}</span>Inscrit ! Début dans ${until(lg.startAt)||'quelques instants'}</div>`;
  else if(alive) h+=`<div class="banner alive"><span class="ico">💚</span>${c.alive.length===1?'Tu es le dernier !':`Tu es dans les ${c.alive.length} derniers !`}</div>`;
  else h+=`<div class="banner dead"><span class="ico">☠️</span>Tu es éliminé. Tente ta chance dans une autre ligue…</div>`;
  const tab=S.view.ltab;
  h+=`<div class="seg"><button class="${tab==='paris'?'on':''}" data-a="ltab" data-v="paris">${c.pick?'Paris':'Vote'}</button><button class="${tab==='surv'?'on':''}" data-a="ltab" data-v="surv">Survivants</button><button class="${tab==='hist'?'on':''}" data-a="ltab" data-v="hist">Historique</button></div>`;
  if(tab==='paris'){
    h+=rulesCard(lg)+standingsCard(lg)+statsCard(c);
    const open=c.rounds.filter(r=>t(r.deadline)>now()).slice(0,1);
    const waiting=c.rounds.filter(r=>t(r.deadline)<=now() && ['waiting'].includes((c.info[r.k]||{}).state));
    if(c.status==='finished') h+=`<div class="empty"><div class="ico">🏁</div><h3>C'EST FINI</h3><p>Revis la ligue dans l'historique.</p></div>`;
    else {
      if(open.length) h+=open.map(r=>roundCard(c,r)).join('');
      else h+=`<div class="card muted" style="text-align:center;font-size:15px">Pas de journée ouverte pour l'instant.${canManage(lg)?' Importe la prochaine depuis « Gérer la ligue ».':' La prochaine arrive bientôt !'}</div>`;
      if(waiting.length) h+=`<div class="sec2">EN ATTENTE DES RÉSULTATS</div>`+waiting.map(r=>roundCard(c,r)).join('');
    }
  } else if(tab==='surv'){
    const shown=c.status==='upcoming'?c.mem:c.alive;
    if(c.status==='live') h+=`<div class="muted" style="text-align:center;font-family:var(--bold);font-weight:700;margin-bottom:4px">Vous n'êtes plus que ${c.alive.length} en vie !</div>`;
    const done=c.rounds.filter(r=>['done','cancelled'].includes((c.info[r.k]||{}).state)).length;
    h+=`<div class="card"><span class="ctitle">${I.chart}Statistiques</span><div class="statgrid" style="margin-bottom:0"><div class="stat" style="background:#fff"><b>${c.mem.length}</b><span>Inscrits</span></div><div class="stat" style="background:#fff"><b>${done}</b><span>Journées</span></div><div class="stat" style="background:#fff"><b>${c.mem.length-c.alive.length}</b><span>Éliminés</span></div></div></div>`;
    h+=`<div class="plist"><div class="sec">Classement</div>`+standingRows(c).map(x=>{
      const p=x.u, dead=!c.alive.includes(p); const r=dead?c.lg.rounds[c.elimAt[p]]:null; const pk=r?pickOf(p,lid,c.elimAt[p]):null;
      const rk=r&&pk?pickRank(lg,{...r,k:c.elimAt[p]},pk):null;
      const sub=dead?`Éliminé J${(c.info[c.elimAt[p]]||{}).n||'?'} · ${pk?esc(pickLabel(lg,{...r,k:c.elimAt[p]},pk))+(rk?` (${rk}e)`:''):'pas de choix'}`:(c.status==='upcoming'?'Inscrit':c.winners.includes(p)?'Vainqueur':'Toujours en vie');
      const pill=c.winners.includes(p)?'<span class="pill" style="background:var(--brand)">🏆</span>':dead?'<span class="pill red">Éliminé</span>':'<span class="pill green">En vie</span>';
      return `<div class="prow"><div class="pos ${dead?'':'live'}">${x.pos}<sup>${x.pos===1?'er':'e'}</sup>${x.tie?'<i>ex æquo</i>':''}</div>${avatarOf(p,dead?'dead':'')}<div class="nm">${esc(nameOf(p))}${p===S.me?'<span class="me-tag">TOI</span>':''}<small>${sub}</small></div>${pill}</div>`;
    }).join('')+'</div>';
  } else {
    const past=c.rounds.filter(r=>t(r.deadline)<=now()).reverse();
    if(!past.length) h+=`<div class="empty"><h3>RIEN POUR L'INSTANT</h3><p>Les journées passées apparaîtront ici.</p></div>`;
    const hv=S.view.hv||'days';
    if(past.length) h+=`<div class="chips in" style="margin-bottom:12px"><button class="chip sm ${hv==='days'?'on':''}" data-a="hview" data-v="days">Par journée</button>${c.mem.map(u=>`<button class="chip sm ${hv===u?'on':''}" data-a="hview" data-v="${u}">${esc(u===S.me?'Moi':nameOf(u))}</button>`).join('')}</div>`;
    if(hv!=='days' && past.length){ h+=journey(c,hv,{share:hv===S.me}); return h; }
    past.forEach(r=>{
      h+=roundCard(c,r,{hint:false});
      const ri=c.info[r.k]||{}; const voters=(ri.aliveBefore||[]);
      if(voters.length) h+=`<div class="card" style="margin-top:-6px"><span class="lbl">Choix des joueurs</span>`+voters.map(u=>{ const p=pickOf(u,lid,r.k); const res=c.pick&&p?(ri.res||{})[p.m]:null; const ok=c.pick?(p&&res&&res===p.p):(p&&ri.win?p.p===ri.win:null); return `<div class="prow">${avatarOf(u)}<div class="nm">${esc(nameOf(u))}<small>${p?esc(pickLabel(lg,r,p)):'pas de choix'}</small></div>${ri.state==='done'?(ri.out.includes(u)?'<span class="pill red">Éliminé</span>':'<span class="pill green">OK</span>'):ok===null||ri.state!=='done'?'':''}</div>`; }).join('')+'</div>';
    });
  }
  return h;
}

function viewParis(){
  let h=`<div class="ptitle">${titleImg('title-mes-paris.png','MES PARIS')}</div>`;
  const my=Object.keys(S.leagues).filter(isMember).map(C).filter(Boolean);
  if(!my.length) return h+`<div class="empty"><div class="ico">🎟️</div><h3>AUCUNE LIGUE</h3><p>Inscris-toi à une ligue pour jouer.</p><button class="btn" data-a="tab" data-v="ligues">VOIR LES LIGUES</button></div>`;
  const next=[], wait=[], hist=[];
  my.forEach(c=>{
    const alive=c.alive.includes(S.me);
    const open=c.rounds.find(r=>t(r.deadline)>now());
    if(open && alive && c.status!=='finished') next.push([c,open]);
    c.rounds.forEach(r=>{ const ri=c.info[r.k]||{}; const p=pickOf(S.me,c.lg.id,r.k); if(t(r.deadline)<=now() && p){ if(ri.state==='waiting') wait.push([c,r]); else if(ri.state==='done'||ri.state==='cancelled') hist.push([c,r,p,ri]); } });
  });
  next.sort((a,b)=>t(a[1].deadline)-t(b[1].deadline));
  const hdr=(c,r)=>{ const n=(c.info[r.k]||{}).n; const m=c.lg.name.match(/^\s*survivor\b\s*(.*)$/i);
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px"><span style="font-family:var(--bold);font-weight:800;font-size:16px;display:flex;align-items:center;gap:8px;min-width:0">${m?`<span style="font-size:15px">${WM()}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-flex;align-items:center">${xify(esc(m[1]))}</span>`:esc(c.lg.name)}</span><span class="muted hdr-r" style="font-size:14px;white-space:nowrap">${c.pick?'JOURNÉE':'QUESTION'} ${n||''} · ${fmtD(r.deadline)}</span></div>`; };
  h+=`<div class="sec" style="margin-top:4px">Prochaine journée (${next.length})</div>`;
  if(!next.length) h+=`<div class="card muted" style="text-align:center;font-size:15px">Rien à jouer pour le moment 👌</div>`;
  next.forEach(([c,r])=>{
    const my=pickOf(S.me,c.lg.id,r.k); const nm=c.pick?matchesOf(r).length:0;
    const info=c.pick?`<div class="dl open" style="font-size:15px">${nm} match${nm>1?'s':''} · ${my?'ton choix est en surbrillance':'à toi de choisir'} · modifiable jusqu'au ${fmtDT(r.deadline)}</div>`:`<div class="dl open" style="font-size:15px">Vote modifiable jusqu'au ${fmtDT(r.deadline)}</div>`;
    let card=roundCard(c,r,{header:hdr(c,r)+info, compact:true, hint:false});
    card=card.replace(/<div class="dl open">[\s\S]*?<\/div>/,''); // header already shows deadline
    h+=card;
  });
  if(wait.length){ h+=`<div class="sec2">EN ATTENTE DES RÉSULTATS</div>`; wait.forEach(([c,r])=>{ h+=`<div class="card"><div style="font-family:var(--bold);font-weight:800">${esc(c.lg.name)} · Journée ${(c.info[r.k]||{}).n||''}</div><div class="muted" style="margin-top:4px">Ton choix : <b style="color:var(--on)">${esc(pickLabel(c.lg,r,pickOf(S.me,c.lg.id,r.k)))}</b></div></div>`; }); }
  if(hist.length){
    h+=`<div class="sec">Historique</div>`;
    hist.sort((a,b)=>t(b[1].deadline)-t(a[1].deadline)).slice(0,20).forEach(([c,r,p,ri])=>{
      const out=ri.out&&ri.out.includes(S.me); const ok=ri.state==='cancelled'?null:!out;
      h+=`<div class="prow"><div class="av" style="background:${ok===null?'var(--muted)':ok?'var(--ok2)':'var(--brand)'}">${ok===null?'–':ok?'✓':'✗'}</div><div class="nm">${esc(pickLabel(c.lg,r,p))}<small>${esc(c.lg.name)} · ${c.pick?'Journée':'Question'} ${ri.n||''}${ri.state==='cancelled'?' · annulée':''}</small></div></div>`;
    });
  }
  return h;
}

function viewAdmin(){
  if(S.view.manage) return viewManage(S.view.manage);
  const owner=S.isOwner;
  let h=`<div class="ptitle">${owner?titleImg('title-admin.png','ADMIN'):titleImg('title-ma-ligue.png','MA LIGUE')}<div class="sub">${owner?'Crée et gère les ligues.':'Crée ta ligue privée et invite tes proches avec un code.'}</div></div>`;
  const mineL = owner ? Object.values(S.leagues) : Object.values(S.leagues).filter(l=>l.id===S.me);
  if(owner || !mineL.length){
    const d=new Date(now()+864e5); d.setHours(20,0,0,0);
    const k=S.view.newCat, cc=cat(k);
    h+=`<div class="card"><div class="ctitle" style="margin-bottom:18px">Créer une ligue</div>
      <label class="f">Nom</label>${pfxInput('nl-name','','','Ligue des potes')}
      <label class="f">Catégorie</label><div class="chips in">${Object.entries(CATS).map(([kk,v])=>`<button class="chip ${kk===k?'on':''}" data-a="newCat" data-v="${kk}">${esc(v.label)}</button>`).join('')}</div>
      <label class="f" style="margin-top:4px">Type de pari : ${cc.mode==='pick'?'un match par journée':'vote à la majorité'}</label>
      <div class="help" style="margin:0">${cc.mode==='pick'?`Chaque joueur choisit UN seul match par journée et parie dessus. Interdit de reprendre une équipe déjà jouée.${cc.draw?' Le match nul peut être parié.':''}`:'Chaque question oppose 2 options : ceux qui votent comme la minorité sont éliminés.'}</div>
      <label class="f">Description (optionnel)</label><textarea class="in" id="nl-desc" maxlength="300" placeholder="Entre amis pour tester…"></textarea>
      <label class="f">Fin des inscriptions (date + heure)</label><div class="row2"><input class="in" type="date" id="nl-date" value="${dateIn(d)}"><input class="in" type="time" id="nl-time" value="20:00"></div>
      <button class="btn pop full" style="margin-top:18px" data-a="createLeague">CRÉER LA LIGUE</button></div>`;
  }
  if(mineL.length){
    h+=`<div class="sec">${owner?'Gérer les ligues':'Ma ligue'}</div>`;
    mineL.map(l=>C(l.id)).filter(Boolean).sort((a,b)=>(+(b.lg.pin||0))-(+(a.lg.pin||0)) || t(b.lg.createdAt)-t(a.lg.createdAt)).forEach(c=>{
      const todo=c.rounds.filter(r=>(c.info[r.k]||{}).state==='waiting').length;
      h+=`<button class="lrow" data-a="manage" data-v="${c.lg.id}"><span class="th">${coverHtml(c.lg)}</span><span class="x">${leagueTitle(c.lg.name)}<small>${c.lg.pin?'⭐ En premier · ':''}${c.mem.length} joueurs · ${c.rounds.length} journées · code ${esc(c.lg.code||'')}</small></span>${todo?'<span class="pill orange">Résultats</span>':statusPill(c)}</button>`;
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
  h+=`<div class="card"><div class="h-disp">NOM &amp; DESCRIPTION</div>
    <label class="f">Nom de la ligue</label>${pfxInput('ei-name','w',stripPrefix(lg.name),'Ligue 1')}
    <label class="f">Description</label><textarea class="in w" id="ei-desc" maxlength="300" placeholder="Quelques mots affichés sur la vignette de la ligue…">${esc(lg.description||'')}</textarea>
    ${c.status==='upcoming'?`<label class="f">Date de début (fin des inscriptions)</label><div class="row2"><input class="in w" type="date" id="ei-date" value="${dateIn(sd)}"><input class="in w" type="time" id="ei-time" value="${timeIn(sd)}"></div><div class="help">La ligue démarre le ${fmtDT(lg.startAt)}.</div>`:''}
    <label class="f">Catégorie</label><div class="chips in" style="flex-wrap:wrap">${Object.entries(CATS).map(([k,v])=>`<button class="chip sm ${k===lg.category?'on':''}" ${c.rounds.length?'disabled title="Catégorie figée après la 1re journée"':`data-a="setCat" data-v="${lid}|${k}"`}>${esc(v.label)}</button>`).join('')}</div>
    ${cc.comps.length?`<label class="f">Championnat</label><div class="chips in" style="flex-wrap:wrap">${cc.comps.map(k=>`<button class="chip sm ${k===lg.comp?'on':''}" data-a="setComp" data-v="${lid}|${k}">${esc(COMP_NAMES[k])}</button>`).join('')}</div><div class="help" style="margin:-4px 0 12px;font-size:13px">Sert pour le classement, les stats et l'import des journées.</div>`:''}
    <button class="btn pop full" style="margin-top:6px" data-a="saveInfo" data-v="${lid}">ENREGISTRER</button></div>`;
  // cover
  const cur=lg.cover||'auto', shown=coverKey(lg);
  h+=`<div class="card"><div class="h-disp" style="font-size:24px">PHOTO DE LA LIGUE</div><div class="bigcover">${coverHtml(lg)}</div>${isPhoto(shown)?`<div class="credit">${creditLine(shown)}</div>`:''}
    <div class="covers"><button class="auto ${cur==='auto'?'on':''}" data-a="setCover" data-v="${lid}|auto">${I.sparkle}AUTO</button>${PHOTOS.map(p=>`<button class="${cur===p.k?'on':''}" data-a="setCover" data-v="${lid}|${p.k}">${coverImg(p.k)}${esc(p.label)}</button>`).join('')}</div>
    <div class="help" style="margin:-4px 0 12px;font-size:13px">« Auto » attribue une de ces photos à la ligue.</div>
    <button class="btn line full" data-a="uploadCover" data-v="${lid}">${I.image} IMPORTER UNE PHOTO</button></div>`;
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
          ${S.open['peek'+r.k]?`<ul class="imp-list">${r.ev.map(id=>{ const e=f.events[id]||{}; const a=teamOf(f,e.h), b=teamOf(f,e.a); return `<li>${a.logo?`<img src="${esc(a.logo)}" data-fb="" alt="">`:''}${esc(a.n)} – ${esc(b.n)}${b.logo?`<img src="${esc(b.logo)}" data-fb="" alt="">`:''}<span class="muted">${esc(fmtShort(e.d))}</span></li>`; }).join('')}</ul>`:''}</div>
          ${done?'<span class="done">IMPORTÉE ✓</span>':started?'<span class="done" style="color:var(--muted)">COMMENCÉE</span>':`<button class="btn" data-a="importRound" data-v="${lid}|${esc(r.k)}">IMPORTER</button>`}</div>`;
      });
      h+=`<div class="muted" style="font-size:12px;margin-top:6px">Calendrier mis à jour le ${fmtDT(f.updatedAt)}</div>`;
    }
    h+=`</div>`;
  }
  // rules
  h+=`<div class="card"><div class="h-disp">RÈGLES DU JEU</div><div class="help" style="margin:-6px 0 12px;font-size:14px">Ce texte s'affiche en haut de la ligue pour tous les joueurs.</div><textarea class="in w" id="ru-txt" style="min-height:220px;font-size:16px">${esc((lg.rules||'').trim()||DEFAULT_RULES[c.pick?'pick':'majority'])}</textarea>
    <div style="display:flex;gap:10px;margin-top:14px;align-items:center"><button class="btn" style="flex:1.6" data-a="saveRules" data-v="${lid}">ENREGISTRER</button><button class="link grey" style="flex:1;justify-content:center" data-a="defRules" data-v="${lid}">PAR DÉFAUT</button></div></div>`;
  // registrations
  h+=`<div class="card"><div class="h-disp" style="font-size:24px">INSCRIPTIONS</div>${c.status==='upcoming'?`<div class="help green" style="margin:0 0 14px">Ouvertes jusqu'au ${fmtDT(lg.startAt)} · ${c.mem.length} inscrit${c.mem.length>1?'s':''}</div><button class="btn line full" data-a="startNow" data-v="${lid}">DÉMARRER MAINTENANT (CLÔTURER)</button>`:`<div class="help" style="margin:0">Closes depuis le ${fmtDT(lg.startAt)} · ${c.mem.length} inscrit${c.mem.length>1?'s':''}</div>`}</div>`;
  // manual create
  const d=new Date(now()+864e5); d.setHours(21,0,0,0);
  if(c.pick){
    const futureRounds=c.rounds.filter(r=>t(r.deadline)>now());
    h+=`<div class="card"><div class="h-disp" style="font-size:24px">CRÉER UN MATCH</div>
      <div class="row2 eq"><div><label class="f">Domicile</label><input class="in w" id="am-h" maxlength="40" placeholder="PSG"></div><div><label class="f">Extérieur</label><input class="in w" id="am-a" maxlength="40" placeholder="OM"></div></div>
      <label class="f">Date et heure du match</label><div class="row2"><input class="in w" type="date" id="am-d" value="${dateIn(d)}"><input class="in w" type="time" id="am-t" value="21:00"></div>
      <label class="f">Ajouter à</label><select class="in w" id="am-r"><option value="new">Nouvelle journée</option>${futureRounds.map(r=>`<option value="${r.k}">Journée ${(c.info[r.k]||{}).n||''} (${fmtD(r.deadline)})</option>`).join('')}</select>
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

function viewProfil(){
  const me=S.players[S.me]||{}; const name=nameOf(S.me);
  const my=Object.keys(S.leagues).filter(isMember).map(C).filter(Boolean);
  const wins=my.filter(c=>c.winners.includes(S.me)).length, alive=my.filter(c=>c.status!=='finished'&&c.alive.includes(S.me)).length;
  let h=`<div class="ptitle">${titleImg('title-profil.png','PROFIL')}</div>`;
  h+=`<div style="text-align:center"><button class="avatar-big" data-a="uploadAvatar">${me.avatar?`<img src="${blobUrl(me.avatar)}" data-fb="${esc(initials(name))}" alt="">`:esc(initials(name))}<span class="cam">${I.cam}</span></button><div style="margin:18px 0 22px"><button class="link" data-a="uploadAvatar">Changer la photo</button></div></div>`;
  h+=`<div class="card" style="display:flex;align-items:center;gap:14px"><div style="flex:1;min-width:0"><div class="lbl">Nom d'utilisateur</div><div class="pname" style="margin-top:10px">${esc(name)}</div>${S.email?`<div class="pmail">${esc(S.email)}</div>`:'<div style="height:10px"></div>'}${S.isOwner?`<span class="badge">${I.shield}ADMIN</span>`:''}</div><button class="circ" data-a="editName" aria-label="Modifier">${I.edit}</button></div>`;
  h+=`<div class="statgrid"><div class="stat"><b>${my.length}</b><span>Ligues</span></div><div class="stat"><b>${alive}</b><span>En vie</span></div><div class="stat"><b>${wins}</b><span>Victoires</span></div></div>`;
  if(S.mode==='demo') h+=`<div class="card" style="font-size:14px;line-height:1.5"><b>Mode démo.</b> Données fictives, rien n'est enregistré. Ouvre le site depuis son lien claude.ai, connecté, pour jouer avec tes proches.</div>`;
  if(S.readOnly) h+=`<div class="card" style="background:var(--brand-soft);font-size:14px;line-height:1.5"><b>Lecture seule.</b> Pour jouer, l'organisateur doit t'inviter sur le site avec le rôle Éditeur.</div>`;
  const jl=my.filter(c=>c.started && c.rounds.some(r=>t(r.deadline)<=now()));
  if(jl.length){ h+=`<div class="sec">Mon parcours</div>`+jl.map(c=>journey(c,S.me,{title:true,share:true})).join(''); }
  if(CREDITS && Object.keys(CREDITS).length) h+=`<details class="card coll" style="margin-top:14px"><summary><span class="lbl">Crédits photos</span>${I.chev}</summary><div class="credits">${PHOTOS.filter(p=>CREDITS[p.k]).map(p=>`<p><b>${esc(p.label)}</b> — ${creditLine(p.k)}</p>`).join('')}</div></details>`;
  h+=installCard('profil');
  if(window.survivorLogout) h+=`<button class="btn line full" style="margin-top:18px" data-a="logout">SE DÉCONNECTER</button>`;
  h+=`<div style="text-align:center;margin-top:26px"><button class="link red" style="color:var(--err)" data-a="wipe">${I.trash.replace('<svg','<svg width="22" height="22"')} Supprimer mes données</button></div>`;
  return h;
}

/* ================================================================ Render */
function countTodo(){ let n=0; Object.keys(S.leagues).filter(isMember).forEach(lid=>{ const c=C(lid); if(!c||c.status==='finished'||!c.alive.includes(S.me)) return; const r=c.rounds.find(r=>t(r.deadline)>now()); if(r && !pickOf(S.me,lid,r.k)) n++; }); return n; }
function render(){
  const app=document.getElementById('app');
  if(S.mode==='loading'||(S.mode==='live'&&!(S.loaded.leagues&&S.loaded.players))){ app.innerHTML='<div class="spin"></div>'; return; }
  const keep={}; app.querySelectorAll('input,textarea,select').forEach(el=>{ if(el.id) keep[el.id]=el.value; });
  const focusId=document.activeElement&&document.activeElement.id;
  const v=S.view; let body;
  if(v.tab==='ligues'&&v.league) body=viewLeague(v.league);
  else if(v.tab==='ligues') body=viewHome();
  else if(v.tab==='paris') body=viewParis();
  else if(v.tab==='admin') body=viewAdmin();
  else body=viewProfil();
  const todo=countTodo();
  const tabs=[['ligues','Ligues',I.trophy],['paris','Mes paris',I.paris],['admin',S.isOwner?'Admin':'Ma ligue',S.isOwner?I.gear:I.plus],['profil','Profil',I.user]];
  app.innerHTML=(S.mode==='demo'?`<div class="demo">🎮 <span><b>MODE DÉMO</b> · données fictives, rien n'est enregistré.</span></div>`:'')+
    (S.stale?`<div class="demo">⚠️ <span>Connexion lente : les données peuvent ne pas être à jour.</span><button class="demo-btn" data-a="reload">Réessayer</button></div>`:'')+
    `<div class="page">${body}</div><nav class="bottom">${tabs.map(([k,l,ic])=>`<button class="${v.tab===k?'on':''}" data-a="tab" data-v="${k}">${ic}${l}${k==='paris'&&todo?`<span class="nbadge">${todo}</span>`:''}</button>`).join('')}</nav>`;
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
