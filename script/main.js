import { app, BrowserWindow } from 'electron';
import sqlite3 from 'sqlite3';
import {open} from 'sqlite';

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


async function criarTabelaUsuarios() {
    const db = await open({
        filename: 'banco/banco.db',
        driver: sqlite3.Database,
    });

    await db.run('DROP TABLE IF EXISTS USUARIO');

    db.run(`CREATE TABLE IF NOT EXISTS USUARIO (
        USUARIOID INTEGER PRIMARY KEY, USUARIONOME TEXT, USUARIOTEL INTEGER, USUARIOCPF INTEGER, USUARIOSENHA TEXT
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

async function deletarRegistro(USUARIOID) {
    const db = await open({
      filename: 'banco/banco.db',
      driver: sqlite3.Database,
    });
    await db.run('DELETE FROM USUARIO WHERE ID = ?', [USUARIOID]);
    console.log(`Registro com ID ${USUARIOID} deletado com sucesso.`);
  }
  
// deletarRegistro(2);  // Deletar o registro com o ID 1

criarTabelaUsuarios();

// NOME, TELEFONE, CPF, SENHA
inserirRegistroTabelaUsuarios('LEILA', '9827504594', '05270659948', 'SENHA112233');
inserirRegistroTabelaUsuarios('AGUSTA', '65993168625', '71690665645', 'BOLINHO');
inserirRegistroTabelaUsuarios('EMILY', '51983540418', '32459125526', '112233');