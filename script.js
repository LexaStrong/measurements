// ═══════════════════════════════════════════════════════════
// DATA LAYER — robust versioned storage with fallback & backup
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// DATA LAYER — Robust IndexedDB storage with fallback
// ═══════════════════════════════════════════════════════════
const DB = {
  DB_NAME: 'LemaireAtelier',
  STORE_NAME: 'records',
  VERSION: 1,
  _db: null,

  async init() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this._db = e.target.result;
        resolve(this._db);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  },

  async load() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        // Fallback to localStorage for legacy data migration
        let data = request.result || [];
        if (data.length === 0) {
          const legacy = localStorage.getItem('lemaire_v3');
          if (legacy) {
            data = JSON.parse(legacy);
            this.saveAll(data); // Migrate to IDB
          }
        }
        resolve(this._migrate(data));
      };
      request.onerror = () => reject(request.error);
    });
  },

  async save(record) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async saveAll(records) {
    await this.init();
    const transaction = this._db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    records.forEach(r => store.put(r));
    return new Promise((resolve) => {
      transaction.oncomplete = () => resolve();
    });
  },

  async delete(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  _migrate(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(r => ({
      id:         r.id         || uid(),
      name:       r.name       || '',
      phone:      r.phone      || '',
      date:       r.date       || '',
      garment:    r.garment    || '',
      halfBack:   r.halfBack   || '',
      fullBack:   r.fullBack   || '',
      chest:      r.chest      || '',
      stomach:    r.stomach    || '',
      sleeves:    r.sleeves    || '',
      topLength:  r.topLength  || r.topLen || '',
      arm:        r.arm        || '',
      shoulder:   r.shoulder   || '',
      waist:      r.waist      || '',
      downLength: r.downLength || r.downLen || '',
      hip:        r.hip        || '',
      bass:       r.bass       || '',
      thigh:      r.thigh      || '',
      knee:       r.knee       || '',
      charged:    r.charged    || '',
      paid:       r.paid       || '',
      collection: r.collection || '',
      receivedDate: r.receivedDate || r.rcvDate || '',
      received:   !!r.received,
      notes:      r.notes      || '',
      updatedAt:  r.updatedAt  || new Date().toISOString(),
      createdAt:  r.createdAt  || r.updatedAt || new Date().toISOString(),
    }));
  }
};

// ═══════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════
let records = [];
let editingId = null;
let currentTab = 'records';
let filterOpen = false;
let remOpen = false;
let currentShareId = null;

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MON3   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function esc(s) {
  if (!s) return '';
  return s.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function fmt(s) {
  if (!s) return '—';
  const d = new Date(s + 'T12:00:00');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function fmtShort(s) {
  if (!s) return '—';
  const d = new Date(s + 'T12:00:00');
  return `${MON3[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function ghs(n) { return 'GH₵ ' + (parseFloat(n)||0).toFixed(2); }

// ═══════════════════════════════════════════════════════════
// COLLECTION STATUS
// ═══════════════════════════════════════════════════════════
function colStatus(r) {
  if (r.received) return 'received';
  if (!r.collection) return 'none';
  const now = new Date(); now.setHours(0,0,0,0);
  const col = new Date(r.collection + 'T12:00:00'); col.setHours(0,0,0,0);
  const d = Math.round((col - now) / 86400000);
  if (d < 0)  return 'overdue';
  if (d === 0) return 'today';
  if (d <= 2)  return 'urgent';
  if (d <= 7)  return 'soon';
  return 'upcoming';
}

function daysLabel(r) {
  if (!r.collection) return '';
  const now = new Date(); now.setHours(0,0,0,0);
  const col = new Date(r.collection + 'T12:00:00'); col.setHours(0,0,0,0);
  const d = Math.round((col - now) / 86400000);
  if (d < 0)  return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  return `in ${d}d`;
}

// ═══════════════════════════════════════════════════════════
// FILTERING
// ═══════════════════════════════════════════════════════════
function getFiltered(q) {
  const search = (q ?? document.getElementById('searchInput').value).toLowerCase().trim();
  const year   = document.getElementById('fYear').value;
  const month  = document.getElementById('fMonth').value;
  const bal    = document.getElementById('fBal').value;
  const col    = document.getElementById('fCol').value;

  return records.filter(r => {
    const d = r.date ? new Date(r.date + 'T12:00:00') : null;
    if (search && !r.name.toLowerCase().includes(search) && !(r.garment||'').toLowerCase().includes(search)) return false;
    if (year  && d && d.getFullYear().toString() !== year) return false;
    if (month !== '' && d && d.getMonth().toString() !== month) return false;
    const b = (parseFloat(r.charged)||0) - (parseFloat(r.paid)||0);
    if (bal === 'owed' && b <= 0) return false;
    if (bal === 'paid' && b > 0)  return false;
    const st = colStatus(r);
    if (col === 'pending'  && (st === 'received' || st === 'none')) return false;
    if (col === 'received' && st !== 'received') return false;
    if (col === 'overdue'  && st !== 'overdue')  return false;
    if (col === 'week'     && !['today','urgent','soon'].includes(st)) return false;
    return true;
  }).sort((a,b) => (b.date||'').localeCompare(a.date||''));
}

function activeFilterCount() {
  let n = 0;
  if (document.getElementById('fYear').value)  n++;
  if (document.getElementById('fMonth').value) n++;
  if (document.getElementById('fBal').value)   n++;
  if (document.getElementById('fCol').value)   n++;
  return n;
}

// ═══════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════
let searchTimeout;
function onSearch(v) {
  document.getElementById('sClear').classList.toggle('on', v.length > 0);
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => renderAll(), 250);
}
function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('sClear').classList.remove('on');
  renderAll();
}
function hl(text, q) {
  if (!q || !text) return esc(text);
  const escapedText = esc(text);
  const escapedQ = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapedText.replace(new RegExp(escapedQ, 'gi'), m => `<span class="highlight">${m}</span>`);
}

// ═══════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════
function renderAll() {
  updateYearFilter();
  renderStats();
  renderReminders();
  const fc = activeFilterCount();
  document.getElementById('filterBadge').classList.toggle('on', fc > 0);
  document.getElementById('filterBtn').classList.toggle('active', fc > 0);
  if (currentTab === 'records') renderRecords();
  else renderTimeline();
}

function renderStats() {
  const now = new Date();
  document.getElementById('sTotal').textContent = records.length;
  document.getElementById('sMonth').textContent = records.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date+'T12:00:00');
    return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
  }).length;
  document.getElementById('sOwed').textContent = records.filter(r => (parseFloat(r.charged)||0)-(parseFloat(r.paid)||0)>0).length;
  document.getElementById('sPend').textContent = records.filter(r => !r.received && r.collection).length;
  const rev = records.reduce((sum, r) => sum + (parseFloat(r.paid)||0), 0);
  document.getElementById('sRev').textContent = rev > 1000 ? (rev/1000).toFixed(1)+'k' : rev.toFixed(0);
}

function updateYearFilter() {
  const sel = document.getElementById('fYear');
  const cur = sel.value;
  const years = [...new Set(records.map(r => r.date?new Date(r.date+'T12:00:00').getFullYear():null).filter(Boolean))].sort((a,b)=>b-a);
  sel.innerHTML = '<option value="">All Years</option>' + years.map(y=>`<option value="${y}"${y.toString()===cur?' selected':''}>${y}</option>`).join('');
}

function clearFilters() {
  ['fYear','fMonth','fBal','fCol'].forEach(id => document.getElementById(id).value = '');
  renderAll();
}

function renderRecords() {
  const q = document.getElementById('searchInput').value.trim();
  const filtered = getFiltered(q.toLowerCase());
  const el = document.getElementById('recordsView');

  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-icon">✂️</div>
      <div class="empty-title">${records.length ? 'No results' : 'No clients yet'}</div>
      <div class="empty-sub">${records.length ? 'Adjust search or filters' : 'Tap ＋ to add your first client'}</div>
    </div>`;
    return;
  }

  let out = '';
  if (q) out += `<div class="result-meta">${filtered.length} result${filtered.length!==1?'s':''}</div>`;

  out += '<div class="record-list">' + filtered.map((r, idx) => {
    const bal = (parseFloat(r.charged)||0) - (parseFloat(r.paid)||0);
    const st = colStatus(r);
    let cardCls = bal > 0 ? 'has-bal' : 'all-paid';
    if (!r.received && st === 'overdue') cardCls = 'overdue';
    else if (!r.received && (st==='urgent'||st==='today')) cardCls = 'overdue';
    else if (!r.received && st==='soon') cardCls = 'due-soon';

    const nameHtml = q ? hl(r.name, q) : esc(r.name);
    let chips = '';
    if (r.received)         chips += `<span class="chip chip-rcvd">✓ Received</span>`;
    if (st==='overdue'&&!r.received) chips += `<span class="chip chip-red">⚠ Overdue</span>`;
    if (st==='today'&&!r.received)   chips += `<span class="chip chip-red">🔔 Today</span>`;
    if (st==='urgent'&&!r.received)  chips += `<span class="chip chip-warn">${esc(daysLabel(r))}</span>`;
    if (st==='soon'&&!r.received)    chips += `<span class="chip chip-warn">${esc(daysLabel(r))}</span>`;
    if (!chips && r.collection && !r.received) chips += `<span class="chip chip-muted">📅 ${esc(daysLabel(r))}</span>`;
    chips += bal > 0 ? `<span class="chip chip-bal">${esc(ghs(bal))}</span>` : `<span class="chip chip-paid">Paid ✓</span>`;

    const staggerIdx = Math.min(idx, 20);
    return `<div class="record-card ${cardCls}" style="animation-delay: ${staggerIdx * 0.04}s" onclick="openDetail('${r.id}')">
      <div class="record-inner">
        <div class="record-main">
          <div class="record-name">${nameHtml}</div>
          <div class="record-sub">
            <span>${fmtShort(r.date)}</span>
            ${r.garment?`<span>· ${r.garment}</span>`:''}
          </div>
          <div class="record-chips">${chips}</div>
        </div>
        <div class="record-right">
          <div class="record-amount ${bal>0?'owed':'clear'}">${bal>0?ghs(bal):'✓'}</div>
          <button class="record-quickbtn" onclick="event.stopPropagation();openEditSheet('${r.id}')" title="Edit">✎</button>
        </div>
      </div>
    </div>`;
  }).join('') + '</div>';

  el.innerHTML = out;
}

function renderTimeline() {
  const filtered = getFiltered();
  const el = document.getElementById('timelineView');
  if (!filtered.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">No Records</div></div>`; return; }
  const byYear = {};
  filtered.forEach(r => {
    const y = r.date?new Date(r.date+'T12:00:00').getFullYear():'—';
    const m = r.date?new Date(r.date+'T12:00:00').getMonth():-1;
    if (!byYear[y]) byYear[y]={};
    if (!byYear[y][m]) byYear[y][m]=[];
    byYear[y][m].push(r);
  });
  el.innerHTML = '<div class="tl-group">' + Object.keys(byYear).sort((a,b)=>b-a).map(y => {
    return `<div class="tl-year">${y}<span>${Object.values(byYear[y]).flat().length} clients</span></div>` +
    Object.keys(byYear[y]).sort((a,b)=>b-a).map(m => {
      return `<div class="tl-month">
        <div class="tl-month-lbl">${m>=0?MONTHS[m]:'Unknown'}</div>
        ${byYear[y][m].map(r => {
          const bal=(parseFloat(r.charged)||0)-(parseFloat(r.paid)||0);
          const st=colStatus(r);
          return `<div class="tl-entry" onclick="openDetail('${r.id}')">
            <div><div class="tl-name">${esc(r.name)}</div><div class="tl-info">${esc(fmtShort(r.date))}${r.collection?' · '+esc(fmtShort(r.collection)):''}</div></div>
            <div class="tl-right">
              ${r.received?`<div style="font-size:8px;color:var(--sage)">✓ Rcvd</div>`:st==='overdue'?`<div style="font-size:8px;color:var(--red)">⚠ OD</div>`:''}
              <div style="font-family:'Playfair Display',serif;font-size:15px;color:${bal>0?'var(--rust)':'var(--sage)'}">${bal>0?ghs(bal):'Paid'}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('');
  }).join('') + '</div>';
}

// ═══════════════════════════════════════════════════════════
// DETAIL SHEET
// ═══════════════════════════════════════════════════════════
function openDetail(id) {
  const r = records.find(x=>x.id===id);
  if (!r) return;
  currentShareId = id;

  document.getElementById('dName').textContent = r.name;
  document.getElementById('dSub').textContent = `Recorded ${fmt(r.date)}${r.garment?' · '+r.garment:''}`;

  const bal = (parseFloat(r.charged)||0)-(parseFloat(r.paid)||0);
  const st = colStatus(r);
  const dl = daysLabel(r);

  // Banner
  let banner = '';
  if (r.received) banner = `<div class="reminder-banner banner-sage on">✅ Order received${r.receivedDate?' on '+fmt(r.receivedDate):''}</div>`;
  else if (st==='overdue') banner = `<div class="reminder-banner banner-red on">⚠️ Collection overdue — was ${fmt(r.collection)}</div>`;
  else if (st==='today')   banner = `<div class="reminder-banner banner-red on">🔔 Collection due TODAY</div>`;
  else if (st==='urgent')  banner = `<div class="reminder-banner banner-red on">🔔 Collection ${dl} — ${fmt(r.collection)}</div>`;
  else if (st==='soon')    banner = `<div class="reminder-banner banner-warn on">📅 Collection ${dl} — ${fmt(r.collection)}</div>`;

  // Body diagrams
  const topSVG = buildTopSVG(r);
  const downSVG = buildDownSVG(r);

  const topM = [
    {l:'Half Back',v:r.halfBack},{l:'Full Back',v:r.fullBack},{l:'Chest',v:r.chest},
    {l:'Stomach',v:r.stomach},{l:'Sleeves',v:r.sleeves},{l:'Length',v:r.topLength},
    {l:'Arm',v:r.arm},{l:'Shoulder',v:r.shoulder}
  ].filter(x=>x.v);
  const downM = [
    {l:'Waist',v:r.waist},{l:'Length',v:r.downLength},{l:'Hip',v:r.hip},
    {l:'Bass',v:r.bass},{l:'Thigh',v:r.thigh},{l:'Knee',v:r.knee}
  ].filter(x=>x.v);

  document.getElementById('detailBody').innerHTML = `
    ${banner}
    <div class="body-diag-row">
      <div class="body-diag-card"><div class="body-diag-lbl">Top</div>${topSVG}</div>
      <div class="body-diag-card"><div class="body-diag-lbl">Bottom</div>${downSVG}</div>
    </div>
    ${topM.length?`<div class="detail-section">
      <div class="detail-section-head"><span>👕</span> Top Measurements</div>
      ${topM.map(m=>`<div class="mrow"><span class="mrow-lbl">${m.l}</span><span class="mrow-val">${m.v}"</span></div>`).join('')}
    </div>`:''}
    ${downM.length?`<div class="detail-section">
      <div class="detail-section-head"><span>👖</span> Down Measurements</div>
      ${downM.map(m=>`<div class="mrow"><span class="mrow-lbl">${m.l}</span><span class="mrow-val">${m.v}"</span></div>`).join('')}
    </div>`:''}
    <div class="fin-grid">
      <div class="fin-cell"><div class="fin-cell-lbl">Charged</div><div class="fin-cell-val">${ghs(r.charged)}</div></div>
      <div class="fin-cell"><div class="fin-cell-lbl">Paid</div><div class="fin-cell-val clear">${ghs(r.paid)}</div></div>
      <div class="fin-cell"><div class="fin-cell-lbl">Balance</div><div class="fin-cell-val ${bal>0?'owed':'clear'}">${bal>0?ghs(bal):'✓'}</div></div>
    </div>
    ${r.collection?`<div class="col-block">
      <div class="col-row">
        <div class="col-dates">
          <div class="col-date-item"><div class="col-date-lbl">Expected Collection</div><div class="col-date-val">${fmt(r.collection)}</div></div>
          ${r.receivedDate?`<div class="col-date-item" style="margin-top:8px"><div class="col-date-lbl">Received On</div><div class="col-date-val">${fmt(r.receivedDate)}</div></div>`:''}
        </div>
        <button class="rcv-btn ${r.received?'yes':'no'}" onclick="toggleReceived('${r.id}')">${r.received?'✓ Received':'Mark Received'}</button>
      </div>
    </div>`:''}
    ${r.notes?`<div class="detail-section">
      <div class="detail-section-head"><span>📝</span> Notes</div>
      <div style="font-size:12px;line-height:1.7;color:var(--parch);padding-top:4px">${esc(r.notes)}</div>
    </div>`:''}
    ${r.phone?`<div style="margin-top:10px"><a href="tel:${r.phone}" class="btn btn-gold btn-sm">📞 Call ${esc(r.phone)}</a></div>`:''}
    <div style="height:8px"></div>
  `;

  document.getElementById('detailFooter').innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="closeSheet('detailSheet');openEditSheet('${r.id}')">✎ Edit</button>
    <button class="btn btn-outline btn-sm" onclick="openShareSheet('${r.id}')">↑ Share</button>
    <button class="btn btn-red btn-sm" onclick="deleteRecord('${r.id}')">✕ Delete</button>
  `;

  openSheet('detailSheet');
}

function buildTopSVG(r) {
  const haC=r.chest, haS=r.stomach, haSl=r.sleeves, haA=r.arm, haHB=r.halfBack, haFB=r.fullBack, haL=r.topLength;
  return `<svg viewBox="0 0 100 130" width="100%" style="max-width:140px;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
    <defs><style>
      .t0{fill:#1E1A18;stroke:#3D3830;stroke-width:1}
      .t1{fill:none;stroke:#C9A96E;stroke-width:.7;stroke-dasharray:2.5,2}
      .tx{font-size:4.5px;fill:#C9A96E;font-family:'Syne Mono',monospace}
      .ts{fill:none;stroke:#3D3830;stroke-width:1}
    </style></defs>
    <ellipse cx="50" cy="13" rx="9" ry="11" class="t0"/>
    <rect x="45" y="23" width="10" height="6" class="t0"/>
    <path d="M18 40 Q14 31 45 29L55 29Q86 31 82 40" class="t0"/>
    <path d="M18 40L15 92Q50 100 85 92L82 40" class="t0"/>
    ${haC?`<line x1="20" y1="52" x2="80" y2="52" class="t1"/><text x="32" y="50" class="tx">chest</text>`:''}
    ${haS?`<line x1="21" y1="70" x2="79" y2="70" class="t1"/><text x="30" y="68" class="tx">stomach</text>`:''}
    <path d="M18 40L5 77Q8 81 15 78L22 44" class="t0"/>
    <path d="M82 40L95 77Q92 81 85 78L78 44" class="t0"/>
    ${haSl?`<text x="0" y="62" class="tx" transform="rotate(-72,6,60)">sleeve</text>`:''}
    ${haA?`<text x="0" y="44" class="tx">arm</text>`:''}
    ${haHB||haFB?`<line x1="50" y1="29" x2="50" y2="92" class="t1"/><text x="52" y="55" class="tx">back</text>`:''}
    ${haL?`<line x1="14" y1="29" x2="14" y2="92" class="t1"/><text x="1" y="70" class="tx" transform="rotate(-90,14,60)">len</text>`:''}
  </svg>`;
}

function buildDownSVG(r) {
  const haW=r.waist, haH=r.hip, haB=r.bass, haT=r.thigh, haK=r.knee, haL=r.downLength;
  return `<svg viewBox="0 0 100 140" width="100%" style="max-width:140px;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
    <defs><style>
      .d0{fill:#1E1A18;stroke:#3D3830;stroke-width:1}
      .d1{fill:none;stroke:#C9A96E;stroke-width:.7;stroke-dasharray:2.5,2}
      .dx{font-size:4.5px;fill:#C9A96E;font-family:'Syne Mono',monospace}
    </style></defs>
    <rect x="22" y="5" width="56" height="9" rx="2" class="d0"/>
    <path d="M22 14Q18 22 20 32L80 32Q82 22 78 14" class="d0"/>
    ${haW?`<line x1="22" y1="14" x2="78" y2="14" class="d1"/><text x="26" y="13" class="dx">waist</text>`:''}
    ${haH?`<line x1="20" y1="30" x2="80" y2="30" class="d1"/><text x="33" y="29" class="dx">hip</text>`:''}
    <path d="M20 32L15 134Q28 138 38 134L44 54L50 54" class="d0"/>
    <path d="M80 32L85 134Q72 138 62 134L56 54L50 54" class="d0"/>
    <path d="M44 54Q50 64 56 54" class="d0"/>
    ${haT?`<line x1="16" y1="68" x2="44" y2="68" class="d1"/><text x="17" y="66" class="dx">thigh</text>`:''}
    ${haK?`<line x1="17" y1="98" x2="42" y2="98" class="d1"/><text x="18" y="96" class="dx">knee</text>`:''}
    ${haB?`<line x1="19" y1="42" x2="43" y2="42" class="d1"/><text x="20" y="41" class="dx">bass</text>`:''}
    ${haL?`<line x1="88" y1="32" x2="88" y2="134" class="d1"/><text x="90" y="90" class="dx" transform="rotate(90,88,90)">len</text>`:''}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════
// TOGGLE RECEIVED
// ═══════════════════════════════════════════════════════════
async function toggleReceived(id) {
  const r = records.find(x=>x.id===id);
  if (!r) return;
  r.received = !r.received;
  if (r.received && !r.receivedDate) r.receivedDate = new Date().toISOString().split('T')[0];
  else if (!r.received) r.receivedDate = '';
  r.updatedAt = new Date().toISOString();
  await DB.save(r);
  renderAll();
  openDetail(id);
  toast(r.received ? 'Marked as received ✓' : 'Marked as pending');
}

// ═══════════════════════════════════════════════════════════
// EDIT / SAVE
// ═══════════════════════════════════════════════════════════
function openEditSheet(id) {
  editingId = id || null;
  document.getElementById('editTitle').textContent = id ? 'Edit Client' : 'New Client';

  const fields = ['Name','Phone','Date','Garment','HalfBack','FullBack','Chest','Stomach','Sleeves','TopLen','Arm','Shoulder','Waist','DownLen','Hip','Bass','Thigh','Knee','Charged','Paid','Collection','RcvDate','Notes'];
  fields.forEach(f => { const el=document.getElementById('f'+f); if(el) el.value=''; });
  document.getElementById('fReceived').checked = false;

  if (id) {
    const r = records.find(x=>x.id===id);
    if (!r) return;
    document.getElementById('fName').value      = r.name       || '';
    document.getElementById('fPhone').value     = r.phone      || '';
    document.getElementById('fDate').value      = r.date       || '';
    document.getElementById('fGarment').value   = r.garment    || '';
    document.getElementById('fHalfBack').value  = r.halfBack   || '';
    document.getElementById('fFullBack').value  = r.fullBack   || '';
    document.getElementById('fChest').value     = r.chest      || '';
    document.getElementById('fStomach').value   = r.stomach    || '';
    document.getElementById('fSleeves').value   = r.sleeves    || '';
    document.getElementById('fTopLen').value    = r.topLength  || '';
    document.getElementById('fArm').value       = r.arm        || '';
    document.getElementById('fShoulder').value  = r.shoulder   || '';
    document.getElementById('fWaist').value     = r.waist      || '';
    document.getElementById('fDownLen').value   = r.downLength || '';
    document.getElementById('fHip').value       = r.hip        || '';
    document.getElementById('fBass').value      = r.bass       || '';
    document.getElementById('fThigh').value     = r.thigh      || '';
    document.getElementById('fKnee').value      = r.knee       || '';
    document.getElementById('fCharged').value   = r.charged    || '';
    document.getElementById('fPaid').value      = r.paid       || '';
    document.getElementById('fCollection').value = r.collection || '';
    document.getElementById('fRcvDate').value   = r.receivedDate || '';
    document.getElementById('fReceived').checked = r.received  || false;
    document.getElementById('fNotes').value     = r.notes      || '';
  } else {
    document.getElementById('fDate').value = new Date().toISOString().split('T')[0];
  }
  calcBal();
  closeSheet('detailSheet');
  openSheet('editSheet');
}

function calcBal() {
  const charged = parseFloat(document.getElementById('fCharged').value)||0;
  const paid    = parseFloat(document.getElementById('fPaid').value)||0;
  const bal = charged - paid;
  const el = document.getElementById('fBal');
  el.textContent = ghs(bal);
  el.style.color = bal > 0 ? '#C45C2A' : '#4A7C59';
}

async function saveRecord() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { toast('Please enter a client name'); return; }
  const now = new Date().toISOString();
  const data = {
    id:          editingId || uid(),
    name,
    phone:       document.getElementById('fPhone').value.trim(),
    date:        document.getElementById('fDate').value,
    garment:     document.getElementById('fGarment').value,
    halfBack:    document.getElementById('fHalfBack').value,
    fullBack:    document.getElementById('fFullBack').value,
    chest:       document.getElementById('fChest').value,
    stomach:     document.getElementById('fStomach').value,
    sleeves:     document.getElementById('fSleeves').value,
    topLength:   document.getElementById('fTopLen').value,
    arm:         document.getElementById('fArm').value,
    shoulder:    document.getElementById('fShoulder').value,
    waist:       document.getElementById('fWaist').value,
    downLength:  document.getElementById('fDownLen').value,
    hip:         document.getElementById('fHip').value,
    bass:        document.getElementById('fBass').value,
    thigh:       document.getElementById('fThigh').value,
    knee:        document.getElementById('fKnee').value,
    charged:     document.getElementById('fCharged').value,
    paid:        document.getElementById('fPaid').value,
    collection:  document.getElementById('fCollection').value,
    receivedDate:document.getElementById('fRcvDate').value,
    received:    document.getElementById('fReceived').checked,
    notes:       document.getElementById('fNotes').value,
    updatedAt:   now,
    createdAt:   editingId ? (records.find(x=>x.id===editingId)||{}).createdAt || now : now,
  };
  
  await DB.save(data);
  if (editingId) { const i=records.findIndex(x=>x.id===editingId); if(i>=0) records[i]=data; }
  else records.unshift(data);

  if (navigator.vibrate) navigator.vibrate([30, 30]);
  closeSheet('editSheet');
  renderAll();
  toast(editingId ? 'Record updated ✓' : 'Client added ✓');
}

async function deleteRecord(id) {
  if (!confirm('Delete this record permanently?')) return;
  if (navigator.vibrate) navigator.vibrate(50);
  await DB.delete(id);
  records = records.filter(x=>x.id!==id);
  closeSheet('detailSheet');
  renderAll();
  toast('Record deleted');
}

// ═══════════════════════════════════════════════════════════
// SHARE / RECEIPT
// ═══════════════════════════════════════════════════════════
function openShareSheet(id) {
  const r = records.find(x=>x.id===id);
  if (!r) return;
  currentShareId = id;
  closeSheet('detailSheet');

  const bal = (parseFloat(r.charged)||0)-(parseFloat(r.paid)||0);

  // Build importable receipt code (base64 JSON)
  const rcpData = { _lemaire: true, _v: 3, records: [r] };
  const code = 'LEMAIRE:' + btoa(unescape(encodeURIComponent(JSON.stringify(rcpData))));
  const shortCode = code.slice(0,48)+'…';

  const topM = [
    {l:'Half Back',v:r.halfBack},{l:'Full Back',v:r.fullBack},{l:'Chest',v:r.chest},
    {l:'Stomach',v:r.stomach},{l:'Sleeves',v:r.sleeves},{l:'Top Length',v:r.topLength},
    {l:'Arm',v:r.arm},{l:'Shoulder',v:r.shoulder}
  ].filter(x=>x.v);
  const downM = [
    {l:'Waist',v:r.waist},{l:'Down Length',v:r.downLength},{l:'Hip',v:r.hip},
    {l:'Bass',v:r.bass},{l:'Thigh',v:r.thigh},{l:'Knee',v:r.knee}
  ].filter(x=>x.v);

  const receiptHTML = `
    <div class="rcp-brand">Lemaire</div>
    <div class="rcp-sub">Atelier Measurement Receipt</div>
    <hr class="rcp-divider">
    <div class="rcp-client">${r.name}</div>
    <div class="rcp-date">${fmt(r.date)}${r.garment?' · '+r.garment:''}</div>
    ${topM.length?`<div class="rcp-section">Top Measurements</div>${topM.map(m=>`<div class="rcp-row"><span>${m.l}</span><span>${m.v}"</span></div>`).join('')}`:''}
    ${downM.length?`<div class="rcp-section" style="margin-top:8px">Down Measurements</div>${downM.map(m=>`<div class="rcp-row"><span>${m.l}</span><span>${m.v}"</span></div>`).join('')}`:''}
    <hr class="rcp-divider">
    <div class="rcp-section">Payment</div>
    <div class="rcp-fin-row"><span>Charged</span><span>${ghs(r.charged)}</span></div>
    <div class="rcp-fin-row"><span>Paid</span><span style="color:var(--sage)">${ghs(r.paid)}</span></div>
    <div class="rcp-fin-row"><span><b>Balance</b></span><span class="rcp-bal" style="color:${bal>0?'var(--rust)':'var(--sage)'}">${bal>0?ghs(bal):'Settled ✓'}</span></div>
    ${r.collection?`<div class="rcp-fin-row"><span>Collection</span><span>${fmt(r.collection)}</span></div>`:''}
    ${r.received?`<div class="rcp-fin-row"><span>Status</span><span style="color:var(--sage)">✓ Received ${r.receivedDate?fmt(r.receivedDate):''}</span></div>`:''}
    ${r.notes?`<hr class="rcp-divider"><div style="font-size:9px;color:#6B6560;line-height:1.6">${r.notes}</div>`:''}
    <hr class="rcp-divider">
    <div class="rcp-barcode">${shortCode}</div>
    <div class="rcp-footer">Lemaire Atelier · ${new Date().toLocaleDateString()} · Scan code to import</div>
  `;

  // Build plain-text version for sharing
  function textReceipt() {
    let t = `LEMAIRE ATELIER\nClient Measurement Receipt\n${'─'.repeat(30)}\n`;
    t += `Client: ${r.name}\nDate: ${fmt(r.date)}${r.garment?'\nGarment: '+r.garment:''}\n\n`;
    if (topM.length) { t += 'TOP MEASUREMENTS\n'; topM.forEach(m=>t+=`  ${m.l}: ${m.v}"\n`); t+='\n'; }
    if (downM.length) { t += 'DOWN MEASUREMENTS\n'; downM.forEach(m=>t+=`  ${m.l}: ${m.v}"\n`); t+='\n'; }
    t += `${'─'.repeat(30)}\nPAYMENT\n  Charged: ${ghs(r.charged)}\n  Paid:    ${ghs(r.paid)}\n  Balance: ${bal>0?ghs(bal):'Settled ✓'}\n`;
    if (r.collection) t += `  Collection: ${fmt(r.collection)}\n`;
    if (r.notes) t += `\nNotes: ${r.notes}\n`;
    t += `\n${'─'.repeat(30)}\nImport code:\n${code}`;
    return t;
  }

  document.getElementById('shareBody').innerHTML = `
    <div class="receipt-preview" id="rcpPreview">${receiptHTML}</div>
    <div class="share-actions">
      ${navigator.share?`<button class="share-btn share-btn-prim" onclick="doNativeShare('${id}')">↑ Share</button>`:''}
      <button class="share-btn share-btn-prim" onclick="copyReceiptText('${id}')">⎘ Copy</button>
      <button class="share-btn share-btn-sec" onclick="downloadReceipt('${id}')">↓ Save File</button>
    </div>
    <div style="margin-top:10px;font-size:8px;letter-spacing:1px;color:var(--stone);text-transform:uppercase">
      The saved file or copied code can be imported directly into Lemaire on any device.
    </div>
  `;

  // Store for sharing functions
  window.__rcpText = textReceipt;
  window.__rcpCode = code;
  window.__rcpR    = r;

  openSheet('shareSheet');
}

async function doNativeShare(id) {
  const text = window.__rcpText();
  try {
    await navigator.share({ title: `Lemaire — ${window.__rcpR.name}`, text });
    toast('Shared ✓');
  } catch(e) {
    if (e.name !== 'AbortError') copyReceiptText(id);
  }
}

function copyReceiptText(id) {
  const text = window.__rcpText();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(()=>toast('Copied to clipboard ✓')).catch(()=>fallbackCopy(text));
  } else { fallbackCopy(text); }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  document.execCommand('copy'); document.body.removeChild(ta);
  toast('Copied ✓');
}

function downloadReceipt(id) {
  const r = window.__rcpR;
  const rcpData = { _lemaire: true, _v: 3, records: [r] };
  const blob = new Blob([JSON.stringify(rcpData,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lemaire-${r.name.replace(/\s+/g,'-').toLowerCase()}-${r.date||'record'}.lmr`;
  a.click(); URL.revokeObjectURL(url);
  toast('Receipt file saved ↓');
}

// ═══════════════════════════════════════════════════════════
// IMPORT
// ═══════════════════════════════════════════════════════════
function openImportSheet() { openSheet('importSheet'); }

function handleFileImport(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => processImportData(ev.target.result);
  reader.readAsText(file);
  e.target.value = '';
}

function importFromCode() {
  const raw = document.getElementById('importCode').value.trim();
  if (!raw) { toast('Paste a receipt code first'); return; }
  processImportData(raw);
}

function processImportData(raw) {
  try {
    let parsed;
    // Handle LEMAIRE: prefixed code
    if (raw.startsWith('LEMAIRE:')) {
      const b64 = raw.slice(8);
      const json = decodeURIComponent(escape(atob(b64)));
      parsed = JSON.parse(json);
    } else {
      parsed = JSON.parse(raw);
    }
    const incoming = parsed.records || (Array.isArray(parsed) ? parsed : null);
    if (!incoming) throw new Error('No records found');
    const migrated = DB._migrate(incoming);
    const existing = new Set(records.map(r=>r.id));
    let added = 0, updated = 0;
    const toSave = [];
    migrated.forEach(r => {
      if (!existing.has(r.id)) { records.push(r); toSave.push(r); added++; }
      else {
        const i = records.findIndex(x=>x.id===r.id);
        if (i>=0 && r.updatedAt > records[i].updatedAt) { records[i]=r; toSave.push(r); updated++; }
      }
    });
    if (toSave.length) DB.saveAll(toSave);
    closeSheet('importSheet');
    document.getElementById('importCode').value = '';
    renderAll();
    toast(`Imported: ${added} new, ${updated} updated`);
  } catch(e) {
    console.error(e);
    toast('⚠ Invalid receipt or file');
  }
}

// ═══════════════════════════════════════════════════════════
// REMINDERS
// ═══════════════════════════════════════════════════════════
function renderReminders() {
  const urgent = records.filter(r => {
    if (r.received || !r.collection) return false;
    return ['overdue','today','urgent','soon'].includes(colStatus(r));
  }).sort((a,b) => (a.collection||'').localeCompare(b.collection||''));

  document.getElementById('bellBadge').classList.toggle('on', urgent.length > 0);

  const el = document.getElementById('remList');
  if (!urgent.length) { el.innerHTML = `<div class="rem-empty">No upcoming collections</div>`; return; }
  el.innerHTML = urgent.map(r => {
    const st = colStatus(r);
    const dotCls = st==='overdue'||st==='today'||st==='urgent' ? 'r' : st==='soon' ? 'w' : 'g';
    return `<div class="rem-item" onclick="closeReminders();openDetail('${r.id}')">
      <div class="rem-dot ${dotCls}"></div>
      <div>
        <div class="rem-item-name">${r.name}</div>
        <div class="rem-item-info">${st==='overdue'?'⚠ ':st==='today'?'🔔 ':'📅 '}${fmt(r.collection)} · ${daysLabel(r)}</div>
      </div>
    </div>`;
  }).join('');
}

function openReminders() {
  remOpen = true;
  document.getElementById('remPanel').classList.add('on');
  document.getElementById('overlayBg').classList.add('on');
}
function closeReminders() {
  remOpen = false;
  document.getElementById('remPanel').classList.remove('on');
  document.getElementById('overlayBg').classList.remove('on');
}

// ═══════════════════════════════════════════════════════════
// SHEET MANAGEMENT
// ═══════════════════════════════════════════════════════════
let openSheets = [];
function openSheet(id) {
  const el = document.getElementById(id);
  el.classList.add('on');
  document.getElementById('overlayBg').classList.add('on');
  if (!openSheets.includes(id)) openSheets.push(id);
}
function closeSheet(id) {
  document.getElementById(id).classList.remove('on');
  openSheets = openSheets.filter(x=>x!==id);
  if (!openSheets.length && !remOpen) document.getElementById('overlayBg').classList.remove('on');
}

// ═══════════════════════════════════════════════════════════
// FILTER DRAWER
// ═══════════════════════════════════════════════════════════
function toggleFilter() {
  filterOpen = !filterOpen;
  document.getElementById('filterDrawer').classList.toggle('open', filterOpen);
  document.getElementById('filterBtn').textContent = filterOpen ? '⊞' : '⊟';
}

// ═══════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════
function switchTab(name, btn) {
  currentTab = name;
  document.querySelectorAll('.tab-btn').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('recordsView').style.display  = name==='records'  ? '' : 'none';
  document.getElementById('timelineView').style.display = name==='timeline' ? '' : 'none';
  if (name==='records') renderRecords(); else renderTimeline();
}

// ═══════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════
function toggleTheme() {
  const body = document.body;
  const isLight = body.getAttribute('data-theme') === 'light';
  const next = isLight ? 'dark' : 'light';
  body.setAttribute('data-theme', next);
  localStorage.setItem('lemaire_theme', next);
  document.getElementById('themeToggle').textContent = isLight ? '🌓' : '☀️';
  toast(`Switched to ${next} mode`);
}

// ═══════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════
function exportToCSV() {
  if (!records.length) { toast('No records to export'); return; }
  const cols = ['name','phone','date','garment','charged','paid','collection','notes'];
  const header = cols.join(',');
  const rows = records.map(r => cols.map(c => `"${(r[c]||'').toString().replace(/"/g,'""')}"`).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lemaire-records-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Exported to CSV ✓');
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('on'), 2600);
}

// ═══════════════════════════════════════════════════════════
// DRAG-TO-CLOSE SHEETS (mobile)
// ═══════════════════════════════════════════════════════════
function enableDragClose(sheetId) {
  const sheet = document.getElementById(sheetId);
  let startY=0, curY=0, dragging=false;
  sheet.addEventListener('touchstart', e=>{
    if (e.target.closest('.sheet-body')) return;
    startY = e.touches[0].clientY; dragging=true;
  }, {passive:true});
  sheet.addEventListener('touchmove', e=>{
    if (!dragging) return;
    curY = e.touches[0].clientY;
    const d = Math.max(0, curY-startY);
    sheet.style.transform = `translateX(-50%) translateY(${d}px)`;
  }, {passive:true});
  sheet.addEventListener('touchend', ()=>{
    if (!dragging) return; dragging=false;
    const d = curY-startY;
    sheet.style.transform = '';
    if (d > 100) closeSheet(sheetId);
  });
}
['detailSheet','editSheet','shareSheet','importSheet'].forEach(enableDragClose);

// ═══════════════════════════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (openSheets.length) closeSheet(openSheets[openSheets.length-1]);
    else if (remOpen) closeReminders();
  }
  if ((e.ctrlKey||e.metaKey) && e.key==='n') { e.preventDefault(); openEditSheet(); }
  if ((e.ctrlKey||e.metaKey) && e.key==='f') { e.preventDefault(); document.getElementById('searchInput').focus(); }
});

// Overlay click
document.getElementById('overlayBg').addEventListener('click', () => {
  if (remOpen) { closeReminders(); return; }
  if (openSheets.length) closeSheet(openSheets[openSheets.length-1]);
});

// Drag over import zone
const iz = document.getElementById('importZone');
iz.addEventListener('dragover', e=>{e.preventDefault();iz.classList.add('drag');});
iz.addEventListener('dragleave', ()=>iz.classList.remove('drag'));
iz.addEventListener('drop', e=>{
  e.preventDefault(); iz.classList.remove('drag');
  const file = e.dataTransfer.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => processImportData(ev.target.result);
  reader.readAsText(file);
});

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
window.addEventListener('load', async () => {
  try {
    records = await DB.load();
    // Load theme
    const savedTheme = localStorage.getItem('lemaire_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    document.getElementById('themeToggle').textContent = savedTheme==='light' ? '☀️' : '🌓';

    // Set greeting
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    document.getElementById('dashGreeting').textContent = greet;
    document.getElementById('dashDate').textContent = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });

    renderAll();
    // Dismiss loading screen
    setTimeout(() => {
      const ls = document.getElementById('loadScreen');
      if (ls) {
        ls.classList.add('out');
        setTimeout(() => ls.remove(), 400);
      }
    }, 800);
  } catch(e) {
    console.error('Init failed:', e);
    toast('⚠ Failed to load records');
  }
});

// Periodic auto-backup to localStorage just in case
setInterval(() => {
  if (records.length) localStorage.setItem('lemaire_backup_full', JSON.stringify(records));
}, 10 * 60 * 1000);
