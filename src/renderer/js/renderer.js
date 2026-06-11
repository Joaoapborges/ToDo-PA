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

        li.innerHTML = `
            <div class="task-info">
                <input type="checkbox" class="task-checkbox" data-id="${task.ID}" ${task.Done ? 'checked' : ''}>
                <div>
                    <span class="task-name">${task.Name}</span>
                    ${dateHtml}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-edit" data-id="${task.ID}">Editar</button>
                <button class="btn-delete" data-id="${task.ID}">Apagar</button>
            </div>
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
    console.log("O ficheiro tasks.js percebeu que a data mudou para:", activeDate);
    
    // Voltar a desenhar as tarefas (aplicando o filtro da nova data)
    renderTasks(currentTasks); 
});

// Inicialização: Carregar tarefas
loadTasks();