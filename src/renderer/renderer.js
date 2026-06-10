
// CAPTURAR OS ELEMENTOS DO DOM
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

// LÓGICA DE CARREGAMENTO E RENDERIZAÇÃO

// Buscar as tarefas ao backend (através do preload)
// assincrona para esperar pela resposta 
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

    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); margin-top: 40px;">
                <p>Não tens tarefas pendentes.</p>
                <p>Bom trabalho!</p>
            </div>`;
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        // Adicionar a classe 'completed' se a tarefa estiver Done (valor 1)
        li.className = `task-item ${task.Done ? 'completed' : ''}`;
        
        // Formatar a data para exibição (se existir)
        let dateHtml = '';
        if (task.DueDate) {
            const dateObj = new Date(task.DueDate);
            dateHtml = `<small style="display:block; color: var(--text-secondary); font-size: 0.8em; margin-top: 4px;">
                Prazo: ${dateObj.toLocaleDateString('pt-PT')} às ${dateObj.toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}
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

// LÓGICA DE CRUD (CRIAR, ATUALIZAR, APAGAR)

// Submissão do Formulário (Gravar/Atualizar)
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitar o refresh da página

    // Construir o objeto a ser enviado para o todoAPI
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
        loadTasks(); // Recarregar a lista para refletir as alterações
    } catch (error) {
        console.error('Erro ao guardar tarefa:', error);
    }
});

// Delegação de Eventos (Event Delegation) na Lista
// É mais eficiente adicionar 1 listener na <ul> do que 1 listener por cada botão
taskList.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.getAttribute('data-id');

    if (!id) return;

    // Ação: APAGAR
    /* // erro por causa do confirm
   if (target.classList.contains('btn-delete')) {
        if (confirm('Tens a certeza que queres apagar esta tarefa?')) {
            try {
                await window.todoAPI.deleteItem(parseInt(id));
                resetForm();
                loadTasks();
            }catch (error) {
                console.error('Erro ao apagar tarefa:', error);
            }
        }
        
        return;
    }
*/
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
        // Procurar no array carregado a tarefa correspondente
        const taskToEdit = currentTasks.find(t => t.ID === parseInt(id));
        if (taskToEdit) {
            populateForm(taskToEdit);
            openModal();
        }
    }

    // Ação: MARCAR/DESMARCAR CONCLUÍDA DIRETO NA LISTA
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

// Preencher o formulário quando se clica em Editar
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

    btnCancel.style.display = 'block'; // Mostrar botão de cancelar
}

// Limpar o formulário para o estado padrão
function resetForm() {
    taskForm.reset();
    itemIdInput.value = '';
    formTitle.textContent = 'Adicionar Tarefa';
    btnCancel.style.display = 'none';
}

// Alterar o listener do botão Cancelar existente
btnCancel.addEventListener('click', closeModal);

// Fechar no "X"
btnCloseModal.addEventListener('click', closeModal);

// Ao clicar em Nova Tarefa, reseta o formulário e abre o modal
btnNewTask.addEventListener('click', () => {
    resetForm();
    openModal();
    itemNameInput.focus();
});

// Fechar o modal se o utilizador clicar fora da caixa branca
window.addEventListener('click', (e) => {
    if (e.target === taskModal) {
        closeModal();
    }
});

// Carregar tarefas logo após a abertura da aplicação
loadTasks();