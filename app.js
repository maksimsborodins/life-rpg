const SPHERES = [
  { id: 'health',    name: '💪 Здоровье',    color: '#4ade80' },
  { id: 'trading',   name: '📈 Трейдинг',    color: '#facc15' },
  { id: 'work',      name: '💼 Работа',      color: '#60a5fa' },
  { id: 'money',     name: '💰 Деньги',      color: '#fbbf24' },
  { id: 'discipline',name: '🔥 Дисциплина',  color: '#f87171' },
  { id: 'looks',     name: '🪞 Внешность',   color: '#e879f9' },
  { id: 'relations', name: '❤️ Отношения',  color: '#fb7185' },
  { id: 'growth',    name: '📚 Развитие',    color: '#34d399' },
];

const YEARS = 30;
const DAYS_PER_YEAR = 365;
const TOTAL_DAYS = YEARS * DAYS_PER_YEAR; // 10950

// Все прожитые дни до сегодня (1 янв 2026 — 17 апр 2026)
const SEED_DAYS = ["2026-01-01","2026-01-02","2026-01-03","2026-01-04","2026-01-05","2026-01-06","2026-01-07","2026-01-08","2026-01-09","2026-01-10","2026-01-11","2026-01-12","2026-01-13","2026-01-14","2026-01-15","2026-01-16","2026-01-17","2026-01-18","2026-01-19","2026-01-20","2026-01-21","2026-01-22","2026-01-23","2026-01-24","2026-01-25","2026-01-26","2026-01-27","2026-01-28","2026-01-29","2026-01-30","2026-01-31","2026-02-01","2026-02-02","2026-02-03","2026-02-04","2026-02-05","2026-02-06","2026-02-07","2026-02-08","2026-02-09","2026-02-10","2026-02-11","2026-02-12","2026-02-13","2026-02-14","2026-02-15","2026-02-16","2026-02-17","2026-02-18","2026-02-19","2026-02-20","2026-02-21","2026-02-22","2026-02-23","2026-02-24","2026-02-25","2026-02-26","2026-02-27","2026-02-28","2026-03-01","2026-03-02","2026-03-03","2026-03-04","2026-03-05","2026-03-06","2026-03-07","2026-03-08","2026-03-09","2026-03-10","2026-03-11","2026-03-12","2026-03-13","2026-03-14","2026-03-15","2026-03-16","2026-03-17","2026-03-18","2026-03-19","2026-03-20","2026-03-21","2026-03-22","2026-03-23","2026-03-24","2026-03-25","2026-03-26","2026-03-27","2026-03-28","2026-03-29","2026-03-30","2026-03-31","2026-04-01","2026-04-02","2026-04-03","2026-04-04","2026-04-05","2026-04-06","2026-04-07","2026-04-08","2026-04-09","2026-04-10","2026-04-11","2026-04-12","2026-04-13","2026-04-14","2026-04-15","2026-04-16","2026-04-17"];

function loadData() {
  return JSON.parse(localStorage.getItem('lifeRPG') || '{}');
}

function saveData(data) {
  localStorage.setItem('lifeRPG', JSON.stringify(data));
}

function getScores() {
  return loadData().scores || {};
}

function getDoneDays() {
  return loadData().doneDays || [];
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

// --- SEED: заполнить прожитые дни при первом открытии ---
function seedDays() {
  const data = loadData();
  if (!data.seeded) {
    data.doneDays = [...SEED_DAYS];
    data.seeded = true;
    saveData(data);
  }
}

// --- NAV ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'wheel') drawWheel();
    if (btn.dataset.tab === 'days') renderDays();
  });
});

// --- SPHERES ---
function renderSpheres() {
  const scores = getScores();
  const container = document.getElementById('spheres-list');
  container.innerHTML = '';
  SPHERES.forEach(s => {
    const val = scores[s.id] ?? 5;
    const div = document.createElement('div');
    div.className = 'sphere-item';
    div.innerHTML = `
      <div class="sphere-header">
        <span class="sphere-name">${s.name}</span>
        <span class="sphere-score" id="score-${s.id}">${val}</span>
      </div>
      <input type="range" min="0" max="10" value="${val}" class="sphere-slider" data-id="${s.id}">
    `;
    container.appendChild(div);
  });
  container.querySelectorAll('.sphere-slider').forEach(slider => {
    slider.addEventListener('input', () => {
      document.getElementById('score-' + slider.dataset.id).textContent = slider.value;
    });
  });
}

document.getElementById('save-spheres').addEventListener('click', () => {
  const data = loadData();
  data.scores = {};
  document.querySelectorAll('.sphere-slider').forEach(slider => {
    data.scores[slider.dataset.id] = parseInt(slider.value);
  });
  saveData(data);
  const btn = document.getElementById('save-spheres');
  btn.textContent = '✅ Сохранено!';
  setTimeout(() => btn.textContent = '💾 Сохранить', 1500);
});

// --- WHEEL ---
function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const scores = getScores();
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const R = cx - 28;
  const n = SPHERES.length;
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
    ctx.strokeStyle = i % 2 === 0 ? '#2a2a3e' : '#1e1e30';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (let j = 0; j < n; j++) {
    const angle = step * j - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  SPHERES.forEach((s, j) => {
    const val = scores[s.id] ?? 5;
    const angle = step * j - Math.PI / 2;
    const r = (R * val) / 10;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(124, 58, 237, 0.35)';
  ctx.fill();
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 2;
  ctx.stroke();

  SPHERES.forEach((s, j) => {
    const angle = step * j - Math.PI / 2;
    const r = R + 20;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    const val = scores[s.id] ?? 5;
    const emoji = s.name.split(' ')[0];
    ctx.font = 'bold 12px Segoe UI';
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji + ' ' + val, x, y);
  });
}

// --- DAYS ---
function renderDays() {
  const done = getDoneDays();
  const doneCount = done.length;
  const pct = ((doneCount / TOTAL_DAYS) * 100).toFixed(1);

  document.getElementById('days-done-label').textContent = doneCount + ' / ' + TOTAL_DAYS + ' дней';
  document.getElementById('days-pct-label').textContent = pct + '%';
  document.getElementById('days-progress-fill').style.width = pct + '%';

  const container = document.getElementById('years-grid');
  container.innerHTML = '';

  const startYear = 2026;

  for (let y = 0; y < YEARS; y++) {
    const row = document.createElement('div');
    row.className = 'year-row';

    const label = document.createElement('div');
    label.className = 'year-label';
    label.textContent = startYear + y;
    row.appendChild(label);

    const cells = document.createElement('div');
    cells.className = 'year-cells';

    for (let d = 0; d < DAYS_PER_YEAR; d++) {
      const idx = y * DAYS_PER_YEAR + d;
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      if (idx < doneCount) {
        cell.classList.add('done');
      } else if (idx === doneCount) {
        cell.classList.add('today');
      }
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
  const data = loadData();
  const today = getTodayStr();
  if (!data.doneDays) data.doneDays = [];
  if (!data.doneDays.includes(today)) {
    data.doneDays.push(today);
    saveData(data);
    renderDays();
  }
});

// --- INIT ---
seedDays();
renderSpheres();
