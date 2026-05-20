import catalogData from '../data/catalog.json';
import pricingData from '../data/pricing.json';
import suggestionsData from '../data/suggestions.json';
import { initPdf } from './pdf.js';

const { GROUPS, CATALOG } = catalogData;

let curModel = '', curMotor = '', curTrn = '', curCode = '';
let selKMs = [];
let selSuggestions = [];

const PREPAID_ACTIVITIES = [
  { name: 'Chequeo Previaje',                      condition: '1 por MTO',    value: 44.85, qty: n => n },
  { name: 'Lavada de Vehículo',                    condition: '2 por MTO',    value: 13.46, qty: n => 2 * n },
  { name: 'Recuperación de Brillo / Abrillantado', condition: '1 por cada 3', value: 44.85, qty: n => Math.floor(n / 3) },
  { name: 'Limpieza de Motor',                     condition: '1 por cada 3', value: 22.43, qty: n => Math.floor(n / 3) },
  { name: 'Bono de Pintura',                       condition: '1 por cada 4', value: 50.00, qty: n => Math.floor(n / 4) },
];

const AC_FILTER_PRICES = {
  'Soluto AB': 21.17, 'Sonet QY': 17.27, 'Picanto JA': 14.18, 'Picanto TA': 14.18, 'Rio SC': 19.06,
  'Cerato BDm': 19.06, 'K3 BL7m': 19.06, 'K3 BL7m Cross': 19.06, 'Stonic YBCVU': 17.27, 'Seltos SP2i': 19.06, 'Seltos SP2c': 19.06, 'Carens KY': 17.27,
  'Sportage NQ5': 50.01, 'Sportage QL': 46.95, 'Niro DE HEV': 20.75, 'Niro SG2 HEV': 20.75, 'Sorento MQ4': 50.01, 'Sportage SL': 21.17, 'Carnival KA4': 17.13, 'Carnival YP': 17.13, 'Stinger CK': 72.61, 'K5 DL3 HEV': 72.61, 'Optima JF HEV': 72.61
};

export function initApp() {
  initNav();
  initSelects();
  
  // Initialize PDF module and pass a state getter function
  initPdf(() => ({
    curCode, curModel, curMotor, curTrn, selKMs, selSuggestions, pricingData
  }));

  document.getElementById('btn-reset').addEventListener('click', resetAll);
  document.getElementById('btn-cat-hero').addEventListener('click', () => showSec('catalogue'));
  
  // Filter logic for catalogue
  document.querySelectorAll('.cfbtn').forEach(b => {
    b.addEventListener('click', (e) => filterCat(e.target.dataset.seg, e.target));
  });

  renderCat('all');
}

function initNav() {
  document.querySelectorAll('.nlnk').forEach(btn => {
    btn.addEventListener('click', (e) => {
      showSec(e.target.dataset.sec, e.target);
    });
  });
}

function showSec(id, btn = null) {
  document.querySelectorAll('.psec').forEach(s => s.classList.remove('act'));
  document.getElementById(`sec-${id}`).classList.add('act');
  if (btn) {
    document.querySelectorAll('.nlnk').forEach(b => b.classList.remove('act'));
    btn.classList.add('act');
  }
}

function initSelects() {
  document.getElementById('met-var').textContent = Object.keys(CATALOG).length;
  initAutocomplete();
  document.getElementById('sel-mtr').addEventListener('change', onMtr);
  document.getElementById('sel-trn').addEventListener('change', onTrn);
}

function initAutocomplete() {
  const inp = document.getElementById('inp-mod');
  const list = document.getElementById('ac-list');
  const modelNames = GROUPS.map(g => g.n);
  let focusIdx = -1;

  function highlight(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }

  function showList(query) {
    const q = query.trim().toLowerCase();
    const matches = q
      ? modelNames.filter(n => n.toLowerCase().includes(q))
      : modelNames;

    list.innerHTML = '';
    focusIdx = -1;

    if (matches.length === 0) {
      list.innerHTML = '<li class="ac-empty">Sin resultados</li>';
    } else {
      matches.forEach(name => {
        const li = document.createElement('li');
        li.className = 'ac-item';
        li.innerHTML = highlight(name, q);
        li.addEventListener('mousedown', (e) => {
          e.preventDefault(); // prevent blur before click
          selectModel(name);
        });
        list.appendChild(li);
      });
    }

    list.classList.remove('hidden');
  }

  function hideList() {
    list.classList.add('hidden');
    focusIdx = -1;
  }

  function selectModel(name) {
    inp.value = name;
    hideList();
    onMod({ target: { value: name } });
  }

  function moveFocus(dir) {
    const items = list.querySelectorAll('.ac-item');
    if (!items.length) return;
    items[focusIdx]?.classList.remove('ac-focus');
    focusIdx = Math.max(0, Math.min(items.length - 1, focusIdx + dir));
    items[focusIdx].classList.add('ac-focus');
    items[focusIdx].scrollIntoView({ block: 'nearest' });
  }

  inp.addEventListener('input', () => showList(inp.value));
  inp.addEventListener('focus', () => showList(inp.value));
  inp.addEventListener('blur', () => setTimeout(hideList, 150));

  inp.addEventListener('keydown', (e) => {
    if (list.classList.contains('hidden')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const focused = list.querySelector('.ac-focus');
      if (focused) selectModel(focused.textContent);
    }
    else if (e.key === 'Escape') hideList();
  });
}

function onMod(e) {
  curModel = e.target.value;
  curMotor = ''; curTrn = ''; curCode = '';
  selKMs = [];
  
  const selMtr = document.getElementById('sel-mtr');
  const selTrn = document.getElementById('sel-trn');
  selMtr.innerHTML = '<option value="">— Motor —</option>';
  selTrn.innerHTML = '<option value="">— Trans. —</option>';
  selTrn.disabled = true;
  document.getElementById('codbox').classList.add('hidden');
  document.getElementById('seg-badge').textContent = '— Segmento';
  
  if (!curModel) {
    selMtr.disabled = true;
    updateUI();
    return;
  }
  
  const g = GROUPS.find(x => x.n === curModel);
  if (g) {
    g.mo.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = m;
      selMtr.appendChild(opt);
    });
    selMtr.disabled = false;
  }
  updateUI();
}

function onMtr(e) {
  curMotor = e.target.value;
  curTrn = ''; curCode = '';
  selKMs = [];
  
  const selTrn = document.getElementById('sel-trn');
  selTrn.innerHTML = '<option value="">— Trans. —</option>';
  document.getElementById('codbox').classList.add('hidden');
  
  if (!curMotor) {
    selTrn.disabled = true;
    updateUI();
    return;
  }
  
  const g = GROUPS.find(x => x.n === curModel);
  if (g && g.v[curMotor]) {
    g.v[curMotor].forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.tr; opt.textContent = v.tr;
      selTrn.appendChild(opt);
    });
    selTrn.disabled = false;
  }
  updateUI();
}

function onTrn(e) {
  curTrn = e.target.value;
  selKMs = [];
  selSuggestions = [];
  
  if (!curTrn) {
    curCode = '';
    document.getElementById('codbox').classList.add('hidden');
    document.getElementById('seg-badge').textContent = '— Segmento';
    document.getElementById('seg-badge').className = 'badge bn';
    hideSugCard();
    updateUI();
    return;
  }
  
  const g = GROUPS.find(x => x.n === curModel);
  if (g && g.v[curMotor]) {
    const match = g.v[curMotor].find(x => x.tr === curTrn);
    if (match) {
      curCode = match.code;
      document.getElementById('codval').textContent = curCode;
      document.getElementById('codbox').classList.remove('hidden');
      const catInfo = CATALOG[curCode];
      if (catInfo) {
        const sg = catInfo.sg || 'B';
        document.getElementById('seg-badge').textContent = 'Segmento ' + sg;
        document.getElementById('seg-badge').className = 'badge ba';
      }
    }
  }
  renderKMs();
  renderSuggestions();
  updateUI();
}

function renderKMs() {
  const grid = document.getElementById('km-grid');
  grid.innerHTML = '';
  if (!curCode) return;
  
  const data = pricingData[curCode];
  if (!data || !data.k) return;
  
  // Sort KMs numerically
  const kms = Object.keys(data.k).map(Number).sort((a,b) => a-b).map(String);
  
  kms.forEach(km => {
    const btn = document.createElement('div');
    btn.className = 'kmb';
    btn.textContent = km + 'K';
    btn.addEventListener('click', () => toggleKM(km, btn));
    grid.appendChild(btn);
  });
}

function toggleKM(km, btn) {
  if (selKMs.includes(km)) {
    selKMs = selKMs.filter(k => k !== km);
    btn.classList.remove('kms');
  } else {
    // Enforcement: only contiguous selection if we want to be strict, but let's just allow toggling
    selKMs.push(km);
    // sort numerically
    selKMs.sort((a,b) => Number(a) - Number(b));
    btn.classList.add('kms');
  }
  updateUI();
}

function updateUI() {
  const ppBody = document.getElementById('pp-body');
  const ppCnt = document.getElementById('pp-cnt');
  const ppEmpty = document.getElementById('pp-empty');
  
  if (!curCode || selKMs.length === 0) {
    ppEmpty.classList.remove('hidden');
    ppCnt.classList.add('hidden');
    document.getElementById('pp-seg').textContent = 'Sin seleccionar';
    return;
  }
  
  ppEmpty.classList.add('hidden');
  ppCnt.classList.remove('hidden');
  document.getElementById('pp-seg').textContent = `${curModel} - ${curMotor}`;
  
  const d = pricingData[curCode];
  const n = selKMs.length;
  const disc = n >= 2 ? 0.05 : 0;
  
  let tRep = 0, tMO = 0, tSinIVA = 0, tConIVA = 0;
  selKMs.forEach(km => {
    const kd = d.k[km];
    if (kd) {
      tRep += kd.r;
      tMO += kd.o;
      tSinIVA += kd.s;
      tConIVA += kd.c;
    }
  });

  // Add selected suggestions (no IVA applied — they're already final price)
  const tSug = selSuggestions.reduce((acc, s) => acc + s.price, 0);
  const grandTotal = tConIVA * (1 - disc) + tSug;
  
  let html = `
    <div class="pprow"><span class="pplbl">Repuestos (PVP)</span><span class="ppval">$${tRep.toFixed(2)}</span></div>
    <div class="pprow"><span class="pplbl">Mano de Obra</span><span class="ppval">$${tMO.toFixed(2)}</span></div>
    <div class="ppdiv"></div>
    <div class="pprow"><span class="pplbl">Subtotal</span><span class="ppval">$${tSinIVA.toFixed(2)}</span></div>
    <div class="pprow"><span class="pplbl">IVA (15%)</span><span class="ppval">$${(tConIVA - tSinIVA).toFixed(2)}</span></div>
    <div class="ppdiv"></div>
  `;
  
  if (disc > 0) {
    html += `
      <div class="pptrow">
        <span class="pptlbl">Mantenimientos</span>
        <span class="pptval str" style="font-size:16px">$${tConIVA.toFixed(2)}</span>
      </div>
      <div class="pptrow" style="margin-top:5px">
        <span class="pptlbl">Total Prepagado</span>
        <span class="pptval">$${(tConIVA * (1-disc)).toFixed(2)}</span>
      </div>
      <div class="savbox">
        <span class="savlbl">Ahorro por ${n} MTOs</span>
        <span class="savval">$${(tConIVA - tConIVA*(1-disc)).toFixed(2)}</span>
      </div>
    `;
  } else {
    html += `
      <div class="pptrow">
        <span class="pptlbl">Total mantenimientos</span>
        <span class="pptval" style="color:#fff">$${tConIVA.toFixed(2)}</span>
      </div>
    `;
  }

  // Prepaid activities block (2+ MTOs)
  if (n >= 2) {
    const acts = PREPAID_ACTIVITIES
      .map(a => ({ ...a, count: a.qty(n) }))
      .filter(a => a.count > 0);
    if (acts.length > 0) {
      const totalBenefits = acts.reduce((sum, a) => sum + a.count * a.value, 0);
      html += `<div class="ppdiv"></div><div class="bsec"><div class="bttl">Actividades prepagadas incluidas</div>`;
      acts.forEach(a => {
        html += `
          <div class="brow">
            <div>
              <div class="bnam">${a.name}</div>
              <div class="bcnd">${a.condition} · ${a.count} sesión${a.count > 1 ? 'es' : ''}</div>
            </div>
            <div class="bval">$${(a.count * a.value).toFixed(2)}</div>
          </div>`;
      });
      html += `
        <div class="brow" style="margin-top:4px;background:rgba(68,180,139,.1);border:1px solid rgba(68,180,139,.25)">
          <div class="bnam" style="color:#4ade80">Valor total en beneficios</div>
          <div class="bval">$${totalBenefits.toFixed(2)}</div>
        </div>
      </div>`;
    }
  }

  // Suggestions block
  if (tSug > 0) {
    html += `
      <div class="ppdiv"></div>
      <div class="pprow"><span class="pplbl">Servicios adicionales</span><span class="ppval">$${tSug.toFixed(2)}</span></div>
      <div class="ppdiv"></div>
      <div class="pptrow">
        <span class="pptlbl" style="color:#4ade80;font-size:15px">TOTAL FINAL</span>
        <span class="pptval">$${grandTotal.toFixed(2)}</span>
      </div>
    `;
  }
  
  ppBody.innerHTML = html;
  
  // Also render items
  renderItems();
}

function renderItems() {
  const card = document.getElementById('items-card');
  const tabs = document.getElementById('km-tabs');
  const list = document.getElementById('items-list');
  
  if (!curCode || selKMs.length === 0) {
    card.classList.add('hidden');
    return;
  }
  card.classList.remove('hidden');
  
  tabs.innerHTML = '';
  selKMs.forEach((km, idx) => {
    const btn = document.createElement('div');
    btn.className = 'km-tab' + (idx === 0 ? ' kt-act' : '');
    btn.textContent = km + 'K';
    btn.addEventListener('click', () => {
      document.querySelectorAll('.km-tab').forEach(b => b.classList.remove('kt-act'));
      btn.classList.add('kt-act');
      showItemsForKM(km);
    });
    tabs.appendChild(btn);
  });
  
  showItemsForKM(selKMs[0]);
}

function showItemsForKM(km) {
  const list = document.getElementById('items-list');
  const items = pricingData[curCode].k[km].items || [];
  
  if (items.length === 0) {
    list.innerHTML = '<div class="iempty">No hay repuestos registrados para este mantenimiento.</div>';
    return;
  }
  
  let html = '';
  items.forEach((it, i) => {
    html += `
      <div class="irow">
        <div class="inum">${i+1}</div>
        <div class="iinf">
          <div class="iname">${it.name}</div>
          <div class="iqty">Cant: ${it.qty} · Unit: $${it.pvp.toFixed(2)}</div>
        </div>
        <div class="irep">$${it.total.toFixed(2)}</div>
      </div>
    `;
  });
  
  const kd = pricingData[curCode].k[km];
  html += `
    <div class="itot">
      <span>Subtotal de repuestos</span>
      <span style="color:var(--org)">$${kd.r.toFixed(2)}</span>
    </div>
    <div class="itot" style="border:none;padding-top:5px;margin-top:0">
      <span>Mano de Obra</span>
      <span style="color:var(--ink)">$${kd.o.toFixed(2)}</span>
    </div>
  `;
  
  const catInfo = CATALOG[curCode];
  const seg = (catInfo && catInfo.sg) || 'B';
  const sugItems = suggestionsData[seg] || [];
  let hasIncluded = false;
  let htmlInc = '<div class="itot" style="border:none;padding-top:10px;margin-top:10px;border-top:1px dashed var(--steel)"><span style="font-size:11px;letter-spacing:0.05em;color:var(--slate);font-weight:700">SERVICIOS INCLUIDOS:</span></div>';
  
  sugItems.forEach(item => {
    let included = item.included;
    if (item.name === 'CAMBIO FILTRO DE AC') included = false;
    
    if (included) {
       hasIncluded = true;
       htmlInc += `
         <div class="irow" style="padding:4px 0">
           <div class="iinf" style="margin-left:0;flex-direction:row;align-items:center;gap:6px">
             <div style="color:#10b981;font-size:14px;font-weight:bold">✓</div>
             <div class="iname" style="color:#059669">${item.name}</div>
           </div>
           <div class="irep" style="color:#059669;font-size:12px">Incluido</div>
         </div>
       `;
    }
  });
  
  if (hasIncluded) html += htmlInc;
  
  list.innerHTML = html;
}

function renderSuggestions() {
  const card = document.getElementById('sug-card');
  const list = document.getElementById('sug-list');
  const badge = document.getElementById('sug-badge');

  if (!curCode) { hideSugCard(); return; }

  const catInfo = CATALOG[curCode];
  const seg = (catInfo && catInfo.sg) || 'B';
  const items = suggestionsData[seg] || [];

  badge.textContent = 'Seg ' + seg;
  badge.className = seg === 'A' ? 'badge ba' : seg === 'B' ? 'badge bb' : 'badge bc';

  card.classList.remove('hidden');
  list.innerHTML = '';

  items.forEach(item => {
    let price = item.price;
    let included = item.included;
    
    if (item.name === 'CAMBIO FILTRO DE AC') {
       price = AC_FILTER_PRICES[curModel] || 19.06; // Fallback to B segment if missing
       included = false;
    }

    if (included) return;

    const row = document.createElement('label');
    row.className = 'srow';

    const cb = document.createElement('input');
    cb.type = 'checkbox';

    const existing = selSuggestions.find(s => s.name === item.name);
    if (existing) cb.checked = true;

    cb.addEventListener('change', () => {
      if (cb.checked) {
        selSuggestions.push({ name: item.name, price: price });
      } else {
        selSuggestions = selSuggestions.filter(s => s.name !== item.name);
      }
      updateUI();
    });

    const nameSpan = document.createElement('span');
    nameSpan.className = 'snam';
    nameSpan.textContent = item.name;

    const priceSpan = document.createElement('span');
    priceSpan.className = 'spai';
    priceSpan.textContent = '$' + price.toFixed(2);

    row.appendChild(cb);
    row.appendChild(nameSpan);
    row.appendChild(priceSpan);

    list.appendChild(row);
  });
}

function hideSugCard() {
  document.getElementById('sug-card').classList.add('hidden');
  selSuggestions = [];
}
function resetAll() {
  curModel = ''; curMotor = ''; curTrn = ''; curCode = ''; selKMs = []; selSuggestions = [];
  document.getElementById('inp-mod').value = '';
  onMod({target: {value: ''}});
  document.getElementById('km-grid').innerHTML = '';
  document.getElementById('items-card').classList.add('hidden');
  hideSugCard();
  updateUI();
}

function filterCat(seg, btn) {
  document.querySelectorAll('.cfbtn').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
  renderCat(seg);
}

function renderCat(seg) {
  const cnt = document.getElementById('cat-cnt');
  cnt.innerHTML = '';
  
  GROUPS.forEach(g => {
    let html = `<div class="cgroup"><div class="cgttl">${g.n}</div>`;
    let hasItems = false;
    
    g.mo.forEach(m => {
      g.v[m].forEach(v => {
        const catInfo = CATALOG[v.code];
        if (!catInfo) return;
        if (seg !== 'all' && catInfo.sg !== seg) return;
        hasItems = true;
        html += `
          <div class="citem">
            <div class="cinam">${m} - ${v.tr} <span style="color:#7c7f88;font-size:10px;margin-left:6px">${v.code}</span></div>
          </div>
        `;
      });
    });
    
    html += `</div>`;
    if (hasItems) cnt.innerHTML += html;
  });
}
