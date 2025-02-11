const { contextBridge, ipcRenderer } = require('electron');

console.log("Preload carregado!");

contextBridge.exposeInMainWorld('electronAPI', {
    buscarUsuario: (CPF, senha) => ipcRenderer.invoke('buscarUsuario', CPF, senha),
    inserirAgendamento: (usuario, data, hora, servico) => ipcRenderer.invoke('inserirAgendamento', usuario, data, hora, servico),
    existeAgendamento: (usuario) => ipcRenderer.invoke('existeAgendamento', usuario),
    existeAgendamentoMesmaSemana: (usuario) => ipcRenderer.invoke('existeAgendamentoMesmaSemana', usuario),
    procuraQlqAgendamento: () => ipcRenderer.invoke('procuraQlqAgendamento'),
    excluirIdAgendamento: (idAgendamento) => ipcRenderer.invoke('excluirIdAgendamento', idAgendamento),
    existeAgendamentoAntigo: (usuario) => ipcRenderer.invoke('existeAgendamentoAntigo', usuario),
    procuraAgendamentoPorId: (idAgendamento) => ipcRenderer.invoke('idAgendamentoClicadoEdicao', idAgendamento),
    editarAgendamentoPorId: (id, data, hora, servico) => ipcRenderer.invoke('editarAgendamentoPorId', id, data, hora, servico),
    filtrarDadosPorData: (dataInicial, dataFinal) => ipcRenderer.invoke('filtrarDadosPorData', dataInicial, dataFinal),
    procuraServicosCadastrados: () => ipcRenderer.invoke('procuraServicosCadastrados'),
});