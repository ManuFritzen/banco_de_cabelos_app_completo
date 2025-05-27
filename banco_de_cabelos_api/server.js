const app = require('./src/app.js');
const { testConnection } = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await testConnection();
  
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV}`);
  });
};

process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Promessa rejeitada não tratada:', error);
  process.exit(1);
});

startServer();