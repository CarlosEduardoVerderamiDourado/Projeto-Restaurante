const express = require('express');
const router = express.Router();
const db = require('../database'); // Puxa a conexão direta com o MariaDB

router.get('/', (req, res) => { 
    console.log("📖 Cliente solicitou o cardápio digital...");
    
    // 🟢 CORREÇÃO DEFINITIVA: Usando id_item e nome_item (as colunas oficiais e modernas do seu banco!)
    const querySQL = "SELECT id_item, nome_item, categoria, preco, descricao, imagem_url FROM cardapio";

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar cardápio:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar o cardápio" });
        }
        // Devolve a lista pura de produtos prontinha para o frontend
        return res.json(results);
    });
});

module.exports = router;
