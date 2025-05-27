import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { CommonActions } from '@react-navigation/native';

// Use 10.0.2.2 para emulador Android, ou o IP da sua máquina para dispositivo físico
// const API_URL = 'http://192.168.2.100:3000/api'; // Para emulador Android
const API_URL = 'http://192.168.2.100:3000/api'; // Para dispositivo físico

// Cliente axios para as requisições
const cliente = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variável global para armazenar a referência do navigation
let navigationRef: any = null;

export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

// Interceptador para adicionar o token de autenticação a todas as requisições
cliente.interceptors.request.use(
  async (config) => {
    // Busca o token armazenado
    const token = await SecureStore.getItemAsync('token');
    
    // Adiciona o token ao header se ele existir
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Para upload de arquivos, não sobrescrever o Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (erro) => {
    // Retorna o erro caso ocorra algum problema
    return Promise.reject(erro);
  }
);

// Interceptador para tratar erros nas respostas
cliente.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    // Trata erro de autenticação (401)
    if (erro.response && erro.response.status === 401) {
      // Verifica se é um erro de token - ampliando a detecção
      const message = erro.response.data?.message || '';
      const error = erro.response.data?.error || '';
      const isTokenError = 
        message.toLowerCase().includes('token') || 
        message.toLowerCase().includes('acesso') ||
        error.toLowerCase().includes('token') ||
        error.toLowerCase().includes('acesso');
      
      if (isTokenError || erro.response.status === 401) {
        
        // Remove o token armazenado
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('usuario');
        
        // Força um pequeno delay para garantir que o navigation esteja pronto
        setTimeout(() => {
          if (navigationRef && navigationRef.isReady()) {
            navigationRef.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
          } else {
            // Tenta novamente após mais um segundo
            setTimeout(() => {
              if (navigationRef && navigationRef.isReady()) {
                navigationRef.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                );
              }
            }, 1000);
          }
        }, 100);
      }
    }
    
    return Promise.reject(erro);
  }
);

export default cliente;