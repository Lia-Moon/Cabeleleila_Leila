import { app, BrowserWindow, ipcMain } from 'electron';
import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const preloadPath = path.join(__dirname, 'script', 'preload.js');
console.log("Caminho do preload:", preloadPath);

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, 'script', 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.openDevTools();
    });
});

// -------------- Tabela Usuário

async function criarTabelaUsuarios() {
    const db = await open({
        filename: 'banco/banco.db',
        driver: sqlite3.Database,
    });

    // await db.run('DROP TABLE IF EXISTS USUARIO'); // Deleta a tabela de usuário

    db.run(`CREATE TABLE IF NOT EXISTS USUARIO (
        USUARIOID INTEGER NOT NULL PRIMARY KEY, 
        USUARIONOME VARCHAR(15) NOT NULL, 
        USUARIOTEL TEXT NOT NULL,
        USUARIOCPF TEXT NOT NULL,
        USUARIOSENHA VARCHAR(15) NOT NULL
    )`);  
}

async function inserirRegistroTabelaUsuarios(USUARIONOME, USUARIOTEL, USUARIOCPF, USUARIOSENHA) {
    const db = await open({
        filename: 'banco/banco.db',
        driver: sqlite3.Database,
    });
    
    await db.run('INSERT INTO USUARIO (USUARIONOME, USUARIOTEL, USUARIOCPF, USUARIOSENHA) VALUES (?,?,?,?)', [
        USUARIONOME,
        USUARIOTEL,
        USUARIOCPF,
        USUARIOSENHA,
    ]);
    console.log(`Registro com NOME ${USUARIONOME} TELEFONE ${USUARIOTEL} CPF ${USUARIOCPF} inserido com sucesso.`);
}

async function deletarRegistroTabelaUsuarios(USUARIOID) {
    const db = await open({
      filename: 'banco/banco.db',
      driver: sqlite3.Database,
    });
    await db.run('DELETE FROM USUARIO WHERE ID = ?', [USUARIOID]);
    console.log(`Registro com ID ${USUARIOID} deletado com sucesso.`);
}
  
// deletarRegistroTabelaUsuarios(2);  // Deletar o registro com o ID

criarTabelaUsuarios();

// NOME, TELEFONE, CPF, SENHA
// inserirRegistroTabelaUsuarios('LEILA', '9827504594', '15270659948', 'SENHA112233');
// inserirRegistroTabelaUsuarios('AGUSTA', '65993168625', '71690665645', 'BOLINHO');
// inserirRegistroTabelaUsuarios('EMILY', '51983540418', '32459125526', '112233');

// -------------- Tabela Agendamentos

async function criarTabelaAgendamento() {
    const db = await open({
        filename: 'banco/banco.db',
        driver: sqlite3.Database,
    });

    // await db.run('DROP TABLE IF EXISTS AGENDAMENTO'); // Deleta a tabela de Agendamento

    db.run(`CREATE TABLE IF NOT EXISTS AGENDAMENTO (
        AGENDAMENTOID INTEGER NOT NULL PRIMARY KEY, 
        AGENDAMENTONOME VARCHAR(15) NOT NULL, 
        AGENDAMENTODATA DATE NOT NULL,
        AGENDAMENTOHORA TIME NOT NULL,
        AGENDAMENTOSERVICO VARCHAR(10) NOT NULL
    )`);  
}

async function inserirRegistroTabelaAgendamento(AGENDAMENTONOME, AGENDAMENTODATA, AGENDAMENTOHORA, AGENDAMENTOSERVICO) {
    const db = await open({
        filename: 'banco/banco.db',
        driver: sqlite3.Database,
    });
    
    await db.run('INSERT INTO AGENDAMENTO (AGENDAMENTONOME, AGENDAMENTODATA, AGENDAMENTOHORA, AGENDAMENTOSERVICO) VALUES (?,?,?,?)', [
        AGENDAMENTONOME,
        AGENDAMENTODATA,
        AGENDAMENTOHORA,
        AGENDAMENTOSERVICO,
    ]);
    console.log(`Registro com NOME ${AGENDAMENTONOME} DATA ${AGENDAMENTODATA} HORA ${AGENDAMENTOHORA} SERVICO ${AGENDAMENTOSERVICO} inserido com sucesso.`);
}

async function deletarRegistroTabelaAgendamento(AGENDAMENTOID) {
    const db = await open({
      filename: 'banco/banco.db',
      driver: sqlite3.Database,
    });
    await db.run('DELETE FROM AGENDAMENTO WHERE ID = ?', [AGENDAMENTOID]);
    console.log(`Registro com ID ${AGENDAMENTOID} deletado com sucesso.`);
}

criarTabelaAgendamento();

async function inserirAgendamento(nome, date, hora, servico) {
    const db = await open({
        filename: 'banco/banco.db',
        driver: sqlite3.Database,
    });

    inserirRegistroTabelaAgendamento(nome, date, hora, servico);
}

ipcMain.handle('inserirAgendamento', async (event, nome, data, hora, servico) => {
    return await inserirAgendamento(nome, data, hora, servico);
});

// -------------- Pesquisar Usuário

async function verificarUsuario(USUARIOCPF, USUARIOSENHA) {
    const db = await open({
        filename: 'banco/banco.db',
        driver: sqlite3.Database,
    });

    const busca = 'SELECT * FROM USUARIO WHERE USUARIOCPF = ? AND USUARIOSENHA = ? LIMIT 1';
    const retornoBusca = await db.get(busca, [USUARIOCPF, USUARIOSENHA]);

    return retornoBusca ? true : false;
    
}

ipcMain.handle('buscarUsuario', async (event, USUARIOCPF, USUARIOSENHA) => {
    return await verificarUsuario(USUARIOCPF, USUARIOSENHA);
});


