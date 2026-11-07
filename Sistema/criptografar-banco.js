const db = require('./database'); // Puxa a sua conexão compartilhada com o banco
const bcrypt = require('bcrypt');

console.log("🔒 INICIANDO CONVERSÃO E CRIPTOGRAFIA DE SENHAS DOS COLABORADORES...");

// 1️⃣ Busca todos os funcionários que ainda estão com senhas limpas (que não começam com '$2b$')
const queryBusca = "SELECT ID, nome, senha FROM funcionarios WHERE senha NOT LIKE '$2b$%'";

db.query(queryBusca, [], async (err, funcionarios) => {
    if (err) {
        console.error("❌ Erro ao buscar funcionários:", err.message);
        process.exit(1);
    }

    if (funcionarios.length === 0) {
        console.log("✨ Tudo pronto! Todos os funcionários já possuem senhas criptografadas no banco de dados.");
        process.exit(0);
    }

    console.log(`📊 Encontrados ${funcionarios.length} funcionário(s) para atualizar...`);

    const saltRounds = 10;

    // Varre a lista usando um loop assíncrono seguro
    for (let f of funcionarios) {
        try {
            console.log(`🔐 Criptografando senha do colaborador: ${f.nome}...`);
            
            // Gera o Hash matemático perfeito do bcrypt baseado na senha atual dele (ex: '1234')
            const hashCriptografado = await bcrypt.hash(f.senha, saltRounds);

            // Grava o hash gigante de volta na linha correspondente do MariaDB
            const queryUpdate = "UPDATE funcionarios SET senha = ? WHERE ID = ?";
            
            await new Promise((resolve, reject) => {
                db.query(queryUpdate, [hashCriptografado, f.ID], (errUp) => {
                    if (errUp) reject(errUp);
                    else resolve();
                });
            });

            console.log(`✅ ${f.nome} atualizado com sucesso!`);
        } catch (erro) {
            console.error(`❌ Erro ao processar ${f.nome}:`, erro.message);
        }
    }

    console.log("🎉 PROCESSAMENTO CONCLUÍDO! Todos os funcionários foram migrados para a nova segurança.");
    process.exit(0);
});
