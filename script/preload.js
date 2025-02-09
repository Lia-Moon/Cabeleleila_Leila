const { contextBridge, ipcRenderer } = require('electron');

console.log("Preload carregado!");

contextBridge.exposeInMainWorld('electronAPI', {
    buscarUsuario: (CPF, senha) => ipcRenderer.invoke('buscarUsuario', CPF, senha),
    inserirAgendamento: (usuario, data, hora, servico) => ipcRenderer.invoke('inserirAgendamento', usuario, data, hora, servico),
    existeAgendamento: (usuario) => ipcRenderer.invoke('existeAgendamento', usuario),
});