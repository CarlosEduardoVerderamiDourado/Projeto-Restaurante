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
        WHERE c.id_mesa = ? AND c.status_chamado = 'A caminho'
        ORDER BY c.horario_chamado DESC LIMIT 1
    `;

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("❌ Erro ao checar status do chamado:", err.message);
            return res.status(500).json({ erro: "Erro ao checar status" });
        }
        
        if (results.length > 0) {
            // Se achou um chamado 'A caminho', manda o status e o nome do garçom!
            return res.json({ ativo: true, garcom: results[0].nome });
        } else {
            return res.json({ ativo: false });
        }
    });
});

module.exports = router;
