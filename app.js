const DEFAULT_SPHERES = [
  { id: 'trading',  name: '📈 Трейдинг',           color: '#facc15' },
  { id: 'health',   name: '💪 Здоровье',           color: '#4ade80' },
  { id: 'creative', name: '🎨 Творчество',         color: '#f472b6' },
  { id: 'hobby',    name: '🎮 Хобби',             color: '#60a5fa' },
  { id: 'looks',    name: '🪞 Внешний вид',        color: '#e879f9' },
  { id: 'family',   name: '👨‍👩‍👧 Семья',            color: '#fb7185' },
  { id: 'social',   name: '🤝 Знакомства',        color: '#34d399' },
  { id: 'inner',    name: '🧘 Внутренний порядок',  color: '#a78bfa' },
];

const START_YEAR = 2026;
const YEARS = 30;
const DAYS_PER_YEAR = 365;
const TOTAL_DAYS = YEARS * DAYS_PER_YEAR;

const SEED_DAYS = ["2026-01-01","2026-01-02","2026-01-03","2026-01-04","2026-01-05","2026-01-06","2026-01-07","2026-01-08","2026-01-09","2026-01-10","2026-01-11","2026-01-12","2026-01-13","2026-01-14","2026-01-15","2026-01-16","2026-01-17","2026-01-18","2026-01-19","2026-01-20","2026-01-21","2026-01-22","2026-01-23","2026-01-24","2026-01-25","2026-01-26","2026-01-27","2026-01-28","2026-01-29","2026-01-30","2026-01-31","2026-02-01","2026-02-02","2026-02-03","2026-02-04","2026-02-05","2026-02-06","2026-02-07","2026-02-08","2026-02-09","2026-02-10","2026-02-11","2026-02-12","2026-02-13","2026-02-14","2026-02-15","2026-02-16","2026-02-17","2026-02-18","2026-02-19","2026-02-20","2026-02-21","2026-02-22","2026-02-23","2026-02-24","2026-02-25","2026-02-26","2026-02-27","2026-02-28","2026-03-01","2026-03-02","2026-03-03","2026-03-04","2026-03-05","2026-03-06","2026-03-07","2026-03-08","2026-03-09","2026-03-10","2026-03-11","2026-03-12","2026-03-13","2026-03-14","2026-03-15","2026-03-16","2026-03-17","2026-03-18","2026-03-19","2026-03-20","2026-03-21","2026-03-22","2026-03-23","2026-03-24","2026-03-25","2026-03-26","2026-03-27","2026-03-28","2026-03-29","2026-03-30","2026-03-31","2026-04-01","2026-04-02","2026-04-03","2026-04-04","2026-04-05","2026-04-06","2026-04-07","2026-04-08","2026-04-09","2026-04-10","2026-04-11","2026-04-12","2026-04-13","2026-04-14","2026-04-15","2026-04-16","2026-04-17","2026-04-18","2026-04-19"];

function loadData() { return JSON.parse(localStorage.getItem('lifeRPG') || '{}'); }
function saveData(d) { localStorage.setItem('lifeRPG', JSON.stringify(d)); }
function getTodayStr() { return new Date().toISOString().slice(0, 10); }
function getSpheres() { const d = loadData(); return d.spheres || DEFAULT_SPHERES; }
function getScores() { return loadData().scores || {}; }
function getDoneDays() { return loadData().doneDays || []; }
function getTodayImproved() { const d = loadData(); return d.improved || {}; }

// --- SEED ---
function seedDays() {
  const d = loadData();
  if (!d.seeded) {
    d.doneDays = [...SEED_DAYS];
    d.seeded = true;
    d.spheres = DEFAULT_SPHERES;
    d.scores = {};
    DEFAULT_SPHERES.forEach(s => d.scores[s.id] = 5);
    saveData(d);
  }
}

// --- NAV ---
document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'spheres') { renderSpheres(); drawWheel(); }
    if (btn.dataset.tab === 'days') renderDays();
  });
});

// --- SETTINGS ---
const overlay = document.getElementById('settings-overlay');

document.getElementById('open-settings').addEventListener('click', () => {
  renderSettingsSpheres();
  overlay.classList.remove('hidden');
});
document.getElementById('settings-close').addEventListener('click', () => overlay.classList.add('hidden'));
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });

function renderSettingsSpheres() {
  const spheres = getSpheres();
  const scores = getScores();
  const container = document.getElementById('settings-spheres-list');
  container.innerHTML = '';
  spheres.forEach((s, i) => {
    const val = scores[s.id] ?? 5;
    const row = document.createElement('div');
    row.className = 'settings-sphere-row';
    row.innerHTML = `
      <input class="settings-emoji" type="text" maxlength="4" value="${s.name.split(' ')[0]}" data-i="${i}">
      <input class="settings-name" type="text" value="${s.name.split(' ').slice(1).join(' ')}" data-i="${i}">
      <input class="settings-score-input" type="number" min="0" max="10" value="${val}" data-id="${s.id}">
      <input class="settings-color" type="color" value="${s.color}" data-i="${i}">
    `;
    container.appendChild(row);
  });
}

document.getElementById('settings-save').addEventListener('click', () => {
  const d = loadData();
  const emojis = document.querySelectorAll('.settings-emoji');
  const names = document.querySelectorAll('.settings-name');
  const colors = document.querySelectorAll('.settings-color');
  const scoreInputs = document.querySelectorAll('.settings-score-input');
  const spheres = getSpheres();

  spheres.forEach((s, i) => {
    s.name = (emojis[i].value.trim() || '⭐') + ' ' + (names[i].value.trim() || s.name);
    s.color = colors[i].value;
  });

  d.spheres = spheres;
  d.scores = d.scores || {};
  scoreInputs.forEach(inp => {
    d.scores[inp.dataset.id] = Math.min(10, Math.max(0, parseInt(inp.value) || 0));
  });

  saveData(d);
  overlay.classList.add('hidden');
  renderSpheres();
  drawWheel();

  const btn = document.getElementById('settings-save');
  btn.textContent = '✅ Сохранено!';
  setTimeout(() => btn.textContent = '💾 Сохранить', 1500);
});

document.getElementById('settings-reset').addEventListener('click', () => {
  if (confirm('Точно? Все данные будут удалены.')) {
    localStorage.removeItem('lifeRPG');
    location.reload();
  }
});

// --- SPHERES ---
function renderSpheres() {
  const spheres = getSpheres();
  const scores = getScores();
  const today = getTodayStr();
  const improved = getTodayImproved();
  const container = document.getElementById('spheres-list');
  container.innerHTML = '';

  spheres.forEach(s => {
    const val = scores[s.id] ?? 5;
    const isImproved = improved[s.id] === today;
    const bars = Array.from({length: 10}, (_, i) => {
      const filled = i < val;
      return `<div class="bar-seg ${filled ? 'filled' : ''}" style="${filled ? 'background:' + s.color : ''}"></div>`;
    }).join('');

    const div = document.createElement('div');
    div.className = 'sphere-item' + (isImproved ? ' improved' : '');
    div.dataset.id = s.id;
    div.innerHTML = `
      <div class="sphere-row">
        <span class="sphere-name">${s.name}</span>
        <div class="sphere-right">
          <div class="bar-track">${bars}</div>
          <span class="sphere-score" style="color:${s.color}">${val}</span>
          ${isImproved ? '<span class="improved-badge">✨</span>' : ''}
        </div>
      </div>
    `;
    div.addEventListener('click', () => toggleImproved(s.id));
    container.appendChild(div);
  });
}

function toggleImproved(id) {
  const d = loadData();
  const today = getTodayStr();
  if (!d.improved) d.improved = {};
  if (d.improved[id] === today) {
    delete d.improved[id];
  } else {
    d.improved[id] = today;
  }
  saveData(d);
  renderSpheres();
}

// --- WHEEL ---
function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const spheres = getSpheres();
  const scores = getScores();
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const R = cx - 30;
  const n = spheres.length;
  const step = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // rings
  for (let i = 10; i >= 1; i--) {
    ctx.beginPath();
    for (let j = 0; j < n; j++) {
      const angle = step * j - Math.PI / 2;
      const r = (R * i) / 10;
      const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
      j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = i % 2 === 0 ? '#252538' : '#1a1a2e';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // dividers
  for (let j = 0; j < n; j++) {
    const angle = step * j - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.strokeStyle = '#2a2a3e'; ctx.lineWidth = 1; ctx.stroke();
  }

  // fill each segment with its own color
  spheres.forEach((s, j) => {
    const val = scores[s.id] ?? 5;
    const angleStart = step * j - Math.PI / 2;
    const angleEnd = step * (j + 1) - Math.PI / 2;
    const r = (R * val) / 10;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angleStart, angleEnd);
    ctx.closePath();
    ctx.fillStyle = s.color + '55';
    ctx.fill();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // labels
  spheres.forEach((s, j) => {
    const angle = step * j + step / 2 - Math.PI / 2;
    const r = R + 18;
    const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
    const val = scores[s.id] ?? 5;
    ctx.font = '11px Segoe UI';
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.name.split(' ')[0], x, y);
  });
}

// --- DAYS ---
function renderDays() {
  const done = getDoneDays();
  const doneCount = done.length;
  const remaining = TOTAL_DAYS - doneCount;
  const pct = ((doneCount / TOTAL_DAYS) * 100).toFixed(1);
  const currentYear = new Date().getFullYear();

  document.getElementById('days-done').textContent = doneCount;
  document.getElementById('days-pct-label').textContent = pct + '% • осталось ' + remaining;
  document.getElementById('days-progress-fill').style.width = pct + '%';

  const container = document.getElementById('years-grid');
  container.innerHTML = '';

  for (let y = 0; y < YEARS; y++) {
    const year = START_YEAR + y;
    const row = document.createElement('div');
    row.className = 'year-row' + (year === currentYear ? ' current-year' : '');
    const label = document.createElement('div');
    label.className = 'year-label';
    label.textContent = year;
    row.appendChild(label);
    const cells = document.createElement('div');
    cells.className = 'year-cells';
    for (let d = 0; d < DAYS_PER_YEAR; d++) {
      const idx = y * DAYS_PER_YEAR + d;
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      if (idx < doneCount) cell.classList.add('done');
      else if (idx === doneCount) cell.classList.add('today');
      cells.appendChild(cell);
    }
    row.appendChild(cells);
    container.appendChild(row);
  }

  const btn = document.getElementById('close-day-btn');
  const alreadyDone = done.includes(getTodayStr());
  btn.disabled = alreadyDone;
  btn.textContent = alreadyDone ? '✅ День уже закрыт' : '✅ Закрыть сегодняшний день';
}

document.getElementById('close-day-btn').addEventListener('click', () => {
  const d = loadData();
  const today = getTodayStr();
  if (!d.doneDays) d.doneDays = [];
  if (!d.doneDays.includes(today)) {
    d.doneDays.push(today);
    saveData(d);
    renderDays();
  }
});

// --- INIT ---
seedDays();
renderSpheres();
drawWheel();
