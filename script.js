const THEME_PRESETS = {
    'blue-neon': { bg: '#060c1a', text: '#00f0ff' },
    'cyber-cyan': { bg: '#081b24', text: '#38ef7d' },
    'purple-neon': { bg: '#120524', text: '#e056fd' },
    'burgundy': { bg: '#1f0910', text: '#f8a5c2' },
    'graphite': { bg: '#121214', text: '#ffffff' },
    'dark-gray': { bg: '#1e1e24', text: '#ffffff' },
    'matte-gray': { bg: '#2d2d30', text: '#ffffff' },
    'pitch-black': { bg: '#0a0a0a', text: '#ffffff' },
    'light-silver': { bg: '#f2f2f7', text: '#1c1c1e' },
    'starlight': { bg: '#fbf7f0', text: '#2c2c2e' },
    'alpine-green': { bg: '#eef5f0', text: '#1b3b22' }
};

let subjects = JSON.parse(localStorage.getItem('subjects_pro')) || [];
let appSettings = JSON.parse(localStorage.getItem('app_settings_pro')) || {
    viewStyle: 'cubes', 
    themePreset: 'graphite',
    themeBg: '#121214',
    themeTextColor: '#ffffff',
    themeBlur: 16,
    themeBorderOpacity: 15,
    showDeadlines: true,
    deadlineFormat: 'dms',
    fontFamily: 'Montserrat'
};

const form = document.getElementById('tracker-form');
const subjectsList = document.getElementById('subjects-list');
const hasTargetCheckbox = document.getElementById('has-target-checkbox');
const targetInputsRow = document.getElementById('target-inputs-row');
const totalTasksInput = document.getElementById('total-tasks');
const doneTasksInput = document.getElementById('done-tasks');
const sidebar = document.getElementById('settings-sidebar');
const formSection = document.getElementById('form-section');
const modalOverlay = document.getElementById('modal-form-overlay');
const modalFormContainer = document.getElementById('modal-form-container');

const MAX_LIMIT = 25;

totalTasksInput.addEventListener('input', function() {
    if (parseInt(this.value) > MAX_LIMIT) this.value = MAX_LIMIT;
});
doneTasksInput.addEventListener('input', function() {
    if (parseInt(this.value) > MAX_LIMIT) this.value = MAX_LIMIT;
});

hasTargetCheckbox.addEventListener('change', function() {
    if (this.checked) {
        targetInputsRow.classList.remove('hidden');
        totalTasksInput.required = true;
    } else {
        targetInputsRow.classList.add('hidden');
        totalTasksInput.required = false;
        totalTasksInput.value = '';
    }
});

document.getElementById('open-settings-btn').addEventListener('click', () => sidebar.classList.remove('hidden'));
document.getElementById('dock-settings-btn').addEventListener('click', () => sidebar.classList.remove('hidden'));
document.getElementById('close-settings-btn').addEventListener('click', () => sidebar.classList.add('hidden'));
document.getElementById('sidebar-close-overlay').addEventListener('click', () => sidebar.classList.add('hidden'));
document.getElementById('close-modal-btn').addEventListener('click', closeModal);

document.getElementById('dock-home-btn').addEventListener('click', () => {
    document.getElementById('dock-home-btn').classList.add('active');
    document.getElementById('dock-add-btn').classList.remove('active');
    closeModal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('dock-add-btn').addEventListener('click', () => {
    resetForm();
    openModal();
});

function openModal() {
    if (window.innerWidth < 850) {
        modalFormContainer.appendChild(form);
        modalOverlay.classList.remove('hidden');
    }
}

function closeModal() {
    if (window.innerWidth < 850) {
        modalOverlay.classList.add('hidden');
    }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

document.getElementById('clear-all-btn').addEventListener('click', () => {
    const firstCheck = confirm('ВНИМАНИЕ: Вы действительно хотите удалить ВСЕ дисциплины и данные?');
    if (firstCheck) {
        const secondCheck = confirm('ПОСЛЕДНЕЕ ПОДТВЕРЖДЕНИЕ: Это действие нельзя отменить. Удалить всё?');
        if (secondCheck) {
            subjects = [];
            saveAndRefresh();
            resetForm();
            alert('Все данные успешно очищены.');
            sidebar.classList.add('hidden');
        }
    }
});

function formatDeadline(deadlineStr, format) {
    if (!deadlineStr) return '';
    const now = new Date().getTime();
    const target = new Date(deadlineStr).getTime();
    const diff = target - now;

    if (diff <= 0) return { text: 'Дедлайн истек!', expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let result = '';
    switch (format) {
        case 'dms':
            result = `${days}д ${hours}ч ${minutes}м ${seconds}с`;
            break;
        case 'dm':
            result = `${days}д ${hours}ч ${minutes}м`;
            break;
        case 'd':
            result = `${days} дн.`;
            break;
    }

    const urgent = diff < 24 * 60 * 60 * 1000;
    return { text: `⏳ ${result}`, urgent, expired: false };
}

function renderSubjects() {
    subjectsList.innerHTML = '';
    
    if (subjects.length === 0) {
        subjectsList.innerHTML = `
            <div class="glass-element" style="padding: 30px; text-align: center; color: var(--accent); grid-column: 1/-1;">
                Список пуст. Добавьте свою первую учебную дисциплину.
            </div>`;
        return;
    }

    subjects.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'card glass-element';
        card.dataset.id = sub.id;
        
        const hasTarget = sub.total && sub.total > 0;
        let progressHTML = '';
        
        if (!hasTarget) {
            progressHTML = `
                <div class="counter-text">Выполнено работ: <strong>${sub.done}</strong></div>
                <button class="btn-sm" style="margin-top:10px; width:100%;" onclick="promptAddTarget('${sub.id}')">
                    🎯 Указать цель
                </button>
            `;
        } else {
            switch (appSettings.viewStyle) {
                case 'counter':
                    progressHTML = `<div class="counter-text">Выполнено: <strong>${sub.done}</strong> из <strong>${sub.total}</strong></div>`;
                    break;
                    
                case 'cubes':
                    let cubes = '';
                    for (let i = 1; i <= sub.total; i++) {
                        const activeClass = i <= sub.done ? 'active' : '';
                        cubes += `<div class="cube ${activeClass}" onclick="setTasksFromCubes('${sub.id}', ${i})"></div>`;
                    }
                    progressHTML = `
                        <div class="cubes-container">${cubes}</div>
                        <div class="counter-text" style="font-size:13px; opacity:0.8;">Выполнено: ${sub.done} из ${sub.total}</div>
                    `;
                    break;
                    
                case 'progress-ring':
                    const percent = Math.round((sub.done / sub.total) * 100);
                    const radius = 20;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (percent / 100) * circumference;
                    progressHTML = `
                        <div class="ring-wrapper">
                            <svg class="progress-ring" width="50" height="50">
                                <circle class="progress-ring__circle" stroke="var(--text-color)" stroke-width="4" fill="transparent" r="${radius}" cx="25" cy="25" 
                                style="stroke-dasharray: ${circumference} ${circumference}; stroke-dashoffset: ${strokeDashoffset};"/>
                            </svg>
                            <span class="counter-text">${sub.done} / ${sub.total}</span>
                        </div>`;
                    break;
            }
        }

        let deadlineHTML = '';
        if (appSettings.showDeadlines && sub.deadline) {
            const dl = formatDeadline(sub.deadline, appSettings.deadlineFormat);
            const urgentClass = dl.urgent ? 'urgent' : '';
            const expiredClass = dl.expired ? 'expired' : '';
            deadlineHTML = `<div class="deadline-badge ${urgentClass} ${expiredClass}">${dl.text}</div>`;
        }

        card.innerHTML = `
            <div>
                <div class="card-type">${sub.type}</div>
                <div class="card-title">${sub.name}</div>
                <div class="deadline-container">${deadlineHTML}</div>
                <div class="display-wrapper">
                    ${progressHTML}
                </div>
                <div class="quick-controls">
                    <button class="btn-sm" onclick="changeDone('${sub.id}', -1)">-</button>
                    <button class="btn-sm" onclick="changeDone('${sub.id}', 1)">+</button>
                    <span style="font-size:12px; color:var(--accent)">Быстрый шаг</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="editSubject('${sub.id}')">Редактировать</button>
                <button class="btn btn-secondary" style="color:#ff7675" onclick="deleteSubject('${sub.id}')">Удалить</button>
            </div>
        `;
        subjectsList.appendChild(card);
    });
}

function updateDeadlinesOnly() {
    if (!appSettings.showDeadlines) return;

    subjects.forEach(sub => {
        if (!sub.deadline) return;
        const card = subjectsList.querySelector(`.card[data-id="${sub.id}"]`);
        if (!card) return;

        const container = card.querySelector('.deadline-container');
        if (container) {
            const dl = formatDeadline(sub.deadline, appSettings.deadlineFormat);
            const urgentClass = dl.urgent ? 'urgent' : '';
            const expiredClass = dl.expired ? 'expired' : '';
            container.innerHTML = `<div class="deadline-badge ${urgentClass} ${expiredClass}">${dl.text}</div>`;
        }
    });
}

setInterval(updateDeadlinesOnly, 1000);

function changeDone(id, delta) {
    subjects = subjects.map(sub => {
        if (sub.id === id) {
            let newVal = sub.done + delta;
            if (newVal < 0) newVal = 0;
            if (sub.total && newVal > sub.total) newVal = sub.total;
            if (newVal > MAX_LIMIT) newVal = MAX_LIMIT;
            return { ...sub, done: newVal };
        }
        return sub;
    });
    saveAndRefresh();
}

function setTasksFromCubes(id, count) {
    subjects = subjects.map(sub => {
        if (sub.id === id) {
            return { ...sub, done: sub.done === count ? count - 1 : count };
        }
        return sub;
    });
    saveAndRefresh();
}

function promptAddTarget(id) {
    const target = prompt(`Введите количество работ (макс. ${MAX_LIMIT}):`);
    let total = parseInt(target);
    if (total && total > 0) {
        if (total > MAX_LIMIT) total = MAX_LIMIT;
        subjects = subjects.map(sub => sub.id === id ? { ...sub, total: total } : sub);
        saveAndRefresh();
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('subject-name').value;
    const type = document.getElementById('subject-type').value;
    let done = parseInt(doneTasksInput.value);
    const deadline = document.getElementById('deadline-date').value;
    
    const hasTarget = hasTargetCheckbox.checked;
    let total = hasTarget ? parseInt(totalTasksInput.value) : null;

    if (total && total > MAX_LIMIT) total = MAX_LIMIT;
    if (done > MAX_LIMIT) done = MAX_LIMIT;

    if (id) {
        subjects = subjects.map(sub => sub.id === id ? { id, name, type, total, done, deadline } : sub);
    } else {
        subjects.push({ id: Date.now().toString(), name, type, total, done, deadline });
    }
    
    saveAndRefresh();
    resetForm();
    closeModal();
});

function editSubject(id) {
    const sub = subjects.find(s => s.id === id);
    if (!sub) return;
    
    document.getElementById('form-title').innerText = 'Редактирование';
    document.getElementById('modal-form-title').innerText = 'Редактирование';
    document.getElementById('edit-id').value = sub.id;
    document.getElementById('subject-name').value = sub.name;
    document.getElementById('subject-type').value = sub.type;
    document.getElementById('done-tasks').value = sub.done;
    document.getElementById('deadline-date').value = sub.deadline || '';
    
    if (sub.total) {
        hasTargetCheckbox.checked = true;
        targetInputsRow.classList.remove('hidden');
        totalTasksInput.value = sub.total;
    } else {
        hasTargetCheckbox.checked = false;
        targetInputsRow.classList.add('hidden');
        totalTasksInput.value = '';
    }
    
    document.getElementById('cancel-btn').classList.remove('hidden');
    document.getElementById('submit-btn').innerText = 'Обновить';
    
    if (window.innerWidth < 850) {
        openModal();
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function deleteSubject(id) {
    if (confirm('Удалить эту дисциплину?')) {
        subjects = subjects.filter(s => s.id !== id);
        saveAndRefresh();
        resetForm();
    }
}

function resetForm() {
    form.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('form-title').innerText = 'Новая дисциплина';
    document.getElementById('modal-form-title').innerText = 'Новая дисциплина';
    document.getElementById('submit-btn').innerText = 'Сохранить';
    document.getElementById('cancel-btn').classList.add('hidden');
    hasTargetCheckbox.checked = true;
    targetInputsRow.classList.remove('hidden');
}
document.getElementById('cancel-btn').addEventListener('click', () => {
    resetForm();
    closeModal();
});

function saveAndRefresh() {
    localStorage.setItem('subjects_pro', JSON.stringify(subjects));
    renderSubjects();
}

function applyThemeSettings() {
    const root = document.documentElement;
    root.style.setProperty('--bg-page', appSettings.themeBg);
    root.style.setProperty('--text-color', appSettings.themeTextColor);
    root.style.setProperty('--glass-blur', `${appSettings.themeBlur}px`);
    root.style.setProperty('--border-rgba', `rgba(255, 255, 255, ${appSettings.themeBorderOpacity / 100})`);
    
    let fontFamilyCSS = "'Montserrat', sans-serif";
    if (appSettings.fontFamily === 'SF Pro Display') fontFamilyCSS = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
    if (appSettings.fontFamily === 'Trebuchet MS') fontFamilyCSS = "'Trebuchet MS', sans-serif";
    if (appSettings.fontFamily === 'Impact') fontFamilyCSS = "Impact, sans-serif";
    root.style.setProperty('--main-font', fontFamilyCSS);
    
    document.getElementById('view-style-select').value = appSettings.viewStyle;
    document.getElementById('font-family-select').value = appSettings.fontFamily || 'Montserrat';
    document.getElementById('theme-preset').value = appSettings.themePreset || 'custom';
    document.getElementById('theme-bg').value = appSettings.themeBg;
    document.getElementById('theme-text-color').value = appSettings.themeTextColor;
    document.getElementById('theme-blur').value = appSettings.themeBlur;
    document.getElementById('blur-val').innerText = `${appSettings.themeBlur}px`;
    document.getElementById('theme-border-opacity').value = appSettings.themeBorderOpacity;
    document.getElementById('border-val').innerText = `${appSettings.themeBorderOpacity}%`;
    
    document.getElementById('show-deadlines-checkbox').checked = appSettings.showDeadlines;
    document.getElementById('deadline-format-select').value = appSettings.deadlineFormat;
}

function handleResize() {
    if (window.innerWidth >= 850) {
        if (form.parentElement !== formSection) {
            formSection.appendChild(form);
        }
        closeModal();
    }
}
window.addEventListener('resize', handleResize);

document.getElementById('view-style-select').addEventListener('change', (e) => { appSettings.viewStyle = e.target.value; updateSettings(); });
document.getElementById('font-family-select').addEventListener('change', (e) => { appSettings.fontFamily = e.target.value; updateSettings(); });

document.getElementById('theme-preset').addEventListener('change', (e) => {
    const presetKey = e.target.value;
    appSettings.themePreset = presetKey;
    if (THEME_PRESETS[presetKey]) {
        appSettings.themeBg = THEME_PRESETS[presetKey].bg;
        appSettings.themeTextColor = THEME_PRESETS[presetKey].text;
    }
    updateSettings();
});

document.getElementById('theme-bg').addEventListener('change', (e) => { appSettings.themeBg = e.target.value; appSettings.themePreset = 'custom'; updateSettings(); });
document.getElementById('theme-text-color').addEventListener('input', (e) => { appSettings.themeTextColor = e.target.value; appSettings.themePreset = 'custom'; updateSettings(); });
document.getElementById('theme-blur').addEventListener('input', (e) => { appSettings.themeBlur = e.target.value; updateSettings(); });
document.getElementById('theme-border-opacity').addEventListener('input', (e) => { appSettings.themeBorderOpacity = e.target.value; updateSettings(); });

document.getElementById('show-deadlines-checkbox').addEventListener('change', (e) => { appSettings.showDeadlines = e.target.checked; updateSettings(); });
document.getElementById('deadline-format-select').addEventListener('change', (e) => { appSettings.deadlineFormat = e.target.value; updateSettings(); });

document.getElementById('reset-theme-btn').addEventListener('click', () => {
    appSettings = {
        viewStyle: 'cubes',
        themePreset: 'graphite',
        themeBg: '#121214',
        themeTextColor: '#ffffff',
        themeBlur: 16,
        themeBorderOpacity: 15,
        showDeadlines: true,
        deadlineFormat: 'dms',
        fontFamily: 'Montserrat'
    };
    updateSettings();
});

function updateSettings() {
    localStorage.setItem('app_settings_pro', JSON.stringify(appSettings));
    applyThemeSettings();
    renderSubjects();
}

handleResize();
applyThemeSettings();
renderSubjects();