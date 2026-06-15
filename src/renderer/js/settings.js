document.addEventListener('DOMContentLoaded', () => {
   
    const btnChangeName = document.getElementById('btn-change-name');
    const nameInput = document.getElementById('name-input');
    const displayName = document.getElementById('display-name');
    const userGreeting = document.getElementById('user-greeting');
    const avatarInitial = document.getElementById('avatar-initial');

    btnChangeName.addEventListener('click', () => {
        // Obter o valor escrito no input e remover espaços em branco extra
        const newName = nameInput.value.trim();

        // Verificar se o input não está vazio
        if (newName !== '') {
            // Atualizar o nome nas definições
            displayName.textContent = newName;
            
            // Atualizar a saudação principal
            userGreeting.textContent = `Olá, ${newName}!`;
            
            //Atualizar a letra inicial no avatar (ex: "Maria" -> "M")
            avatarInitial.textContent = newName.charAt(0).toUpperCase();

            // Limpar a caixa de texto depois de alterar
            nameInput.value = '';
            
            //Guardar o nome no LocalStorage para não desaparecer quando fechas a app
            localStorage.setItem('savedUserName', newName);
        } else {
            alert('Por favor, escreve um nome válido.');
        }
    });

    // (Opcional) Carregar o nome guardado quando a app abre
    const savedName = localStorage.getItem('savedUserName');
    if (savedName) {
        displayName.textContent = savedName;
        userGreeting.textContent = `Olá, ${savedName}!`;
        avatarInitial.textContent = savedName.charAt(0).toUpperCase();
    }
});