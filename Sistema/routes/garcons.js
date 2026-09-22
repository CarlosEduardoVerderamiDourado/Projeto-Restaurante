const express = require('express');
const router = express.Router();
const db = require('../database'); // Puxa a conexão do nosso cofre compartilhado

// 🛎️ 1. ROTA LISTAR: Traz chamados de ajuda (Pendente) e de conta (Pagamento)
router.get('/chamados', (req, res) => {
    console.log("🛎️ Aplicativo do Garçom buscando chamados de todos os tipos...");

    // Traz os dois status ativos do salão
    const querySQL = `
        SELECT id_chamado, id_mesa, status_chamado, horario_chamado 
        FROM chamados_atendimento 
        WHERE status_chamado IN ('Pendente', 'Pagamento') 
        ORDER BY horario_chamado ASC
    `;

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar chamados no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar os chamados" });
        }
        return res.json(results);
    });
});

// 🏃‍♂️ 2. ROTA ACEITAR: Aceita tanto chamados 'Pendente' quanto 'Pagamento'
router.post('/aceitar-chamado', (req, res) => {
    const { id_chamado, id_funcionario } = req.body;
    console.log(`🏃‍♂️ Garçom ID ${id_funcionario} aceitou o chamado número ${id_chamado}...`);

    const querySQL = "UPDATE chamados_atendimento SET status_chamado = 'A caminho', id_funcionario = ? WHERE id_chamado = ?";

    db.query(querySQL, [id_funcionario, id_chamado], (err, results) => {
        if (err) {
            console.error("❌ Erro ao aceitar chamado no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao aceitar o chamado" });
        }
        return res.json({ sucesso: true, mensagem: "Atendimento aceito com sucesso!" });
    });
});


// 🛎️ 3. ROTA BLINDADA DE ALTA PRECISÃO: Checa o chamado aceito mais recente ignorando totalmente fusos horários e relógios do banco!
router.get('/status-mesa/:mesa', (req, res) => {
    const { mesa } = req.params;

    // 🟢 MÁGICA TÉCNICA: Buscamos o ÚLTIMO chamado criado para essa mesa (ORDER BY id_chamado DESC LIMIT 1)
    // Se o status dele for 'A caminho', significa que o garçom ACABOU de aceitar o chamado atual!
    const querySQL = `
        SELECT c.id_chamado, c.status_chamado, f.nome AS nome_garcom
        FROM chamados_atendimento c
        INNER JOIN funcionarios f ON c.id_funcionario = f.ID
        WHERE c.id_mesa = ?
        ORDER BY c.id_chamado DESC LIMIT 1
    `;

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("❌ Erro ao checar status do chamado:", err.message);
            return res.status(500).json({ erro: "Erro ao checar status" });
        }
        
        console.log("🔍 Resposta real do MariaDB para a Mesa " + mesa + ":", results);

        if (results.length > 0) {
            const linhaDoBanco = results[0]; // 🟢 CORREÇÃO CRUCIAL: Acessa o índice 0 do array retornado!
            
            // Só libera a cortina se o ÚLTIMO chamado dessa mesa estiver com o status 'A caminho'
            if (linhaDoBanco.status_chamado === 'A caminho') {
                const garcomEncontrado = linhaDoBanco.nome_garcom;
                console.log(`🟢 SUCESSO ABSOLUTO: Mesa ${mesa} tem o garçom ${garcomEncontrado} vindo agora!`);
                
                return res.json({ 
                    ativo: true, 
                    garcom: garcomEncontrado 
                });
            }
        }
        
        // Se o último chamado ainda estiver 'Pendente' ou 'Pagamento', o cliente continua esperando o clique real!
        return res.json({ ativo: false });
    });
});




// 🍳 4. ROTA CORRIGIDA: Listar pratos prontos usando as colunas reais da foto
router.get('/entregas-pendentes', (req, res) => {
    console.log("🛎️ Garçom buscando pratos prontos para entregar...");

    // 🟢 CORREÇÃO MESTRE: Alterado para pi.status_preparo
    const querySQL = `
        SELECT pi.id_pedido, pi.id_comanda, com.id_mesa, pi.status_preparo
        FROM pedidos_itens pi
        INNER JOIN comandas com ON pi.id_comanda = com.id_comanda
        WHERE pi.status_preparo = 'Pronto'
        ORDER BY com.id_mesa ASC
    `;

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar entregas no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar as entregas" });
        }
        return res.json(results);
    });
});

// 🏁 5. ROTA CORRIGIDA: Garçom confirma a entrega usando as colunas reais da foto
router.post('/finalizar-entrega', (req, res) => {
    const { id_pedido } = req.body;
    console.log(`🏃‍♂️ Garçom confirmou a entrega do Pedido #${id_pedido} na mesa...`);

    // 🟢 CORREÇÃO MESTRE: Alterado para status_preparo = 'Entregue'
    const querySQL = "UPDATE pedidos_itens SET status_preparo = 'Entregue' WHERE id_pedido = ?";

    db.query(querySQL, [id_pedido], (err, results) => {
        if (err) {
            console.error("❌ Erro ao finalizar entrega no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao registrar a entrega" });
        }
        return res.json({ sucesso: true, message: "Pedido entregue com sucesso!", mensagem: "Pedido entregue com sucesso!" });
    });
});




module.exports = router;
