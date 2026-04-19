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
const START_DATE = `${START_YEAR}-01-01`;
const HOLD_MS = 2000;
const STORAGE_KEY = 'lifeRPG_Premium';

/* State & Data */
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
    updateStats();
}

function getTodayStr() {
    return new Date().toLocaleDateString('en-CA');
}

/* UI Logic */
const el = {
    overlay: document.getElementById('settings-overlay'),
    spheresList: document.getElementById('spheres-container'),
    habitsList: document.getElementById('habits-container'),
    daysLived: document.getElementById('days-lived'),
    progress: document.getElementById('life-progress'),
    avgLevel: document.getElementById('avg-level'),
    startBtn: document.getElementById('start-day-btn'),
    spheresEdit: document.getElementById('settings-spheres-list'),
    habitsEdit: document.getElementById('settings-habits-list')
};

function init() {
    renderDashboard();
    setupEvents();
    updateStats();
}

function updateStats() {
    const days = data.openedDays.length;
    if (el.daysLived) el.daysLived.innerText = days;
    if (el.progress) el.progress.innerText = ((days / TOTAL_DAYS) * 100).toFixed(4) + '%';
    
    const avg = data.spheres.reduce((acc, s) => acc + (s.score || 0), 0) / data.spheres.length;
    if (el.avgLevel) el.avgLevel.innerText = (avg * 10).toFixed(1) + '%';
}

function renderDashboard() {
    // Spheres
    el.spheresList.innerHTML = '';
    const today = getTodayStr();
    const improved = data.sphereProgress[today] || [];
    
    data.spheres.forEach(s => {
        const active = improved.includes(s.id);
        const card = document.createElement('div');
        card.className = `sphere-card ${active ? 'active' : ''}`;
        card.style.setProperty('--sphere-color', s.color);
        card.innerHTML = `
            <div class="sphere-header">
                <span class="sphere-name">${s.name}</span>
                <span class="sphere-score">Lv ${s.score || 0}</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${(s.score || 0) * 10}%"></div>
            </div>
        `;
        card.onclick = () => toggleSphere(s.id);
        el.spheresList.appendChild(card);
    });

    // Habits
    el.habitsList.innerHTML = '';
    const done = data.habitHistory[today] || [];
    
    if (data.habits.length === 0) {
        el.habitsList.innerHTML = '<div style="color: var(--text-dim)">Привычки не добавлены. Зайди в настройки ⚙️</div>';
    } else {
        data.habits.forEach(h => {
            const isDone = done.includes(h.id);
            const row = document.createElement('div');
            row.className = `habit-row ${isDone ? 'done' : ''}`;
            row.innerHTML = `
                <div class="habit-checkbox">${isDone ? '✓' : ''}</div>
                <div class="habit-text">
                    <span class="habit-name">${h.name}</span>
                    <span class="habit-purpose">${h.purpose || ''}</span>
                </div>
            `;
            row.onclick = () => toggleHabit(h.id);
            el.habitsList.appendChild(row);
        });
    }
}

function toggleSphere(id) {
    const today = getTodayStr();
    if (!data.sphereProgress[today]) data.sphereProgress[today] = [];
    const idx = data.sphereProgress[today].indexOf(id);
    if (idx > -1) data.sphereProgress[today].splice(idx, 1);
    else data.sphereProgress[today].push(id);
    saveData();
    renderDashboard();
}

function toggleHabit(id) {
    const today = getTodayStr();
    if (!data.habitHistory[today]) data.habitHistory[today] = [];
    const idx = data.habitHistory[today].indexOf(id);
    if (idx > -1) data.habitHistory[today].splice(idx, 1);
    else data.habitHistory[today].push(id);
    saveData();
    renderDashboard();
}

function setupEvents() {
    document.getElementById('settings-open').onclick = () => {
        renderSettings();
        el.overlay.classList.remove('hidden');
    };
    
    document.getElementById('settings-close').onclick = () => el.overlay.classList.add('hidden');

    document.getElementById('settings-save').onclick = () => {
        const rows = document.querySelectorAll('.edit-row');
        rows.forEach(row => {
            const idx = row.dataset.idx;
            data.spheres[idx].name = row.querySelector('.edit-name').value;
            data.spheres[idx].score = parseInt(row.querySelector('.edit-score').value) || 0;
            data.spheres[idx].color = row.querySelector('.edit-color').value;
        });
        saveData();
        renderDashboard();
        alert('Сохранено!');
    };

    document.getElementById('add-habit-btn').onclick = () => {
        const name = document.getElementById('new-habit-input').value.trim();
        const purp = document.getElementById('new-habit-purpose').value.trim();
        if (!name) return;
        data.habits.push({ id: 'h_' + Date.now(), name, purpose: purp });
        document.getElementById('new-habit-input').value = '';
        document.getElementById('new-habit-purpose').value = '';
        saveData();
        renderSettings();
        renderDashboard();
    };

    // Hold Logic
    let holdTimer;
    let progress = 0;
    
    const startHold = (e) => {
        e.preventDefault();
        progress = 0;
        el.startBtn.classList.add('holding');
        holdTimer = setInterval(() => {
            progress += 2;
            el.startBtn.style.background = `linear-gradient(90deg, var(--accent-success) ${progress}%, var(--accent-primary) ${progress}%)`;
            if (progress >= 100) {
                finishHold();
            }
        }, HOLD_MS / 50);
    };

    const finishHold = () => {
        clearInterval(holdTimer);
        const today = getTodayStr();
        if (!data.openedDays.includes(today)) {
            data.openedDays.push(today);
            saveData();
            el.startBtn.innerText = 'День начат! ✨';
            el.startBtn.style.background = 'var(--accent-success)';
            setTimeout(() => {
                el.startBtn.innerText = 'Удерживай, чтобы начать день';
                el.startBtn.style.background = 'var(--accent-primary)';
                el.startBtn.classList.remove('holding');
            }, 2000);
        }
    };

    const cancelHold = () => {
        clearInterval(holdTimer);
        el.startBtn.classList.remove('holding');
        el.startBtn.style.background = 'var(--accent-primary)';
    };

    el.startBtn.addEventListener('mousedown', startHold);
    el.startBtn.addEventListener('touchstart', startHold);
    window.addEventListener('mouseup', cancelHold);
    window.addEventListener('touchend', cancelHold);

    // Data Management
    document.getElementById('export-data').onclick = () => {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `life_rpg_backup_${getTodayStr()}.json`;
        a.click();
    };

    document.getElementById('import-data-btn').onclick = () => document.getElementById('import-data-input').click();
    document.getElementById('import-data-input').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                data = JSON.parse(ev.target.result);
                saveData();
                location.reload();
            } catch { alert('Ошибка импорта'); }
        };
        reader.readAsText(file);
    };

    document.getElementById('reset-data').onclick = () => {
        if (confirm('Удалить всё? Это необратимо.')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    };
}

function renderSettings() {
    el.spheresEdit.innerHTML = '';
    data.spheres.forEach((s, i) => {
        const row = document.createElement('div');
        row.className = 'edit-row';
        row.dataset.idx = i;
        row.style = 'display: grid; grid-template-columns: 1fr 60px 50px; gap: 8px; margin-bottom: 8px;';
        row.innerHTML = `
            <input type="text" class="edit-name input-glass" value="${s.name}">
            <input type="number" class="edit-score input-glass" value="${s.score || 0}" min="0" max="10">
            <input type="color" class="edit-color" value="${s.color}" style="height: 100%; width: 100%; border: none; background: none; padding: 0;">
        `;
        el.spheresEdit.appendChild(row);
    });

    el.habitsEdit.innerHTML = '';
    data.habits.forEach((h, i) => {
        const item = document.createElement('div');
        item.style = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-input); border-radius: 8px; margin-bottom: 4px;';
        item.innerHTML = `<span>${h.name}</span><button class="btn-premium btn-danger" onclick="removeHabit(${i})" style="padding: 4px 8px;">🗑️</button>`;
        el.habitsEdit.appendChild(item);
    });
}

window.removeHabit = (i) => {
    data.habits.splice(i, 1);
    saveData();
    renderSettings();
    renderDashboard();
};

init();
