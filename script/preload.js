const { contextBridge, ipcRenderer } = require('electron');

console.log("Preload carregado!");

contextBridge.exposeInMainWorld('electronAPI', {
    buscarUsuario: (CPF, senha) => ipcRenderer.invoke('buscarUsuario', CPF, senha)
});