// --- CAPTURAR OS ELEMENTOS DO DOM (CRUD) ---
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const itemIdInput = document.getElementById('item-id');
const itemNameInput = document.getElementById('item-name');
const itemNotesInput = document.getElementById('item-notes');
const itemDueDateInput = document.getElementById('item-due-date');
const itemDoneInput = document.getElementById('item-done');
const formTitle = document.getElementById('form-title');
const btnCancel = document.getElementById('btn-cancel');
const btnNewTask = document.getElementById('btn-new-task');
const taskModal = document.getElementById('task-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const confirmModal = document.getElementById('confirm-modal');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');
const btnCancelDelete = document.getElementById('btn-cancel-delete');


// LÓGICA DE CRUD E ESTADO

// Variável para guardar o estado das tarefas na memória
let currentTasks = [];

// Funções para gerir o Modal
function openModal() {
    taskModal.classList.add('show');
}

function closeModal() {
    taskModal.classList.remove('show');
    resetForm();
}

// Buscar as tarefas ao backend (através do preload)
async function loadTasks() {
    try {
        currentTasks = await window.todoAPI.getItems();
        renderTasks(currentTasks);
        window.dispatchEvent(new Event('tasksUpdated'));
    } catch (error) {
        console.error('Erro ao carregar tarefas do SQLite:', error);
    }
}

// Transformar o array de dados em elementos HTML
function renderTasks(tasks) {
     taskList.innerHTML = ''; // Limpar a lista atual

     // Obter a string da data de "Hoje" e da "Data Ativa" (selecionada no calendário)
    const todayString = new Date().toDateString();
    const activeDateString = activeDate.toDateString();

    
    // Filtrar as tarefas para mostrar apenas as do dia selecionado
    const filteredTasks = tasks.filter(task => {
        if (!task.DueDate) {
            // Mostra apenas se o dia selecionado no calendário for o dia de "Hoje"
            return activeDateString === todayString;
        }
        

        // Se a tarefa TEM data limite:
        const taskDate = new Date(task.DueDate);
        // Mostra apenas se bater certo com o dia selecionado no calendário
        return taskDate.toDateString() === activeDateString;
    });


    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <p>Não tens tarefas pendentes para este dia.</p>
                <p>Bom descanso!</p>
            </div>`;
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.Done ? 'completed' : ''}`;
        
        // Adicionar atributos para o Drag & Drop
        li.setAttribute('draggable', 'true');
        li.setAttribute('data-id', task.ID); 

        let dateHtml = '';
        if (task.DueDate) {
            const dateObj = new Date(task.DueDate);
            dateHtml = `<small class="task-date-info">
                Prazo: ${dateObj.toLocaleDateString('pt-PT')} às ${dateObj.toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}
            </small>`;
        } else {
            // Pequeno indicador de que a tarefa não tem data (Opcional)
            dateHtml = `<small class="task-date-info">
                Sem prazo definido
            </small>`;
        }

        // Descrição
        let expandBtnHtml = '';
        let descriptionHtml = '';

        // Se existirem notas e não forem apenas espaços em branco
        if (task.Notes && task.Notes.trim() !== '') {
            // Cria o botão com o ícone SVG da seta
            expandBtnHtml = `
                <button class="btn-expand" aria-label="Expandir descrição">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            `;
            // div da descrição (usando replace para manter quebras de linha reais)
            descriptionHtml = `
                <div class="task-description">
                    ${task.Notes.replace(/\n/g, '<br>')}
                </div>
            `;
        }


        // item 

        li.innerHTML = `
            <div class="task-header">
                <div class="task-info">
                    <input type="checkbox" class="task-checkbox" data-id="${task.ID}" ${task.Done ? 'checked' : ''}>
                    <div>
                        <span class="task-name">${task.Name}</span>
                        ${dateHtml}
                    </div>
                </div>
                <div class="task-actions" style="display: flex; gap: 10px; align-items: center;">
                    ${expandBtnHtml}
                    <button class="btn-edit" data-id="${task.ID}">Editar</button>
                    <button class="btn-delete" data-id="${task.ID}">Apagar</button>
                </div>
            </div>
            ${descriptionHtml}
        `;
        taskList.appendChild(li);
    });
}

// Submissão do Formulário (Gravar/Atualizar)
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const taskItem = {
        ID: itemIdInput.value ? parseInt(itemIdInput.value) : null,
        Name: itemNameInput.value,
        Notes: itemNotesInput.value,
        Done: itemDoneInput.checked ? 1 : 0,
        DueDate: itemDueDateInput.value || null
    };

    try {
        await window.todoAPI.saveItem(taskItem);
        closeModal();
        loadTasks(); // Recarregar a lista
    } catch (error) {
        console.error('Erro ao guardar tarefa:', error);
    }
});

// Delegação de Eventos na Lista
taskList.addEventListener('click', async (e) => {
    const target = e.target;

    //EXPANDIR / COLAPSAR DESCRIÇÃO
    //  closest() porque o utilizador pode clicar exatamente em cima da linha do SVG
    const expandBtn = target.closest('.btn-expand');
    if (expandBtn) {
        const taskItem = expandBtn.closest('.task-item');
        const description = taskItem.querySelector('.task-description');
        
        if (description) {
            description.classList.toggle('expanded');
            expandBtn.classList.toggle('open');
        }
        return; // Pára a execução aqui, pois não precisamos de verificar IDs para expandir
    }


    const id = target.getAttribute('data-id');

    if (!id) return;

    // Ação: APAGAR
    if (target.classList.contains('btn-delete')) {
        const idToDelete = parseInt(id);
        confirmModal.classList.add('show');

        btnConfirmDelete.onclick = async () => {
            try {
                await window.todoAPI.deleteItem(idToDelete);
                loadTasks();
            } catch (error) {
                console.error('Erro ao apagar tarefa:', error);
            } finally {
                confirmModal.classList.remove('show');
            }
        };

        btnCancelDelete.onclick = () => {
            confirmModal.classList.remove('show');
        };

        return;
    }

    // Ação: EDITAR
    if (target.classList.contains('btn-edit')) {
        const taskToEdit = currentTasks.find(t => t.ID === parseInt(id));
        if (taskToEdit) {
            populateForm(taskToEdit);
            openModal();
        }
    }

    // Ação: MARCAR/DESMARCAR CONCLUÍDA
    if (target.classList.contains('task-checkbox')) {
        const taskToToggle = currentTasks.find(t => t.ID === parseInt(id));
        if (taskToToggle) {
            const updatedTask = {
                ID: taskToToggle.ID,
                Name: taskToToggle.Name,
                Notes: taskToToggle.Notes,
                Done: target.checked ? 1 : 0,
                DueDate: taskToToggle.DueDate
            };
            await window.todoAPI.saveItem(updatedTask);
            loadTasks();
        }
    }
});


// LÓGICA DE DRAG E DROP NATIVO 
function setupDragAndDrop() {
    let draggedItem = null;

    // Quando começamos a arrastar
    taskList.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.task-item');
        if (!item) return;

        draggedItem = item;
        setTimeout(() => item.classList.add('dragging'), 0);
    });

    // Quando o item é largado ou o arrasto termina
    taskList.addEventListener('dragend', async (e) => {
        if (!draggedItem) return;
        
        draggedItem.classList.remove('dragging');
        draggedItem = null;

        // Lê a nova ordem visual do DOM (recolhe os data-ids dos <li>)
        const currentItems = [...taskList.querySelectorAll('.task-item')];
        const orderedIds = currentItems.map(item => parseInt(item.getAttribute('data-id')));

        try {
            // Envia a nova ordem para o backend
            await window.todoAPI.updateItemsOrder(orderedIds);
            
            // Recarrega o estado em memória para não perdermos a consistência
            currentTasks = await window.todoAPI.getItems();
            window.dispatchEvent(new Event('tasksUpdated'));
        } catch (error) {
            console.error("Erro ao guardar nova ordem:", error);
        }
    });

    // Reordenar os elementos no ecrã enquanto arrastamos
    taskList.addEventListener('dragover', (e) => {
        e.preventDefault(); // Obrigatório para permitir o "drop"
        
        if (!draggedItem) return;

        const afterElement = getDragAfterElement(taskList, e.clientY);
        
        if (afterElement == null) {
            taskList.appendChild(draggedItem);
        } else {
            taskList.insertBefore(draggedItem, afterElement);
        }
    });
}

// Descobre atrás de que elemento o rato está a passar
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}


// FUNÇÕES UTILITÁRIAS DE INTERFACE

// Preencher o formulário
function populateForm(task) {
    formTitle.textContent = 'Editar Tarefa';
    itemIdInput.value = task.ID;
    itemNameInput.value = task.Name;
    itemNotesInput.value = task.Notes || '';
    itemDoneInput.checked = task.Done === 1;
    
    if (task.DueDate) {
        const dateStr = new Date(task.DueDate).toISOString().slice(0, 16);
        itemDueDateInput.value = dateStr;
    } else {
        itemDueDateInput.value = '';
    }

    btnCancel.style.display = 'block';
}

// Limpar o formulário
function resetForm() {
    taskForm.reset();
    itemIdInput.value = '';
    formTitle.textContent = 'Adicionar Tarefa';
    btnCancel.style.display = 'none';
}


btnCancel.addEventListener('click', closeModal);
btnCloseModal.addEventListener('click', closeModal);

btnNewTask.addEventListener('click', () => {
    resetForm();
    openModal();
    itemNameInput.focus();
});

// Fechar modal clicando fora
window.addEventListener('click', (e) => {
    if (e.target === taskModal) {
        closeModal();
    }
});

// Variável para saber qual é a data selecionada atualmente (por defeito é hoje)
let activeDate = new Date();

// Escutar as mudanças de dia vindas do calendário
window.addEventListener('dateSelected', (e) => {
    activeDate = e.detail.date; // Atualizar a data ativa
    renderTasks(currentTasks); 
});


// Inicialização: Configura eventos e carrega tarefas
setupDragAndDrop();
loadTasks();