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
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
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
  return [...arr].sort((a, b) => new Date(a + 'T00:00:00') - new Date(b + 'T00:00:00'));
}

function clampScore(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(10, Math.max(0, Math.round(num)));
}

function normalizeOpenedDays(list) {
  if (!Array.isArray(list)) return [];
  return sortDateStrings([...new Set(list.filter(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)))]);
}

function getSpheres() {
  const d = loadData();
  return d.spheres || DEFAULT_SPHERES;
}

function getScores() {
  return loadData().scores || {};
}

function getTodayImproved() {
  const d = loadData();
  return d.improved || {};
}

function getOpenedDays() {
  return normalizeOpenedDays(loadData().openedDays || []);
}

function getHabits() {
  return loadData().habits || [];
}

function getHabitDone() {
  return loadData().habitDone || {};
}

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
  const d = loadData();
  const history = (d.habitHistory && d.habitHistory[habitId]) || [];
  if (history.length === 0) return 0;
  const unique = sortDateStrings([...new Set(history)]);
  const today = getTodayStr();
  const yesterday = shiftDate(today, -1);
  let last = unique[unique.length - 1];
  if (last !== today && last !== yesterday) return 0;
  let streak = 1;
  for (let i = unique.length - 2; i >= 0; i--) {
    if (shiftDate(last, -1) === unique[i]) {
      streak++;
      last = unique[i];
    } else {
      break;
    }
  }
  return streak;
}

function getDoneCount() {
  const today = getTodayStr();
  return getOpenedDays().filter(day => day <= today).length;
}

function getCurrentDayIndex() {
  return getDoneCount();
}

function isDayOpened() {
  return getOpenedDays().includes(getTodayStr());
}

function openToday() {
  const d = loadData();
  const today = getTodayStr();
  d.openedDays = normalizeOpenedDays([...(d.openedDays || []), today]);
  saveData(d);
  updateRitual();
  renderDays();
}

function ensureDefaults() {
  const d = loadData();
  let changed = false;

  if (!d.seeded) {
    d.seeded = true;
    changed = true;
  }

  if (!d.spheres) {
    d.spheres = DEFAULT_SPHERES;
    changed = true;
  }

  if (!d.scores) {
    d.scores = {};
    DEFAULT_SPHERES.forEach(s => d.scores[s.id] = 5);
    changed = true;
  } else {
    DEFAULT_SPHERES.forEach(s => {
      d.scores[s.id] = clampScore(d.scores[s.id] ?? 5, 5);
    });
    changed = true;
  }

  if (!d.improved) {
    d.improved = {};
    changed = true;
  }

  if (!d.habits) {
    d.habits = [];
    changed = true;
  }

  d.habits = d.habits.map(h => ({
    id: h.id || 'h_' + Date.now() + Math.random().toString(16).slice(2),
    emoji: h.emoji || '🔹',
    name: (h.name || '').trim(),
    purpose: (h.purpose || '').trim(),
  })).filter(h => h.name);
  changed = true;

  if (!d.habitDone) {
    d.habitDone = {};
    changed = true;
  }

  if (!d.habitHistory) {
    d.habitHistory = {};
    changed = true;
  }

  Object.keys(d.habitHistory).forEach(id => {
    d.habitHistory[id] = normalizeOpenedDays(d.habitHistory[id]);
  });
  changed = true;

  if (!d.openedDays && d.openedDay) {
    d.openedDays = normalizeOpenedDays([d.openedDay]);
    delete d.openedDay;
    changed = true;
  }

  if (!d.openedDays) {
    d.openedDays = [];
    changed = true;
  } else {
    d.openedDays = normalizeOpenedDays(d.openedDays);
    changed = true;
  }

  if (changed) saveData(d);
}

function activateTab(tabName) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
  const tab = document.getElementById('tab-' + tabName);
  if (btn) btn.classList.add('active');
  if (tab) tab.classList.add('active');
  if (tabName === 'spheres') {
    renderSpheres();
    drawWheel();
  }
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
overlay.addEventListener('click', e => {
  if (e.target === overlay) overlay.classList.add('hidden');
});

function renderSettingsSpheres() {
  const spheres = getSpheres();
  const scores = getScores();
  const container = document.getElementById('settings-spheres-list');
  container.innerHTML = '';
  spheres.forEach((s, i) => {
    const val = clampScore(scores[s.id] ?? 5, 5);
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
    const emoji = emojis[i].value.trim() || '⭐';
    const baseName = names[i].value.trim() || s.name.split(' ').slice(1).join(' ') || 'Без названия';
    s.name = `${emoji} ${baseName}`;
    s.color = colors[i].value;
  });

  d.spheres = spheres;
  d.scores = d.scores || {};
  scoreInputs.forEach(inp => {
    d.scores[inp.dataset.id] = clampScore(inp.value, 0);
    inp.value = d.scores[inp.dataset.id];
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
      <div class="settings-habit-texts">
        <span class="settings-habit-name">${h.emoji} ${h.name}</span>
        ${h.purpose ? `<div class="settings-habit-purpose-text">${h.purpose}</div>` : ''}
      </div>
      <button class="btn-remove" data-i="${i}">✕</button>
    `;

    row.querySelector('.btn-remove').addEventListener('click', () => {
      const d = loadData();
      const removed = d.habits[i];
      d.habits.splice(i, 1);
      if (removed) {
        if (d.habitDone) delete d.habitDone[removed.id];
        if (d.habitHistory) delete d.habitHistory[removed.id];
      }
      saveData(d);
      renderSettingsHabits();
      renderHabits();
    });

    container.appendChild(row);
  });
}

document.getElementById('add-habit-btn').addEventListener('click', () => {
  const input = document.getElementById('new-habit-input');
  const purposeInput = document.getElementById('new-habit-purpose');
  const val = input.value.trim();
  const purpose = purposeInput.value.trim();
  if (!val) return;

  const d = loadData();
  if (!d.habits) d.habits = [];

  const emojiMatch = val.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
  const emoji = emojiMatch ? emojiMatch[0] : '🔹';
  const name = emojiMatch ? val.slice(emoji.length).trim() : val;

  d.habits.push({
    id: 'h_' + Date.now(),
    emoji,
    name,
    purpose,
  });

  saveData(d);
  input.value = '';
  purposeInput.value = '';
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
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});

function exportData() {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `life-rpg-backup-${getTodayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  if (!file) return;
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    alert('Не удалось прочитать JSON-файл');
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  ensureDefaults();
  renderSettingsSpheres();
  renderSettingsHabits();
  renderSpheres();
  renderHabits();
  renderDays();
  drawWheel();
  alert('Данные импортированы');
}

document.getElementById('export-data-btn').addEventListener('click', exportData);
document.getElementById('import-data-input').addEventListener('change', e => {
  importData(e.target.files[0]);
  e.target.value = '';
});

function renderSpheres() {
  const spheres = getSpheres();
  const scores = getScores();
  const today = getTodayStr();
  const improved = getTodayImproved();
  const container = document.getElementById('spheres-list');
  container.innerHTML = '';

  spheres.forEach(s => {
    const val = clampScore(scores[s.id] ?? 5, 5);
    const isImproved = improved[s.id] === today;
    const bars = Array.from({ length: 10 }, (_, i) => {
      const filled = i < val;
      return `<div class="bar-seg ${filled ? 'filled' : ''}" style="${filled ? 'background:' + s.color : ''}"></div>`;
    }).join('');

    const div = document.createElement('div');
    div.className = 'sphere-item' + (isImproved ? ' improved' : '');
    div.innerHTML = `
      <div class="sphere-row">
        <span class="sphere-name">${s.name}</span>
        <div class="sphere-right">
          <div class="bar-track">${bars}</div>
          <span class="sphere-score" style="color:${s.color}">${val}</span>
          ${isImproved ? '<span class="improved-badge">✨</span>' : ''}
        </div>
      </div>`;

    div.addEventListener('click', () => {
      if (!isDayOpened()) {
        activateTab('days');
        return;
      }
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
    const streakLabel = streak >= 2 ? `🔥 ${streak} дн.` : streak === 1 ? '🔥 1 дн.' : '—';
    const div = document.createElement('div');
    div.className = 'habit-item' + (done ? ' done' : '');
    div.innerHTML = `
      <div class="habit-check">${done ? '✅' : '⬜'}</div>
      <div class="habit-info">
        <span class="habit-name">${h.emoji} ${h.name}</span>
        ${h.purpose ? `<div class="habit-purpose">${h.purpose}</div>` : ''}
        <div class="habit-meta">
          <span class="habit-streak ${streak > 0 ? 'active' : ''}">${streakLabel}</span>
          <span class="habit-status ${done ? '' : 'habit-status-muted'}">${done ? 'Сегодня сделано' : 'Ещё не отмечено'}</span>
        </div>
      </div>`;

    div.addEventListener('click', () => {
      if (!isDayOpened()) {
        activateTab('days');
        return;
      }

      const d = loadData();
      if (!d.habitDone) d.habitDone = {};
      if (!d.habitHistory) d.habitHistory = {};
      if (!d.habitHistory[h.id]) d.habitHistory[h.id] = [];

      if (d.habitDone[h.id] === today) {
        delete d.habitDone[h.id];
        d.habitHistory[h.id] = d.habitHistory[h.id].filter(dt => dt !== today);
      } else {
        d.habitDone[h.id] = today;
        if (!d.habitHistory[h.id].includes(today)) d.habitHistory[h.id].push(today);
      }

      d.habitHistory[h.id] = normalizeOpenedDays(d.habitHistory[h.id]);
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
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const R = cx - 30;
  const n = spheres.length;
  const step = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 10; i >= 1; i--) {
    ctx.beginPath();
    for (let j = 0; j < n; j++) {
      const angle = step * j - Math.PI / 2;
      const r = (R * i) / 10;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
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
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  spheres.forEach((s, j) => {
    const val = clampScore(scores[s.id] ?? 5, 5);
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
    ctx.font = '11px Segoe UI';
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.name.split(' ')[0], cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  });
}

function updateRitual() {
  const ritual = document.getElementById('day-ritual');
  if (isDayOpened()) ritual.classList.add('done');
  else ritual.classList.remove('done');
}

function renderDays() {
  const doneCount = getDoneCount();
  const remaining = Math.max(0, TOTAL_DAYS - doneCount);
  const pct = ((doneCount / TOTAL_DAYS) * 100).toFixed(1);
  const currentYear = new Date().getFullYear();
  const currentYearStartIdx = (currentYear - START_YEAR) * DAYS_PER_YEAR;
  const passedInCurrentYear = Math.max(0, Math.min(DAYS_PER_YEAR, doneCount - currentYearStartIdx));

  document.getElementById('days-done').textContent = doneCount;
  document.getElementById('days-total-label').textContent = `/ ${TOTAL_DAYS.toLocaleString('ru-RU')} дней`;
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
      else if (idx === getCurrentDayIndex()) cell.classList.add('today');
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
    if (elapsed >= HOLD_MS) {
      finishHold();
      return;
    }
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

['mousedown', 'touchstart', 'pointerdown'].forEach(evt =>
  holdBtn.addEventListener(evt, e => {
    e.preventDefault();
    startHold();
  }, { passive: false })
);

['mouseup', 'mouseleave', 'touchend', 'touchcancel', 'pointerup', 'pointercancel'].forEach(evt =>
  holdBtn.addEventListener(evt, stopHold)
);

ensureDefaults();
activateTab('days');
renderSpheres();
renderHabits();
drawWheel();
renderDays();
