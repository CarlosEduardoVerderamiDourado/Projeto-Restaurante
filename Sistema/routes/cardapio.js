const express = require('express');
const router = express.Router();
const db = require('../database'); // Puxa a conexão direta com o MariaDB

// 📖 1. ENDPOINT: Listar todos os itens do cardápio para o cliente ou gerência
router.get('/', (req, res) => { 
    console.log("📖 API: Solicitada listagem completa do cardápio...");
    
    const querySQL = "SELECT id_item, nome_item, categoria, preco, descricao, imagem_url, disponivel FROM cardapio";

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar cardápio:", err.message);
            return res.status(500).json({ erro: "Erro interno ao carregar o cardápio" });
        }
        return res.json(results);
    });
});

// ➕ 2. ENDPOINT: Cadastrar um novo produto no banco (Camada da Gerência)
router.post('/cadastrar', (req, res) => {
    const { nome_item, descricao, preco, categoria, imagem_url } = req.body;
    console.log(`➕ API: Gerência tentando cadastrar novo item: ${nome_item}...`);

    // Validação estrita de payload no backend
    if (!nome_item || !preco || !categoria) {
        return res.status(400).json({ erro: "Campos obrigatórios ausentes (nome_item, preco, categoria)." });
    }

    // Usamos '1' por padrão em disponível para o item nascer ativo nas prateleiras virtuais
    const querySQL = `
        INSERT INTO cardapio (nome_item, descricao, preco, categoria, disponivel, imagem_url) 
        VALUES (?, ?, ?, ?, 1, ?)
    `;

    db.query(querySQL, [nome_item, descricao, preco, categoria, imagem_url || null], (err, results) => {
        if (err) {
            console.error("❌ Erro ao inserir produto no banco:", err.message);
            return res.status(500).json({ erro: "Erro ao cadastrar o produto no banco de dados" });
        }
        return res.status(201).json({
            sucesso: true,
            mensagem: `Produto '${nome_item}' cadastrado com sucesso!`,
            id_item: results.insertId
        });
    });
});

// 🔄 3. ENDPOINT: Alternar disponibilidade do item (Ativar/Desativar no estoque)
router.put('/alterar-disponibilidade', (req, res) => {
    const { id_item, disponivel } = req.body; // 'disponivel' deve ser 1 (ativo) ou 0 (inativo)
    console.log(`🔄 API: Alterando status de disponibilidade do item ID #${id_item} para ${disponivel}...`);

    if (id_item === undefined || disponivel === undefined) {
        return res.status(400).json({ erro: "Parâmetros id_item e disponivel são obrigatórios." });
    }

    const querySQL = "UPDATE cardapio SET disponivel = ? WHERE id_item = ?";

    db.query(querySQL, [disponivel, id_item], (err, results) => {
        if (err) {
            console.error("❌ Erro ao atualizar disponibilidade:", err.message);
            return res.status(500).json({ erro: "Erro ao atualizar status do produto" });
        }
        return res.json({ sucesso: true, mensagem: "Disponibilidade atualizada com sucesso!" });
    });
});

// ❌ 4. ENDPOINT: Remover um produto definitivamente do cardápio
router.delete('/remover/:id', (req, res) => {
    const id_item = req.params.id;
    console.log(`❌ API: Gerência solicitou a exclusão permanente do item ID #${id_item}...`);

    const querySQL = "DELETE FROM cardapio WHERE id_item = ?";

    db.query(querySQL, [id_item], (err, results) => {
        if (err) {
            console.error("❌ Erro ao deletar produto do banco:", err.message);
            return res.status(500).json({ erro: "Erro ao excluir o produto do banco de dados" });
        }
        return res.json({ sucesso: true, mensagem: "Produto removido do cardápio com sucesso!" });
    });
});

module.exports = router;

