const express = require('express');
const router = express.Router();
const db = require('../database');


// ==========================================
// ROAT 1: LOGIN DE FUNCIONÁRIOS
// ==========================================
router.post('/login', (req, res) => {
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
                id_funcionario: funcionario.ID,
                cargo: funcionario.cargo
            });
        } else {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Usuário ou senha inválidos.'
            });
        }
    }); 
});

// 👤 ROTA: Administrador cadastra um novo funcionário no sistema
router.post('/cadastrar', (req, res) => {
    const { nome, login, senha, cargo } = req.body;
    console.log(`👤 ADM tentando cadastrar o funcionário: ${nome} (${cargo})...`);

    const querySQL = "INSERT INTO funcionarios (nome, login, senha, cargo) VALUES (?, ?, ?, ?)";
    db.query(querySQL, [nome, login, senha, cargo], (err, results) => {
        if (err) {
            console.error("❌ Erro ao cadastrar funcionário:", err.message);
            return res.status(500).json({ erro: "Não foi possível salvar o funcionário no banco" });
        }
        return res.json({ sucesso: true, mensagem: `Funcionário ${nome} cadastrado com sucesso!` });
    });
});

module.exports = router;