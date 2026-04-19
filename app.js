const DEFAULT_SPHERES = [
  { id: 'trading', name: '📈 Трейдинг', color: '#facc15' },
  { id: 'health', name: '💪 Здоровье', color: '#4ade80' },
  { id: 'creative', name: '🎨 Творчество', color: '#f472b6' },
  { id: 'hobby', name: '🎮 Хобби', color: '#60a5fa' },
  { id: 'looks', name: '🪞 Внешний вид', color: '#e879f9' },
  { id: 'family', name: '👨‍👩‍👧 Семья', color: '#fb7185' },
  { id: 'social', name: '🤝 Знакомства', color: '#34d399' },
  { id: 'inner', name: '🧘 Внутренний порядок', color: '#a78bfa' },
];

const START_YEAR = 2026;
const YEARS = 30;
const DAYS_PER_YEAR = 365;
const TOTAL_DAYS = YEARS * DAYS_PER_YEAR;
const START_DATE = `${START_YEAR}-01-01`;
const HOLD_MS = 3000;
const STORAGE_KEY = 'lifeRPG';

/* Data Management */
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } 
  catch { return {}; }
}
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function getTodayStr() { return new Date().toLocaleDateString('en-CA'); }

function ensureDefaults(d) {
  if (!d.spheres || d.spheres.length === 0) d.spheres = JSON.parse(JSON.stringify(DEFAULT_SPHERES));
  if (!d.habits) d.habits = [];
  if (!d.openedDays) d.openedDays = [];
  if (!d.sphereProgress) d.sphereProgress = {};
  if (!d.habitHistory) d.habitHistory = {};
  return d;
}

let data = ensureDefaults(loadData());

/* Initial Renders */
function init() {
  renderSpheres();
  renderHabits();
  updateStats();
  drawWheel();
  renderGrid();
}

/* UI Logic */
const settingsOverlay = document.getElementById('settings-overlay');
document.getElementById('open-settings').onclick = () => { renderSettings(); settingsOverlay.classList.remove('hidden'); };
document.getElementById('settings-close').onclick = () => settingsOverlay.classList.add('hidden');

// Analysis Tabs
document.querySelectorAll('.analysis-tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.analysis-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const type = tab.dataset.type;
    document.getElementById('wheel-view').classList.toggle('hidden', type !== 'wheel');
    document.getElementById('years-view').classList.toggle('hidden', type !== 'years');
    if (type === 'wheel') drawWheel();
  };
});

function renderSpheres() {
  const grid = document.getElementById('spheres-grid');
  grid.innerHTML = '';
  const today = getTodayStr();
  const improvedToday = data.sphereProgress[today] || [];

  data.spheres.forEach(s => {
    const isImproved = improvedToday.includes(s.id);
    const div = document.createElement('div');
    div.className = `sphere-item ${isImproved ? 'improved' : ''}`;
    
    let bars = '';
    for (let i = 1; i <= 10; i++) {
      const active = i <= (s.score || 0);
      bars += `<div class="bar-seg" style="background: ${active ? s.color : '#1e1e2e'}"></div>`;
    }

    div.innerHTML = `
      <div class="sphere-name">${s.name}</div>
      <div class="bar-track">${bars}</div>
    `;
    div.onclick = () => toggleSphere(s.id);
    grid.appendChild(div);
  });
}

function toggleSphere(id) {
  const today = getTodayStr();
  if (!data.sphereProgress[today]) data.sphereProgress[today] = [];
  const idx = data.sphereProgress[today].indexOf(id);
  if (idx > -1) data.sphereProgress[today].splice(idx, 1);
  else data.sphereProgress[today].push(id);
  saveData(data);
  renderSpheres();
  drawWheel();
}

function renderHabits() {
  const container = document.getElementById('habits-container');
  container.innerHTML = '';
  const today = getTodayStr();
  const doneToday = data.habitHistory[today] || [];

  if (data.habits.length === 0) {
    container.innerHTML = '<div style="color:#444; text-align:center; padding:20px;">Привычки не добавлены. Нажми ⚙️</div>';
    return;
  }

  data.habits.forEach(h => {
    const isDone = doneToday.includes(h.id);
    const streak = calculateStreak(h.id);
    const div = document.createElement('div');
    div.className = `habit-item ${isDone ? 'done' : ''}`;
    div.innerHTML = `
      <div class="habit-check">${isDone ? '✓' : ''}</div>
      <div class="habit-info">
        <div class="habit-name">${h.name}</div>
        ${h.purpose ? `<div class="habit-purpose">${h.purpose}</div>` : ''}
        ${streak > 0 ? `<div class="habit-meta"><div class="habit-streak">🔥 ${streak}</div></div>` : ''}
      </div>
    `;
    div.onclick = () => toggleHabit(h.id);
    container.appendChild(div);
  });
}

function toggleHabit(id) {
  const today = getTodayStr();
  if (!data.habitHistory[today]) data.habitHistory[today] = [];
  const idx = data.habitHistory[today].indexOf(id);
  if (idx > -1) data.habitHistory[today].splice(idx, 1);
  else data.habitHistory[today].push(id);
  saveData(data);
  renderHabits();
}

function calculateStreak(id) {
  let streak = 0; let curr = new Date();
  while (true) {
    const dStr = curr.toLocaleDateString('en-CA');
    if ((data.habitHistory[dStr] || []).includes(id)) {
      streak++; curr.setDate(curr.getDate() - 1);
    } else {
      if (dStr === getTodayStr()) { curr.setDate(curr.getDate() - 1); continue; }
      break;
    }
  }
  return streak;
}

function updateStats() {
  const count = data.openedDays.length;
  document.getElementById('days-count').innerText = count;
  document.getElementById('days-percent').innerText = ((count / TOTAL_DAYS) * 100).toFixed(2);
}

/* Ritual Logic */
let holdTimer;
const holdBtn = document.getElementById('start-day-hold');
const holdFill = document.getElementById('start-day-fill');

function startHold(e) {
  e.preventDefault();
  let start = null;
  function animate(t) {
    if (!start) start = t;
    const progress = t - start;
    const pct = Math.min(progress / HOLD_MS, 1);
    holdFill.style.width = (pct * 100) + '%';
    if (pct < 1) holdTimer = requestAnimationFrame(animate);
    else finishDayStart();
  }
  holdTimer = requestAnimationFrame(animate);
}
function cancelHold() { cancelAnimationFrame(holdTimer); holdFill.style.width = '0%'; }
function finishDayStart() {
  const today = getTodayStr();
  if (!data.openedDays.includes(today)) {
    data.openedDays.push(today); saveData(data); updateStats();
  }
  cancelHold();
}

holdBtn.addEventListener('mousedown', startHold);
holdBtn.addEventListener('touchstart', startHold);
window.addEventListener('mouseup', cancelHold);
window.addEventListener('touchend', cancelHold);

/* Analysis Renders */
function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const size = Math.min(window.innerWidth - 72, 360);
  canvas.width = size * 2; canvas.height = size * 2;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  ctx.scale(2, 2);

  const center = size / 2;
  const radius = (size / 2) - 10;
  const step = (Math.PI * 2) / data.spheres.length;

  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let i = 1; i <= 10; i++) {
    ctx.beginPath(); ctx.arc(center, center, (radius / 10) * i, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.beginPath();
  data.spheres.forEach((s, i) => {
    const angle = i * step - Math.PI / 2;
    const r = (radius / 10) * (s.score || 0);
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(192, 132, 252, 0.2)'; ctx.fill();
  ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2; ctx.stroke();
}

function renderGrid() {
  const grid = document.getElementById('years-grid');
  grid.innerHTML = '';
  // Optimization: render current year cell-by-cell, others as progress bars
  const currentYear = new Date().getFullYear();
  for (let y = 0; y < YEARS; y++) {
    const yearNum = START_YEAR + y;
    const row = document.createElement('div');
    row.style = "display:flex; align-items:center; gap:8px; margin-bottom:4px; font-size:10px;";
    row.innerHTML = `<div style="width:30px; color:#444">${yearNum}</div>`;
    const bar = document.createElement('div');
    bar.style = `flex:1; height:4px; background:#1e1e2e; border-radius:2px; position:relative; overflow:hidden;`;
    if (yearNum < currentYear) {
      bar.innerHTML = `<div style="width:100%; height:100%; background:#4c1d95"></div>`;
    } else if (yearNum === currentYear) {
      const dayOfYear = Math.floor((new Date() - new Date(currentYear, 0, 0)) / 1000 / 60 / 60 / 24);
      bar.innerHTML = `<div style="width:${(dayOfYear / 365) * 100}%; height:100%; background:#c084fc"></div>`;
    }
    row.appendChild(bar);
    grid.appendChild(row);
  }
}

/* Settings Logic */
function renderSettings() {
  const sList = document.getElementById('settings-spheres-list');
  sList.innerHTML = '';
  data.spheres.forEach((s, idx) => {
    const div = document.createElement('div');
    div.style = "display:flex; gap:8px; margin-bottom:8px;";
    div.innerHTML = `
      <input type="text" class="settings-emoji" style="width:40px" value="${s.name.split(' ')[0]}" data-idx="${idx}">
      <input type="text" class="settings-name" style="flex:1" value="${s.name.split(' ').slice(1).join(' ')}" data-idx="${idx}">
      <input type="number" class="settings-score-input" style="width:50px" value="${s.score || 0}" min="0" max="10" data-idx="${idx}">
    `;
    sList.appendChild(div);
  });

  const hList = document.getElementById('settings-habits-list');
  hList.innerHTML = '';
  data.habits.forEach((h, idx) => {
    const div = document.createElement('div');
    div.className = 'habit-item';
    div.innerHTML = `<div class="habit-info"><b>${h.name}</b></div><button class="btn-remove" onclick="removeHabit(${idx})">🗑️</button>`;
    hList.appendChild(div);
  });
}

window.removeHabit = (idx) => { data.habits.splice(idx, 1); saveData(data); renderSettings(); renderHabits(); };

document.getElementById('settings-save').onclick = () => {
  document.querySelectorAll('.settings-sphere-row, div[style*="margin-bottom:8px"]').forEach(row => {
    const emojiInput = row.querySelector('.settings-emoji');
    if (!emojiInput) return;
    const nameInput = row.querySelector('.settings-name');
    const scoreInput = row.querySelector('.settings-score-input');
    const idx = emojiInput.dataset.idx;
    data.spheres[idx].name = `${emojiInput.value} ${nameInput.value}`;
    data.spheres[idx].score = parseInt(scoreInput.value) || 0;
  });
  saveData(data); renderSpheres(); drawWheel(); alert('Сферы сохранены');
};

document.getElementById('add-habit-btn').onclick = () => {
  const n = document.getElementById('new-habit-input');
  const p = document.getElementById('new-habit-purpose');
  if (!n.value) return;
  data.habits.push({ id: 'h_'+Date.now(), name: n.value, purpose: p.value });
  n.value = ''; p.value = ''; saveData(data); renderSettings(); renderHabits();
};

document.getElementById('settings-reset').onclick = () => {
  if (confirm('Сбросить всё?')) { localStorage.removeItem(STORAGE_KEY); location.reload(); }
};

init();
