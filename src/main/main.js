
// importa os 3 modulos: 
// app ( gerir comportamento da app em segundo plano: escutar eventos sistema, fechar janelas etc)
// browserWindow ( responsavel por renderizar o html )
// ipcMain ( ponte para interface interagir com o SO sem comprometer segurança da aplicação )
const {app, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
const os = require('os');
const db = require('../database/database'); // importa ficheiro db

function createWindow(){
    //criar a janela
    const window = new BrowserWindow({
        width: 1200,
        height: 600,
        webPreferences:{
            preload: join (__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true // nao deixa o front e o back end falarem diretamente um com o outr, tem de passar pelo ipc 
        }
    });
    window.maximize();
    window.loadFile(join(__dirname, '../renderer/index.html'));
}

// Quando o Electron estiver pronto, iniciamos tudo
app.whenReady().then(async () => {
    try {
        // Inicia a db
        await db.InitDatabase();
        console.log("Base de dados iniciada com sucesso!");

        // Configura os "Ouvintes" (Handlers) para os pedidos do preload.js
        ipcMain.handle('db:getItems', async () => {
            return await db.GetItemsAsync();
        });

        ipcMain.handle('db:saveItem', async (event, item) => {
            return await db.SaveItemAsync(item);
        });

        ipcMain.handle('db:deleteItem', async (event, id) => {
            return await db.DeleteItemAsync(id);
        });

        // Cria a janela
        createWindow();

    } catch (error) {
        console.error("Erro ao iniciar a aplicação:", error);
    }
});

// Encerra a app quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});