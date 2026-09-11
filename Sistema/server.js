const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const rotasMesas = require('./routes/mesas')
const rotasFuncionarios = require('./routes/funcionarios');
const rotascardapio = require('./routes/cardapio');
const rotaspedidos = require('./routes/pedidos');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/mesas', rotasMesas);
app.use('/api/funcionarios', rotasFuncionarios);
app.use('/api/cardapio', rotascardapio);
app.use('/api/pedidos',rotaspedidos);

// 🛢️ Configuração da conexão com o seu banco de dados MySQL 
const db = require('./database');
// Testando a conexão com o banco
db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar no MySQL:', err.message);
        return;
    }
    console.log('🚀 Conectado com sucesso ao banco de dados "restaurante"!');
});

// ==========================================
// ROTA BASE E PORTA DO SERVIDOR
// ==========================================
app.get('/', (req, res) => {
    res.send('Servidor do Ratatue rodando com sucesso!');
}); 

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`📡 Servidor rodando na porta http://localhost:${PORT}`);
});
