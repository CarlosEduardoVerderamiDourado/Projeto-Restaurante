const express = require('express');
const router = express.Router();
const db = require('../database');

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

// 🟢 Removido o 'f' solto da linha 18
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
                // 🟢 Removida a linha que causava o loop infinito! Apenas responde o JSON direto.
                return res.json({ 
                    sucesso: true, 
                    mensagem: `Seja bem-vindo! Mesa ativada com sucesso. Sua senha de acesso ao cardápio é: ${senhaRotativa}` 
                });
            }
        });
    });
}
