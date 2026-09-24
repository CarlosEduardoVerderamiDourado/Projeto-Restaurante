const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexão compartilhada com o MariaDB
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🟢 CONFIGURAÇÃO DO COFRE DE IMAGENS: Garante que a pasta física exista
const pastaImagens = path.join(__dirname, '../imagens');
if (!fs.existsSync(pastaImagens)) {
    fs.mkdirSync(pastaImagens, { recursive: true });
}

// Configura o armazenamento do Multer com nomes únicos para não duplicar arquivos
const armazenamento = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pastaImagens);
    },
    filename: (req, file, cb) => {
        // Gera um nome único: data-atual + extensão original da imagem
        const nomeUnico = Date.now() + path.extname(file.originalname);
        cb(null, nomeUnico);
    }
});

const upload = multer({ storage: armazenamento });

// ➕ 4. ENDPOINT GERENCIAL ATUALIZADO: Cadastrar comida com Upload de Imagem física!
// Injetamos o middleware 'upload.single('foto_prato')' para interceptar o arquivo vindo do painel
router.post('/cadastrar', upload.single('foto_prato'), (req, res) => {
    const { nome_item, descricao, preco, categoria } = req.body;
    console.log(`➕ API ADM: Recebida solicitação de cadastro para o prato: ${nome_item}...`);

    if (!nome_item || !preco || !categoria) {
        return res.status(400).json({ erro: "Dados obrigatórios ausentes. Forneça nome_item, preco e categoria." });
    }

    // 🟢 A MÁGICA DO UPLOAD: Se o ADM subiu uma foto, pegamos o nome dela. Se não, fica nulo.
    let imagem_url = null;
    if (req.file) {
        // Armazena a rota estática que o tablet vai usar para desenhar o hambúrguer
        imagem_url = `/imagens/${req.file.filename}`;
        console.log(`🖼️ Imagem salva com sucesso na pasta física: ${req.file.filename}`);
    }

    const querySQL = `
        INSERT INTO cardapio (nome_item, descricao, preco, categoria, disponivel, imagem_url)
        VALUES (?, ?, ?, ?, 1, ?)
    `;

    db.query(querySQL, [nome_item, descricao, preco, categoria, imagem_url], (err, results) => {
        if (err) {
            console.error("❌ Erro ao registrar comida no banco:", err.message);
            return res.status(500).json({ erro: "Erro interno no servidor ao cadastrar produto" });
        }

        return res.status(201).json({
            sucesso: true,
            mensagem: `Nova comida '${nome_item}' registrada com sucesso com imagem!`,
            id_item: results.insertId,
            url_gerada: imagem_url
        });
    });
});

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
        return res.json({ sucesso: true, mensagem: "Disponibilidade updated com sucesso!" });
    });
});

// ➕ 4. ENDPOINT GERENCIAL: Cadastrar um novo produto/comida no cardápio
router.post('/cadastrar', (req, res) => {
    const { nome_item, descricao, preco, categoria, imagem_url } = req.body;
    console.log(`➕ API ADM: Tentando registrar nova comida: ${nome_item}...`);

    // 🟢 VALIDAÇÃO DE CAMADA DE NEGÓCIO: Impede dados incompletos de poluírem o MariaDB
    if (!nome_item || !preco || !categoria) {
        return res.status(400).json({ erro: "Dados obrigatórios ausentes. Forneça nome_item, preco e categoria." });
    }

    // A coluna 'disponivel' nasce como 1 por padrão para o prato já brotar ativo no tablet
    const querySQL = `
        INSERT INTO cardapio (nome_item, descricao, preco, categoria, disponivel, imagem_url)
        VALUES (?, ?, ?, ?, 1, ?)
    `;

    db.query(querySQL, [nome_item, descricao, preco, categoria, imagem_url || null], (err, results) => {
        if (err) {
            console.error("❌ Erro ao registrar comida no banco:", err.message);
            return res.status(500).json({ erro: "Erro interno no servidor ao cadastrar produto" });
        }

        return res.status(201).json({
            sucesso: true,
            mensagem: `Nova comida '${nome_item}' registrada com sucesso no cardápio!`,
            id_item: results.insertId
        });
    });
});

// 📊 5. ENDPOINT GERENCIAL: Listar histórico completo de produtos para o painel de registros
router.get('/gerenciamento-total', (req, res) => {
    console.log("📊 API: Gerência puxando relatório de registro e auditoria de insumos...");

    const querySQL = "SELECT id_item, nome_item, categoria, preco, disponivel FROM cardapio ORDER BY categoria ASC, nome_item ASC";

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro na auditoria do cardápio:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar os dados do caixa" });
        }
        return res.json(results);
    });
});

// 🔄 6. ENDPOINT GERENCIAL: Editar dados mestre do produto (Preço e Nome)
router.post('/editar-produto', (req, res) => {
    const { id_item, nome_item, preco, categoria } = req.body;
    console.log(`🔄 API: Gerência editando dados mestre do produto ID #${id_item}...`);

    if (!id_item || !nome_item || !preco || !categoria) {
        return res.status(400).json({ erro: "Parâmetros incompletos para atualização de registro." });
    }

    const querySQL = "UPDATE cardapio SET nome_item = ?, preco = ?, categoria = ? WHERE id_item = ?";

    db.query(querySQL, [nome_item, preco, categoria, id_item], (err, results) => {
        if (err) {
            console.error("❌ Erro ao atualizar registro de comida:", err.message);
            return res.status(500).json({ erro: "Erro ao salvar alterações do produto no banco" });
        }
        return res.json({ sucesso: true, mensagem: "Registro de comida atualizado com sucesso no MariaDB!" });
    });
});

// ❌ 7. ENDPOINT INJETADO: Remover uma comida/bebida definitivamente do cardápio via ID
router.delete('/remover/:id', (req, res) => {
    const id_item = req.params.id;
    console.log(`❌ API ADM: Solicitada exclusão permanente do item ID #${id_item}...`);

    if (!id_item) {
        return res.status(400).json({ erro: "ID do item não foi fornecido na URL." });
    }

    const querySQL = "DELETE FROM cardapio WHERE id_item = ?";

    db.query(querySQL, [id_item], (err, results) => {
        if (err) {
            console.error("❌ Erro ao deletar produto do banco:", err.message);
            
            // Tratamento relacional: Impede quebrar o banco se o produto já foi vendido no passado
            if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
                return res.status(400).json({ 
                    erro: "Não é possível excluir este produto de forma permanente pois ele já consta no histórico de faturamento de comandas antigas. Recomendamos apenas alterar a disponibilidade do item." 
                });
            }
            return res.status(500).json({ erro: "Erro ao excluir o produto do banco de dados" });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Nenhum produto com este ID foi encontrado." });
        }

        return res.json({ sucesso: true, mensagem: "Produto removido do cardápio com sucesso de forma definitiva!" });
    });
});

module.exports = router;


