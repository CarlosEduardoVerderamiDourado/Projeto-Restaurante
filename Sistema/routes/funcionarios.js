const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt'); // 🟢 INJEÇÃO DE SEGURANÇA: Importa o motor de criptografia

// ==========================================
// ROTA 1: LOGIN DE FUNCIONÁRIOS (Com Verificação de Criptografia)
// ==========================================
router.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    console.log("Recebendo tentativa de login com criptografia...");
    
    // Puxamos o registro buscando puramente pelo login
    const querySQL = "SELECT ID, nome, cargo, senha AS senha_criptografada FROM funcionarios WHERE login = ?";

    db.query(querySQL, [usuario], (err, results) => {
        if (err) {
            console.error('❌ Erro no banco de dados:', err.message);
            return res.status(500).json({ erro: 'Erro interno no servidor' });
        }

        if (results.length > 0) {
            const funcionario = results[0];

            // 🔐 COMPARAÇÃO CRUCIAL: O bcrypt compara a senha digitada com o hash criptografado do banco
            bcrypt.compare(senha, funcionario.senha_criptografada, (errCompare, hashBateu) => {
                if (errCompare) {
                    return res.status(500).json({ erro: 'Erro ao validar chaves de segurança' });
                }

                if (hashBateu) {
                    console.log(`🟢 LOGIN COM SUCESSO: ${funcionario.nome} autenticado!`);
                    return res.json({
                        sucesso: true,
                        mensagem: `Bem-vindo, ${funcionario.nome}!`,
                        id_funcionario: funcionario.ID,
                        cargo: funcionario.cargo
                    });
                } else {
                    return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha inválidos.' });
                }
            });
        } else {
            return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha inválidos.' });
        }
    }); 
});

// ==========================================
// ROTA 2: CADASTRAR FUNCIONÁRIO (Gerando Hash da Senha)
// ==========================================
router.post('/cadastrar', (req, res) => {
    const { nome, login, senha, cargo } = req.body;
    console.log(`👤 ADM tentando cadastrar o funcionário: ${nome} (${cargo})...`);

    const saltRounds = 10; // Fator de complexidade da criptografia

    // 🔐 GERAÇÃO DO HASH: Embaralha a senha antes de mandar para o INSERT do MariaDB
    bcrypt.hash(senha, saltRounds, (errHash, hashCriptografado) => {
        if (errHash) {
            console.error("Erro ao gerar hash da senha:", errHash);
            return res.status(500).json({ erro: "Erro interno de segurança" });
        }

        const querySQL = "INSERT INTO funcionarios (nome, login, senha, cargo) VALUES (?, ?, ?, ?)";
        db.query(querySQL, [nome, login, hashCriptografado, cargo], (err, results) => {
            if (err) {
                console.error("❌ Erro ao cadastrar funcionário:", err.message);
                return res.status(500).json({ erro: "Não foi possível salvar o funcionário no banco" });
            }
            return res.json({ sucesso: true, mensagem: `Funcionário ${nome} cadastrado com sucesso com senha protegida!` });
        });
    });
});

// ==========================================
// ROTA 5: RESETAR SENHA (Atualizando com nova Criptografia)
// ==========================================
router.post('/resetar-senha', (req, res) => {
    const { id_func, nova_senha } = req.body;
    console.log(`🔑 API ADM: Forçando reset de senha com criptografia para o ID #${id_func}...`);

    if (!id_func || !nova_senha) {
        return res.status(400).json({ erro: "Parâmetros incompletos." });
    }

    const saltRounds = 10;

    // 🔐 GERAÇÃO DO NOVO HASH: Garante que a senha resetada também nasça criptografada
    bcrypt.hash(nova_senha, saltRounds, (errHash, hashCriptografado) => {
        if (errHash) return res.status(500).json({ erro: "Erro ao criptografar nova senha" });

        const querySQL = "UPDATE funcionarios SET senha = ? WHERE ID = ?";
        db.query(querySQL, [hashCriptografado, id_func], (err, results) => {
            if (err) {
                console.error("❌ Erro ao resetar senha no MariaDB:", err.message);
                return res.status(500).json({ erro: "Erro ao salvar a nova senha" });
            }
            return res.json({ sucesso: true, mensagem: "Senha redefinida com segurança no banco de dados!" });
        });
    });
});

// (As rotas /listar-todos e /editar continuam as mesmas de RH abaixo...)
router.get('/listar-todos', (req, res) => {
    const querySQL = "SELECT ID, nome, login, cargo FROM funcionarios ORDER BY ID ASC";
    db.query(querySQL, [], (err, results) => {
        if (err) return res.status(500).json({ erro: "Erro ao carregar lista" });
        return res.json(results);
    });
});

router.post('/editar', (req, res) => {
    const { id_func, nome, login, cargo } = req.body;
    const querySQL = "UPDATE funcionarios SET nome = ?, login = ?, cargo = ? WHERE ID = ?";
    db.query(querySQL, [nome, login, cargo, id_func], (err, results) => {
        if (err) return res.status(500).json({ erro: "Erro ao editar" });
        return res.json({ sucesso: true, mensagem: "Cadastro atualizado com sucesso!" });
    });
});

router.delete('/remover/:id', (req, res) => {
    const id_func = req.params.id;
    const querySQL = "DELETE FROM funcionarios WHERE ID = ?";
    db.query(querySQL, [id_func], (err, results) => {
        if (err) return res.status(500).json({ erro: "Erro ao excluir" });
        return res.json({ sucesso: true, mensagem: "Funcionário removido com sucesso!" });
    });
});

module.exports = router;
