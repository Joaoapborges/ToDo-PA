// --- LÓGICA DO TEMA (Modo Claro/Escuro) ---
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const htmlElement = document.documentElement;

const savedTheme = localStorage.getItem('app-theme') || 'light';
if (savedTheme === 'dark') {
    htmlElement.setAttribute('data-theme', 'dark');
    btnThemeToggle.textContent = 'Mudar para Light Mode';
}

btnThemeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        htmlElement.removeAttribute('data-theme');
        localStorage.setItem('app-theme', 'light');
        btnThemeToggle.textContent = 'Mudar para Dark Mode';
    } else {
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('app-theme', 'dark');
        btnThemeToggle.textContent = 'Mudar para Light Mode';
    }
});