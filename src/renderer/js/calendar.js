

// (slider semana)
const weekSlider = document.getElementById('week-slider');
const monthYearLabel = document.getElementById('calendar-month-year');
const btnPrevWeek = document.getElementById('btn-prev-week');
const btnNextWeek = document.getElementById('btn-next-week');
const btnToday = document.getElementById('btn-today');

// botao hoje
// botao hoje
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

renderCalendarWeek();