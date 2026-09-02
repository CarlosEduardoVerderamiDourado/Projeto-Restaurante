const mysql = require('mysql2');



// 🛢️ Configuração da conexão com o seu banco de dados MySQL 
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',          
    password: '',          
    database: 'restaurante'
});

// Testando a conexão com o banco
db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar no MySQL:', err.message);
        return;
    }
    console.log('🚀 Conectado com sucesso ao banco de dados "restaurante"!');
});
module.exports = db;
