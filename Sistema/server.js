const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// 🟢 CORREÇÃO MESTRE: Importa o módulo nativo do Node para gerenciamento e mapas de caminhos físicos
const path = require('path'); 
// 🛢️ Configuração e Inicialização do Pool de Conexões compartilhado com o MariaDB
const db = require('./database');

// 🔌 Importação de todas as rotas operacionais do ecossistema Ratatue

const rotasMesas = require('./routes/mesas');
const rotasFuncionarios = require('./routes/funcionarios');
const rotascardapio = require('./routes/cardapio');
const rotaspedidos = require('./routes/pedidos');
const rotasgarcons = require('./routes/garcons.js');

const app = express();

// Middlewares globais do servidor Express
app.use(cors());
app.use(express.json());

// Injeção de prefixos das rotas da API RESTful
app.use('/api/mesas', rotasMesas);
app.use('/api/funcionarios', rotasFuncionarios);
app.use('/api/cardapio', rotascardapio);
app.use('/api/pedidos', rotaspedidos);
app.use('/api/garcons', rotasgarcons);

// 🟢 LIBERAÇÃO ESTÁTICA BLINDADA: Agora o path está perfeitamente definido no topo!
// Permite que os tablets e celulares abram as fotos dos hambúrgueres salvas dentro da pasta 'imagens'
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));



// ==========================================
// ROTA BASE E PORTA DO SERVIDOR
// ==========================================
app.get('/', (req, res) => {
    res.send('Servidor do Ratatue rodando com sucesso e totalmente integrado ao Pool do MariaDB!');
}); 

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`📡 Servidor rodando na porta http://localhost:${PORT}`);
});
