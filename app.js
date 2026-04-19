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

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveData(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function getTodayStr() {
  return new Date().toLocaleDateString('en-CA');
}

function sortDateStrings(arr) {
  return [...arr].sort((a, b) => new Date(a) - new Date(b));
}

function ensureDefaults(d) {
  if (!d.spheres || d.spheres.length === 0) d.spheres = JSON.parse(JSON.stringify(DEFAULT_SPHERES));
  if (!d.habits) d.habits = [];
  if (!d.openedDays) d.openedDays = [];
  if (!d.sphereProgress) d.sphereProgress = {};
  if (!d.habitHistory) d.habitHistory = {};
  return d;
}

let data = ensureDefaults(loadData());

/* Navigation Logic */
const navButtons = document.querySelectorAll('.nav-btn[data-tab]');
const tabs = document.querySelectorAll('.tab');

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    navButtons.forEach(b => b.classList.toggle('active', b === btn));
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
    if (target === 'spheres') drawWheel();
  });
});

/* Settings Logic */
const settingsOverlay = document.getElementById('settings-overlay');
const openSettingsBtn = document.getElementById('open-settings');
const closeSettingsBtn = document.getElementById('settings-close');

openSettingsBtn.addEventListener('click', () => {
  renderSettings();
  settingsOverlay.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsOverlay.classList.add('hidden');
});

function renderSettings() {
  const sList = document.getElementById('settings-spheres-list');
  sList.innerHTML = '';
  data.spheres.forEach((s, idx) => {
    const div = document.createElement('div');
    div.className = 'settings-sphere-row';
    div.innerHTML = `
      <input type="text" class="settings-emoji" value="${s.name.split(' ')[0]}" data-idx="${idx}" data-type="emoji">
      <input type="text" class="settings-name" value="${s.name.split(' ').slice(1).join(' ')}" data-idx="${idx}" data-type="name">
      <input type="number" class="settings-score-input" value="${s.score || 0}" min="0" max="10" data-idx="${idx}">
    `;
    sList.appendChild(div);
  });

  const hList = document.getElementById('settings-habits-list');
  hList.innerHTML = '';
  data.habits.forEach((h, idx) => {
    const div = document.createElement('div');
    div.className = 'habit-item';
    div.style.cursor = 'default';
    div.innerHTML = `
      <div class="habit-info">
        <div class="habit-name">${h.name}</div>
        <div class="habit-purpose">${h.purpose || ''}</div>
      </div>
      <button class="btn-remove" onclick="removeHabit(${idx})">🗑️</button>
    `;
    hList.appendChild(div);
  });
}

window.removeHabit = (idx) => {
  data.habits.splice(idx, 1);
  saveData(data);
  renderSettings();
  renderHabits();
};

document.getElementById('add-habit-btn').addEventListener('click', () => {
  const nameInput = document.getElementById('new-habit-input');
  const purposeInput = document.getElementById('new-habit-purpose');
  if (!nameInput.value.trim()) return;
  
  data.habits.push({
    id: 'h_' + Date.now(),
    name: nameInput.value.trim(),
    purpose: purposeInput.value.trim()
  });
  
  nameInput.value = '';
  purposeInput.value = '';
  saveData(data);
  renderSettings();
  renderHabits();
});

document.getElementById('settings-save').addEventListener('click', () => {
  const rows = document.querySelectorAll('.settings-sphere-row');
  rows.forEach(row => {
    const emoji = row.querySelector('.settings-emoji').value;
    const name = row.querySelector('.settings-name').value;
    const score = parseInt(row.querySelector('.settings-score-input').value) || 0;
    const idx = row.querySelector('.settings-emoji').dataset.idx;
    data.spheres[idx].name = `${emoji} ${name}`;
    data.spheres[idx].score = Math.max(0, Math.min(10, score));
  });
  saveData(data);
  renderSpheres();
  drawWheel();
  alert('Сферы сохранены');
});

document.getElementById('settings-habits-save').addEventListener('click', () => {
  saveData(data);
  alert('Привычки сохранены');
});

/* Spheres Logic */
function renderSpheres() {
  const list = document.getElementById('spheres-list');
  list.innerHTML = '';
  const today = getTodayStr();
  const improvedToday = data.sphereProgress[today] || [];

  data.spheres.forEach(s => {
    const isImproved = improvedToday.includes(s.id);
    const div = document.createElement('div');
    div.className = `sphere-item ${isImproved ? 'improved' : ''}`;
    
    let bars = '';
    for (let i = 1; i <= 10; i++) {
      const active = i <= (s.score || 0);
      bars += `<div class="bar-seg" style="background: ${active ? s.color : '#1e1e30'}"></div>`;
    }

    div.innerHTML = `
      <div class="sphere-row">
        <div class="sphere-name">${s.name}</div>
        <div class="bar-track">${bars}</div>
        <div class="sphere-score">${s.score || 0}</div>
      </div>
    `;
    
    div.onclick = () => toggleSphere(s.id);
    list.appendChild(div);
  });
}

function toggleSphere(id) {
  const today = getTodayStr();
  if (!data.sphereProgress[today]) data.sphereProgress[today] = [];
  
  const idx = data.sphereProgress[today].indexOf(id);
  if (idx > -1) {
    data.sphereProgress[today].splice(idx, 1);
  } else {
    data.sphereProgress[today].push(id);
  }
  
  saveData(data);
  renderSpheres();
  drawWheel();
}

function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const size = Math.min(window.innerWidth - 64, 400);
  canvas.width = size * 2;
  canvas.height = size * 2;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(2, 2);

  const center = size / 2;
  const radius = (size / 2) - 20;
  const step = (Math.PI * 2) / data.spheres.length;

  ctx.clearRect(0, 0, size, size);
  
  // Background grid
  ctx.strokeStyle = '#1e1e2e';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 10; i++) {
    ctx.beginPath();
    ctx.arc(center, center, (radius / 10) * i, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Axes
  data.spheres.forEach((s, i) => {
    const angle = i * step - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
    ctx.stroke();
  });

  // Data shape
  ctx.beginPath();
  data.spheres.forEach((s, i) => {
    const angle = i * step - Math.PI / 2;
    const r = (radius / 10) * (s.score || 0);
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(192, 132, 252, 0.3)';
  ctx.fill();
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Points
  data.spheres.forEach((s, i) => {
    const angle = i * step - Math.PI / 2;
    const r = (radius / 10) * (s.score || 0);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(center + Math.cos(angle) * r, center + Math.sin(angle) * r, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* Habits Logic */
function renderHabits() {
  const container = document.getElementById('habits-container');
  container.innerHTML = '';
  
  if (data.habits.length === 0) {
    container.innerHTML = '<div class="habits-empty">Привычки не добавлены. Открой настройки ⚙️</div>';
    return;
  }

  const today = getTodayStr();
  const doneToday = data.habitHistory[today] || [];

  data.habits.forEach(h => {
    const isDone = doneToday.includes(h.id);
    const streak = calculateStreak(h.id);
    
    const div = document.createElement('div');
    div.className = `habit-item ${isDone ? 'done' : ''}`;
    div.innerHTML = `
      <div class="habit-check">${isDone ? '✅' : '⬜'}</div>
      <div class="habit-info">
        <div class="habit-name">${h.name}</div>
        <div class="habit-purpose">${h.purpose || ''}</div>
        <div class="habit-meta">
          ${streak > 0 ? `<div class="habit-streak">🔥 ${streak}</div>` : ''}
        </div>
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
  if (idx > -1) {
    data.habitHistory[today].splice(idx, 1);
  } else {
    data.habitHistory[today].push(id);
  }
  
  saveData(data);
  renderHabits();
}

function calculateStreak(id) {
  let streak = 0;
  let curr = new Date();
  
  while (true) {
    const dStr = curr.toLocaleDateString('en-CA');
    const done = (data.habitHistory[dStr] || []).includes(id);
    if (done) {
      streak++;
      curr.setDate(curr.getDate() - 1);
    } else {
      // If not done today, don't break yet, check yesterday
      if (dStr === getTodayStr()) {
        curr.setDate(curr.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

/* Days & Grid Logic */
function renderGrid() {
  const grid = document.getElementById('years-grid');
  grid.innerHTML = '';
  
  for (let y = 0; y < YEARS; y++) {
    const row = document.createElement('div');
    row.className = 'year-row';
    const yearNum = START_YEAR + y;
    
    row.innerHTML = `<div class="year-label">${yearNum}</div>`;
    
    const cells = document.createElement('div');
    cells.className = 'year-cells';
    
    // Simplification for mobile performance: only show current year details, others are summaries
    const isCurrentYear = new Date().getFullYear() === yearNum;
    
    if (isCurrentYear) {
      for (let d = 0; d < 365; d++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        // Logic to check if day is proproced would go here
        cells.appendChild(cell);
      }
    } else {
      // Placeholder for other years
      cells.innerHTML = '<div style="height: 4px; background: #1a1a2e; width: 100%; border-radius: 2px;"></div>';
    }
    
    row.appendChild(cells);
    grid.appendChild(row);
  }
  updateDaysUI();
}

function updateDaysUI() {
  const count = data.openedDays.length;
  document.getElementById('days-count').innerText = count;
  const pct = ((count / TOTAL_DAYS) * 100).toFixed(2);
  document.getElementById('days-percent').innerText = pct;
}

/* Day Ritual Logic */
let holdTimer;
const holdBtn = document.getElementById('start-day-hold');
const holdFill = document.getElementById('start-day-fill');

function startHold(e) {
  e.preventDefault();
  let start = null;
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const pct = Math.min(progress / HOLD_MS, 1);
    holdFill.style.width = (pct * 100) + '%';
    
    if (pct < 1) {
      holdTimer = requestAnimationFrame(animate);
    } else {
      finishDayStart();
    }
  }
  holdTimer = requestAnimationFrame(animate);
}

function cancelHold() {
  cancelAnimationFrame(holdTimer);
  holdFill.style.width = '0%';
}

function finishDayStart() {
  const today = getTodayStr();
  if (!data.openedDays.includes(today)) {
    data.openedDays.push(today);
    saveData(data);
    updateDaysUI();
    alert('Новый день начат! Удачи сегодня.');
  }
  cancelHold();
}

holdBtn.addEventListener('mousedown', startHold);
holdBtn.addEventListener('touchstart', startHold);
window.addEventListener('mouseup', cancelHold);
window.addEventListener('touchend', cancelHold);

/* Backup Logic */
document.getElementById('export-data-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `life-rpg-backup-${getTodayStr()}.json`;
  a.click();
});

document.getElementById('import-data-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (confirm('Это перезапишет текущие данные. Продолжить?')) {
        data = ensureDefaults(imported);
        saveData(data);
        location.reload();
      }
    } catch {
      alert('Ошибка при чтении файла');
    }
  };
  reader.readAsText(file);
});

document.getElementById('settings-reset').addEventListener('click', () => {
  if (confirm('ВНИМАНИЕ: Это полностью удалит все твои данные навсегда. Уверен?')) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});

/* Initial Render */
renderSpheres();
renderHabits();
renderGrid();
if (document.querySelector('.tab.active').dataset.tab === 'spheres') drawWheel();
