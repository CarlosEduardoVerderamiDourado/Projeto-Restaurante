const express = require('express');
const router = express.Router()

const db = require('../database');


router.post('/solicitar-garcom', (req, res) => {
    const {mesa} = req.body;

    console.log("Chamando garson");

    const querySQL = "INSERT INTO  comandas (id_mesa,status_comanda,valor_total,senha_gerente,horario_abertura) values (?, 'Aberta', 0.00, '1234', NOW())";


    // Dispara a ordem para o MariaDB passando a variável [mesa] para o único "?"
    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("Erro ao abrir comanda:", err.message);
            return res.status(500).json({ erro: "Erro ao abrir a comanda no servidor" });
        }
        
        // Retorna o sucesso temporário para a tela do cliente
        return res.json({ sucesso: true, mensagem: "Comanda aberta! Chamando o garçom..." });
    });
}); 


module.exports = router;
