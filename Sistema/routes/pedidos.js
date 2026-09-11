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

module.exports = router;
