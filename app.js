let config = null;
const statusMessage = document.getElementById('status-message');
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-description');
const taskEditIdInput = document.getElementById('task-edit-id');
const taskSubmitBtn = document.getElementById('task-submit');
const taskList = document.getElementById('task-list');

function showMessage(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.style.color = isError ? 'red' : 'green';
  setTimeout(() => {
    statusMessage.textContent = '';
  }, 4000);
}

function getHeaders() {
  return {
    'apikey': config.supabasePublishableKey,
    'Authorization': `Bearer ${config.supabasePublishableKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

async function loadTasks() {
  try {
    const url = `${config.supabaseUrl}/rest/v1/${config.tableName}?select=*&order=id.asc`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    showMessage('Error loading tasks: ' + err.message, true);
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;
    item.setAttribute('data-id', task.id);

    const titleEl = document.createElement('h3');
    titleEl.className = 'task-title';
    titleEl.textContent = task.title;

    const descEl = document.createElement('p');
    descEl.className = 'task-description';
    descEl.textContent = task.description || '';

    const statusEl = document.createElement('p');
    statusEl.className = 'task-status';
    statusEl.textContent = task.completed ? 'Status: Completed' : 'Status: Incomplete';

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-task';
    toggleBtn.textContent = task.completed ? 'Mark Incomplete' : 'Mark Complete';
    toggleBtn.onclick = () => toggleTask(task.id, !task.completed);

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-task';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => startEditTask(task);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-task';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteTask(task.id);

    actions.append(toggleBtn, editBtn, deleteBtn);
    item.append(titleEl, descEl, statusEl, actions);
    taskList.appendChild(item);
  });
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const editId = taskEditIdInput.value;

  if (!title) return;

  try {
    if (editId) {
      const url = `${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${editId}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ title, description })
      });
      if (!res.ok) throw new Error('Could not update task');
      showMessage('Task updated successfully');
      taskEditIdInput.value = '';
      taskSubmitBtn.textContent = 'Add Task';
    } else {
      const url = `${config.supabaseUrl}/rest/v1/${config.tableName}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, description, completed: false })
      });
      if (!res.ok) throw new Error('Could not create task');
      showMessage('Task added successfully');
    }

    taskForm.reset();
    loadTasks();
  } catch (err) {
    showMessage(err.message, true);
  }
});

function startEditTask(task) {
  taskTitleInput.value = task.title;
  taskDescInput.value = task.description || '';
  taskEditIdInput.value = task.id;
  taskSubmitBtn.textContent = 'Save Changes';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function toggleTask(id, newStatus) {
  try {
    const url = `${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ completed: newStatus })
    });
    if (!res.ok) throw new Error('Could not change status');
    loadTasks();
  } catch (err) {
    showMessage(err.message, true);
  }
}

async function deleteTask(id) {
  try {
    const url = `${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Could not delete task');
    showMessage('Task deleted');
    loadTasks();
  } catch (err) {
    showMessage(err.message, true);
  }
}

async function init() {
  try {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error('Could not load config.json');
    config = await res.json();
    loadTasks();
  } catch (err) {
    showMessage('Initialization error: ' + err.message, true);
  }
}

init();
