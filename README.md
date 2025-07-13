# App Banco de Cabelos

<div align="center">
  <img src="app.gif" width="300" alt="Demonstração do App Banco de Cabelos">
</div>

## Sobre o Projeto

O App Banco de Cabelos é uma plataforma móvel desenvolvida como Trabalho de Conclusão de Curso que visa conectar doadores de cabelo, instituições beneficentes e pessoas que necessitam de perucas devido a condições médicas como câncer, alopecia, lúpus e outras doenças.

A aplicação facilita e democratiza o processo de doação de cabelos e distribuição de perucas, criando uma ponte digital entre doadores, instituições e beneficiários. Além disso, promove uma comunidade de apoio mútuo através de um fórum interativo onde experiências são compartilhadas e vínculos de solidariedade são estabelecidos.

## Funcionalidades Principais

### Para Pessoas Físicas
- **Doação de Cabelo**: Registro e acompanhamento de doações
- **Solicitação de Perucas**: Processo simplificado com upload de documentação médica
- **Fórum Comunitário**: Espaço para compartilhar experiências e apoio mútuo
- **Sistema de Notificações**: Acompanhamento em tempo real do status das solicitações

### Para Instituições
- **Gestão de Perucas**: Cadastro e controle de disponibilidade
- **Análise de Solicitações**: Sistema democrático onde múltiplas instituições podem avaliar pedidos
- **Recebimento de Doações**: Registro e processamento de cabelos doados
- **Participação no Fórum**: Comunicação direta com a comunidade

### Para Administradores
- **Gerenciamento de Usuários**: Controle de contas e permissões
- **Moderação de Conteúdo**: Manutenção de um ambiente seguro e respeitoso
- **Visualização de Estatísticas**: Métricas operacionais para tomada de decisões

## Tecnologias Utilizadas

### Frontend Mobile
- **React Native** v0.72.4 - Framework para desenvolvimento mobile cross-platform
- **TypeScript** - Tipagem estática para JavaScript
- **Expo SDK** v49.0.0 - Plataforma de desenvolvimento e build
- **React Navigation** v6.1.7 - Navegação entre telas
- **Formik** + **Yup** - Gerenciamento e validação de formulários
- **Axios** - Cliente HTTP para comunicação com API
- **Tailwind CSS** (React Native) - Sistema de estilização

### Backend
- **Node.js** v18.17.0 - Runtime JavaScript
- **Express.js** v4.18.2 - Framework web minimalista
- **PostgreSQL** v15 - Banco de dados relacional
- **Sequelize ORM** v6.32.1 - Mapeamento objeto-relacional
- **JWT** - Autenticação baseada em tokens
- **Bcrypt** - Criptografia de senhas
- **Multer** - Upload de arquivos

### Integrações
- **ViaCEP API** - Validação e preenchimento automático de endereços

## Arquitetura

O sistema segue uma arquitetura cliente-servidor com:

- **Frontend Mobile**: Interface multiplataforma desenvolvida em React Native
- **API RESTful**: Backend em Node.js/Express seguindo padrão MVC
- **Banco de Dados**: PostgreSQL para persistência de dados
- **Autenticação**: JWT com refresh tokens e blacklist

## Instalação e Configuração

### Pré-requisitos
- Node.js v14 ou superior
- PostgreSQL v12 ou superior
- npm ou yarn
- Expo CLI (para o frontend mobile)

### Backend

1. Navegue até a pasta do backend:
```bash
cd banco_de_cabelos_api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Crie o banco de dados PostgreSQL usando o arquivo:
```bash
psql -U seu_usuario -d postgres -f banco_cabelos.sql
```

5. Inicie o servidor:
```bash
npm run dev
```

### Frontend Mobile

1. Navegue até a pasta do frontend:
```bash
cd banco-cabelo-front
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo de ambiente com o IP da API

4. Inicie o aplicativo:
```bash
npx expo start
```

5. Use o Expo Go no seu dispositivo móvel ou um emulador para testar

## API e Documentação

### Collection do Postman

Para facilitar o teste e integração com a API, disponibilizamos uma **collection completa do Postman** com todos os endpoints documentados e organizados por módulos:

**Localização**: `banco_de_cabelos_api/docs/`

**Arquivos disponíveis**:
- `Banco_de_Cabelos_API.postman_collection.json` - Collection para importar no Postman

### Como usar a Collection:

1. **Importar no Postman**:
   - Abra o Postman
   - Clique em **Import**
   - Selecione o arquivo `banco_de_cabelos_api/docs/Banco_de_Cabelos_API.postman_collection.json`

2. **Configurar Variáveis**:
   - `base_url`: `http://localhost:3000/api`
   - Configure os tokens JWT após fazer login

3. **Testar Endpoints**:
   - A collection inclui **89 endpoints** organizados em **15 módulos**
   - Exemplos de requisição para todos os casos de uso
   - Documentação embutida em cada endpoint

### Módulos da API:
- ✅ Autenticação e Gestão de Usuários
- ✅ Administração do Sistema
- ✅ Gestão de Endereços
- ✅ Catálogo de Perucas
- ✅ Solicitações e Análises
- ✅ Doações de Cabelo
- ✅ Fórum Comunitário
- ✅ Sistema de Curtidas
- ✅ Notificações

## Segurança e Privacidade

O aplicativo foi desenvolvido com foco na proteção de dados sensíveis, especialmente informações médicas, seguindo as diretrizes da LGPD (Lei Geral de Proteção de Dados):

- Criptografia de senhas com bcrypt
- Autenticação JWT com tokens de acesso e refresh
- Armazenamento seguro de dados sensíveis
- Validação de dados em múltiplas camadas
- Tratamento adequado de informações médicas

## Contribuindo

Este projeto é de código aberto e aceita contribuições. Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autora

**Emanuelle Fritzen Machado**

Trabalho de Conclusão de Curso apresentado ao Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas do Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do Sul - Campus Rio Grande.

**Orientador**: Prof. Dr. Igor Avila Pereira  
**Coorientador**: Prof. Msc. Vinicius Fritzen Machado

## Agradecimentos

- Ao IFRS Campus Rio Grande pela estrutura e suporte
- Aos orientadores pelo direcionamento e apoio
- À comunidade de desenvolvedores pelas ferramentas open source
- A todos que contribuíram direta ou indiretamente para este projeto

## Status do Projeto

O App Banco de Cabelos encontra-se em desenvolvimento ativo. As funcionalidades principais estão implementadas e funcionais, mas melhorias e novas features continuam sendo adicionadas.

### Funcionalidades Implementadas ✅
- Sistema completo de autenticação e autorização
- Cadastro diferenciado para pessoas físicas e instituições
- Doação e recebimento de cabelos
- Gestão de perucas (cadastro, listagem, filtros)
- Sistema de solicitações com upload de documentação
- Fórum com publicações, comentários e curtidas
- Sistema de notificações
- Painel administrativo

### Próximas Implementações 🚀
- Sistema de geolocalização para busca por proximidade
- Chat entre usuários e instituições
- Notificações push
- Integração com redes sociais
- Versão web para instituições
- Sistema de gamificação

## Contato

Para dúvidas, sugestões ou reportar problemas, abra uma issue no GitHub ou entre em contato através do meu email manufritzenpro@gmail.com.

---

**Nota**: Este projeto foi desenvolvido com propósito educacional e social, visando criar um impacto positivo na vida de pessoas que enfrentam a perda capilar devido a condições médicas.