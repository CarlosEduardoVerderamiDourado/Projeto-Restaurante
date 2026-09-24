const express = require('express');
const router = express.Router();
const db = require('../database'); // Puxa a conexão compartilhada

// 📥 ROTA: Receber carrinho do cliente e gravar direto em pedidos_itens
router.post('/enviar', (req, res) => {
    const { mesa, itens } = req.body; 

    console.log(`📦 Processando pedido recebido da Mesa ${mesa}...`);

    if (!itens || itens.length === 0) {
        return res.status(400).json({ erro: "A sacola de compras está vazia." });
    }

    // PASSO 1: Descobrir o ID da comanda ativa dessa mesa
    const queryComanda = "SELECT id_comanda FROM comandas WHERE id_mesa = ? AND status_comanda = 'Aberta'";

    db.query(queryComanda, [mesa], (err, comandaResults) => {
        if (err) {
            console.error("❌ Erro ao buscar comanda ativa:", err.message);
            return res.status(500).json({ erro: "Erro interno ao processar o pedido" });
        }

        if (comandaResults.length === 0) {
            return res.status(404).json({ erro: "Nenhuma comanda aberta foi encontrada para esta mesa." });
        }

        const id_comanda = comandaResults[0].id_comanda;

        // 🟢 CORREÇÃO: Colunas exatas da foto (id_comanda, id_produto, quantidade, preco_unitario_pago, status_preparo, horario_pedido)
        const queryItens = `
            INSERT INTO pedidos_itens 
            (id_comanda, id_produto, quantidade, preco_unitario_pago, status_preparo, horario_pedido) 
            VALUES (?, ?, ?, ?, 'Pendente', NOW())
        `;
        
        let erroNoLaço = false;
        let itensProcessados = 0;

        itens.forEach(item => {
            // item.id_item e item.preco vêm da sacola do frontend
            db.query(queryItens, [id_comanda, item.id_item, item.quantidade, item.preco], (err) => {
                if (err) {
                    console.error(`❌ Erro ao inserir item ID ${item.id_item}:`, err.message);
                    erroNoLaço = true;
                }

                itensProcessados++;

                if (itensProcessados === itens.length) {
                    if (erroNoLaço) {
                        return res.status(500).json({ erro: "Alguns itens falharam ao salvar no banco." });
                    }

                    return res.json({ 
                        sucesso: true, 
                        mensagem: "Pedido enviado com sucesso para a cozinha! Seu prato já está sendo preparado." 
                    });
                }
            });
        }); 
    }); 
});

// 🍳 ROTA: Listar apenas as COMIDAS pendentes para a tela da Cozinha (Lendo de pedidos_itens)
router.get('/pendentes', (req, res) => {
    console.log("🍳 Cozinha solicitou a lista de pratos pendentes...");

    // 🟢 CORREÇÃO: Alinhado para i.id_produto e i.status_preparo
    const querySQL = `
        SELECT 
            i.id_pedido,
            i.id_comanda,
            i.horario_pedido,
            i.status_preparo,
            i.id_produto,
            c.nome_item,
            i.quantidade,
            c.categoria
        FROM pedidos_itens i
        INNER JOIN cardapio c ON i.id_produto = c.id_item
        WHERE i.status_preparo IN ('Pendente', 'Em Preparo') 
          AND c.categoria != 'Bebidas'
        ORDER BY i.horario_pedido ASC
    `;

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar pedidos na cozinha:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar os pedidos da cozinha" });
        }
        return res.json(results);
    });
});

// 🍹 ROTA: Listar apenas as BEBIDAS pendentes para a tela do Bar (Lendo de pedidos_itens)
router.get('/pendentes-bar', (req, res) => {
    console.log("🍹 Bar solicitou a lista de bebidas pendentes...");

    // 🟢 CORREÇÃO: Alinhado para i.id_produto e i.status_preparo
    const querySQL = `
        SELECT 
            i.id_pedido,
            i.id_comanda,
            i.horario_pedido,
            i.status_preparo,
            i.id_produto,
            c.nome_item,
            i.quantidade,
            c.categoria
        FROM pedidos_itens i
        INNER JOIN cardapio c ON i.id_produto = c.id_item
        WHERE i.status_preparo IN ('Pendente', 'Em Preparo') 
          AND c.categoria = 'Bebidas'
        ORDER BY i.horario_pedido ASC
    `;

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar pedidos no bar:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar os pedidos do bar" });
        }
        return res.json(results);
    });
});

// 🔄 ROTA: Atualizar o status do pedido (Muda em pedidos_itens)
router.post('/atualizar-status', (req, res) => {
    const { id_pedido, novo_status } = req.body;

    console.log(`🔀 Mudando o pedido número ${id_pedido} para o status: ${novo_status}`);

    // 🟢 CORREÇÃO: Alinhado para status_preparo
    const querySQL = "UPDATE pedidos_itens SET status_preparo = ? WHERE id_pedido = ?";

    db.query(querySQL, [novo_status, id_pedido], (err, results) => {
        if (err) {
            console.error("❌ Erro ao atualizar status do pedido:", err.message);
            return res.status(500).json({ erro: "Erro ao atualizar o status no banco de dados" });
        }

        return res.json({ 
            sucesso: true, 
            mensagem: `Pedido updated para '${novo_status}' com sucesso!` 
        });
    });
});

// 📑 ROTA: Puxar o extrato completo lendo puramente da tabela pedidos_itens
router.get('/extrato/:mesa', (req, res) => {
    const { mesa } = req.params;
    console.log(`🧾 Gerando extrato de consumo para a Mesa ${mesa}...`);

    // 🟢 CORREÇÃO: Alinhado para i.id_produto e i.preco_unitario_pago
    const querySQL = `
        SELECT 
            c.id_item,
            c.nome_item,
            SUM(i.quantidade) AS quantidade_total,
            i.preco_unitario_pago,
            SUM(i.quantidade * i.preco_unitario_pago) AS subtotal_item
        FROM comandas com
        INNER JOIN pedidos_itens i ON com.id_comanda = i.id_comanda
        INNER JOIN cardapio c ON i.id_produto = c.id_item
        WHERE com.id_mesa = ? AND com.status_comanda = 'Aberta'
        GROUP BY c.id_item, c.nome_item, i.preco_unitario_pago
    `;

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("❌ Erro ao gerar extrato no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao calcular o extrato da mesa" });
        }

        let valorTotalMesa = 0;
        results.forEach(linha => {
            valorTotalMesa += Number(linha.subtotal_item);
        });

        return res.json({
            sucesso: true,
            itens_consumidos: results,
            total_geral: valorTotalMesa
        });
    });
});

// 💳 ROTA ADICIONADA: Acionar Garçom para a Conta (Salvando como status 'Pagamento')
router.post('/solicitar-garcom', (req, res) => {
    const { mesa } = req.body;
    console.log(`💳 Mesa ${mesa} solicitou a maquininha para fechar a conta...`);

    // 🟢 GRAVAÇÃO COM STATUS EXCLUSIVO: 'Pagamento' para o painel do garçom saber separar!
    const querySQL = "INSERT INTO chamados_atendimento (id_mesa, status_chamado, horario_chamado) VALUES (?, 'Pagamento', NOW())";

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("❌ Erro ao registrar chamado de conta:", err.message);
            return res.status(500).json({ erro: "Erro ao chamar o garçom para a conta" });
        }
        return res.json({ sucesso: true, mensagem: "Maquininha solicitada com sucesso!" });
    });
});

// 👁️🦅 6. ROTA: Monitor Geral "Olho de Águia" para o Administrador acompanhar tudo em tempo real
router.get('/monitor-geral', (req, res) => {
    console.log("👁️🦅 Gerência solicitou o painel mestre Olho de Águia...");

    // 🟢 MÁGICA CONSTRUÍDA: Cruzamos pi.id_comanda com com.id_comanda para buscar com.id_mesa real!
    const querySQL = `
        SELECT 
            pi.id_pedido,
            com.id_mesa,
            c.nome_item,
            c.categoria,
            pi.quantidade,
            pi.status_preparo,
            pi.horario_pedido
        FROM pedidos_itens pi
        INNER JOIN cardapio c ON pi.id_produto = c.id_item
        INNER JOIN comandas com ON pi.id_comanda = com.id_comanda
        WHERE pi.status_preparo IN ('Pendente', 'Em Preparo')
        ORDER BY pi.horario_pedido ASC
    `;

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro no monitor Olho de Águia do banco:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar o monitor de pedidos gerencial" });
        }
        
        console.log("📊 Carga do monitor enviada com Mesas reais:", results);
        return res.json(results);
    });
});

module.exports = router;

