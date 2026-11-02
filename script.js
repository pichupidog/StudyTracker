// Инициализация данных из localStorage или создание дефолтных массивов
let subjects = JSON.parse(localStorage.getItem('subjects_pro')) || [];
let appSettings = JSON.parse(localStorage.getItem('app_settings_pro')) || {
    viewStyle: 'cubes', // Доступные стили: counter, cubes, progress-ring, minimal
    themeBg: '#121214',
    themeTextColor: '#ffffff',
    themeBlur: 16,
    themeBorderOpacity: 15
};

// Ссылки на элементы интерфейса (DOM)
const form = document.getElementById('tracker-form');
const subjectsList = document.getElementById('subjects-list');
const hasTargetCheckbox = document.getElementById('has-target-checkbox');
const targetInputsRow = document.getElementById('target-inputs-row');
const totalTasksInput = document.getElementById('total-tasks');
const sidebar = document.getElementById('settings-sidebar');

// Показ/скрытие поля ввода цели в зависимости от чекбокса
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

// Открытие и закрытие боковой панели настроек
document.getElementById('open-settings-btn').addEventListener('click', () => sidebar.classList.remove('hidden'));
document.getElementById('close-settings-btn').addEventListener('click', () => sidebar.classList.add('hidden'));
document.getElementById('sidebar-close-overlay').addEventListener('click', () => sidebar.classList.add('hidden'));

// Логика переключения табов (подпунктов) внутри настроек
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Функция отрисовки всех карточек дисциплин
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
        
        const hasTarget = sub.total && sub.total > 0;
        const percent = hasTarget ? Math.round((sub.done / sub.total) * 100) : 0;
        
        // Переменная для хранения HTML-кода блока прогресса
        let progressHTML = '';
        
        if (!hasTarget) {
            // Вид, если цель не указана: обычный счетчик с возможностью добавить цель
            progressHTML = `
                <div class="counter-text">Выполнено работ: <strong>${sub.done}</strong></div>
                <button class="btn-sm" style="margin-top:10px; width:100%;" onclick="promptAddTarget('${sub.id}')">
                    🎯 Указать цель (кол-во лаб)
                </button>
            `;
        } else {
            // Генерация отображения на основе выбранного стиля в настройках
            switch (appSettings.viewStyle) {
                case 'counter':
                    progressHTML = `<div class="counter-text">Выполнено: <strong>${sub.done}</strong> из <strong>${sub.total}</strong> [${percent}%]</div>`;
                    break;
                    
                case 'cubes':
                    let cubes = '';
                    for (let i = 1; i <= sub.total; i++) {
                        const activeClass = i <= sub.done ? 'active' : '';
                        cubes += `<div class="cube ${activeClass}" onclick="setTasksFromCubes('${sub.id}', ${i})"></div>`;
                    }
                    progressHTML = `<div class="cubes-container">${cubes}</div>`;
                    break;
                    
                case 'progress-ring':
                    const radius = 20;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (percent / 100) * circumference;
                    progressHTML = `
                        <div class="ring-wrapper">
                            <svg class="progress-ring" width="50" height="50">
                                <circle class="progress-ring__circle" stroke="white" stroke-width="4" fill="transparent" r="${radius}" cx="25" cy="25" 
                                style="stroke-dasharray: ${circumference} ${circumference}; stroke-dashoffset: ${strokeDashoffset};"/>
                            </svg>
                            <span class="counter-text">${sub.done} / ${sub.total} (${percent}%)</span>
                        </div>`;
                    break;
                    
                case 'minimal':
                    progressHTML = `<div class="counter-text" style="font-size:24px; font-weight:300;">${percent}% завершено</div>`;
                    break;
            }
        }

        // Собираем карточку целиком
        card.innerHTML = `
            <div>
                <div class="card-type">${sub.type}</div>
                <div class="card-title">${sub.name}</div>
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

// Быстрое изменение кликами по кнопкам + и - на карточке
function changeDone(id, delta) {
    subjects = subjects.map(sub => {
        if (sub.id === id) {
            let newVal = sub.done + delta;
            if (newVal < 0) newVal = 0;
            if (sub.total && newVal > sub.total) newVal = sub.total;
            return { ...sub, done: newVal };
        }
        return sub;
    });
    saveAndRefresh();
}

// Изменение прогресса по клику на кубики
function setTasksFromCubes(id, count) {
    subjects = subjects.map(sub => {
        if (sub.id === id) {
            if (sub.done === count) {
                return { ...sub, done: count - 1 };
            }
            return { ...sub, done: count };
        }
        return sub;
    });
    saveAndRefresh();
}

// Кнопка добавления цели на "бесцельной" карточке
function promptAddTarget(id) {
    const target = prompt("Введите необходимое количество работ для выполнения:");
    const total = parseInt(target);
    if (total && total > 0) {
        subjects = subjects.map(sub => sub.id === id ? { ...sub, total: total } : sub);
        saveAndRefresh();
    }
}

// Создание и обновление дисциплины через отправку формы
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('subject-name').value;
    const type = document.getElementById('subject-type').value;
    const done = parseInt(document.getElementById('done-tasks').value);
    
    const hasTarget = hasTargetCheckbox.checked;
    const total = hasTarget ? parseInt(totalTasksInput.value) : null;

    if (id) {
        subjects = subjects.map(sub => sub.id === id ? { id, name, type, total, done } : sub);
    } else {
        subjects.push({ id: Date.now().toString(), name, type, total, done });
    }
    
    saveAndRefresh();
    resetForm();
});

// Заполнение формы данными для редактирования
function editSubject(id) {
    const sub = subjects.find(s => s.id === id);
    if (!sub) return;
    
    document.getElementById('form-title').innerText = 'Редактирование';
    document.getElementById('edit-id').value = sub.id;
    document.getElementById('subject-name').value = sub.name;
    document.getElementById('subject-type').value = sub.type;
    document.getElementById('done-tasks').value = sub.done;
    
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Удаление предмета
function deleteSubject(id) {
    if (confirm('Удалить эту дисциплину?')) {
        subjects = subjects.filter(s => s.id !== id);
        saveAndRefresh();
        resetForm();
    }
}

// Очистка формы и возврат в дефолтный режим
function resetForm() {
    form.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('form-title').innerText = 'Новая дисциплина';
    document.getElementById('submit-btn').innerText = 'Сохранить';
    document.getElementById('cancel-btn').classList.add('hidden');
    hasTargetCheckbox.checked = true;
    targetInputsRow.classList.remove('hidden');
}
document.getElementById('cancel-btn').addEventListener('click', resetForm);

// Сохранение изменений в базу данных браузера и перезапуск рендера
function saveAndRefresh() {
    localStorage.setItem('subjects_pro', JSON.stringify(subjects));
    renderSubjects();
}

// Применение настроек кастомизации к CSS-переменным документа
function applyThemeSettings() {
    const root = document.documentElement;
    root.style.setProperty('--bg-page', appSettings.themeBg);
    root.style.setProperty('--text-color', appSettings.themeTextColor);
    root.style.setProperty('--glass-blur', `${appSettings.themeBlur}px`);
    root.style.setProperty('--border-rgba', `rgba(255, 255, 255, ${appSettings.themeBorderOpacity / 100})`);
    
    document.getElementById('view-style-select').value = appSettings.viewStyle;
    document.getElementById('theme-bg').value = appSettings.themeBg;
    document.getElementById('theme-text-color').value = appSettings.themeTextColor;
    document.getElementById('theme-blur').value = appSettings.themeBlur;
    document.getElementById('blur-val').innerText = `${appSettings.themeBlur}px`;
    document.getElementById('theme-border-opacity').value = appSettings.themeBorderOpacity;
    document.getElementById('border-val').innerText = `${appSettings.themeBorderOpacity}%`;
}

// Слушатели интерактивных изменений в меню настроек
document.getElementById('view-style-select').addEventListener('change', (e) => { appSettings.viewStyle = e.target.value; updateSettings(); });
document.getElementById('theme-bg').addEventListener('change', (e) => { appSettings.themeBg = e.target.value; updateSettings(); });
document.getElementById('theme-text-color').addEventListener('input', (e) => { appSettings.themeTextColor = e.target.value; updateSettings(); });
document.getElementById('theme-blur').addEventListener('input', (e) => { appSettings.themeBlur = e.target.value; updateSettings(); });
document.getElementById('theme-border-opacity').addEventListener('input', (e) => { appSettings.themeBorderOpacity = e.target.value; updateSettings(); });

// Кнопка полного сброса кастомизации на дефолтные серые стеклянные параметры
document.getElementById('reset-theme-btn').addEventListener('click', () => {
    appSettings = {
        viewStyle: 'cubes',
        themeBg: '#121214',
        themeTextColor: '#ffffff',
        themeBlur: 16,
        themeBorderOpacity: 15
    };
    updateSettings();
});

// Функция обновления глобальных настроек приложения
function updateSettings() {
    localStorage.setItem('app_settings_pro', JSON.stringify(appSettings));
    applyThemeSettings();
    renderSubjects();
}

// Первоначальный запуск приложения при загрузке страницы
applyThemeSettings();
renderSubjects();
