const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt'); // 🟢 Importa o motor de criptografia

// ==========================================
// ROTA 1 BLINDADA: LOGIN INTELIGENTE (Com Rastreio de Texto do Front)
// ==========================================
router.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    // 🟢 LINHA DE AUDITORIA CRUCIAL: Mostra no terminal preto exatamente o que o front enviou!
    console.log(`🔐 API AUTH: Tentativa para [${usuario}] | Senha recebida do Front: [${senha}]`);
    
    const querySQL = "SELECT ID, nome, cargo, senha FROM funcionarios WHERE login = ?";

    db.query(querySQL, [usuario], (err, results) => {
        if (err) {
            console.error('❌ Erro fatal no banco de dados:', err.message);
            return res.status(500).json({ erro: 'Erro interno no servidor' });
        }

        if (!results || results.length === 0) {
            console.warn(`❌ LOGIN NEGADO: Usuário [${usuario}] não existe no banco.`);
            return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha inválidos.' });
        }

        const funcionario = results[0];
        const idFuncionarioReal = funcionario.ID || funcionario.id;
        const cargoReal = funcionario.cargo || funcionario.CARGO;
        const nomeReal = funcionario.nome || funcionario.NOME;
        const senhaDoBanco = funcionario.senha || funcionario.SENHA;

        // 🛡️ 1º TESTE: Verifica se a senha bate usando a criptografia Bcrypt padrão
        bcrypt.compare(senha, senhaDoBanco, (errCompare, hashBateu) => {
            
            if (!errCompare && hashBateu) {
                console.log(`🟢 LOGIN SUCESSO: ${nomeReal} autenticado via Hash.`);
                return res.json({
                    sucesso: true,
                    mensagem: `Bem-vindo, ${nomeReal}!`,
                    id_funcionario: idFuncionarioReal,
                    cargo: cargoReal
                });
            }

            // ⚠️ 2º TESTE (AUTO-CONVERSÃO): Se o hash falhou, checa se a senha digitada é igual ao texto limpo do banco
            if (senha === senhaDoBanco) {
                console.log(`⚠️ ALERTA: Senha em texto limpo detectada para ${nomeReal}. Iniciando auto-conversão...`);

                const saltRounds = 10;
                bcrypt.hash(senha, saltRounds, (errHash, hashCriptografado) => {
                    if (errHash) {
                        return res.status(500).json({ erro: 'Erro ao processar segurança' });
                    }

                    const queryUpdate = "UPDATE funcionarios SET senha = ? WHERE ID = ?";
                    db.query(queryUpdate, [hashCriptografado, idFuncionarioReal], (errUp) => {
                        if (errUp) {
                            console.error("❌ Erro ao auto-criptografar senha:", errUp.message);
                        } else {
                            console.log(`✅ SUCESSO: A senha de ${nomeReal} foi criptografada e salva no MariaDB!`);
                        }
                    });
                });

                return res.json({
                    sucesso: true,
                    mensagem: `Bem-vindo, ${nomeReal}! (Sua conta foi atualizada para a nova segurança)`,
                    id_funcionario: idFuncionarioReal,
                    cargo: cargoReal
                });
            }

            console.warn(`❌ LOGIN NEGADO: Senha incorreta para o usuário [${usuario}].`);
            return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha inválidos.' });
        });
    }); 
});

// ==========================================
// ROTA 2: CADASTRAR FUNCIONÁRIO (Gerando Hash)
// ==========================================
router.post('/cadastrar', (req, res) => {
    const { nome, login, senha, cargo } = req.body;
    console.log(`👤 ADM tentando cadastrar o funcionário: ${nome} (${cargo})...`);

    const saltRounds = 10; 

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
// ROTA 5: RESETAR SENHA (Com Criptografia)
// ==========================================
router.post('/resetar-senha', (req, res) => {
    const { id_func, nova_senha } = req.body;
    console.log(`🔑 API ADM: Forçando reset de senha com criptografia para o ID #${id_func}...`);

    if (!id_func || !nova_senha) {
        return res.status(400).json({ erro: "Parâmetros incompletos." });
    }

    const saltRounds = 10;

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
