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

// (NAVEGAÇÃO) 
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

// (slider semana)
const weekSlider = document.getElementById('week-slider');
const monthYearLabel = document.getElementById('calendar-month-year');
const btnPrevWeek = document.getElementById('btn-prev-week');
const btnNextWeek = document.getElementById('btn-next-week');

let selectedDate = new Date(); // Dia atualmente clicado
let currentWeekStart = getStartOfWeek(new Date()); // Segunda-feira da semana visível

// Função utilitária: Descobrir a Segunda-feira
function getStartOfWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay() || 7; 
    if (day !== 1) d.setHours(-24 * (day - 1)); 
    return d;
}

//  LÓGICA DE NAVEGAÇÃO LATERAL
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remover a classe 'active' de todos os botões e páginas
        navButtons.forEach(btn => btn.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));

        // Adicionar a classe 'active' ao botão clicado
        button.classList.add('active');

        // Encontrar e mostrar a página correspondente
        const targetPageId = button.getAttribute('data-target');
        document.getElementById(targetPageId).classList.add('active');
    });
});

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


// Renderizar os 7 dias
function renderCalendarWeek() {
    weekSlider.innerHTML = ''; 
    
    monthYearLabel.textContent = currentWeekStart.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

    for (let i = 0; i < 7; i++) {
        const dateObj = new Date(currentWeekStart);
        dateObj.setDate(currentWeekStart.getDate() + i);

        const isSelected = dateObj.toDateString() === selectedDate.toDateString();

        const dayCard = document.createElement('div');
        dayCard.className = `day-card ${isSelected ? 'active' : ''}`;
        
        const dayName = dateObj.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', ''); 
        const dayNumber = dateObj.getDate();

        dayCard.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-number">${dayNumber}</span>
        `;

        dayCard.addEventListener('click', () => {
            selectedDate = dateObj; 
            renderCalendarWeek(); 
            
            // LÓGICA FUTURA: 
            // Aqui vamos chamar uma função tipo filterTasksByDate(selectedDate) 
            // para mostrar apenas as tarefas do dia clicado!
        });

        weekSlider.appendChild(dayCard);
    }
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

// Eventos dos botões < e > slider semanal
btnPrevWeek.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderCalendarWeek();
});

btnNextWeek.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderCalendarWeek();
});

// Inicialização: Carregar tarefas
loadTasks();
renderCalendarWeek();

