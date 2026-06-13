// WIDGET

// Estado
let widgetDate = new Date();
let allTasks = [];

// Elementos
const taskList = document.getElementById('widget-task-list');
const dateLabel = document.getElementById('widget-date-label');
const btnPrev = document.getElementById('widget-prev-day');
const btnNext = document.getElementById('widget-next-day');
const btnPin = document.getElementById('btn-pin');
const btnClose = document.getElementById('btn-close-widget');
const btnAdd = document.getElementById('btn-widget-add');

// --- DATA ---
function formatDateLabel(date) {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    if (date.toDateString() === tomorrow.toDateString()) return 'Amanhã';

    return date.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' });
}

function updateDateLabel() {
    dateLabel.textContent = formatDateLabel(widgetDate);
}

btnPrev.addEventListener('click', () => {
    widgetDate.setDate(widgetDate.getDate() - 1);
    updateDateLabel();
    renderWidgetTasks();
});

btnNext.addEventListener('click', () => {
    widgetDate.setDate(widgetDate.getDate() + 1);
    updateDateLabel();
    renderWidgetTasks();
});

// --- TAREFAS ---
async function loadAndRender() {
    allTasks = await window.todoAPI.getItems();
    renderWidgetTasks();
}

function renderWidgetTasks() {
    taskList.innerHTML = '';

    const todayString = new Date().toDateString();
    const activeDateString = widgetDate.toDateString();

    const filtered = allTasks.filter(task => {
        if (!task.DueDate) return activeDateString === todayString;
        return new Date(task.DueDate).toDateString() === activeDateString;
    });

    if (filtered.length === 0) {
        taskList.innerHTML = '<li class="widget-empty">Sem tarefas para este dia 🎉</li>';
        return;
    }

    filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `widget-task-item ${task.Done ? 'completed' : ''}`;
        li.setAttribute('draggable', 'true');
        li.setAttribute('data-id', task.ID);

        const expandBtnHtml = task.Notes && task.Notes.trim() !== '' ? `
            <button class="btn-expand" aria-label="Expandir descrição">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
        ` : '';

        const descriptionHtml = task.Notes && task.Notes.trim() !== '' ? `
            <div class="widget-task-description">
                ${task.Notes.replace(/\n/g, '<br>')}
            </div>
        ` : '';

        li.innerHTML = `
            <div class="widget-task-header">
                <input type="checkbox" ${task.Done ? 'checked' : ''} data-id="${task.ID}">
                <span class="widget-task-name">${task.Name}</span>
                ${expandBtnHtml}
            </div>
            ${descriptionHtml}
        `;

        // Toggle done
        li.querySelector('input').addEventListener('change', async (e) => {
            const updated = { ...task, Done: e.target.checked ? 1 : 0 };
            await window.todoAPI.saveItem(updated);
            window.todoAPI.notifyTasksChanged();
            await loadAndRender();
        });

        // Expandir notas
        const expandBtn = li.querySelector('.btn-expand');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                const description = li.querySelector('.widget-task-description');
                description.classList.toggle('expanded');
                expandBtn.classList.toggle('open');
            });
        }

        taskList.appendChild(li);
    });

    setupWidgetDragAndDrop();
}

// --- DRAG & DROP ---
function setupWidgetDragAndDrop() {
    let draggedItem = null;

    taskList.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.widget-task-item');
        if (!item) return;
        draggedItem = item;
        setTimeout(() => item.classList.add('dragging'), 0);
    });

    taskList.addEventListener('dragend', async () => {
        if (!draggedItem) return;
        draggedItem.classList.remove('dragging');
        draggedItem = null;

        const items = [...taskList.querySelectorAll('.widget-task-item')];
        const orderedIds = items.map(i => parseInt(i.getAttribute('data-id')));
        await window.todoAPI.updateItemsOrder(orderedIds);
        window.todoAPI.notifyTasksChanged();
        allTasks = await window.todoAPI.getItems();
    });

    taskList.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedItem) return;
        const after = getDragAfterElement(taskList, e.clientY);
        if (!after) taskList.appendChild(draggedItem);
        else taskList.insertBefore(draggedItem, after);
    });
}

function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll('.widget-task-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- CONTROLOS ---
btnClose.addEventListener('click', () => window.close());

// --- MODAL DE NOVA TAREFA ---
const addModal = document.getElementById('widget-task-modal');
const widgetForm = document.getElementById('widget-task-form');
const widgetItemName = document.getElementById('widget-item-name');
const widgetItemNotes = document.getElementById('widget-item-notes');
const widgetCloseModal = document.getElementById('widget-close-modal');

function openWidgetModal() {
    widgetItemName.value = '';
    widgetItemNotes.value = '';
    addModal.classList.add('show');
    widgetItemName.focus();
}

function closeWidgetModal() {
    addModal.classList.remove('show');
}

btnAdd.addEventListener('click', openWidgetModal);
widgetCloseModal.addEventListener('click', closeWidgetModal);

// Fechar ao clicar fora
addModal.addEventListener('click', (e) => {
    if (e.target === addModal) closeWidgetModal();
});

// Submeter
widgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = widgetItemName.value.trim();
    if (!name) return;

    const isToday = widgetDate.toDateString() === new Date().toDateString();
    const dueDate = isToday ? null : widgetDate.toISOString();

    await window.todoAPI.saveItem({
        Name: name,
        Notes: widgetItemNotes.value,
        Done: 0,
        DueDate: dueDate
    });

    window.todoAPI.notifyTasksChanged();
    closeWidgetModal();
    await loadAndRender();
});

// Fechar com Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeWidgetModal();
});

// --- PIN (alwaysOnTop) ---

// --- INIT ---
updateDateLabel();
loadAndRender();