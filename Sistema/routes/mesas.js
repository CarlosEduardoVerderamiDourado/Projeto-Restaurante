const express = require('express');
const router = express.Router();
const db = require('../database');

// =========================================================
// 1. AS SUAS DUAS FUNÇÕES REAPROVEITÁVEIS (Perfeitas como estão!)
// =========================================================
function criarChamado(id_mesa, res, textoMensagem) {
    const queryChamado = "INSERT INTO chamados_atendimento (id_mesa, status_chamado) VALUES (?, 'Pendente')";
    db.query(queryChamado, [id_mesa], (err, results) => {
        if (err) {
            console.error("Erro ao criar chamado:", err.message);
            return res.status(500).json({ erro: "Erro ao notificar o garçom" });
        }
        return res.json({ sucesso: true, mensagem: textoMensagem });
    });
}

function nova_comanda(mesa, res, chamarGarcom) {
    const senhaRotativa = Math.floor(1000 + Math.random() * 9000);
    const queryInsert = "INSERT INTO comandas (id_mesa, status_comanda, valor_total, senha_gerente, horario_abertura) VALUES (?, 'Aberta', 0.00, ?, NOW())";

    db.query(queryInsert, [mesa, senhaRotativa], (err, results) => {
        if (err) {
            console.error("Erro ao abrir comanda:", err.message);
            return res.status(500).json({ erro: "Erro ao abrir a comanda no servidor" });
        }
        
        const queryUpdateMesa = "UPDATE mesas SET status_mesa = 'Ocupada' WHERE id_mesa = ?";
        db.query(queryUpdateMesa, [mesa], (err, updateResults) => {
            if (err) {
                console.error("Erro ao atualizar status da mesa:", err.message);
                return res.status(500).json({ erro: "Erro ao atualizar a mesa" });
            }

            if (chamarGarcom) {
                criarChamado(mesa, res, `Mesa ativada e garçom notificado! Sua senha de acesso ao cardápio é: ${senhaRotativa}`);
            } else {
                return res.json({ 
                    sucesso: true, 
                    mensagem: `Seja bem-vindo! Mesa ativada com sucesso. Sua senha de acesso ao cardápio é: ${senhaRotativa}` 
                });
            }
        });
    });
}

// =========================================================
// 2. A SUA ROTA QUE CONSOME AS FUNÇÕES (Garanta que ela continua aí)
// =========================================================
router.post('/solicitar-garcom', (req, res) => {
    const { mesa } = req.body;
    console.log("Chamando garçom para a mesa:", mesa);
    
    const querySQL = "SELECT id_comanda FROM comandas WHERE id_mesa = ? AND status_comanda = 'Aberta'";

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("Erro ao abrir comanda:", err.message);
            return res.status(500).json({ erro: "Erro ao abrir a comanda no servidor" });
        }
        
        if (results.length > 0) {
            // Usa a fábrica de chamados se a mesa já tiver conta
            criarChamado(mesa, res, "Garçom notificado! Um funcionário está a caminho da sua mesa.");
        } else {
            // Usa a fábrica de comandas se a mesa estiver livre (passando true para chamar garçom)
            nova_comanda(mesa, res, true);
            criarChamado(mesa, res, "Garçom notificado! Um funcionário está a caminho da sua mesa."); 
        }
    });
}); 

// =========================================================
// 3. A EXPORTAÇÃO MESTRE (Na última linha)
// =========================================================
module.exports = router;
