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
const STORAGE_KEY = 'lifeRPG_Dashboard_v3';

let data = loadData();

function loadData() {
    try {
        const d = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        if (!d.spheres || d.spheres.length === 0) d.spheres = JSON.parse(JSON.stringify(DEFAULT_SPHERES));
        if (!d.habits) d.habits = [];
        if (!d.openedDays) d.openedDays = [];
        d.habits = d.habits.map(h => ({
            ...h,
            done: h.done || false,
            streak: h.streak || 0
        }));
        return d;
    } catch {
        return { spheres: JSON.parse(JSON.stringify(DEFAULT_SPHERES)), habits: [], openedDays: [] };
    }
}

function saveData(opts = {}) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (opts.skipRender) return;
    renderHeader();
    renderSpheres();
    renderHabits();
    if (opts.wheel) drawWheel();
}

const ui = {
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

    const today = new Date().toLocaleDateString('en-CA');
    if (data.lastVisit !== today) {
        data.habits.forEach(h => {
            if (!h.done) h.streak = 0;
            h.done = false;
        });
        data.lastVisit = today;
        saveData({ wheel: false });
    }

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
    renderHeader();
    renderSpheres();
    renderHabits();
    drawWheel();
}

function renderHeader() {
    const totalScore = data.spheres.reduce((sum, s) => sum + s.score, 0);
    const avg = (totalScore / data.spheres.length).toFixed(1);
    const doneTodayCount = data.habits.filter(h => h.done).length;
    const totalHabits = data.habits.length;

    const statsEl = document.getElementById('header-stats');
    if (!statsEl) return;
    statsEl.innerHTML = `
        <span>⚡ Средний балл: <b>${avg}</b></span>
        <span>✅ Привычки сегодня: <b>${doneTodayCount}/${totalHabits}</b></span>
    `;
}

function renderSpheres() {
    if (!ui.dashboardSpheres) return;
    ui.dashboardSpheres.innerHTML = '';
    data.spheres.forEach(s => {
        const item = document.createElement('div');
        item.className = 'sphere-item';
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:16px;">
                <span class="sphere-name" style="margin-bottom:0;">${s.name}</span>
                <span style="font-size:32px; font-weight:800; color:var(--text-main); line-height:1;">${s.score}</span>
            </div>
            <div class="level-track">
                <div class="level-fill" style="width: ${s.score * 10}%; background: ${s.color}"></div>
            </div>
        `;
        ui.dashboardSpheres.appendChild(item);
    });
}

function renderHabits() {
    if (!ui.dashboardHabits) return;
    ui.dashboardHabits.innerHTML = '';
    data.habits.forEach((h) => {
        const card = document.createElement('div');
        card.className = `habit-card ${h.done ? 'done' : ''}`;
        card.innerHTML = `
            <div class="checkbox"></div>
            <div class="habit-info">
                <div class="h-name">${h.name}</div>
                <div class="h-streak-badge">
                    <span>🔥</span>
                    <span>${h.streak || 0}</span>
                </div>
            </div>
        `;
        card.onclick = () => {
            h.done = !h.done;
            if (h.done) h.streak = (h.streak || 0) + 1;
            else h.streak = Math.max(0, (h.streak || 0) - 1);
            saveData({ wheel: false });
        };
        ui.dashboardHabits.appendChild(card);
    });
}

function drawWheel() {
    if (!ui.canvas || ui.canvas.offsetParent === null) return;
    const ctx = ui.canvas.getContext('2d');
    const size = 400;
    ui.canvas.width = size;
    ui.canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 130;
    const slices = data.spheres.length;
    const sliceAngle = (Math.PI * 2) / slices;
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 10; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (radius / 10) * i, 0, Math.PI * 2);
        ctx.stroke();
    }
    data.spheres.forEach((s, i) => {
        const angle = i * sliceAngle - Math.PI / 2;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelDist = radius + 35;
        const lx = cx + Math.cos(angle) * labelDist;
        const ly = cy + Math.sin(angle) * labelDist;
        if (s.name.length > 10 && s.name.includes(' ')) {
            const parts = s.name.split(' ');
            ctx.fillText(parts[0], lx, ly - 7);
            ctx.fillText(parts.slice(1).join(' '), lx, ly + 7);
        } else {
            ctx.fillText(s.name, lx, ly);
        }
    });
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
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.stroke();
    data.spheres.forEach((s, i) => {
        const angle = i * sliceAngle - Math.PI / 2;
        const r = (radius / 10) * s.score;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 4, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
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
            if (pageId === 'analytics') setTimeout(drawWheel, 50);
        };
    });
}

function setupEventListeners() {
    const openBtn = document.getElementById('open-settings');
    const closeBtn = document.getElementById('close-settings');
    const saveBtn = document.getElementById('save-spheres');
    const addHabitBtn = document.getElementById('add-habit');
    const exportBtn = document.getElementById('export-btn');
    const importInput = document.getElementById('import-input');

    if (openBtn) openBtn.onclick = () => {
        ui.settingsModal.classList.remove('hidden');
        requestAnimationFrame(() => renderSettings());
    };
    if (closeBtn) closeBtn.onclick = () => ui.settingsModal.classList.add('hidden');

    if (saveBtn) saveBtn.onclick = () => {
        document.querySelectorAll('.s-edit-row').forEach(row => {
            const idx = row.dataset.idx;
            data.spheres[idx].name = row.querySelector('.e-name').value;
            data.spheres[idx].score = parseInt(row.querySelector('.e-score').value) || 0;
            data.spheres[idx].color = row.querySelector('.e-color').value;
        });
        saveData({ wheel: true });
        ui.settingsModal.classList.add('hidden');
    };

    if (addHabitBtn) addHabitBtn.onclick = () => {
        const input = document.getElementById('new-habit-name');
        const n = input.value.trim();
        if (!n) return;
        data.habits.push({ id: 'h_' + Date.now(), name: n, done: false, streak: 0 });
        input.value = '';
        saveData({ wheel: false });
        renderSettings();
    };

    if (exportBtn) exportBtn.onclick = exportData;
    if (importInput) importInput.addEventListener('change', e => {
        importData(e.target.files[0]);
        e.target.value = '';
    });
}

function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-life-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

async function importData(file) {
    if (!file) return;
    try {
        const text = await file.text();
        data = JSON.parse(text);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        renderAll();
        renderSettings();
    } catch {
        alert('Ошибка: файл повреждён');
    }
}

function renderSettings() {
    if (!ui.settingsSpheres) return;
    ui.settingsSpheres.innerHTML = '';
    data.spheres.forEach((s, i) => {
        const row = document.createElement('div');
        row.className = 's-edit-row';
        row.dataset.idx = i;
        row.style = 'display:grid; grid-template-columns:1fr 60px 40px; gap:8px; margin-bottom:12px;';
        row.innerHTML = `
            <input type="text" class="e-name" value="${s.name}" style="background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; padding:12px; border-radius:12px;">
            <input type="number" class="e-score" value="${s.score}" min="0" max="10" style="background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; padding:12px; border-radius:12px;">
            <input type="color" class="e-color" value="${s.color}" style="width:100%; height:100%; border:none; background:none; cursor:pointer;">
        `;
        ui.settingsSpheres.appendChild(row);
    });

    const habitsContainer = document.getElementById('settings-habits');
    if (!habitsContainer) return;
    habitsContainer.innerHTML = '<p style="color:var(--text-muted); font-size:13px; margin-bottom:12px;">Привычки</p>';

    if (data.habits.length === 0) {
        habitsContainer.innerHTML += '<p style="color:var(--text-muted); font-size:13px;">Нет привычек</p>';
        return;
    }

    data.habits.forEach((h, i) => {
        const row = document.createElement('div');
        row.style = 'display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:12px; padding:12px 16px; margin-bottom:8px;';
        row.innerHTML = `
            <span style="color:white; font-size:14px;">${h.name}</span>
            <button style="background:none; border:none; color:#555; font-size:20px; cursor:pointer; line-height:1; padding:4px 8px; border-radius:6px; transition:color 0.2s;" onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='#555'">−</button>
        `;
        row.querySelector('button').addEventListener('click', () => deleteHabit(i));
        habitsContainer.appendChild(row);
    });
}

function deleteHabit(index) {
    data.habits.splice(index, 1);
    saveData({ wheel: false });
    renderSettings();
}

init();
