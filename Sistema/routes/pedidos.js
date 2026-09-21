const express = require('express');
const router = express.Router();
const db = require('../database'); // Puxa a conexão compartilhada

// 📥 ROTA: Receber carrinho do cliente e gravar nas tabelas de pedidos
router.post('/enviar', (req, res) => {
    const { mesa, itens } = req.body; // Recebe o número da mesa e o array do carrinho

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

        // PASSO 2: Criar o registro na tabela mãe (pedidos)
        const queryPedidoMae = "INSERT INTO pedidos (id_comanda, status_pedido, horario_pedido) VALUES (?, 'Pendente', NOW())";

        db.query(queryPedidoMae, [id_comanda], (err, pedidoResults) => {
            if (err) {
                console.error("❌ Erro ao criar pedido mãe:", err.message);
                return res.status(500).json({ erro: "Erro ao registrar o pedido" });
            }

            // Captura o ID do pedido que o MySQL acabou de gerar automaticamente!
            const id_pedido = pedidoResults.insertId;

            // PASSO 3: Inserir cada item do carrinho na tabela filha (pedidos_itens)
            const queryItens = "INSERT INTO pedidos_itens (id_pedido, id_item, quantidade, valor_unitario) VALUES (?, ?, ?, ?)";
            
            let erroNoLaço = false;
            let itensProcessados = 0;

            // Varrer a sacola de itens que veio do Frontend
            itens.forEach(item => {
                // Passamos os parâmetros na ordem dos "?" do INSERT
                db.query(queryItens, [id_pedido, item.id_item, item.quantidade, item.preco], (err) => {
                    if (err) {
                        console.error(`❌ Erro ao inserir item ID ${item.id_item}:`, err.message);
                        erroNoLaço = true;
                    }

                    itensProcessados++;

                    // Quando terminar de processar o último item do array
                    if (itensProcessados === itens.length) {
                        if (erroNoLaço) {
                            return res.status(500).json({ erro: "O pedido foi criado, mas alguns itens falharam ao salvar." });
                        }

                        // Veredito único de sucesso absoluto!
                        return res.json({ 
                            sucesso: true, 
                            mensagem: "Pedido enviado com sucesso para a cozinha! Seu prato já está sendo preparado." 
                        });
                    }
                });
            }); 
        });
    }); 
});

// 🍳 ROTA: Listar apenas as COMIDAS pendentes para a tela da Cozinha
router.get('/pendentes', (req, res) => {
    console.log("🍳 Cozinha solicitou a lista de pratos pendentes...");

    // Adicionado o filtro: AND c.categoria != 'Bebidas'
    const querySQL = `
        SELECT 
            p.id_pedido,
            p.id_comanda,
            p.horario_pedido,
            p.status_pedido,
            i.id_item,
            c.nome_item,
            i.quantidade,
            c.categoria
        FROM pedidos p
        INNER JOIN pedidos_itens i ON p.id_pedido = i.id_pedido
        INNER JOIN cardapio c ON i.id_item = c.id_item
        WHERE p.status_pedido IN ('Pendente', 'Em Preparo') 
          AND c.categoria != 'Bebidas'
        ORDER BY p.horario_pedido ASC
    `;

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar pedidos na cozinha:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar os pedidos da cozinha" });
        }
        return res.json(results);
    });
});

// 🍹 ROTA INÉDITA: Listar apenas as BEBIDAS pendentes para a tela do Bar
router.get('/pendentes-bar', (req, res) => {
    console.log("🍹 Bar solicitou a lista de bebidas pendentes...");

    // Adicionado o filtro: AND c.categoria = 'Bebidas'
    const querySQL = `
        SELECT 
            p.id_pedido,
            p.id_comanda,
            p.horario_pedido,
            p.status_pedido,
            i.id_item,
            c.nome_item,
            i.quantidade,
            c.categoria
        FROM pedidos p
        INNER JOIN pedidos_itens i ON p.id_pedido = i.id_pedido
        INNER JOIN cardapio c ON i.id_item = c.id_item
        WHERE p.status_pedido IN ('Pendente', 'Em Preparo') 
          AND c.categoria = 'Bebidas'
        ORDER BY p.horario_pedido ASC
    `;

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar pedidos no bar:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar os pedidos do bar" });
        }
        return res.json(results);
    });
});


// 🔄 ROTA: Atualizar o status do pedido (Clicar para mudar de estado na Cozinha)
router.post('/atualizar-status', (req, res) => {
    const { id_pedido, novo_status } = req.body; // Recebe qual é o pedido e para qual status ele vai

    console.log(`🔀 Mudando o pedido número ${id_pedido} para o status: ${novo_status}`);

    const querySQL = "UPDATE pedidos SET status_pedido = ? WHERE id_pedido = ?";

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

// 📑 ROTA: Puxar o extrato completo e o valor total consumido pela Mesa
router.get('/extrato/:mesa', (req, res) => {
    const { mesa } = req.params;
    console.log(`🧾 Gerando extrato de consumo para a Mesa ${mesa}...`);

    // Essa query busca todos os itens de todos os pedidos amarrados à comanda aberta da mesa
    const querySQL = `
        SELECT 
            c.id_item,
            c.nome_item,
            SUM(i.quantidade) AS quantidade_total,
            i.valor_unitario,
            SUM(i.quantidade * i.valor_unitario) AS subtotal_item
        FROM comandas com
        INNER JOIN pedidos p ON com.id_comanda = p.id_comanda
        INNER JOIN pedidos_itens i ON p.id_pedido = i.id_pedido
        INNER JOIN cardapio c ON i.id_item = c.id_item
        WHERE com.id_mesa = ? AND com.status_comanda = 'Aberta'
        GROUP BY c.id_item, c.nome_item, i.valor_unitario
    `;

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("❌ Erro ao gerar extrato no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao calcular o extrato da mesa" });
        }

        // Calcula a somatória final de todos os subtotais em dinheiro
        let valorTotalMesa = 0;
        results.forEach(linha => {
            valorTotalMesa += Number(linha.subtotal_item);
        });

        // Devolve a lista detalhada de consumo e o total geral
        return res.json({
            sucesso: true,
            itens_consumidos: results,
            total_geral: valorTotalMesa
        });
    });
});

module.exports = router;
