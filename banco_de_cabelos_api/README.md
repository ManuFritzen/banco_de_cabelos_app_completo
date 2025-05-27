# API Banco de Cabelos

Este projeto é uma API RESTful para um aplicativo de banco de cabelos, permitindo gerenciar doações de cabelo, solicitações de perucas e um fórum para interação entre usuários.

## Estrutura do Projeto

O projeto segue a arquitetura MVC (Model-View-Controller):

- **Models**: Representam as tabelas do banco de dados e suas relações
- **Controllers**: Gerenciam a lógica de negócio e as requisições
- **Routes**: Definem os endpoints da API
- **Middlewares**: Funções intermediárias para processamento de requisições
- **Utils**: Utilitários e funções auxiliares
- **Config**: Configurações do projeto

## Requisitos

- Node.js (v14 ou superior)
- PostgreSQL (v12 ou superior)
- npm ou yarn

## Instalação


1. Instale as dependências:
```bash
npm install
# ou
yarn install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com as configurações do seu ambiente
```

3. Crie o banco de dados PostgreSQL, o arquivo está na pasta do projeto:
   - banco_cabelos.sql

4. Inicie o servidor:
```bash
npm run dev
# ou
yarn dev
```