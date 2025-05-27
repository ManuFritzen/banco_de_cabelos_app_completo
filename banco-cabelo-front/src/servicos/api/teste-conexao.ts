import axios from 'axios';

export const testarConexao = async () => {
  const urls = [
    'http://192.168.2.104:3000/api',
    'http://localhost:3000/api',
    'http://127.0.0.1:3000/api',
    'http://10.0.2.2:3000/api' // Para emulador Android
  ];
  
  console.log('Testando conectividade com o servidor...');
  
  for (const url of urls) {
    try {
      console.log(`Testando: ${url}`);
      const response = await axios.get(url, { timeout: 5000 });
      console.log(`✅ Sucesso em ${url}:`, response.status);
      return url;
    } catch (error) {
      console.log(`❌ Falha em ${url}:`, error.message);
    }
  }
  
  console.error('Nenhuma URL funcionou!');
  return null;
};