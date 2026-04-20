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

const STORAGE_KEY = 'lifeRPG_Dashboard_v3';

let data = loadData();

function loadData() {
    try {
        const d = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        if (!d.spheres || d.spheres.length === 0) d.spheres = JSON.parse(JSON.stringify(DEFAULT_SPHERES));
        if (!d.habits) d.habits = [];
        if (!d.openedDays) d.openedDays = [];
        if (!d.sphereChecks) d.sphereChecks = {};
        if (!d.habitChecks) d.habitChecks = {};
        d.habits = d.habits.map(h => ({
            ...h,
            done: h.done || false,
            streak: h.streak || 0,
            description: h.description || ''
        }));
        return d;
    } catch {
        return {
            spheres: JSON.parse(JSON.stringify(DEFAULT_SPHERES)),
            habits: [],
            openedDays: [],
            sphereChecks: {},
            habitChecks: {}
        };
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
        const yesterday = data.lastVisit;

        if (yesterday && data.habitChecks && data.habitChecks[yesterday]) {
            const doneIds = new Set(data.habitChecks[yesterday]);
            data.habits.forEach(h => {
                if (doneIds.has(h.id)) h.streak = (h.streak || 0) + 1;
                else h.streak = 0;
            });
        } else {
            data.habits.forEach(h => h.streak = h.streak || 0);
        }

        data.sphereChecks[today] = [];
        data.habitChecks[today] = [];
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
    renderLifeCounters();
    renderHeader();
    renderSpheres();
    renderHabits();
    drawWheel();
}

function renderHeader() {
    const statsEl = document.getElementById('header-stats');
    if (!statsEl) return;
    statsEl.innerHTML = '';
}

function renderLifeCounters() {
    const el = document.getElementById('life-counters');
    if (!el) return;

    const now = new Date();

    const nextBirthday = new Date('1998-12-26T00:00:00');
    nextBirthday.setFullYear(now.getFullYear());
    if (nextBirthday <= now) nextBirthday.setFullYear(now.getFullYear() + 1);
    const daysToNextBirthday = Math.ceil((nextBirthday - now) / 86400000);
    const nextAge = nextBirthday.getFullYear() - 1998;

    const milestones = [
        { age: 30, color: '#4ade80' },
        { age: 40, color: '#facc15' },
        { age: 50, color: '#f472b6' },
    ];

    const birthdayHtml = `
        <div style="display:flex; flex-direction:column; align-items:flex-end; padding:8px 16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px;">
            <span style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:700; margin-bottom:3px;">до ${nextAge} лет</span>
            <span style="font-size:16px; font-weight:800; color:#fff;">🎂 ${daysToNextBirthday} дн.</span>
        </div>
    `;

    const milestonesHtml = milestones.map(m => {
        const target = new Date('1998-12-26T00:00:00');
        target.setFullYear(target.getFullYear() + m.age);
        const daysLeft = Math.max(0, Math.ceil((target - now) / 86400000));
        return `
            <div style="display:flex; flex-direction:column; align-items:flex-end; padding:8px 16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px;">
                <span style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:700; margin-bottom:3px;">до ${m.age} лет</span>
                <span style="font-size:16px; font-weight:800; color:${m.color};">${daysLeft.toLocaleString('ru-RU')} дн.</span>
            </div>
        `;
    }).join('');

    el.innerHTML = birthdayHtml + milestonesHtml;
}

function renderSpheres() {
    if (!ui.dashboardSpheres) return;
    ui.dashboardSpheres.innerHTML = '';

    const today = new Date().toLocaleDateString('en-CA');
    const todayChecks = data.sphereChecks[today] || [];

    data.spheres.forEach(s => {
        const isChecked = todayChecks.includes(s.id);
        const item = document.createElement('div');
        item.className = 'sphere-item' + (isChecked ? ' sphere-checked' : '');
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:16px;">
                <span class="sphere-name" style="margin-bottom:0;">${s.name}</span>
                <span style="font-size:32px; font-weight:800; color:var(--text-main); line-height:1;">${s.score}</span>
            </div>
            <div class="level-track">
                <div class="level-fill" style="width:${s.score * 10}%; background:${s.color}"></div>
            </div>
        `;
        item.onclick = () => {
            const today = new Date().toLocaleDateString('en-CA');
            if (!data.sphereChecks[today]) data.sphereChecks[today] = [];
            if (data.sphereChecks[today].includes(s.id)) return;
            data.sphereChecks[today].push(s.id);
            saveData({ wheel: false });
        };
        ui.dashboardSpheres.appendChild(item);
    });
}

function renderHabits() {
    if (!ui.dashboardHabits) return;
    ui.dashboardHabits.innerHTML = '';

    const today = new Date().toLocaleDateString('en-CA');
    const todayChecks = data.habitChecks[today] || [];

    data.habits.forEach((h) => {
        const isCheckedToday = todayChecks.includes(h.id);
        const card = document.createElement('div');
        card.className = `habit-card ${isCheckedToday ? 'done' : ''}`;
        card.innerHTML = `
            <div class="checkbox"></div>
            <div class="habit-info">
                <div>
                    <div class="h-name">${h.name}</div>
                    ${h.description ? `<div class="h-desc">${h.description}</div>` : ''}
                </div>
                <div class="h-streak-badge">
                    <span>🔥</span>
                    <span>${h.streak || 0}</span>
                </div>
            </div>
        `;
        card.onclick = () => {
            const today = new Date().toLocaleDateString('en-CA');
            if (!data.habitChecks[today]) data.habitChecks[today] = [];
            if (data.habitChecks[today].includes(h.id)) return;
            data.habitChecks[today].push(h.id);
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
    const cx = size / 2, cy = size / 2, radius = 130;
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
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
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

// ─── Sync helpers ────────────────────────────────────────────────────────────

function getSyncCredentials() {
    const token = document.getElementById('sync-token')?.value.trim()
        || localStorage.getItem('sync_token') || '';
    const gistId = document.getElementById('sync-gist-id')?.value.trim()
        || localStorage.getItem('sync_gist_id') || '';
    return { token, gistId };
}

function saveSyncCredentials() {
    const token = document.getElementById('sync-token')?.value.trim();
    const gistId = document.getElementById('sync-gist-id')?.value.trim();
    if (token) localStorage.setItem('sync_token', token);
    if (gistId) localStorage.setItem('sync_gist_id', gistId);
}

function setSyncStatus(msg, color = 'var(--text-muted)') {
    const el = document.getElementById('sync-status');
    if (el) { el.textContent = msg; el.style.color = color; }
}

async function exportData() {
    saveSyncCredentials();
    const { token, gistId } = getSyncCredentials();
    if (!token || !gistId) { setSyncStatus('Введи токен и Gist ID', '#f87171'); return; }
    setSyncStatus('Сохраняю...');
    try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: { 'project-life.json': { content: JSON.stringify(data, null, 2) } }
            })
        });
        if (res.ok) setSyncStatus('✓ Сохранено в облако', '#4ade80');
        else setSyncStatus('Ошибка сохранения', '#f87171');
    } catch {
        setSyncStatus('Нет соединения', '#f87171');
    }
}

async function importData() {
    saveSyncCredentials();
    const { token, gistId } = getSyncCredentials();
    if (!token || !gistId) { setSyncStatus('Введи токен и Gist ID', '#f87171'); return; }
    setSyncStatus('Загружаю...');
    try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        const json = await res.json();
        const content = json.files?.['project-life.json']?.content;
        if (!content) { setSyncStatus('Файл пустой', '#f87171'); return; }
        data = JSON.parse(content);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        renderAll();
        renderSettings();
        setSyncStatus('✓ Загружено', '#4ade80');
    } catch {
        setSyncStatus('Ошибка загрузки', '#f87171');
    }
}

// ─── Event listeners ─────────────────────────────────────────────────────────

function setupEventListeners() {
    const openBtn = document.getElementById('open-settings');
    const closeBtn = document.getElementById('close-settings');
    const saveBtn = document.getElementById('save-spheres');
    const addHabitBtn = document.getElementById('add-habit');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const resetTodayBtn = document.getElementById('reset-today');

    if (openBtn) openBtn.onclick = () => {
        ui.settingsModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            renderSettings();
            const tokenInput = document.getElementById('sync-token');
            const gistInput = document.getElementById('sync-gist-id');
            if (tokenInput) tokenInput.value = localStorage.getItem('sync_token') || '';
            if (gistInput) gistInput.value = localStorage.getItem('sync_gist_id') || '';
        });
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
        data.habits.push({ id: 'h_' + Date.now(), name: n, done: false, streak: 0, description: '' });
        input.value = '';
        saveData({ wheel: false });
        renderSettings();
    };

    if (exportBtn) exportBtn.onclick = exportData;
    if (importBtn) importBtn.onclick = importData;

    if (resetTodayBtn) resetTodayBtn.onclick = () => {
        const today = new Date().toLocaleDateString('en-CA');
        data.sphereChecks[today] = [];
        data.habitChecks[today] = [];
        saveData({ wheel: false });
    };
}

// ─── Settings ────────────────────────────────────────────────────────────────

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
        row.style = 'display:flex; flex-direction:column; gap:6px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:12px; padding:10px 12px; margin-bottom:8px;';
        row.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <input type="text" data-habit-name="${i}" value="${h.name}" placeholder="Название привычки"
                    style="flex:1; background:transparent; border:none; color:white; font-size:14px; outline:none;">
                <button data-habit-del="${i}"
                    style="background:none; border:none; color:#555; font-size:18px; cursor:pointer; line-height:1; padding:2px 6px; border-radius:6px; transition:background 0.15s, color 0.15s;">
                    −
                </button>
            </div>
            <textarea data-habit-desc="${i}" placeholder="Зачем я это делаю (описание)"
                style="width:100%; min-height:40px; resize:vertical; background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:8px; padding:6px 8px; color:var(--text-muted); font-size:13px; outline:none;"></textarea>
        `;
        habitsContainer.appendChild(row);

        const nameInput = row.querySelector(`[data-habit-name="${i}"]`);
        const descInput = row.querySelector(`[data-habit-desc="${i}"]`);
        const delBtn = row.querySelector(`[data-habit-del="${i}"]`);

        nameInput.value = h.name;
        descInput.value = h.description || '';

        nameInput.addEventListener('input', () => {
            data.habits[i].name = nameInput.value;
            saveData({ wheel: false, skipRender: true });
        });
        descInput.addEventListener('input', () => {
            data.habits[i].description = descInput.value;
            saveData({ wheel: false, skipRender: true });
        });
        delBtn.addEventListener('mouseover', () => {
            delBtn.style.color = '#f87171';
            delBtn.style.background = 'rgba(248,113,113,0.08)';
        });
        delBtn.addEventListener('mouseout', () => {
            delBtn.style.color = '#555';
            delBtn.style.background = 'transparent';
        });
        delBtn.addEventListener('click', () => deleteHabit(i));
    });
}

function deleteHabit(index) {
    data.habits.splice(index, 1);
    saveData({ wheel: false });
    renderSettings();
}

init();
