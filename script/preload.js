const { contextBridge, ipcRenderer } = require('electron');

console.log("Preload carregado!");

contextBridge.exposeInMainWorld('electronAPI', {
    buscarUsuario: (CPF, senha) => ipcRenderer.invoke('buscarUsuario', CPF, senha),
    inserirAgendamento: (nome, data, hora, servico) => ipcRenderer.invoke('inserirAgendamento', nome, data, hora, servico)
});