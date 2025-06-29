const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
require('./utils/tarefasCrons');

const usuarioRoutes = require('./routes/usuarioRoutes');
const adminRoutes = require('./routes/adminRoutes');
const enderecoRoutes = require('./routes/enderecoRoutes');
const perucaRoutes = require('./routes/perucaRoutes');
const solicitacaoRoutes = require('./routes/solicitacaoRoutes');
const solicitacaoInstituicaoRoutes = require('./routes/solicitacaoInstituicaoRoutes');
const doacaoCabeloRoutes = require('./routes/recebimentoCabeloRoutes');
const publicacaoRoutes = require('./routes/publicacaoRoutes');
const comentarioRoutes = require('./routes/comentarioRoutes');
const anexoPublicacaoRoutes = require('./routes/anexoPublicacaoRoutes');
const doacaoRoutes = require('./routes/doacaoRoutes');
const curtidaRoutes = require('./routes/curtidaRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');

const app = express();

// Middlewares
app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enderecos', enderecoRoutes);
app.use('/api/perucas', perucaRoutes);
app.use('/api/solicitacoes', solicitacaoRoutes);
app.use('/api/solicitacoes-instituicao', solicitacaoInstituicaoRoutes);
app.use('/api/recebimento', doacaoCabeloRoutes);
app.use('/api/publicacoes', publicacaoRoutes);
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/anexos', anexoPublicacaoRoutes);
app.use('/api/doacoes', doacaoRoutes);
app.use('/api/curtidas', curtidaRoutes);
app.use('/api/notificacoes', notificacaoRoutes);

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online',
    timestamp: new Date(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.use((req, res, next) => {
  res.status(404).json({ 
    error: true,
    message: 'Endpoint não encontrado' 
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    error: true,
    message: err.message || 'Erro interno do servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;