// Simple, dependency-free Todo app
// Features: add/edit/delete/toggle, filters, search, toggle all, clear completed, localStorage, import/export

const STORAGE_KEY = "todo-app:v1";

/**
 * @typedef {Object} Todo
 * @property {string} id
 * @property {string} title
 * @property {boolean} completed
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/** @type {Todo[]} */
let todos = [];

const elements = {
  form: document.querySelector('#new-todo-form'),
  input: document.querySelector('#new-todo-input'),
  list: document.querySelector('#todo-list'),
  empty: document.querySelector('#empty-state'),
  filterRadios: /** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll('input[name="filter"]')),
  search: document.querySelector('#search'),
  count: document.querySelector('#todo-count'),
  toggleAll: document.querySelector('#toggle-all'),
  clearCompleted: document.querySelector('#clear-completed'),
  exportBtn: document.querySelector('#export'),
  importInput: document.querySelector('#import'),
};

const uiState = {
  filter: /** @type {'all' | 'active' | 'completed'} */ ('all'),
  query: '',
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        todos = parsed.map((t) => ({ ...t, createdAt: Number(t.createdAt), updatedAt: Number(t.updatedAt) }));
      }
    }
  } catch (err) {
    console.error('Failed to load from storage', err);
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (err) {
    console.error('Failed to save to storage', err);
  }
}

function generateId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function getVisibleTodos() {
  const q = uiState.query.trim().toLowerCase();
  return todos.filter((t) => {
    if (uiState.filter === 'active' && t.completed) return false;
    if (uiState.filter === 'completed' && !t.completed) return false;
    if (q && !t.title.toLowerCase().includes(q)) return false;
    return true;
  });
}

function updateCount() {
  const remaining = todos.filter((t) => !t.completed).length;
  const total = todos.length;
  elements.count.textContent = `${remaining} of ${total} remaining`;
}

function render() {
  const visible = getVisibleTodos();
  elements.list.innerHTML = '';

  if (visible.length === 0) {
    elements.empty.hidden = false;
  } else {
    elements.empty.hidden = true;
  }

  const fragment = document.createDocumentFragment();
  for (const todo of visible) {
    fragment.appendChild(renderTodoItem(todo));
  }
  elements.list.appendChild(fragment);
  updateCount();
}

function renderTodoItem(todo) {
  const li = document.createElement('li');
  li.className = `todo${todo.completed ? ' completed' : ''}`;
  li.dataset.id = todo.id;

  const left = document.createElement('div');
  left.className = 'todo__left';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.ariaLabel = 'Toggle completed';
  checkbox.addEventListener('change', () => toggleTodo(todo.id));

  const title = document.createElement('p');
  title.className = 'todo__title';
  title.textContent = todo.title;
  title.title = todo.title;
  title.tabIndex = 0;
  title.addEventListener('dblclick', () => startEditing(li, todo));

  const meta = document.createElement('div');
  meta.className = 'todo__meta';
  const dt = new Date(todo.createdAt);
  meta.textContent = `Added ${dt.toLocaleString()}`;

  left.appendChild(checkbox);
  left.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'todo__actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'icon-btn';
  editBtn.title = 'Edit';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => startEditing(li, todo));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'icon-btn';
  deleteBtn.title = 'Delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(left);
  li.appendChild(meta);
  li.appendChild(actions);

  return li;
}

function startEditing(li, todo) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = todo.title;
  input.className = 'edit-input';
  input.style.width = '100%';

  const left = li.querySelector('.todo__left');
  const title = left.querySelector('.todo__title');
  left.replaceChild(input, title);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  const finish = () => {
    const newTitle = input.value.trim();
    if (newTitle.length === 0) {
      deleteTodo(todo.id);
      return;
    }
    if (newTitle !== todo.title) {
      updateTodo(todo.id, { title: newTitle });
    } else {
      render();
    }
  };

  input.addEventListener('blur', finish);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish();
    if (e.key === 'Escape') render();
  });
}

function addTodo(title) {
  const trimmed = title.trim();
  if (!trimmed) return;
  const now = Date.now();
  todos.unshift({ id: generateId(), title: trimmed, completed: false, createdAt: now, updatedAt: now });
  save();
  render();
}

function updateTodo(id, updates) {
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return;
  todos[idx] = { ...todos[idx], ...updates, updatedAt: Date.now() };
  save();
  render();
}

function toggleTodo(id) {
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  updateTodo(id, { completed: !t.completed });
}

function deleteTodo(id) {
  const next = todos.filter((t) => t.id !== id);
  todos = next;
  save();
  render();
}

function toggleAll() {
  const allCompleted = todos.every((t) => t.completed);
  const next = todos.map((t) => ({ ...t, completed: !allCompleted, updatedAt: Date.now() }));
  todos = next;
  save();
  render();
}

function clearCompleted() {
  todos = todos.filter((t) => !t.completed);
  save();
  render();
}

function handleImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((t) => typeof t.title === 'string' && typeof t.completed === 'boolean');
        const now = Date.now();
        todos = valid.map((t) => ({
          id: t.id || generateId(),
          title: t.title.trim().slice(0, 500),
          completed: Boolean(t.completed),
          createdAt: Number(t.createdAt) || now,
          updatedAt: Number(t.updatedAt) || now,
        }));
        save();
        render();
      }
    } catch (e) {
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
}

function handleExport() {
  const blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'todos.json';
  a.click();
  URL.revokeObjectURL(url);
}

function attachEvents() {
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo(elements.input.value);
    elements.input.value = '';
    elements.input.focus();
  });

  elements.filterRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      uiState.filter = /** @type any */ (radio.value);
      render();
    });
  });

  let searchDebounce = 0;
  elements.search.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(() => {
      uiState.query = elements.search.value;
      render();
    }, 120);
  });

  elements.toggleAll.addEventListener('click', toggleAll);
  elements.clearCompleted.addEventListener('click', clearCompleted);
  elements.exportBtn.addEventListener('click', handleExport);
  elements.importInput.addEventListener('change', (e) => handleImport(e.target.files?.[0]));
}

// Init
load();
attachEvents();
render();