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

const TOTAL_DAYS = 10000;

function loadData() {
  return JSON.parse(localStorage.getItem('lifeRPG') || '{}');
}

function saveData(data) {
  localStorage.setItem('lifeRPG', JSON.stringify(data));
}

function getScores() {
  const d = loadData();
  return d.scores || {};
}

function getDoneDays() {
  const d = loadData();
  return d.doneDays || [];
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
  const R = cx - 20;
  const n = SPHERES.length;
  const step = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background rings
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
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Dividers
  for (let j = 0; j < n; j++) {
    const angle = step * j - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Filled area
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
  ctx.fillStyle = 'rgba(124, 58, 237, 0.4)';
  ctx.fill();
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Labels
  SPHERES.forEach((s, j) => {
    const angle = step * j - Math.PI / 2;
    const r = R + 16;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    const val = scores[s.id] ?? 5;
    const emoji = s.name.split(' ')[0];
    ctx.font = '13px Segoe UI';
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji + ' ' + val, x, y);
  });
}

// --- DAYS ---
function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function renderDays() {
  const done = getDoneDays();
  const grid = document.getElementById('days-grid');
  const today = getTodayStr();
  grid.innerHTML = '';

  document.getElementById('days-done').textContent = done.length;

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (done[i]) {
      cell.classList.add('done');
      cell.title = done[i];
    }
    if (i === done.length) {
      cell.classList.add('today');
    }
    grid.appendChild(cell);
  }

  const btn = document.getElementById('close-day-btn');
  const alreadyDone = done.includes(today);
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
renderSpheres();
