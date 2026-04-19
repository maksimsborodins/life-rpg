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
const HOLD_MS = 2000; // Faster premium feel
const STORAGE_KEY = 'lifeRPG_Premium';

/* State Management */
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

/* UI Elements */
const elements = {
    settingsOverlay: document.getElementById('settings-overlay'),
    settingsOpen: document.getElementById('settings-open'),
    settingsClose: document.getElementById('settings-close'),
    spheresContainer: document.getElementById('spheres-container'),
    habitsContainer: document.getElementById('habits-container'),
    daysLived: document.getElementById('days-lived'),
    lifeProgress: document.getElementById('life-progress'),
    avgLevel: document.getElementById('avg-level'),
    startDayBtn: document.getElementById('start-day-btn'),
    newHabitInput: document.getElementById('new-habit-input'),
    newHabitPurpose: document.getElementById('new-habit-purpose'),
    addHabitBtn: document.getElementById('add-habit-btn'),
    settingsSpheresList: document.getElementById('settings-spheres-list'),
    settingsHabitsList: document.getElementById('settings-habits-list'),
};

/* Initialization */
function init() {
    renderDashboard();
    setupEventListeners();
    updateStats();
}

function renderDashboard() {
    renderSpheres();
    renderHabits();
}

/* Core Logic */
function renderSpheres() {
    elements.spheresContainer.innerHTML = '';
    const today = getTodayStr();
    const improvedToday = data.sphereProgress[today] || [];

    data.spheres.forEach(s => {
        const isImproved = improvedToday.includes(s.id);
        const card = document.createElement('div');
        card.className = `sphere-card ${isImproved ? 'active' : ''}`;
        card.style.setProperty('--sphere-color', s.color);
        
        card.innerHTML = `
            <div class="sphere-info">
                <span class="sphere-name">${s.name}</span>
                <span class="sphere-level">Level ${s.score || 0}</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${(s.score || 0) * 10}%"></div>
            </div>
        `;
        
        card.onclick = () => toggleSphere(s.id);
        elements.spheresContainer.appendChild(card);
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
        createParticles(event); // Visual feedback
    }
    
    saveData();
    renderSpheres();
}

function renderHabits() {
    elements.habitsContainer.innerHTML = '';
    const today = getTodayStr();
    const doneToday = data.habitHistory[today] || [];

    if (data.habits.length === 0) {
        elements.habitsContainer.innerHTML = '<div class="empty-state">Нет привычек. Добавь в настройках ⚙️</div>';
        return;
    }

    data.habits.forEach(h => {
        const isDone = doneToday.includes(h.id);
        const streak = calculateStreak(h.id);
        const item = document.createElement('div');
        item.className = `habit-row ${isDone ? 'done' : ''}`;
        
        item.innerHTML = `
            <div class="habit-checkbox">${isDone ? '✓' : ''}</div>
            <div class="habit-text">
                <span class="name">${h.name}</span>
                ${h.purpose ? `<span class="purpose">${h.purpose}</span>` : ''}
            </div>
            ${streak > 0 ? `<div class="streak-badge">🔥 ${streak}</div>` : ''}
        `;
        
        item.onclick = () => toggleHabit(h.id);
        elements.habitsContainer.appendChild(item);
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
    
    saveData();
    renderHabits();
}

function calculateStreak(id) {
    let streak = 0;
    let curr = new Date();
    while (true) {
        const dStr = curr.toLocaleDateString('en-CA');
        if ((data.habitHistory[dStr] || []).includes(id)) {
            streak++;
            curr.setDate(curr.getDate() - 1);
        } else {
            if (dStr === getTodayStr()) {
                curr.setDate(curr.getDate() - 1);
                continue;
            }
            break;
        }
    }
    return streak;
}

function updateStats() {
    const count = data.openedDays.length;
    if (elements.daysLived) elements.daysLived.innerText = count;
    if (elements.lifeProgress) elements.lifeProgress.innerText = ((count / TOTAL_DAYS) * 100).toFixed(4) + '%';
    
    // Avg level
    const totalScore = data.spheres.reduce((acc, s) => acc + (s.score || 0), 0);
    const avg = (totalScore / data.spheres.length) * 10;
    if (elements.avgLevel) elements.avgLevel.innerText = avg.toFixed(1) + '%';
}

/* Settings Logic */
function renderSettings() {
    // Spheres edit
    elements.settingsSpheresList.innerHTML = '';
    data.spheres.forEach((s, idx) => {
        const row = document.createElement('div');
        row.className = 'settings-row-edit';
        row.innerHTML = `
            <input type="text" class="edit-name input-glass" value="${s.name}" data-idx="${idx}">
            <input type="number" class="edit-score input-glass" value="${s.score || 0}" min="0" max="10" data-idx="${idx}">
            <input type="color" class="edit-color" value="${s.color}" data-idx="${idx}">
        `;
        elements.settingsSpheresList.appendChild(row);
    });

    // Habits edit
    elements.settingsHabitsList.innerHTML = '';
    data.habits.forEach((h, idx) => {
        const item = document.createElement('div');
        item.className = 'settings-habit-item card-glass';
        item.innerHTML = `
            <span>${h.name}</span>
            <button class="btn-icon-danger" onclick="removeHabit(${idx})">🗑️</button>
        `;
        elements.settingsHabitsList.appendChild(item);
    });
}

window.removeHabit = (idx) => {
    data.habits.splice(idx, 1);
    saveData();
    renderSettings();
    renderHabits();
};

/* Events */
function setupEventListeners() {
    elements.settingsOpen.onclick = () => {
        renderSettings();
        elements.settingsOverlay.classList.remove('hidden');
    };
    
    elements.settingsClose.onclick = () => {
        elements.settingsOverlay.classList.add('hidden');
    };

    document.getElementById('settings-save').onclick = () => {
        const rows = document.querySelectorAll('.settings-row-edit');
        rows.forEach(row => {
            const name = row.querySelector('.edit-name').value;
            const score = parseInt(row.querySelector('.edit-score').value);
            const color = row.querySelector('.edit-color').value;
            const idx = row.querySelector('.edit-name').dataset.idx;
            data.spheres[idx].name = name;
            data.spheres[idx].score = score;
            data.spheres[idx].color = color;
        });
        saveData();
        renderSpheres();
        alert('Сохранено!');
    };

    elements.addHabitBtn.onclick = () => {
        const name = elements.newHabitInput.value.trim();
        const purpose = elements.newHabitPurpose.value.trim();
        if (!name) return;
        
        data.habits.push({ id: 'h_' + Date.now(), name, purpose });
        elements.newHabitInput.value = '';
        elements.newHabitPurpose.value = '';
        saveData();
        renderSettings();
        renderHabits();
    };

    // Hero Action: Hold to start day
    let holdInterval;
    let holdProgress = 0;
    
    const startHold = (e) => {
        e.preventDefault();
        holdProgress = 0;
        elements.startDayBtn.classList.add('holding');
        holdInterval = setInterval(() => {
            holdProgress += 20; // 2% per 20ms = 1s total
            elements.startDayBtn.style.setProperty('--hold-progress', holdProgress + '%');
            if (holdProgress >= 100) {
                finishHold();
            }
        }, 20);
    };

    const finishHold = () => {
        clearInterval(holdInterval);
        const today = getTodayStr();
        if (!data.openedDays.includes(today)) {
            data.openedDays.push(today);
            saveData();
            elements.startDayBtn.innerText = 'День начат! ✨';
            elements.startDayBtn.classList.add('success');
            setTimeout(() => {
                elements.startDayBtn.innerText = 'Удерживай, чтобы начать день';
                elements.startDayBtn.classList.remove('success', 'holding');
                elements.startDayBtn.style.setProperty('--hold-progress', '0%');
            }, 2000);
        } else {
            elements.startDayBtn.classList.remove('holding');
            elements.startDayBtn.style.setProperty('--hold-progress', '0%');
        }
    };

    const cancelHold = () => {
        clearInterval(holdInterval);
        elements.startDayBtn.classList.remove('holding');
        elements.startDayBtn.style.setProperty('--hold-progress', '0%');
    };

    elements.startDayBtn.addEventListener('mousedown', startHold);
    elements.startDayBtn.addEventListener('touchstart', startHold);
    window.addEventListener('mouseup', cancelHold);
    window.addEventListener('touchend', cancelHold);

    // Export/Import/Reset
    document.getElementById('export-data').onclick = () => {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `life_rpg_backup_${getTodayStr()}.json`;
        a.click();
    };

    document.getElementById('import-data-btn').onclick = () => {
        document.getElementById('import-data-input').click();
    };

    document.getElementById('import-data-input').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const d = JSON.parse(ev.target.result);
                data = d;
                saveData();
                location.reload();
            } catch { alert('Ошибка импорта'); }
        };
        reader.readAsText(file);
    };

    document.getElementById('reset-data').onclick = () => {
        if (confirm('Вы уверены? Весь прогресс будет удален навсегда.')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    };
}

/* Helpers */
function createParticles(e) {
    // Simple visual flair for "premium" feel
    const count = 10;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        document.body.appendChild(p);
        const size = Math.random() * 8 + 4;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = e.pageX + 'px';
        p.style.top = e.pageY + 'px';
        // Animation handled in CSS
        setTimeout(() => p.remove(), 1000);
    }
}

init();
