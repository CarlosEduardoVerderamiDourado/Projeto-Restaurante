const express = require('express');
const router = express.Router();
const db = require('../database'); // Puxa a conexão compartilhada

// 📥 ROTA: Receber carrinho do cliente e gravar direto na tabela pedidos_itens
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

        // PASSO 2: Inserir cada item do carrinho diretamente em pedidos_itens
        // (Nota: Como id_pedido é sua chave primária AUTO_INCREMENT nessa tabela, deixamos o MySQL gerar sozinho!)
        const queryItens = "INSERT INTO pedidos_itens (id_comanda, id_item, quantidade, valor_unitario, status_pedido, horario_pedido) VALUES (?, ?, ?, ?, 'Pendente', NOW())";
        
        let erroNoLaço = false;
        let itensProcessados = 0;

        itens.forEach(item => {
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

    const querySQL = `
        SELECT 
            i.id_pedido,
            i.id_comanda,
            i.horario_pedido,
            i.status_pedido,
            i.id_item,
            c.nome_item,
            i.quantidade,
            c.categoria
        FROM pedidos_itens i
        INNER JOIN cardapio c ON i.id_item = c.id_item
        WHERE i.status_pedido IN ('Pendente', 'Em Preparo') 
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

    const querySQL = `
        SELECT 
            i.id_pedido,
            i.id_comanda,
            i.horario_pedido,
            i.status_pedido,
            i.id_item,
            c.nome_item,
            i.quantidade,
            c.categoria
        FROM pedidos_itens i
        INNER JOIN cardapio c ON i.id_item = c.id_item
        WHERE i.status_pedido IN ('Pendente', 'Em Preparo') 
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

    const querySQL = "UPDATE pedidos_itens SET status_pedido = ? WHERE id_pedido = ?";

    db.query(querySQL, [novo_status, id_pedido], (err, results) => {
        if (err) {
            console.error("❌ Erro ao atualizar status do pedido:", err.message);
            return res.status(500).json({ erro: "Erro ao atualizar o status no banco de dados" });
        }

        return res.json({ 
            sucesso: true, 
            mensagem: `Pedido atualizado para '${novo_status}' com sucesso!` 
        });
    });
});

// 📑 ROTA: Puxar o extrato completo lendo puramente da tabela pedidos_itens
router.get('/extrato/:mesa', (req, res) => {
    const { mesa } = req.params;
    console.log(`🧾 Gerando extrato de consumo para a Mesa ${mesa}...`);

    const querySQL = `
        SELECT 
            c.id_item,
            c.nome_item,
            SUM(i.quantidade) AS quantidade_total,
            i.valor_unitario,
            SUM(i.quantidade * i.valor_unitario) AS subtotal_item
        FROM comandas com
        INNER JOIN pedidos_itens i ON com.id_comanda = i.id_comanda
        INNER JOIN cardapio c ON i.id_item = c.id_item
        WHERE com.id_mesa = ? AND com.status_comanda = 'Aberta'
        GROUP BY c.id_item, c.nome_item, i.valor_unitario
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

module.exports = router;
