const { app, BrowserWindow, ipcMain } = require('electron');

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Isso permite que o renderer.js utilize módulos Node.js
            contextIsolation: false // Certifique-se de desabilitar isso para permitir acesso aos módulos do Node.js
        }
    });

    mainWindow.loadFile('index.html');
});


ipcMain.on('fechar-app', () => {
    app.quit();
});