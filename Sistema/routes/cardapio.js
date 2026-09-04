const express = require('express');
const router = express.Router();
const db = require('../database'); // Puxa a conexão direta com o MariaDB

router.get('/cardapio', (req, res) => {
    const querySQL = "SELECT id_item, nome_item, categoria, preco, descricao, imagem_url FROM cardapio";

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar cardápio:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar o cardápio" });
        }
        // Devolve a lista pura de produtos encontrados direto para a internet
        return res.json(results);
    });
});

module.exports = router;