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

// Libera as rotas para o server.js conseguir enxergar
module.exports = router;