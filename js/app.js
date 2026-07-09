/* ================================================================
   TechCorp — Dashboard logic (self-contained, localStorage-backed)
   ================================================================ */
'use strict';

const STORE_KEY = 'techcorp_dashboard_v2';
const THEME_KEY = 'techcorp_theme';

const DEFAULT_DATA = {
    projects: [
        { id: 1,  name: 'CRM для ритейла',                 budget: 1250000, status: 'active',    employees: 8,  tasks: 45 },
        { id: 2,  name: 'Мобильное приложение FitTrack',   budget: 980000,  status: 'active',    employees: 6,  tasks: 38 },
        { id: 3,  name: 'AI-чат для поддержки',            budget: 2100000, status: 'active',    employees: 10, tasks: 62 },
        { id: 4,  name: 'Интернет-магазин TechnoShop',     budget: 750000,  status: 'completed', employees: 4,  tasks: 28 },
        { id: 5,  name: 'Дашборд для аналитики',           budget: 560000,  status: 'paused',    employees: 3,  tasks: 15 },
        { id: 6,  name: 'ERP-система',                     budget: 3200000, status: 'active',    employees: 14, tasks: 89 },
        { id: 7,  name: 'Сайт для стоматологии',           budget: 450000,  status: 'completed', employees: 2,  tasks: 12 },
        { id: 8,  name: 'Telegram-бот для доставки',       budget: 320000,  status: 'active',    employees: 4,  tasks: 22 },
        { id: 9,  name: 'Платформа онлайн-обучения',       budget: 1800000, status: 'active',    employees: 9,  tasks: 55 },
        { id: 10, name: 'Управление складом',              budget: 980000,  status: 'paused',    employees: 5,  tasks: 30 },
        { id: 11, name: 'Приложение для ресторанов',       budget: 650000,  status: 'completed', employees: 3,  tasks: 18 },
        { id: 12, name: 'Корпоративный портал',            budget: 1500000, status: 'active',    employees: 7,  tasks: 48 },
    ],
    employees: [
        { id: 1,  name: 'Анна Смирнова',      position: 'PM',       projects: 3, tasks: 12 },
        { id: 2,  name: 'Максим Козлов',      position: 'Dev',      projects: 2, tasks: 8 },
        { id: 3,  name: 'Елена Воронова',     position: 'Designer', projects: 4, tasks: 18 },
        { id: 4,  name: 'Дмитрий Лебедев',    position: 'Dev',      projects: 1, tasks: 5 },
        { id: 5,  name: 'Ольга Морозова',     position: 'QA',       projects: 3, tasks: 14 },
        { id: 6,  name: 'Сергей Новиков',     position: 'Dev',      projects: 2, tasks: 7 },
        { id: 7,  name: 'Наталья Иванова',    position: 'PM',       projects: 5, tasks: 22 },
        { id: 8,  name: 'Иван Петров',        position: 'Dev',      projects: 2, tasks: 9 },
        { id: 9,  name: 'Мария Соколова',     position: 'Designer', projects: 3, tasks: 11 },
        { id: 10, name: 'Алексей Борисов',    position: 'Dev',      projects: 1, tasks: 4 },
        { id: 11, name: 'Екатерина Фёдорова', position: 'QA',       projects: 2, tasks: 10 },
        { id: 12, name: 'Павел Громов',       position: 'Dev',      projects: 3, tasks: 16 },
        { id: 13, name: 'Ирина Кузнецова',    position: 'PM',       projects: 2, tasks: 8 },
        { id: 14, name: 'Андрей Соловьёв',    position: 'Dev',      projects: 4, tasks: 20 },
        { id: 15, name: 'Юлия Тарасова',      position: 'Designer', projects: 2, tasks: 9 },
        { id: 16, name: 'Владимир Орлов',     position: 'QA',       projects: 1, tasks: 6 },
    ],
    finance: {
        months: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
        income:   [450000, 520000, 480000, 610000, 580000, 720000],
        expenses: [320000, 380000, 340000, 450000, 420000, 510000],
    },
};

let state = load();

function load() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return structuredClone(DEFAULT_DATA);
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
const nextId = (arr) => (arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1);
const STATUS = { active: 'Активный', completed: 'Завершён', paused: 'На паузе' };
const PROJECT_ICON = { active: '🟢', completed: '✅', paused: '⏸️' };
const ROLE_ICON = { PM: '👨‍💼', Dev: '👨‍💻', Designer: '🎨', QA: '🔍' };
const ROLE_GRAD = {
    PM: 'linear-gradient(140deg,#f59e0b,#ef4444)',
    Dev: 'linear-gradient(140deg,#7c6cff,#4f46e5)',
    Designer: 'linear-gradient(140deg,#ec4899,#8b5cf6)',
    QA: 'linear-gradient(140deg,#22d3ee,#0891b2)',
};

function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function stats() {
    const p = state.projects;
    return {
        totalProjects: p.length,
        activeProjects: p.filter((x) => x.status === 'active').length,
        totalEmployees: state.employees.length,
        totalTasks: p.reduce((s, x) => s + x.tasks, 0),
        totalBudget: p.reduce((s, x) => s + x.budget, 0),
    };
}
function progressOf(p) {
    if (p.status === 'completed') return 100;
    if (p.status === 'paused') return Math.min(p.tasks * 2, 70);
    return Math.min(Math.round(p.tasks * 1.4), 95);
}

/* ---------- sparkline ---------- */
function sparkline(data, color) {
    const w = 120, h = 42, max = Math.max(...data), min = Math.min(...data);
    const rng = max - min || 1;
    const pts = data.map((v, i) => [ (i / (data.length - 1)) * w, h - 6 - ((v - min) / rng) * (h - 14) ]);
    const line = pts.map((p) => p.join(',')).join(' ');
    const area = `0,${h} ${line} ${w},${h}`;
    const gid = 'sg' + Math.random().toString(36).slice(2, 7);
    return `<svg class="stat__spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}" stop-opacity="0.35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
        </linearGradient></defs>
        <polygon points="${area}" fill="url(#${gid})"/>
        <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

/* ---------- render: stat cards ---------- */
function renderStats() {
    const s = stats();
    const acc = cssVar('--accent'), good = cssVar('--good'), cyan = cssVar('--accent-2'), warn = cssVar('--warn');
    const cards = [
        { ic: '📁', label: 'Проектов активно', value: `${s.activeProjects}/${s.totalProjects}`, delta: '+3', up: true, spark: [4,5,5,6,6,7,s.activeProjects], color: acc },
        { ic: '👥', label: 'Сотрудников', value: s.totalEmployees, delta: '+5', up: true, spark: [10,11,12,13,14,15,s.totalEmployees], color: cyan },
        { ic: '✅', label: 'Задач в работе', value: s.totalTasks, delta: '+24', up: true, spark: [280,300,320,340,380,400,s.totalTasks], color: good },
        { ic: '💰', label: 'Общий бюджет', value: rub(s.totalBudget), delta: '+18%', up: true, spark: [9,10,11,12,13,14,15], color: warn },
    ];
    $('#statCards').innerHTML = cards.map((c) => `
        <div class="stat">
            <div class="stat__head">
                <div class="stat__ic">${c.ic}</div>
                <span class="stat__delta ${c.up ? 'up' : 'down'}">${c.up ? '▲' : '▼'} ${c.delta}</span>
            </div>
            <div class="stat__value num">${c.value}</div>
            <div class="stat__label">${c.label}</div>
            ${sparkline(c.spark, c.color)}
        </div>`).join('');
}

/* ---------- charts ---------- */
const charts = {};
function chartBase() {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = cssVar('--faint');
    return { grid: cssVar('--grid'), text: cssVar('--muted'), acc: cssVar('--accent'), acc2: cssVar('--accent-2'), good: cssVar('--good'), bad: cssVar('--bad'), warn: cssVar('--warn') };
}
function destroyChart(k) { if (charts[k]) { charts[k].destroy(); delete charts[k]; } }

function buildDashboardCharts() {
    const c = chartBase();
    destroyChart('tasks'); destroyChart('budget'); destroyChart('mini');

    charts.tasks = new Chart($('#tasksChart'), {
        type: 'bar',
        data: { labels: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'], datasets: [{ data: [12,19,15,22,28,8,4], backgroundColor: c.acc, borderRadius: 7, barPercentage: 0.6 }] },
        options: baseOpts(c, { xGrid: false }),
    });

    const top = [...state.projects].sort((a, b) => b.budget - a.budget).slice(0, 5);
    charts.budget = new Chart($('#budgetChart'), {
        type: 'doughnut',
        data: { labels: top.map((p) => p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name),
            datasets: [{ data: top.map((p) => p.budget), backgroundColor: [c.acc, c.acc2, c.good, c.warn, c.bad], borderWidth: 0, hoverOffset: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%',
            plugins: { legend: { position: 'bottom', labels: { color: c.text, padding: 12, font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } } } },
    });

    const f = state.finance;
    charts.mini = new Chart($('#miniFinance'), lineConfig(c, f.months, f.income, f.expenses));
}

function buildFinanceChart() {
    const c = chartBase();
    destroyChart('finance');
    const f = state.finance;
    charts.finance = new Chart($('#financeChart'), lineConfig(c, f.months, f.income, f.expenses, true));
}

function lineConfig(c, labels, income, expenses, withLegend) {
    return {
        type: 'line',
        data: { labels, datasets: [
            { label: 'Доходы', data: income, borderColor: c.good, backgroundColor: fade(c.good), fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2.5 },
            { label: 'Расходы', data: expenses, borderColor: c.bad, backgroundColor: fade(c.bad), fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2.5 },
        ] },
        options: baseOpts(c, { legend: !!withLegend, yMoney: true }),
    };
}
function fade(hex) {
    const el = document.createElement('div'); el.style.color = hex; document.body.appendChild(el);
    const rgb = getComputedStyle(el).color; el.remove();
    return rgb.replace('rgb(', 'rgba(').replace(')', ', 0.12)');
}
function baseOpts(c, o = {}) {
    return {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: o.legend ? { labels: { color: c.text, usePointStyle: true, pointStyle: 'circle', padding: 18 } } : { display: false },
            tooltip: { backgroundColor: cssVar('--bg-2'), titleColor: cssVar('--text'), bodyColor: cssVar('--muted'), borderColor: cssVar('--line'), borderWidth: 1, padding: 10, cornerRadius: 8, displayColors: false } },
        scales: {
            y: { grid: { color: c.grid, drawBorder: false }, ticks: { color: c.text, font: { size: 11 }, callback: o.yMoney ? (v) => (v / 1000) + 'k' : undefined } },
            x: { grid: { display: o.xGrid !== false ? false : false, color: c.grid }, ticks: { color: c.text, font: { size: 11 } } },
        },
    };
}

/* ---------- feed ---------- */
function renderFeed() {
    const items = [
        { ic: '✅', t: 'Проект «CRM для ритейла» перешёл в финальную стадию', time: '12 минут назад', bg: 'var(--good)' },
        { ic: '📋', t: 'Добавлен новый проект «AI-чат для поддержки»', time: '1 час назад', bg: 'var(--accent)' },
        { ic: '👥', t: 'В команду принята Анна Смирнова (PM)', time: '3 часа назад', bg: 'var(--accent-2)' },
        { ic: '💰', t: 'Бюджет ERP-системы увеличен на 15%', time: 'вчера', bg: 'var(--warn)' },
        { ic: '🚀', t: 'Релиз v2.4 «Портала» выкачен в продакшн', time: '2 дня назад', bg: 'var(--accent)' },
    ];
    $('#feed').innerHTML = items.map((i) => `
        <div class="feed__item">
            <div class="feed__dot" style="color:${i.bg}">${i.ic}</div>
            <div><div class="feed__text">${i.t}</div><div class="feed__time">${i.time}</div></div>
        </div>`).join('');
}

/* ---------- projects ---------- */
let projectFilter = 'all', projectQuery = '';
function renderProjects() {
    let rows = state.projects.filter((p) => projectFilter === 'all' || p.status === projectFilter);
    if (projectQuery) rows = rows.filter((p) => p.name.toLowerCase().includes(projectQuery));
    const body = $('#projectsBody');
    if (!rows.length) { body.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--faint);padding:40px">Ничего не найдено</td></tr>`; return; }
    body.innerHTML = rows.map((p) => `
        <tr>
            <td><div class="cell-name"><div class="cell-ic">${PROJECT_ICON[p.status]}</div><b>${esc(p.name)}</b></div></td>
            <td class="num">${rub(p.budget)}</td>
            <td><span class="pill ${p.status}">${STATUS[p.status]}</span></td>
            <td>${p.employees}</td>
            <td>${p.tasks}</td>
            <td><div class="bar"><i style="width:${progressOf(p)}%"></i></div></td>
            <td><div class="row-actions">
                <button class="mini-btn" data-edit="${p.id}" aria-label="Изменить"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                <button class="mini-btn danger" data-del="${p.id}" aria-label="Удалить"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>
            </div></td>
        </tr>`).join('');
    body.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => editProject(+b.dataset.edit)));
    body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
        const p = state.projects.find((x) => x.id === +b.dataset.del);
        confirmModal('Удалить проект?', `«${p.name}» будет удалён без возможности восстановления.`, 'Удалить', () => {
            state.projects = state.projects.filter((x) => x.id !== p.id); save(); refreshAll(); toast('Проект удалён');
        });
    }));
}
function projectFields(p = {}) {
    return [
        { name: 'name', label: 'Название', type: 'text', value: p.name || '' },
        { name: 'budget', label: 'Бюджет, ₽', type: 'number', value: p.budget || 500000 },
        { name: 'status', label: 'Статус', type: 'select', value: p.status || 'active', options: [['active','Активный'],['completed','Завершён'],['paused','На паузе']] },
        { name: 'employees', label: 'Сотрудников', type: 'number', value: p.employees || 3 },
        { name: 'tasks', label: 'Задач', type: 'number', value: p.tasks || 10 },
    ];
}
function addProject() {
    formModal('Новый проект', 'Добавьте проект в портфель компании', projectFields(), (v) => {
        if (!v.name.trim()) return false;
        state.projects.push({ id: nextId(state.projects), name: v.name.trim(), budget: +v.budget || 0, status: v.status, employees: +v.employees || 0, tasks: +v.tasks || 0 });
        save(); refreshAll(); toast('Проект добавлен');
    });
}
function editProject(id) {
    const p = state.projects.find((x) => x.id === id); if (!p) return;
    formModal('Изменить проект', esc(p.name), projectFields(p), (v) => {
        Object.assign(p, { name: v.name.trim() || p.name, budget: +v.budget || 0, status: v.status, employees: +v.employees || 0, tasks: +v.tasks || 0 });
        save(); refreshAll(); toast('Изменения сохранены');
    });
}

/* ---------- employees ---------- */
let empFilter = 'all', empQuery = '';
function renderEmployees() {
    let rows = state.employees.filter((e) => empFilter === 'all' || e.position === empFilter);
    if (empQuery) rows = rows.filter((e) => e.name.toLowerCase().includes(empQuery));
    const grid = $('#employeesGrid');
    if (!rows.length) { grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--faint);padding:40px">Ничего не найдено</div>`; return; }
    grid.innerHTML = rows.map((e) => `
        <div class="emp">
            <button class="emp__del" data-del="${e.id}" aria-label="Удалить"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>
            <div class="emp__av" style="background:${ROLE_GRAD[e.position] || 'var(--card-2)'}">${ROLE_ICON[e.position] || '👤'}</div>
            <div class="emp__name">${esc(e.name)}</div>
            <div class="emp__role">${e.position}</div>
            <div class="emp__stats">
                <div class="emp__stat"><b class="num">${e.projects}</b><span>проектов</span></div>
                <div class="emp__stat"><b class="num">${e.tasks}</b><span>задач</span></div>
            </div>
        </div>`).join('');
    grid.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
        const e = state.employees.find((x) => x.id === +b.dataset.del);
        confirmModal('Удалить сотрудника?', `${e.name} будет удалён из команды.`, 'Удалить', () => {
            state.employees = state.employees.filter((x) => x.id !== e.id); save(); refreshAll(); toast('Сотрудник удалён');
        });
    }));
}
function addEmployee() {
    formModal('Новый сотрудник', 'Добавьте участника в команду', [
        { name: 'name', label: 'Имя', type: 'text', value: '' },
        { name: 'position', label: 'Роль', type: 'select', value: 'Dev', options: [['PM','PM'],['Dev','Разработчик'],['Designer','Дизайнер'],['QA','QA']] },
        { name: 'projects', label: 'Проектов', type: 'number', value: 1 },
        { name: 'tasks', label: 'Задач', type: 'number', value: 5 },
    ], (v) => {
        if (!v.name.trim()) return false;
        state.employees.push({ id: nextId(state.employees), name: v.name.trim(), position: v.position, projects: +v.projects || 0, tasks: +v.tasks || 0 });
        save(); refreshAll(); toast('Сотрудник добавлен');
    });
}

/* ---------- finance ---------- */
function renderFinance() {
    const f = state.finance;
    const ti = f.income.reduce((a, b) => a + b, 0), te = f.expenses.reduce((a, b) => a + b, 0);
    $('#incomeList').innerHTML = f.months.map((m, i) => `<div class="fin-row"><span>${m}</span><b class="num">${rub(f.income[i])}</b></div>`).join('');
    $('#expenseList').innerHTML = f.months.map((m, i) => `<div class="fin-row"><span>${m}</span><b class="num">${rub(f.expenses[i])}</b></div>`).join('');
    $('#totalIncome').textContent = rub(ti);
    $('#totalExpense').textContent = rub(te);
    $('#profitValue').textContent = rub(ti - te);
}

/* ---------- settings ---------- */
function renderSettings() {
    const s = stats();
    $('#setEmp').textContent = s.totalEmployees;
    $('#setProj').textContent = s.totalProjects;
    $('#setActive').textContent = s.activeProjects;
    $('#setBudget').textContent = rub(s.totalBudget);
    document.querySelectorAll('#themeSeg button').forEach((b) => b.classList.toggle('active', b.dataset.theme === currentTheme()));
}

/* ---------- refresh ---------- */
function refreshAll() {
    renderStats(); renderFeed(); renderProjects(); renderEmployees(); renderFinance(); renderSettings();
    if (activeTab === 'dashboard') buildDashboardCharts();
    if (activeTab === 'finance') buildFinanceChart();
}

/* ---------- navigation ---------- */
const NAV = [
    { id: 'dashboard', label: 'Дашборд',   sub: 'Обзор ключевых показателей компании', icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>' },
    { id: 'projects',  label: 'Проекты',    sub: 'Портфель проектов и их прогресс',      icon: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>' },
    { id: 'employees', label: 'Сотрудники', sub: 'Команда и распределение нагрузки',     icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 3.5a3.2 3.2 0 0 1 0 6.4M21 20c0-2.6-1.6-4.8-4-5.6"/>' },
    { id: 'finance',   label: 'Финансы',    sub: 'Доходы, расходы и прибыль',            icon: '<path d="M3 17l5-5 4 3 7-8"/><path d="M21 7v5h-5"/>' },
    { id: 'settings',  label: 'Настройки',  sub: 'Параметры компании и интерфейса',      icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.8 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.9 6.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 17 4.9l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>' },
];
let activeTab = 'dashboard';
function buildNav() {
    $('#nav').innerHTML = NAV.map((n) => `
        <button class="side-link ${n.id === 'dashboard' ? 'active' : ''}" data-tab="${n.id}">
            <span class="side-link__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">${n.icon}</svg></span>
            ${n.label}
        </button>`).join('');
    $('#nav').querySelectorAll('.side-link').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
}
function switchTab(id) {
    activeTab = id;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    $('#tab-' + id).classList.add('active');
    document.querySelectorAll('.side-link').forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
    const n = NAV.find((x) => x.id === id);
    $('#pageTitle').textContent = n.label; $('#pageSub').textContent = n.sub;
    closeSidebar();
    if (id === 'dashboard') buildDashboardCharts();
    if (id === 'finance') buildFinanceChart();
}

/* ---------- theme ---------- */
function currentTheme() { return document.documentElement.getAttribute('data-theme'); }
function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    $('#themeIcon').innerHTML = t === 'light'
        ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'
        : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
    renderStats();
    if (activeTab === 'dashboard') buildDashboardCharts();
    if (activeTab === 'finance') buildFinanceChart();
    renderSettings();
}

/* ---------- modal ---------- */
let modalSave = null;
function formModal(title, desc, fields, onSave) {
    $('#modalTitle').textContent = title;
    $('#modalDesc').innerHTML = desc;
    $('#modalFields').innerHTML = fields.map((f) => {
        if (f.type === 'select') {
            return `<div class="field"><label>${f.label}</label><select data-f="${f.name}">${f.options.map((o) => `<option value="${o[0]}" ${o[0] === f.value ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>`;
        }
        return `<div class="field"><label>${f.label}</label><input data-f="${f.name}" type="${f.type}" value="${esc(f.value)}" /></div>`;
    }).join('');
    $('#modalSave').textContent = 'Сохранить';
    $('#modalSave').className = 'btn btn--primary';
    modalSave = () => {
        const v = {};
        $('#modalFields').querySelectorAll('[data-f]').forEach((el) => { v[el.dataset.f] = el.value; });
        const res = onSave(v);
        if (res !== false) closeModal();
    };
    openModal();
    setTimeout(() => { const first = $('#modalFields input, #modalFields select'); if (first) first.focus(); }, 60);
}
function confirmModal(title, desc, action, onYes) {
    $('#modalTitle').textContent = title;
    $('#modalDesc').innerHTML = desc;
    $('#modalFields').innerHTML = '';
    const btn = $('#modalSave');
    btn.textContent = action;
    btn.className = 'btn btn--primary';
    btn.style.background = 'var(--bad)';
    modalSave = () => { onYes(); closeModal(); btn.style.background = ''; };
    openModal();
}
function openModal() { $('#modal').classList.add('open'); }
function closeModal() { $('#modal').classList.remove('open'); $('#modalSave').style.background = ''; }

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- sidebar (mobile) ---------- */
function openSidebar() { $('#sidebar').classList.add('open'); $('#overlay').classList.add('show'); }
function closeSidebar() { $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('show'); }

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = (() => { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } })();
    document.documentElement.setAttribute('data-theme', savedTheme || 'dark');

    buildNav();
    refreshAll();
    buildDashboardCharts();

    // theme
    $('#themeToggle').addEventListener('click', () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark'));
    document.querySelectorAll('#themeSeg button').forEach((b) => b.addEventListener('click', () => applyTheme(b.dataset.theme)));
    applyTheme(currentTheme());

    // sidebar
    $('#burger').addEventListener('click', openSidebar);
    $('#overlay').addEventListener('click', closeSidebar);

    // modal
    $('#modalCancel').addEventListener('click', closeModal);
    $('#modalSave').addEventListener('click', () => modalSave && modalSave());
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // projects
    $('#projectSearch').addEventListener('input', (e) => { projectQuery = e.target.value.toLowerCase(); renderProjects(); });
    $('#projectFilters').querySelectorAll('.filter').forEach((b) => b.addEventListener('click', () => {
        $('#projectFilters .filter.active').classList.remove('active'); b.classList.add('active'); projectFilter = b.dataset.filter; renderProjects();
    }));
    $('#addProjectBtn').addEventListener('click', addProject);

    // employees
    $('#employeeSearch').addEventListener('input', (e) => { empQuery = e.target.value.toLowerCase(); renderEmployees(); });
    $('#employeeFilters').querySelectorAll('.filter').forEach((b) => b.addEventListener('click', () => {
        $('#employeeFilters .filter.active').classList.remove('active'); b.classList.add('active'); empFilter = b.dataset.filter; renderEmployees();
    }));
    $('#addEmployeeBtn').addEventListener('click', addEmployee);

    // global search jumps to projects
    $('#globalSearch').addEventListener('input', (e) => {
        const q = e.target.value; if (!q) return;
        if (activeTab !== 'projects') switchTab('projects');
        projectQuery = q.toLowerCase(); $('#projectSearch').value = q; renderProjects();
    });

    // settings actions
    $('#exportBtn').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `techcorp_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href);
        toast('Данные экспортированы');
    });
    $('#resetBtn').addEventListener('click', () => confirmModal('Сбросить данные?', 'Все проекты, сотрудники и финансы вернутся к исходным значениям.', 'Сбросить', () => {
        state = structuredClone(DEFAULT_DATA); save(); refreshAll(); toast('Данные сброшены');
    }));

    // re-fit charts on resize
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => {
        if (activeTab === 'dashboard') buildDashboardCharts(); if (activeTab === 'finance') buildFinanceChart();
    }, 200); });
});
