const DEFAULT_SPHERES = [
    { id: 'trading', name: 'Трейдинг', color: '#facc15', score: 8 },
    { id: 'health', name: 'Здоровье', color: '#4ade80', score: 7 },
    { id: 'creative', name: 'Творчество', color: '#f472b6', score: 6 },
    { id: 'hobby', name: 'Хобби', color: '#60a5fa', score: 5 },
    { id: 'looks', name: 'Внешний вид', color: '#e879f9', score: 7 },
    { id: 'family', name: 'Семья', color: '#fb7185', score: 9 },
    { id: 'social', name: 'Знакомства', color: '#34d399', score: 6 },
    { id: 'inner', name: 'Внутренний порядок', color: '#a78bfa', score: 8 },
];

const START_YEAR = 2026;
const YEARS = 30;
const DAYS_PER_YEAR = 365;
const TOTAL_DAYS = YEARS * DAYS_PER_YEAR;
const STORAGE_KEY = 'lifeRPG_Dashboard_v1';

let data = loadData();

function loadData() {
    try {
        const d = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        if (!d.spheres || d.spheres.length === 0) d.spheres = JSON.parse(JSON.stringify(DEFAULT_SPHERES));
        if (!d.habits) d.habits = [];
        if (!d.openedDays) d.openedDays = [];
        return d;
    } catch {
        return { spheres: JSON.parse(JSON.stringify(DEFAULT_SPHERES)), habits: [], openedDays: [] };
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    renderAll();
}

const ui = {
    statsDays: document.getElementById('stat-days'),
    statsProgress: document.getElementById('stat-progress'),
    statsAvg: document.getElementById('stat-avg'),
    statsStreak: document.getElementById('stat-streak'),
    dashboardSpheres: document.getElementById('dashboard-spheres'),
    dashboardHabits: document.getElementById('dashboard-habits'),
    settingsModal: document.getElementById('settings-modal'),
    settingsSpheres: document.getElementById('settings-spheres'),
    greetingText: document.getElementById('greeting-text'),
    currentDate: document.getElementById('current-date'),
    canvas: document.getElementById('balance-wheel-canvas')
};

function init() {
    updateGreeting();
    renderAll();
    setupNavigation();
    setupEventListeners();
    
    setInterval(updateGreeting, 60000);
}

function updateGreeting() {
    const hours = new Date().getHours();
    let greeting = 'Добрый вечер';
    if (hours >= 5 && hours < 12) greeting = 'Доброе утро';
    else if (hours >= 12 && hours < 18) greeting = 'Добрый день';
    
    if (ui.greetingText) ui.greetingText.textContent = `${greeting}, Максим`;
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    if (ui.currentDate) ui.currentDate.textContent = new Date().toLocaleDateString('ru-RU', options);
}

function renderAll() {
    renderStats();
    renderSpheres();
    renderHabits();
    drawWheel();
}

function renderStats() {
    if (!ui.statsDays) return;
    const days = data.openedDays.length;
    ui.statsDays.textContent = days;
    ui.statsProgress.textContent = ((days / TOTAL_DAYS) * 100).toFixed(4) + '%';
    
    const totalScore = data.spheres.reduce((sum, s) => sum + s.score, 0);
    const avg = (totalScore / data.spheres.length).toFixed(1);
    ui.statsAvg.textContent = avg;
    ui.statsStreak.textContent = days;
}

function renderSpheres() {
    if (!ui.dashboardSpheres) return;
    ui.dashboardSpheres.innerHTML = '';
    data.spheres.forEach(s => {
        const item = document.createElement('div');
        item.className = 'sphere-item';
        item.innerHTML = `
            <span class="sphere-name">${s.name}</span>
            <div class="level-track">
                <div class="level-fill" style="width: ${s.score * 10}%; background: ${s.color}"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:11px; color:var(--text-muted);">
                <span>Уровень ${s.score}</span>
                <span>10</span>
            </div>
        `;
        ui.dashboardSpheres.appendChild(item);
    });
}

function renderHabits() {
    if (!ui.dashboardHabits) return;
    ui.dashboardHabits.innerHTML = '';
    data.habits.forEach(h => {
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.innerHTML = `
            <div class="checkbox"></div>
            <div class="habit-info">
                <div class="h-name">${h.name}</div>
                <div class="h-streak">🔥 Стрик: 0</div>
            </div>
        `;
        ui.dashboardHabits.appendChild(card);
    });
}

function drawWheel() {
    if (!ui.canvas || ui.canvas.offsetParent === null) return;
    const ctx = ui.canvas.getContext('2d');
    const cx = ui.canvas.width / 2;
    const cy = ui.canvas.height / 2;
    const radius = Math.min(cx, cy) - 40;
    const slices = data.spheres.length;
    const sliceAngle = (Math.PI * 2) / slices;

    ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 10; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (radius / 10) * i, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.beginPath();
    data.spheres.forEach((s, i) => {
        const angle = i * sliceAngle - Math.PI / 2;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        const lx = cx + Math.cos(angle) * (radius + 25);
        const ly = cy + Math.sin(angle) * (radius + 25);
        ctx.fillText(s.name, lx, ly);
    });
    ctx.stroke();

    ctx.beginPath();
    data.spheres.forEach((s, i) => {
        const angle = i * sliceAngle - Math.PI / 2;
        const r = (radius / 10) * s.score;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(192, 132, 252, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'var(--accent)';
    ctx.lineWidth = 2;
    ctx.stroke();

    data.spheres.forEach((s, i) => {
        const angle = i * sliceAngle - Math.PI / 2;
        const r = (radius / 10) * s.score;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 4, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
}

function setupNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const pageId = item.dataset.page;
            document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
            const targetPage = document.getElementById(`page-${pageId}`);
            if (targetPage) targetPage.classList.remove('hidden');
            
            if (pageId === 'analytics') {
                setTimeout(drawWheel, 50);
            }
        };
    });
}

function setupEventListeners() {
    const openBtn = document.getElementById('open-settings');
    const closeBtn = document.getElementById('close-settings');
    const saveBtn = document.getElementById('save-spheres');
    const addHabitBtn = document.getElementById('add-habit');
    const startDayBtn = document.getElementById('start-day-action');

    if (openBtn) openBtn.onclick = () => { renderSettings(); ui.settingsModal.classList.remove('hidden'); };
    if (closeBtn) closeBtn.onclick = () => ui.settingsModal.classList.add('hidden');
    
    if (startDayBtn) startDayBtn.onclick = () => {
        const today = new Date().toISOString().split('T')[0];
        if (!data.openedDays.includes(today)) {
            data.openedDays.push(today);
            saveData();
            alert('День начат!');
        } else {
            alert('День уже начат!');
        }
    };
    
    if (saveBtn) saveBtn.onclick = () => {
        document.querySelectorAll('.s-edit-row').forEach(row => {
            const idx = row.dataset.idx;
            data.spheres[idx].name = row.querySelector('.e-name').value;
            data.spheres[idx].score = parseInt(row.querySelector('.e-score').value) || 0;
            data.spheres[idx].color = row.querySelector('.e-color').value;
        });
        saveData();
        ui.settingsModal.classList.add('hidden');
    };
    
    if (addHabitBtn) addHabitBtn.onclick = () => {
        const input = document.getElementById('new-habit-name');
        const n = input.value.trim();
        if (!n) return;
        data.habits.push({ id: 'h_' + Date.now(), name: n });
        input.value = '';
        saveData();
        renderSettings();
    };
}

function renderSettings() {
    if (!ui.settingsSpheres) return;
    ui.settingsSpheres.innerHTML = '';
    data.spheres.forEach((s, i) => {
        const row = document.createElement('div');
        row.className = 's-edit-row';
        row.dataset.idx = i;
        row.style = 'display:grid; grid-template-columns:1fr 60px 40px; gap:8px; margin-bottom:8px;';
        row.innerHTML = `
            <input type="text" class="e-name" value="${s.name}" style="background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; padding:8px; border-radius:8px;">
            <input type="number" class="e-score" value="${s.score}" min="0" max="10" style="background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; padding:8px; border-radius:8px;">
            <input type="color" class="e-color" value="${s.color}" style="width:100%; height:100%; border:none; background:none; cursor:pointer;">
        `;
        ui.settingsSpheres.appendChild(row);
    });
}

init();
