const btnOpenWidget = document.getElementById('btn-open-widget');

if (btnOpenWidget) {
    btnOpenWidget.addEventListener('click', () => {
        window.todoAPI.openWidget();
    });
}
