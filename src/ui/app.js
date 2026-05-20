import catalogData from '../data/catalog.json';
import pricingData from '../data/pricing.json';

const { GROUPS, CATALOG } = catalogData;

let curModel = '', curMotor = '', curTrn = '', curCode = '';
let selKMs = [];

export function initApp() {
  initNav();
  initSelects();
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
  const dlMod = document.getElementById('dl-models');
  GROUPS.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.n;
    dlMod.appendChild(opt);
  });
  
  document.getElementById('met-var').textContent = Object.keys(CATALOG).length;

  document.getElementById('inp-mod').addEventListener('input', onMod);
  document.getElementById('sel-mtr').addEventListener('change', onMtr);
  document.getElementById('sel-trn').addEventListener('change', onTrn);
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
  
  if (!curTrn) {
    curCode = '';
    document.getElementById('codbox').classList.add('hidden');
    document.getElementById('seg-badge').textContent = '— Segmento';
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
        document.getElementById('seg-badge').textContent = 'Segmento ' + catInfo.sg;
        document.getElementById('seg-badge').className = 'badge ba';
      }
    }
  }
  renderKMs();
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
  
  const prepConIVA = tConIVA * (1 - disc);
  
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
        <span class="pptlbl">Total Regular</span>
        <span class="pptval str" style="font-size:16px">$${tConIVA.toFixed(2)}</span>
      </div>
      <div class="pptrow" style="margin-top:5px">
        <span class="pptlbl">Total Prepagado</span>
        <span class="pptval">$${prepConIVA.toFixed(2)}</span>
      </div>
      <div class="savbox">
        <span class="savlbl">Ahorro por ${n} MTOs</span>
        <span class="savval">$${(tConIVA - prepConIVA).toFixed(2)}</span>
      </div>
    `;
  } else {
    html += `
      <div class="pptrow">
        <span class="pptlbl">Total</span>
        <span class="pptval" style="color:#fff">$${tConIVA.toFixed(2)}</span>
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
  
  list.innerHTML = html;
}

function resetAll() {
  curModel = ''; curMotor = ''; curTrn = ''; curCode = ''; selKMs = [];
  document.getElementById('inp-mod').value = '';
  onMod({target: {value: ''}});
  document.getElementById('km-grid').innerHTML = '';
  document.getElementById('items-card').classList.add('hidden');
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
