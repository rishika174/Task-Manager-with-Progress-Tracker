const STORAGE_KEY = 'tasks_v1_rishika';
const THEME_KEY = 'task_theme';

const taskInput = document.getElementById('taskInput');
const dueInput = document.getElementById('dueInput');
const addBtn = document.getElementById('addBtn');
const tasksEl = document.getElementById('tasks');
const emptyState = document.getElementById('emptyState');
const progressLabel = document.getElementById('progressLabel');
const progressFill = document.getElementById('progressFill');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const doneCount = document.getElementById('doneCount');
const search = document.getElementById('search');
const filter = document.getElementById('filter');
const nextDue = document.getElementById('nextDue');
const themeToggle = document.getElementById('themeToggle');

document.getElementById('clearCompleted').addEventListener('click', () => {
    tasks = tasks.filter(t => !t.done);
    saveTasks(); render();
});
document.getElementById('clearAll').addEventListener('click', () => {
    if (confirm('Clear ALL tasks?')) { tasks = []; saveTasks(); render(); }
});
document.getElementById('sortDue').addEventListener('click', () => { tasks.sort(sortByDue); saveTasks(); render(); });

function loadTasks() {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : [] } catch (e) { return [] }
}
function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

let tasks = loadTasks();

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function sortByDue(a, b) { if (!a.due && !b.due) return 0; if (!a.due) return 1; if (!b.due) return -1; return (a.due > b.due) ? 1 : -1; }

function addTask() {
    const title = taskInput.value.trim(); if (!title) { taskInput.focus(); return }
    const t = { id: uid(), title, due: dueInput.value || null, notes: '', done: false, created: new Date().toISOString() };
    tasks.unshift(t); saveTasks(); render(); taskInput.value = ''; dueInput.value = '';
}

function render() {
    const q = search.value.trim().toLowerCase(); const f = filter.value;
    let visible = tasks.slice();

    if (f === 'active') visible = visible.filter(t => !t.done);
    if (f === 'completed') visible = visible.filter(t => t.done);
    if (f === 'due-soon') {
        const now = new Date(); const soon = new Date(); soon.setDate(now.getDate() + 3);
        visible = visible.filter(t => t.due && new Date(t.due) <= soon);
    }

    if (q) visible = visible.filter(t => t.title.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q));

    tasksEl.innerHTML = '';
    emptyState.style.display = visible.length === 0 ? 'block' : 'none';

    visible.forEach(t => {
        const el = document.createElement('div'); el.className = 'task' + (t.done ? ' completed' : '');
        el.innerHTML = `
          <div style="display:flex;gap:10px;align-items:flex-start;flex:1">
            <input type="checkbox" ${t.done ? 'checked' : ''} />
            <div class="left">
              <div class="title">${escapeHtml(t.title)}</div>
              <div class="meta">${t.due ? 'Due: ' + t.due : ''} ${t.notes ? ' • ' + escapeHtml(t.notes) : ''}</div>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-ghost small edit">Edit</button>
            <button class="btn small delete">Delete</button>
          </div>
        `;

        el.querySelector('input[type="checkbox"]').addEventListener('change', (e) => { t.done = e.target.checked; saveTasks(); updateProgress(); render(); });
        el.querySelector('.delete').addEventListener('click', () => { if (confirm('Delete this task?')) { tasks = tasks.filter(x => x.id !== t.id); saveTasks(); render(); } });
        el.querySelector('.edit').addEventListener('click', () => { openEditDialog(t); });

        tasksEl.appendChild(el);
    });

    updateProgress();
}

function updateProgress() {
    const total = tasks.length; const done = tasks.filter(t => t.done).length; const active = total - done;
    const pct = total ? Math.round((done / total) * 100) : 0;
    progressLabel.textContent = pct + '% complete';
    progressFill.style.width = pct + '%';
    totalCount.textContent = total + ' total';
    activeCount.textContent = active + ' active';
    doneCount.textContent = done + ' done';

    const upcoming = tasks.filter(t => t.due && !t.done).sort((a, b) => new Date(a.due) - new Date(b.due))[0];
    nextDue.textContent = upcoming ? ('Next due: ' + upcoming.due) : 'No upcoming due date';

    document.title = `(${pct}%) Task Manager — Progress Tracker`;
}

function openEditDialog(task) {
    const newTitle = prompt('Edit task title', task.title); if (newTitle === null) return;
    task.title = newTitle.trim() || task.title;
    const newDue = prompt('Due date (YYYY-MM-DD) — leave blank to remove', task.due || ''); if (newDue !== null) { task.due = newDue.trim() || null; }
    const newNotes = prompt('Notes (optional)', task.notes || ''); if (newNotes !== null) { task.notes = newNotes.trim(); }
    saveTasks(); render();
}

function escapeHtml(s) { return String(s).replace(/[&<>\"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
search.addEventListener('input', render);
filter.addEventListener('change', render);

// Theme toggle
function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    themeToggle.textContent = theme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener('click', () => {
    const current = document.body.classList.contains('light') ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
});

const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
applyTheme(savedTheme);

render();
window.__tasks = tasks;