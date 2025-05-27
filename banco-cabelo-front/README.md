# Banco de Cabelos - Frontend

APP que conecta doadores de cabelo, instituições e pessoas que necessitam de perucas. Desenvolvido com React Native e Expo, este projeto faz parte do TCC (Trabalho de Conclusão de Curso).

## 🚀 Tecnologias

- React Native
- TypeScript
- Expo
- React Navigation
- Formik + Yup
- Axios
- react-native-tailwindcss
- Expo Secure Store

## 📱 Funcionalidades

- Autenticação de usuários (pessoa física e instituições)
- Fórum para publicações e interação da comunidade
- Busca e visualização de instituições cadastradas
- Processo de doação de cabelo
- Gerenciamento de recebimentos (para instituições)
- Perfil de usuário

## ⚙️ Pré-requisitos

- Node.js (v18 ou superior)
- npm ou yarn
- Expo CLI
- Ambiente de desenvolvimento React Native configurado
- Um dispositivo físico ou emulador para testes

## 🔧 Instalação

1. Instale as dependências
```bash
npm install
# ou
yarn install
```

2. Configure o arquivo de ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
API_URL=http://seu-backend-url:3000/api
```

3. Inicie a aplicação
```bash
npm start
# ou
yarn start
```

4. Use o aplicativo Expo Go no seu dispositivo para escanear o QR code ou abra no emulador


## 🔄 Configuração da API

O aplicativo está configurado para se conectar a uma API backend. Por padrão, a conexão é feita usando o endereço IP e porta configurados em `src/servicos/api/cliente.ts`.

Para alterar o endereço da API:

1. Abra o arquivo `src/servicos/api/cliente.ts`
2. Atualize a constante `API_URL` para apontar para o seu servidor backend:
```typescript
const API_URL = 'http://seu-ip:3000/api';
```

## 📱 Rodando no dispositivo físico

Para testar o aplicativo em um dispositivo físico:

1. Certifique-se de que o dispositivo está na mesma rede Wi-Fi do computador
2. Inicie a aplicação com `npm start`
3. Escaneie o QR code com o aplicativo Expo Go (Android) ou com a câmera (iOS)


## 🧪 Depuração

Para depurar o aplicativo:

1. Agite o dispositivo para abrir o menu de desenvolvedor
2. Selecione "Debug Remote JS" para habilitar a depuração JavaScript
3. Use o React Native Debugger ou as ferramentas de desenvolvedor do navegador

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Contribuição

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 👥 Autores

- **Emanuelle Fritzen Machado** - *Desenvolvedora Full Satck* - [ManuFritzen](https://github.com/ManuFritzen)

## 📞 Contato

Se você tiver alguma dúvida ou sugestão sobre o projeto, entre em contato pelo e-mail: manufritzenpro@gmail.com