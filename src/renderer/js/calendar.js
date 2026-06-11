

// (slider semana)
const weekSlider = document.getElementById('week-slider');
const monthYearLabel = document.getElementById('calendar-month-year');
const btnPrevWeek = document.getElementById('btn-prev-week');
const btnNextWeek = document.getElementById('btn-next-week');
const btnToday = document.getElementById('btn-today');
const monthSelect = document.getElementById('month-select');
const yearSelect = document.getElementById('year-select');

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
// botoes hoje
if (btnToday) {
    btnToday.addEventListener('click', () => {
        const today = new Date();
        
        selectedDate = today; 
        currentWeekStart = getStartOfWeek(today);
        renderCalendarWeek(); 
        window.dispatchEvent(new CustomEvent('dateSelected', { 
            detail: { date: today } 
        }));
    });
}

const btnTodayMonth = document.getElementById('btn-today-month');

if (btnTodayMonth) {
    btnTodayMonth.addEventListener('click', () => {
        currentMonthView = new Date();
        renderFullMonth();
    });
}


// FUNÇÃO AUXILIAR 
// Descobrir a Segunda-feira da semana de uma determinada data
function getStartOfWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay() || 7; 
    if (day !== 1) d.setHours(-24 * (day - 1)); 
    return d;
}

// VARIÁVEIS DE ESTADO 
let selectedDate = new Date(); // Dia atualmente selecionado
let currentWeekStart = getStartOfWeek(new Date()); // Dia de início da barra (Segunda-feira)


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
            
            // Criar um evento personalizado chamado 'dateSelected'
            // e passar a data que foi clicada dentro do 'detail'
            const event = new CustomEvent('dateSelected', { detail: { date: selectedDate } });
            
            // transmitir o evento para toda a janela window
            window.dispatchEvent(event);
        });

        weekSlider.appendChild(dayCard);
    }
}

// Eventos dos botões < e > slider semanal
btnPrevWeek.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderCalendarWeek();
});

btnNextWeek.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderCalendarWeek();
});



// --- LÓGICA DO CALENDÁRIO MENSAL COMPLETO ---

const monthGrid = document.getElementById('month-grid');
const monthViewTitle = document.getElementById('month-view-title');
const btnPrevMonth = document.getElementById('btn-prev-month');
const btnNextMonth = document.getElementById('btn-next-month');

let currentMonthView = new Date(); // Controla que mês estamos a ver

// Ouve as atualizações vindas do renderer.js para recarregar o calendário
window.addEventListener('tasksUpdated', () => {
    renderFullMonth();
});

// função async para poder esperar pelos dados da bd
async function renderFullMonth() {
    if (!monthGrid) return;
    
    monthGrid.innerHTML = '';
    
    const year = currentMonthView.getFullYear();
    const month = currentMonthView.getMonth(); 
    
    if (monthSelect) monthSelect.value = month;
    if (yearSelect) yearSelect.value = year;

    // Ir buscar todas as tarefas à base de dados
    let allTasks = [];
    try {
        if (window.todoAPI) {
            allTasks = await window.todoAPI.getItems();
        }
    } catch (error) {
        console.error('Erro ao carregar tarefas no calendário mensal:', error);
    }

    const firstDayOfMonth = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Preencher os dias do Mês Anterior (Padding)
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const cell = createMonthCell(daysInPrevMonth - i, true);
        monthGrid.appendChild(cell);
    }

    // Preencher os dias do Mês Atual COM AS TAREFAS
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
        const cell = createMonthCell(i, false, isToday);
        
        // Formatar a data deste quadradinho para comparar com a DueDate das tarefas
        const currentCellDate = new Date(year, month, i).toDateString();
        
        // Filtrar tarefas que pertençam a este dia específico
        const dayTasks = allTasks.filter(task => {
            if (!task.DueDate) return false; // Ignora tarefas "Sem prazo definido" nesta vista
            const taskDate = new Date(task.DueDate);
            return taskDate.toDateString() === currentCellDate;
        });

        // Criar as etiquetas (chips) para cada tarefa encontrada
        dayTasks.forEach(task => {
            let styleClass = task.Done ? 'done-task' : 'primary-fill';
            
            const container = cell.querySelector('.event-container');
            const chip = document.createElement('div');
            chip.className = `event-chip ${styleClass}`;
            chip.textContent = task.Name;
            chip.title = task.Name; 
            
            // --- cLIQUE NA TAREFA ---
            chip.addEventListener('click', (e) => {
                e.stopPropagation(); // Impede que o clique afete outras coisas na célula
                
                //  Extrair a data exata desta tarefa
                const taskDate = new Date(task.DueDate);
                
                //  Atualizar as variáveis do calendário semanal (para a barra mostrar a semana certa)
                selectedDate = taskDate;
                currentWeekStart = getStartOfWeek(taskDate);
                renderCalendarWeek(); 
                
                // Avisar o renderer.js para filtrar as tarefas para este dia
                window.dispatchEvent(new CustomEvent('dateSelected', { 
                    detail: { date: taskDate } 
                }));
                
                //  Simular um clique no botão "Tarefas" da Sidebar para mudar de página
                const btnTarefas = document.querySelector('.nav-btn[data-target="tarefas-page"]');
                if (btnTarefas) {
                    btnTarefas.click();
                }
            });
            
            container.appendChild(chip);
        });

        monthGrid.appendChild(cell);
    }

    // Preencher os dias do Mês Seguinte para completar a grelha
    const totalCells = monthGrid.children.length;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
        const cell = createMonthCell(i, true);
        monthGrid.appendChild(cell);
    }
}

// Função para criar cada quadradinho do calendário
function createMonthCell(dayNumber, isInactive, isToday = false) {
    const cell = document.createElement('div');
    cell.className = `month-cell ${isInactive ? 'inactive' : ''}`;
    
    //destaque dia
    if (isToday && !isInactive) {
        cell.classList.add('highlight');
    }

    const numberSpan = document.createElement('span');
    numberSpan.className = 'cell-number';
    numberSpan.textContent = dayNumber;

    const eventContainer = document.createElement('div');
    eventContainer.className = 'event-container';

    cell.appendChild(numberSpan);
    cell.appendChild(eventContainer);

    return cell;
}

// Função apenas para injetar etiquetas (chips) estáticas de teste
function addMockEvent(cell, title, styleClass) {
    const container = cell.querySelector('.event-container');
    const chip = document.createElement('div');
    chip.className = `event-chip ${styleClass}`;
    chip.textContent = title;
    container.appendChild(chip);
}

// Navegação do mês
if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => {
        currentMonthView.setMonth(currentMonthView.getMonth() - 1);
        renderFullMonth();
    });
}

if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
        currentMonthView.setMonth(currentMonthView.getMonth() + 1);
        renderFullMonth();
    });
}

if (monthSelect) {
    monthNames.forEach((monthName, index) => {
        const option = document.createElement('option');
        option.value = index; // 0 a 11
        option.textContent = monthName;
        monthSelect.appendChild(option);
    });
    
    // Ouvir alterações no mês
    monthSelect.addEventListener('change', (e) => {
        currentMonthView.setMonth(parseInt(e.target.value));
        renderFullMonth();
    });
}

// Preencher a lista de Anos (Ex: Ano atual - 5 até Ano atual + 10)
if (yearSelect) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 5; y <= currentYear + 10; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }
    
    // Ouvir alterações no ano
    yearSelect.addEventListener('change', (e) => {
        currentMonthView.setFullYear(parseInt(e.target.value));
        renderFullMonth();
    });
}


renderFullMonth();
renderCalendarWeek();