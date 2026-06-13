
// importa os 3 modulos: 
// app ( gerir comportamento da app em segundo plano: escutar eventos sistema, fechar janelas etc)
// browserWindow ( responsavel por renderizar o html )
// ipcMain ( ponte para interface interagir com o SO sem comprometer segurança da aplicação )
const {app, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
const os = require('os');
const db = require('../database/database'); // importa ficheiro db

let mainWindow = null;
let widgetWindow = null; 

function createWindow(){
    //criar a janela
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 600,
        webPreferences: {
            preload: join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    mainWindow.maximize();
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
}


function createWidgetWindow() {
    // Se já existe, apenas traz para a frente
    if (widgetWindow) {
        widgetWindow.focus();
        return;
    }

    widgetWindow = new BrowserWindow({
        width: 340,
        height: 500,
        frame: false,           // sem barra de título do SO
        transparent: true,      // fundo transparente (para CSS arredondado)
        resizable: false,
        alwaysOnTop: false,     // começa desativado (o utilizador controla com o pin)
        skipTaskbar: true,      // não aparece na taskbar
        webPreferences: {
            preload: join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });


widgetWindow.loadFile(join(__dirname, '../renderer/widget.html'));

    // Limpa a referência quando o widget é fechado
    widgetWindow.on('closed', () => {
        widgetWindow = null;

         // Se a janela principal não existir ou estiver destruída, abre-a
        if (!mainWindow || mainWindow.isDestroyed()) {
            createWindow();
        } else {
            // Se existir mas estiver escondida, mostra-a
            mainWindow.show();
        }
    });
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
        
        ipcMain.handle('db:updateItemsOrder', async (event, orderedIds) => {
            return await db.UpdateItemsOrderAsync(orderedIds);
        });

        ipcMain.handle('widget:open', () => {
            createWidgetWindow();
        });

        ipcMain.handle('tasks:changed', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('tasks:refresh');
            }
        });

        ipcMain.handle('widget:togglePin', (event, pinned) => {
            if (widgetWindow && !widgetWindow.isDestroyed()) {
                if (pinned) {
                    // Pin ativo: sempre no topo, escondido da taskbar
                    widgetWindow.setAlwaysOnTop(true, 'screen-saver');
                    widgetWindow.setSkipTaskbar(true);
                } else {
                    // Pin desativo: comportamento normal, aparece na taskbar
                    widgetWindow.setAlwaysOnTop(false);
                    widgetWindow.setSkipTaskbar(false);
                }
            }
        });

        // Cria a janela
        createWindow();

    } catch (error) {
        console.error("Erro ao iniciar a aplicação:", error);
    }
});

// Encerra a app quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});