const { contextBridge, ipcRenderer } = require('electron');

// Expomos um objeto chamado 'todoAPI' para a nossa janela (window.todoAPI)
contextBridge.exposeInMainWorld('todoAPI', {
    // Pedimos ao Processo Principal (main.js) para executar as ações
    getItems: () => ipcRenderer.invoke('db:getItems'),
    saveItem: (item) => ipcRenderer.invoke('db:saveItem', item),
    deleteItem: (id) => ipcRenderer.invoke('db:deleteItem', id),
    updateItemsOrder: (orderedIds) => ipcRenderer.invoke('db:updateItemsOrder', orderedIds),
    openWidget: () => ipcRenderer.invoke('widget:open'),
    notifyTasksChanged: () => ipcRenderer.invoke('tasks:changed'),
    onTasksRefresh: (callback) => ipcRenderer.on('tasks:refresh', () => callback()),
    togglePin: (pinned) => ipcRenderer.invoke('widget:togglePin', pinned)
});