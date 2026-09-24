const express = require('express');
const router = express.Router();
const db = require('../database');

// ==========================================
// ROTA 1 ORIGINAL: LOGIN DE FUNCIONÁRIOS (Preservada intacta!)
// ==========================================
router.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    console.log("Recebendo tentativa de login...");
    
    const querySQL = "SELECT ID, nome, cargo FROM funcionarios WHERE login = ? AND senha = ?";

    db.query(querySQL, [usuario, senha], (err, results) => {
        console.log("O banco de dados respondeu! Erro:", err, "Resultados:", results);

        if (err) {
            console.error('❌ Erro no banco de dados:', err.message);
            return res.status(500).json({ erro: 'Erro interno no servidor' });
        }
        if (results.length > 0) {
            const funcionario = results[0]; 
            return res.json({
                sucesso: true,
                mensagem: `Bem-vindo, ${funcionario.nome}!`,
                id_funcionario: funcionario.ID,
                cargo: funcionario.cargo
            });
        } else {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Usuário ou senha inválidos.'
            });
        }
    }); 
});

// ==========================================
// ROTA 2 ORIGINAL: CADASTRAR FUNCIONÁRIO (Preservada intacta!)
// ==========================================
router.post('/cadastrar', (req, res) => {
    const { nome, login, senha, cargo } = req.body;
    console.log(`👤 ADM tentando cadastrar o funcionário: ${nome} (${cargo})...`);

    const querySQL = "INSERT INTO funcionarios (nome, login, senha, cargo) VALUES (?, ?, ?, ?)";
    db.query(querySQL, [nome, login, senha, cargo], (err, results) => {
        if (err) {
            console.error("❌ Erro ao cadastrar funcionário:", err.message);
            return res.status(500).json({ erro: "Não foi possível salvar o funcionário no banco" });
        }
        return res.json({ sucesso: true, mensagem: `Funcionário ${nome} cadastrado com sucesso!` });
    });
});

// ==========================================
// ➕ NOVAS ROTAS GERENCIAIS ADAPTADAS (Alinhadas ao seu modelo original!)
// ==========================================

// 👥 LISTAR TODOS: Alimenta o quadro de ativos do ADM
router.get('/listar-todos', (req, res) => {
    // 🚨 LOG DE AUDITORIA 1: Descobre se a requisição saiu do Chrome e bateu no Node!
    console.log("🚨 ATENÇÃO: O navegador acabou de bater na rota /listar-todos! Vou chamar o banco...");
    
    const querySQL = "SELECT ID, nome, login, cargo FROM funcionarios ORDER BY ID ASC";

    db.query(querySQL, [], (err, results) => {
        if (err) {
            console.error("❌ Erro ao listar funcionários no MySQL:", err.message);
            return res.status(500).json({ erro: "Erro ao carregar lista de colaboradores" });
        }
        
        // 🚨 LOG DE AUDITORIA 2: Mostra o que o banco de dados devolveu de verdade pro Node!
        console.log("📊 CARGA REAL DO BANCO DO SEU REPOSITÓRIO:", results);
        
        return res.json(results);
    });
});

// 🔄 EDITAR REGISTRO: Salva as modificações de linha feitas no ADM
router.post('/editar', (req, res) => {
    const { id_func, nome, login, cargo } = req.body;
    console.log(`🔄 API ADM: Atualizando dados do ID #${id_func}...`);

    const querySQL = "UPDATE funcionarios SET nome = ?, login = ?, cargo = ? WHERE ID = ?";

    db.query(querySQL, [nome, login, cargo, id_func], (err, results) => {
        if (err) {
            console.error("❌ Erro ao editar funcionário:", err.message);
            return res.status(500).json({ erro: "Erro ao salvar alterações no banco" });
        }
        return res.json({ sucesso: true, mensagem: "Cadastro do funcionário atualizado com sucesso!" });
    });
});

// ❌ REMOVER REGISTRO: Exclusão física permanente via ID
router.delete('/remover/:id', (req, res) => {
    const id_func = req.params.id;
    console.log(`❌ API ADM: Solicitada exclusão do ID #${id_func}...`);

    const querySQL = "DELETE FROM funcionarios WHERE ID = ?";

    db.query(querySQL, [id_func], (err, results) => {
        if (err) {
            console.error("❌ Erro ao deletar funcionário:", err.message);
            if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
                return res.status(400).json({ 
                    erro: "Não é possível excluir este funcionário pois ele possui registros históricos vinculados no salão." 
                });
            }
            return res.status(500).json({ erro: "Erro ao excluir funcionário" });
        }
        return res.json({ sucesso: true, mensagem: "Funcionário removido com sucesso de forma definitiva!" });
    });
});

// 🔑 5. ENDPOINT GERENCIAL: Resetar senha de um colaborador por ID (Sem exigir a senha anterior)
router.post('/resetar-senha', (req, res) => {
    const { id_func, nova_senha } = req.body;
    console.log(`🔑 API ADM: Forçando reset de senha para o funcionário ID #${id_func}...`);

    if (!id_func || !nova_senha) {
        return res.status(400).json({ erro: "Parâmetros incompletos para redefinição de senha." });
    }

    // Query direta para substituir a string de senha no registro correspondente
    const querySQL = "UPDATE funcionarios SET senha = ? WHERE ID = ?";

    db.query(querySQL, [nova_senha, id_func], (err, results) => {
        if (err) {
            console.error("❌ Erro ao resetar senha no MariaDB:", err.message);
            return res.status(500).json({ erro: "Erro ao salvar a nova senha no banco de dados" });
        }
        return res.json({ 
            sucesso: true, 
            mensagem: "Senha redefinida com sucesso no banco de dados!" 
        });
    });
});

module.exports = router;
