const DEFAULT_SPHERES = [
    { id: 'trading', name: '📈 Трейдинг', color: '#facc15', score: 8 },
    { id: 'health', name: '💪 Здоровье', color: '#4ade80', score: 7 },
    { id: 'creative', name: '🎨 Творчество', color: '#f472b6', score: 6 },
    { id: 'hobby', name: '🎮 Хобби', color: '#60a5fa', score: 5 },
    { id: 'looks', name: '🪞 Внешний вид', color: '#e879f9', score: 7 },
    { id: 'family', name: '👨‍👩‍👧 Семья', color: '#fb7185', score: 9 },
    { id: 'social', name: '🤝 Знакомства', color: '#34d399', score: 6 },
    { id: 'inner', name: '🧘 Внутренний порядок', color: '#a78bfa', score: 8 },
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
        if (!d.sphereProgress) d.sphereProgress = {};
        if (!d.habitHistory) d.habitHistory = {};
        return d;
    } catch {
        return { spheres: JSON.parse(JSON.stringify(DEFAULT_SPHERES)), habits: [], openedDays: [], sphereProgress: {}, habitHistory: {} };
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateUI();
}

function getTodayStr() {
    return new Date().toLocaleDateString('en-CA');
}

/* UI Elements Mapping */
const ui = {
    statDays: document.getElementById('stat-days'),
    statProgress: document.getElementById('stat-progress'),
    statAvg: document.getElementById('stat-avg'),
    statStreak: document.getElementById('stat-streak'),
    spheresGrid: document.getElementById('dashboard-spheres'),
    habitsList: document.getElementById('dashboard-habits'),
    settingsModal: document.getElementById('settings-modal'),
    settingsSpheres: document.getElementById('settings-spheres'),
    settingsHabits: document.getElementById('settings-habits'),
    currentDate: document.getElementById('current-date')
};

function init() {
    setupDate();
    updateUI();
    setupEventListeners();
}

function setupDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    ui.currentDate.innerText = new Date().toLocaleDateString('ru-RU', options);
}

function updateUI() {
    // Stats
    const days = data.openedDays.length;
    ui.statDays.innerText = days.toLocaleString();
    ui.statProgress.innerText = ((days / TOTAL_DAYS) * 100).toFixed(4) + '%';
    
    const avg = data.spheres.reduce((acc, s) => acc + (s.score || 0), 0) / data.spheres.length;
    ui.statAvg.innerText = avg.toFixed(1);

    // Calc Streak
    let streak = 0;
    const habitIds = data.habits.map(h => h.id);
    if (habitIds.length > 0) {
        let curr = new Date();
        while (true) {
            const dStr = curr.toLocaleDateString('en-CA');
            const doneAtDate = data.habitHistory[dStr] || [];
            const allDone = habitIds.every(id => doneAtDate.includes(id));
            if (allDone && habitIds.length > 0) {
                streak++;
                curr.setDate(curr.getDate() - 1);
            } else {
                if (dStr === getTodayStr()) { curr.setDate(curr.getDate() - 1); continue; }
                break;
            }
        }
    }
    ui.statStreak.innerText = streak;

    renderSpheres();
    renderHabits();
}

function renderSpheres() {
    ui.spheresGrid.innerHTML = '';
    const today = getTodayStr();
    const improved = data.sphereProgress[today] || [];

    data.spheres.forEach(s => {
        const isActive = improved.includes(s.id);
        const card = document.createElement('div');
        card.className = `sphere-item`;
        if (isActive) card.style.borderColor = s.color;
        
        card.innerHTML = `
            <span class="sphere-name">${s.name}</span>
            <div class="level-track">
                <div class="level-fill" style="width: ${(s.score || 0) * 10}%; background: ${s.color}"></div>
            </div>
            <span style="font-size:10px; color:var(--text-muted); margin-top:4px; display:block;">Уровень ${s.score || 0}</span>
        `;
        card.onclick = () => toggleSphere(s.id);
        ui.spheresGrid.appendChild(card);
    });
}

function toggleSphere(id) {
    const today = getTodayStr();
    if (!data.sphereProgress[today]) data.sphereProgress[today] = [];
    const idx = data.sphereProgress[today].indexOf(id);
    if (idx > -1) data.sphereProgress[today].splice(idx, 1);
    else data.sphereProgress[today].push(id);
    saveData();
}

function renderHabits() {
    ui.habitsList.innerHTML = '';
    const today = getTodayStr();
    const done = data.habitHistory[today] || [];

    if (data.habits.length === 0) {
        ui.habitsList.innerHTML = '<p style="color:var(--text-muted); font-size:14px;">Нет активных привычек</p>';
        return;
    }

    data.habits.forEach(h => {
        const isDone = done.includes(h.id);
        const card = document.createElement('div');
        card.className = `habit-card ${isDone ? 'done' : ''}`;
        card.innerHTML = `
            <div class="checkbox">${isDone ? '✓' : ''}</div>
            <div class="habit-info">
                <p class="h-name">${h.name}</p>
                <p style="font-size:11px; color:var(--text-muted);">${h.purpose || ''}</p>
            </div>
        `;
        card.onclick = () => toggleHabit(h.id);
        ui.habitsList.appendChild(card);
    });
}

function toggleHabit(id) {
    const today = getTodayStr();
    if (!data.habitHistory[today]) data.habitHistory[today] = [];
    const idx = data.habitHistory[today].indexOf(id);
    if (idx > -1) data.habitHistory[today].splice(idx, 1);
    else data.habitHistory[today].push(id);
    saveData();
}

function setupEventListeners() {
    document.getElementById('open-settings').onclick = () => {
        renderSettings();
        ui.settingsModal.classList.remove('hidden');
    };
    document.getElementById('close-settings').onclick = () => ui.settingsModal.classList.add('hidden');
    
    document.getElementById('start-day-action').onclick = () => {
        const today = getTodayStr();
        if (!data.openedDays.includes(today)) {
            data.openedDays.push(today);
            saveData();
            alert('Новый день начат! Удачи, Игрок.');
        } else {
            alert('День уже был начат ранее.');
        }
    };

    document.getElementById('save-spheres').onclick = () => {
        const rows = document.querySelectorAll('.s-edit-row');
        rows.forEach(row => {
            const idx = row.dataset.idx;
            data.spheres[idx].name = row.querySelector('.e-name').value;
            data.spheres[idx].score = parseInt(row.querySelector('.e-score').value) || 0;
            data.spheres[idx].color = row.querySelector('.e-color').value;
        });
        saveData();
        alert('Сферы обновлены');
    };

    document.getElementById('add-habit').onclick = () => {
        const name = document.getElementById('new-habit-name').value.trim();
        const desc = document.getElementById('new-habit-desc').value.trim();
        if (!name) return;
        data.habits.push({ id: 'h_' + Date.now(), name, purpose: desc });
        document.getElementById('new-habit-name').value = '';
        document.getElementById('new-habit-desc').value = '';
        saveData();
        renderSettings();
    };

    document.getElementById('export-btn').onclick = () => {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `life_rpg_backup_${getTodayStr()}.json`;
        a.click();
    };

    document.getElementById('import-trigger').onclick = () => document.getElementById('import-file').click();
    document.getElementById('import-file').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                data = JSON.parse(ev.target.result);
                saveData();
                location.reload();
            } catch { alert('Ошибка формата файла'); }
        };
        reader.readAsText(file);
    };

    document.getElementById('danger-reset').onclick = () => {
        if (confirm('ВНИМАНИЕ: Все данные будут удалены безвозвратно. Продолжить?')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    };
}

function renderSettings() {
    ui.settingsSpheres.innerHTML = '';
    data.spheres.forEach((s, i) => {
        const row = document.createElement('div');
        row.className = 's-edit-row';
        row.dataset.idx = i;
        row.style = 'display:grid; grid-template-columns:1fr 80px 50px; gap:var(--p8); align-items:center;';
        row.innerHTML = `
            <input type="text" class="e-name" value="${s.name}" style="background:var(--bg-main); border:1px solid var(--border); padding:var(--p8); color:white; border-radius:var(--p8);">
            <input type="number" class="e-score" value="${s.score || 0}" min="0" max="10" style="background:var(--bg-main); border:1px solid var(--border); padding:var(--p8); color:white; border-radius:var(--p8);">
            <input type="color" class="e-color" value="${s.color}" style="width:100%; height:34px; border:none; background:none; cursor:pointer;">
        `;
        ui.settingsSpheres.appendChild(row);
    });

    ui.settingsHabits.innerHTML = '';
    data.habits.forEach((h, i) => {
        const item = document.createElement('div');
        item.style = 'display:flex; justify-content:space-between; align-items:center; padding:var(--p12); background:var(--bg-hover); border-radius:var(--p12); margin-bottom:var(--p8); border:1px solid var(--border);';
        item.innerHTML = `
            <div>
                <p style="font-weight:600; font-size:14px;">${h.name}</p>
                <p style="font-size:11px; color:var(--text-muted);">${h.purpose || ''}</p>
            </div>
            <button onclick="deleteHabit(${i})" style="background:none; border:none; color:#f87171; cursor:pointer; font-size:14px;">🗑️</button>
        `;
        ui.settingsHabits.appendChild(item);
    });
}

window.deleteHabit = (i) => {
    data.habits.splice(i, 1);
    saveData();
    renderSettings();
};

init();
