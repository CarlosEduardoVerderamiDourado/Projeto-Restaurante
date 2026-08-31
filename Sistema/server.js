const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Permite que o servidor entenda dados em formato JSON

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

app.post('/api/login', (req, res) => {
    const {usuario,senha} = req.body

    console.log("Recebendo tentativa de login...");
    console.log("Usuário digitado na tela:", usuario);
    console.log("Senha digitada na tela:", senha);
    
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
            cargo: funcionario.cargo // Aqui ele envia 'garcom', 'cozinha', etc.
        });
    }else {

        return res.status(401).json({
            sucesso: false,
            mensagem: 'Usuário ou senha inválidos.'
        });
    }
});

    // Devolvemos apenas uma resposta de texto temporária para a tela não ficar travada rodando
});

// Rota base apenas para testar se o servidor está online
app.get('/', (req, res) => {
    res.send('Servidor do Ratatue rodando com sucesso!');
});

// Porta onde o servidor vai ficar rodando e escutando as telas
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`📡 Servidor rodando na porta http://localhost:${PORT}`);
});
