const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🛢️ Configuração da conexão com o seu banco de dados MySQL 
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',          
    password: '',          
    database: 'restaurante'
});

// Testando a conexão com o banco
db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar no MySQL:', err.message);
        return;
    }
    console.log('🚀 Conectado com sucesso ao banco de dados "restaurante"!');
});

// ==========================================
// ROAT 1: LOGIN DE FUNCIONÁRIOS
// ==========================================
app.post('/api/login', (req, res) => {
    const {usuario,senha} = req.body;

    console.log("Recebendo tentativa de login...");
    
    const querySQL = "SELECT ID, nome, cargo FROM funcionarios WHERE login = ? AND senha = ?";

    db.query(querySQL, [usuario, senha], (err, results) => {
        console.log("O banco de dados respondeu! Erro:", err, "Resultados:", results);

        if (err) {
            console.error('❌ Erro no banco de dados:', err.message);
            return res.status(500).json({ erro: 'Erro interno no servidor' });
        }
        if(results.length > 0 ){
            const funcionario = results[0]; 
            return res.json({
                sucesso: true,
                mensagem: `Bem-vindo, ${funcionario.nome}!`,
                cargo: funcionario.cargo
            });
        } else {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Usuário ou senha inválidos.'
            });
        }
    }); 
}); // 🟢 FECHA A ROTA DE LOGIN AQUI!

// ==========================================
// ROTA 2: ATIVAÇÃO DE MESAS
// ==========================================
app.post('/api/mesas/ativar', (req, res) => {
    const {mesa,senha} = req.body;

    console.log("Recebendo tentativa de ativação de mesa...");
    
    const querySQL = "SELECT id_mesa,status_mesa FROM mesas WHERE id_mesa = ? AND senha_gerente = ?";

    db.query(querySQL, [mesa, senate || senha], (err, results) => {
        console.log("O banco de dados respondeu! Erro:", err, "Resultados:", results);

        if (err) {
            console.error('❌ Erro no banco de dados:', err.message);
            return res.status(500).json({ erro: 'Erro interno no servidor' });
        }
        if(results.length > 0 ){
            return res.json({
                sucesso: true,
                mensagem: `Mesa conectada`,
            });
        } else {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'senha errada.'
            });
        }
    });
}); // 🟢 FECHA A ROTA DA MESA AQUI!

// ==========================================
// ROTA BASE E PORTA DO SERVIDOR
// ==========================================
app.get('/', (req, res) => {
    res.send('Servidor do Ratatue rodando com sucesso!');
}); // 🟢 FECHA A ROTA BASE AQUI SEM CHAVES EXTRAS EMBAIXO!

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`📡 Servidor rodando na porta http://localhost:${PORT}`);
});
