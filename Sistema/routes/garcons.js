const express = require('express');
const router = express.Router();
const db = require('../database'); // Puxa a conexão do nosso cofre compartilhado

// 🛎️ 1. ROTA: Listar todas as mesas que estão chamando o garçom neste momento
router.get('/chamados', (req, res) => {
    console.log("🛎️ Aplicativo do Garçom buscando chamados pendentes...");

    // Busca os chamados abertos organizados do mais antigo para o mais recente
    const querySQL = "SELECT id_chamado, id_mesa, status_chamado, horario_chamado FROM chamados_atendimento WHERE status_chamado = 'Pendente' ORDER BY horario_chamado ASC";

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar chamados no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar os chamados" });
        }
        return res.json(results);
    });
});

// 🔄 2. ROTA: Garçom aceita o chamado da mesa
router.post('/aceitar-chamado', (req, res) => {
    const { id_chamado, id_funcionario } = req.body; // Recebe o chamado e o funcionário que vai atender

    console.log(`🏃‍♂️ Garçom ID ${id_funcionario} aceitou o chamado número ${id_chamado}...`);

    // Atualiza o chamado colocando quem vai atender e muda o status para 'A caminho'
    const querySQL = "UPDATE chamados_atendimento SET status_chamado = 'A caminho', id_funcionario = ? WHERE id_chamado = ?";

    db.query(querySQL, [id_funcionario, id_chamado], (err, results) => {
        if (err) {
            console.error("❌ Erro ao aceitar chamado no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao registrar o atendimento" });
        }

        return res.json({ 
            sucesso: true, 
            mensagem: "Atendimento registrado! Corra para a mesa." 
        });
    });
});
// 🛎️ 3. ROTA: Cliente checa se algum garçom aceitou o chamado da mesa dele
router.get('/status-mesa/:mesa', (req, res) => {
    const { mesa } = req.params;

    // Busca o chamado ativo dessa mesa trazendo o nome do funcionário associado
const querySQL = `
        SELECT c.status_chamado, f.nome 
        FROM chamados_atendimento c
        LEFT JOIN funcionarios f ON c.id_funcionario = f.id
        WHERE c.id_mesa = ? 
          AND c.status_chamado = 'A caminho'
          AND c.horario_chamado >= NOW() - INTERVAL 5 MINUTE
        ORDER BY c.horario_chamado DESC LIMIT 1
    `;

 db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("❌ Erro ao checar status do chamado:", err.message);
            return res.status(500).json({ erro: "Erro ao checar status" });
        }
        
        if (results.length > 0) {
            // Se achou um chamado aceito gerado AGORA, manda o nome do garçom!
            return res.json({ ativo: true, garcom: results[0].nome });
        } else {
            return res.json({ ativo: false });
        }
    });
});

// 🍳 4. ROTA: Listar todos os pedidos que já estão 'Prontos' na cozinha/bar esperando entrega
router.get('/entregas-pendentes', (req, res) => {
    console.log("🛎️ Garçom buscando pratos prontos para entregar...");

    const querySQL = `
        SELECT p.id_pedido, p.id_comanda, com.id_mesa, p.status_pedido
        FROM pedidos p
        INNER JOIN comandas com ON p.id_comanda = com.id_comanda
        WHERE p.status_pedido = 'Pronto'
        ORDER BY p.horario_pedido ASC
    `;

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar entregas no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar as entregas" });
        }
        return res.json(results);
    });
});

// 🏁 5. ROTA: Garçom confirma que entregou o prato na mesa (Muda status para 'Entregue')
router.post('/finalizar-entrega', (req, res) => {
    const { id_pedido } = req.body;
    console.log(`🏃‍♂️ Garçom confirmou a entrega do Pedido #${id_pedido} na mesa...`);

    const querySQL = "UPDATE pedidos SET status_pedido = 'Entregue' WHERE id_pedido = ?";

    db.query(querySQL, [id_pedido], (err, results) => {
        if (err) {
            console.error("❌ Erro ao finalizar entrega no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao registrar a entrega" });
        }
        return res.json({ sucesso: true, mensagem: "Pedido entregue com sucesso!" });
    });
});


module.exports = router;
