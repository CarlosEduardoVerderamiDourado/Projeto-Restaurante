const express = require('express');
const router = express.Router();
const db = require('../database');

// =========================================================
// 1. FUNÇÕES criar chamado garson
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

// =========================================================
// 2. FUNÇÕES criar comanda
// =========================================================
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
// ==========================================
//  3. ATIVAÇÃO DE MESAS
// ==========================================
router.post('/ativar', (req, res) => {
    const {mesa,senha} = req.body;

    console.log("Recebendo tentativa de ativação de mesa...");
    
    const querySQL = "SELECT id_mesa,status_mesa FROM mesas WHERE id_mesa = ? AND senha_gerente = ?";

    db.query(querySQL, [mesa, senha], (err, results) => {
        console.log("O banco de dados respondeu! Erro:", err, "Resultados:", results);

        if (err) {
            console.error('❌ Erro no banco de dados:', err.message);
            return res.status(500).json({ erro: 'Erro interno no servidor' });
        }
        if(results.length > 0 ){
            return res.json({
                sucesso: true,
                mensagem: `Mesa conectada`,
            });
        } else {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'senha errada.'
            });
        }
    });
}); 

// =========================================================
// 4. ROTA QUE chama o grason ja abrindo a comanda
// =========================================================
// 🛎️ ROTA 1: Exclusiva para AJUDA COMUM (Disparada pelo portal.html)
router.post('/solicitar-garcom', (req, res) => {
    const { mesa } = req.body;
    console.log(`🛎️ Mesa ${mesa} solicitou AJUDA COMUM no salão...`);

    // 🟢 GRAVA COMO 'Pendente' -> Garçom vai ver o cartão AMARELO!
    const querySQL = "INSERT INTO chamados_atendimento (id_mesa, status_chamado, horario_chamado) VALUES (?, 'Pendente', NOW())";

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("❌ Erro ao registrar chamado de ajuda:", err.message);
            return res.status(500).json({ erro: "Erro ao chamar o garçom" });
        }
        return res.json({ sucesso: true, mensagem: "Garçom acionado para ajuda!" });
    });
});

// 💳 ROTA 2: Exclusiva para PAGAMENTO / MAQUININHA (Disparada pelo cardapio.html)
router.post('/solicitar-maquininha', (req, res) => {
    const { mesa } = req.body;
    console.log(`💳 Mesa ${mesa} solicitou a MAQUININHA para fechar a conta...`);

    // 🟢 GRAVA COMO 'Pagamento' -> Garçom vai ver o cartão LANREJA!
    const querySQL = "INSERT INTO chamados_atendimento (id_mesa, status_chamado, horario_chamado) VALUES (?, 'Pagamento', NOW())";

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("❌ Erro ao registrar chamado de conta:", err.message);
            return res.status(500).json({ erro: "Erro ao chamar a maquininha" });
        }
        return res.json({ sucesso: true, mensagem: "Maquininha solicitada com sucesso!" });
    });
});


// =========================================================
// 5. Rota alto atendimento 
// =========================================================
router.post('/altoatendimento', (req, res) =>{
    const {mesa} = req.body;
    console.log("movendo para a tela do cardapio ")
    const querySQL = "SELECT id_comanda FROM comandas WHERE id_mesa = ? AND status_comanda = 'Aberta'";

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("Erro ao abrir comanda:", err.message);
            return res.status(500).json({ erro: "Erro ao abrir a comanda no servidor" });
        }
         if (results.length > 0) {
            return res.json({ 
        sucesso: true, 
        mensagem: "Bem-vindo de volta! Acessando o seu cardápio..." 
    });
         }else{
            nova_comanda(mesa, res, false);
         }
        })
})

// 🔒 ROTA: Verificar se a mesa ainda possui uma comanda aberta (Segurança do Cardápio)
router.get('/verificar-comanda/:mesa', (req, res) => {
    const { mesa } = req.params;

    const querySQL = "SELECT id_comanda FROM comandas WHERE id_mesa = ? AND status_comanda = 'Aberta'";

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("❌ Erro ao verificar comanda ativa:", err.message);
            return res.status(500).json({ erro: "Erro ao verificar status da mesa" });
        }

        if (results.length > 0) {
            // Mesa ativa e liberada!
            return res.json({ ativa: true });
        } else {
            // Conta paga ou fechada pelo caixa!
            return res.json({ ativa: false });
        }
    });
});

// 🪑 ROTA: Administrador cadastra uma nova mesa no salão
router.post('/cadastrar', (req, res) => {
    const { numero_mesa, senha_gerente } = req.body;
    console.log(`🪑 ADM tentando cadastrar a Mesa Número ${numero_mesa}...`);

    // Toda mesa nasce com o status padrão 'Livre'
    const querySQL = "INSERT INTO mesas (id_mesa, status_mesa, senha_gerente) VALUES (?, 'Livre', ?)";
    db.query(querySQL, [numero_mesa, senha_gerente], (err, results) => {
        if (err) {
            console.error("❌ Erro ao cadastrar nova mesa:", err.message);
            return res.status(500).json({ erro: "Este número de mesa já existe ou o comando falhou." });
        }
        return res.json({ sucesso: true, mensagem: `Mesa ${numero_mesa} adicionada ao salão com sucesso!` });
    });
});

// 🧾 ROTA A: Listar todas as comandas abertas com o valor total gasto por cada mesa
router.get('/comandas-abertas', (req, res) => {
    console.log("🧾 ADM solicitando relatório de comandas abertas no caixa...");

    // 🟢 CORREÇÃO MESTRE: Ligamos 'comandas' direto em 'pedidos_itens' e usamos 'preco_unitario_pago'
    const querySQL = `
        SELECT 
            com.id_comanda,
            com.id_mesa,
            com.horario_abertura,
            IFNULL(SUM(i.quantidade * i.preco_unitario_pago), 0) AS total_gasto
        FROM comandas com
        LEFT JOIN pedidos_itens i ON com.id_comanda = i.id_comanda
        WHERE com.status_comanda = 'Aberta'
        GROUP BY com.id_comanda, com.id_mesa, com.horario_abertura
        ORDER BY com.id_mesa ASC
    `;

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar comandas abertas no caixa:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar os dados do caixa" });
        }
        return res.json(results);
    });
});


// 💳 ROTA B: Dar baixa no pagamento (Fechar comanda para 'Paga' e liberar Mesa para 'Livre')
router.post('/fechar-comanda', (req, res) => {
    const { id_comanda, id_mesa } = req.body;
    console.log(`💳 Caixa recebendo pagamento da Comanda #${id_comanda} (Mesa ${id_mesa})...`);

    // 1. Primeiro UPDATE: Altera o status da comanda para Paga
    const queryFecharComanda = "UPDATE comandas SET status_comanda = 'Paga' WHERE id_comanda = ?";
    
    db.query(queryFecharComanda, [id_comanda], (err, results) => {
        if (err) {
            console.error("❌ Erro ao fechar comanda:", err.message);
            return res.status(500).json({ erro: "Erro ao processar o pagamento da comanda" });
        }

        // 2. Segundo UPDATE: Devolve o status da mesa física para Livre
        const queryLiberarMesa = "UPDATE mesas SET status_mesa = 'Livre' WHERE id_mesa = ?";
        
        db.query(queryLiberarMesa, [id_mesa], (err, results) => {
            if (err) {
                console.error("❌ Erro ao liberar mesa física:", err.message);
                return res.status(500).json({ erro: "A comanda foi paga, mas a mesa falhou ao ser liberada." });
            }

            // MÁGICA: No segundo exato em que esse JSON abaixo responder sucesso, 
            // a trava invisível que fizemos ontem no 'cardapio.html' vai ler a liberação,
            // vai avisar o cliente na tela e vai expulsar o tablet de volta para o login!
            return res.json({ 
                sucesso: true, 
                mensagem: `Mesa ${id_mesa} encerrada e liberada com sucesso!` 
            });
        });
    });
});

// 📑 ROTA BACKEND: Caixa consulta os valores acumulados para emitir a nota fiscal
router.get('/consultar-fechamento/:mesa', (req, res) => {
    const { mesa } = req.params;
    console.log(`💰 Caixa consultando extrato de encerramento da Mesa ${mesa}...`);

    const querySQL = `
        SELECT 
            c.id_item,
            c.nome_item,
            SUM(pi.quantidade) AS quantidade_total,
            pi.preco_unitario_pago,
            SUM(pi.quantidade * pi.preco_unitario_pago) AS subtotal_item
        FROM comandas com
        INNER JOIN pedidos_itens pi ON com.id_comanda = pi.id_comanda
        INNER JOIN cardapio c ON pi.id_produto = c.id_item
        WHERE com.id_mesa = ? AND com.status_comanda = 'Aberta'
        GROUP BY c.id_item, c.nome_item, pi.preco_unitario_pago
    `;

    db.query(querySQL, [mesa], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar dados de fechamento no banco:", err.message);
            return res.status(500).json({ erro: "Erro interno no servidor ao consultar fechamento" });
        }

        let totalGeralAcumulado = 0;
        results.forEach(linha => {
            totalGeralAcumulado += Number(linha.subtotal_item);
        });

        return res.json({
            sucesso: true,
            id_comanda: results.length > 0 ? results[0].id_comanda : null,
            itens_consumidos: results,
            total_pagar: totalGeralAcumulado
        });
    });
});

// 💳 ROTA BACKEND: Processar Baixa Financeira (Fecha a comanda e encerra chamados de pagamento)
router.post('/encerrar-comanda', (req, res) => {
    const { mesa } = req.body;
    console.log(`🛑 Caixa processando encerramento financeiro da Mesa ${mesa}...`);

    // Inicia um bloco de queries síncronas para garantir consistência relacional
    const fecharComandaSQL = "UPDATE comandas SET status_comanda = 'Paga' WHERE id_mesa = ? AND status_comanda = 'Aberta'";
    const arquivarChamadosSQL = "UPDATE chamados_atendimento SET status_chamado = 'Atendido' WHERE id_mesa = ? AND status_chamado = 'Pagamento'";

    db.query(fecharComandaSQL, [mesa], (err, comandaResults) => {
        if (err) {
            console.error("❌ Erro ao fechar comanda ativa:", err.message);
            return res.status(500).json({ erro: "Erro ao encerrar comanda no banco" });
        }

        // Limpa a esteira do garçom, arquivando a solicitação de maquininha que já foi paga
        db.query(arquivarChamadosSQL, [mesa], (err) => {
            if (err) {
                console.error("❌ Erro ao arquivar chamados de pagamento:", err.message);
                return res.status(500).json({ erro: "Erro ao limpar chamados pendentes" });
            }

            return res.json({
                sucesso: true,
                mensagem: `Mesa ${mesa} encerrada com sucesso no banco de dados! Comanda definida como Paga.`
            });
        });
    });
});

module.exports = router;
