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
const START_DATE = '2026-01-01';
const HOLD_MS = 3000;

function loadData() { return JSON.parse(localStorage.getItem('lifeRPG') || '{}'); }
function saveData(d) { localStorage.setItem('lifeRPG', JSON.stringify(d)); }
function getTodayStr() { return new Date().toLocaleDateString('en-CA'); }
function getSpheres() { const d = loadData(); return d.spheres || DEFAULT_SPHERES; }
function getScores() { return loadData().scores || {}; }
function getTodayImproved() { const d = loadData(); return d.improved || {}; }
function getOpenedDay() { return loadData().openedDay || ''; }
function getHabits() { return loadData().habits || []; }
function getHabitDone() { return loadData().habitDone || {}; }

function diffDays(from, to) {
  const a = new Date(from + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  return Math.floor((b - a) / 86400000);
}

function shiftDate(dateStr, days) {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-CA');
}

function getHabitStreak(habitId) {
  const habitDone = getHabitDone();
  const dates = Object.entries(habitDone)
    .filter(([key, value]) => key === habitId && !!value)
    .map(([, value]) => value)
    .sort();

  if (dates.length === 0) return 0;

  const uniqueDates = [...new Set(dates)];
  const today = getTodayStr();
  const yesterday = shiftDate(today, -1);
  let current = uniqueDates[uniqueDates.length - 1];

  if (current !== today && current !== yesterday) return 0;

  let streak = 1;
  for (let i = uniqueDates.length - 2; i >= 0; i--) {
    if (shiftDate(current, -1) === uniqueDates[i]) {
      streak++;
      current = uniqueDates[i];
    } else {
      break;
    }
  }
  return streak;
}

function getAutoDoneCount() {
  const days = diffDays(START_DATE, getTodayStr()) + 1;
  return Math.max(0, Math.min(TOTAL_DAYS, days));
}

function isDayOpened() { return getOpenedDay() === getTodayStr(); }

function openToday() {
  const d = loadData();
  d.openedDay = getTodayStr();
  saveData(d);
  updateRitual();
}

function ensureDefaults() {
  const d = loadData();
  let changed = false;
  if (!d.seeded) { d.seeded = true; changed = true; }
  if (!d.spheres) { d.spheres = DEFAULT_SPHERES; changed = true; }
  if (!d.scores) {
    d.scores = {};
    DEFAULT_SPHERES.forEach(s => d.scores[s.id] = 5);
    changed = true;
  }
  if (!d.improved) { d.improved = {}; changed = true; }
  if (!d.habits) { d.habits = []; changed = true; }
  if (!d.habitDone) { d.habitDone = {}; changed = true; }
  if (changed) saveData(d);
}

function activateTab(tabName) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
  const tab = document.getElementById('tab-' + tabName);
  if (btn) btn.classList.add('active');
  if (tab) tab.classList.add('active');
  if (tabName === 'spheres') { renderSpheres(); drawWheel(); }
  if (tabName === 'habits') renderHabits();
  if (tabName === 'days') renderDays();
}

document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    if ((btn.dataset.tab === 'spheres' || btn.dataset.tab === 'habits') && !isDayOpened()) {
      activateTab('days');
      return;
    }
    activateTab(btn.dataset.tab);
  });
});

const overlay = document.getElementById('settings-overlay');
document.getElementById('open-settings').addEventListener('click', () => {
  renderSettingsSpheres();
  renderSettingsHabits();
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
  setTimeout(() => btn.textContent = '💾 Сохранить сферы', 1500);
});

function renderSettingsHabits() {
  const habits = getHabits();
  const container = document.getElementById('settings-habits-list');
  container.innerHTML = '';
  habits.forEach((h, i) => {
    const row = document.createElement('div');
    row.className = 'settings-habit-row';
    row.innerHTML = `
      <span class="settings-habit-name">${h.emoji} ${h.name}</span>
      <button class="btn-remove" data-i="${i}">✕</button>
    `;
    row.querySelector('.btn-remove').addEventListener('click', () => {
      const d = loadData();
      d.habits.splice(i, 1);
      saveData(d);
      renderSettingsHabits();
    });
    container.appendChild(row);
  });
}

document.getElementById('add-habit-btn').addEventListener('click', () => {
  const input = document.getElementById('new-habit-input');
  const val = input.value.trim();
  if (!val) return;
  const d = loadData();
  if (!d.habits) d.habits = [];
  const emojiMatch = val.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
  const emoji = emojiMatch ? emojiMatch[0] : '🔹';
  const name = emojiMatch ? val.slice(emoji.length).trim() : val;
  d.habits.push({ id: 'h_' + Date.now(), emoji, name });
  saveData(d);
  input.value = '';
  renderSettingsHabits();
});

document.getElementById('new-habit-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('add-habit-btn').click();
});

document.getElementById('settings-habits-save').addEventListener('click', () => {
  overlay.classList.add('hidden');
  renderHabits();
  const btn = document.getElementById('settings-habits-save');
  btn.textContent = '✅ Сохранено!';
  setTimeout(() => btn.textContent = '💾 Сохранить привычки', 1500);
});

document.getElementById('settings-reset').addEventListener('click', () => {
  if (confirm('Точно? Все данные будут удалены.')) {
    localStorage.removeItem('lifeRPG');
    location.reload();
  }
});

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
    const bars = Array.from({ length: 10 }, (_, i) => {
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
    div.addEventListener('click', () => {
      if (!isDayOpened()) { activateTab('days'); return; }
      toggleImproved(s.id);
    });
    container.appendChild(div);
  });
}

function toggleImproved(id) {
  const d = loadData();
  const today = getTodayStr();
  if (!d.improved) d.improved = {};
  if (d.improved[id] === today) delete d.improved[id];
  else d.improved[id] = today;
  saveData(d);
  renderSpheres();
}

function renderHabits() {
  const habits = getHabits();
  const today = getTodayStr();
  const habitDone = getHabitDone();
  const container = document.getElementById('habits-list');
  const empty = document.getElementById('habits-empty');
  container.innerHTML = '';

  if (habits.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  habits.forEach(h => {
    const done = habitDone[h.id] === today;
    const streak = getHabitStreak(h.id);
    const div = document.createElement('div');
    div.className = 'habit-item' + (done ? ' done' : '');
    div.innerHTML = `
      <div class="habit-check">${done ? '✅' : '⬜'}</div>
      <div class="habit-info">
        <span class="habit-name">${h.emoji} ${h.name}</span>
        <div class="habit-meta">
          <span class="habit-streak">🔥 ${streak} дн.</span>
          ${done ? '<span class="habit-status">Сегодня сделано</span>' : '<span class="habit-status habit-status-muted">Ещё не отмечено</span>'}
        </div>
      </div>
    `;
    div.addEventListener('click', () => {
      if (!isDayOpened()) { activateTab('days'); return; }
      const d = loadData();
      if (!d.habitDone) d.habitDone = {};
      if (d.habitDone[h.id] === today) delete d.habitDone[h.id];
      else d.habitDone[h.id] = today;
      saveData(d);
      renderHabits();
    });
    container.appendChild(div);
  });
}

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
  for (let j = 0; j < n; j++) {
    const angle = step * j - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.strokeStyle = '#2a2a3e'; ctx.lineWidth = 1; ctx.stroke();
  }
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
  spheres.forEach((s, j) => {
    const angle = step * j + step / 2 - Math.PI / 2;
    const r = R + 18;
    const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
    ctx.font = '11px Segoe UI';
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.name.split(' ')[0], x, y);
  });
}

function updateRitual() {
  const ritual = document.getElementById('day-ritual');
  if (isDayOpened()) ritual.classList.add('done');
  else ritual.classList.remove('done');
}

function renderDays() {
  const doneCount = getAutoDoneCount();
  const remaining = TOTAL_DAYS - doneCount;
  const pct = ((doneCount / TOTAL_DAYS) * 100).toFixed(1);
  const currentYear = new Date().getFullYear();
  const currentYearStartIdx = (currentYear - START_YEAR) * DAYS_PER_YEAR;
  const passedInCurrentYear = Math.max(0, Math.min(DAYS_PER_YEAR, doneCount - currentYearStartIdx));

  document.getElementById('days-done').textContent = doneCount;
  document.getElementById('days-pct-label').textContent = pct + '% • осталось ' + remaining;
  document.getElementById('days-progress-fill').style.width = pct + '%';
  updateRitual();

  const container = document.getElementById('years-grid');
  container.innerHTML = '';

  for (let y = 0; y < YEARS; y++) {
    const year = START_YEAR + y;
    const isCurrent = year === currentYear;
    const row = document.createElement('div');
    row.className = 'year-row' + (isCurrent ? ' current-year' : '');

    const label = document.createElement('div');
    label.className = 'year-label';
    label.textContent = year;
    row.appendChild(label);

    if (isCurrent) {
      const meta = document.createElement('div');
      meta.className = 'year-current-meta';
      meta.textContent = passedInCurrentYear + ' / ' + DAYS_PER_YEAR;
      row.appendChild(meta);
    }

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
}

const holdBtn = document.getElementById('start-day-hold');
const holdFill = document.getElementById('start-day-fill');
const holdText = document.getElementById('start-day-text');
let holdFrame = null;
let holdStartedAt = 0;
let holding = false;

function resetHoldUi() {
  holdFill.style.width = '0%';
  holdText.textContent = 'Удерживай 3 секунды';
}

function finishHold() {
  holding = false;
  openToday();
  holdFill.style.width = '100%';
  holdText.textContent = '✅ День начат';
  setTimeout(() => activateTab('spheres'), 400);
}

function startHold() {
  if (isDayOpened() || holding) return;
  holding = true;
  holdStartedAt = Date.now();
  const tick = () => {
    if (!holding) return;
    const elapsed = Date.now() - holdStartedAt;
    const pct = Math.min(100, (elapsed / HOLD_MS) * 100);
    holdFill.style.width = pct + '%';
    const rem = Math.max(0, Math.ceil((HOLD_MS - elapsed) / 1000));
    holdText.textContent = rem > 0 ? `Держи... ${rem}` : 'Отпускай!';
    if (elapsed >= HOLD_MS) { finishHold(); return; }
    holdFrame = requestAnimationFrame(tick);
  };
  holdFrame = requestAnimationFrame(tick);
}

function stopHold() {
  if (!holding) return;
  holding = false;
  if (holdFrame) cancelAnimationFrame(holdFrame);
  holdFrame = null;
  resetHoldUi();
}

['mousedown','touchstart','pointerdown'].forEach(evt =>
  holdBtn.addEventListener(evt, e => { e.preventDefault(); startHold(); }, { passive: false })
);
['mouseup','mouseleave','touchend','touchcancel','pointerup','pointercancel'].forEach(evt =>
  holdBtn.addEventListener(evt, stopHold)
);

ensureDefaults();
activateTab('days');
renderSpheres();
drawWheel();
