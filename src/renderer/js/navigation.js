


// (NAVEGAÇÃO) 
// O 'DOMContentLoaded' garante que o JS só corre depois do HTML estar 100% pronto no ecrã
document.addEventListener('DOMContentLoaded', () => {

    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');


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

            // Previne erros verificando se a secção realmente existe antes de a tornar visível
            if (targetPage) {
                targetPage.classList.add('active');
            }

        });
    });
});