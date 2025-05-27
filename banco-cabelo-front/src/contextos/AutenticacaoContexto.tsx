import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { autenticacaoServico, RespostaLogin } from '../servicos/api/autenticacao';
import * as SecureStore from 'expo-secure-store';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: 'F' | 'J' | 'A'; // F = Pessoa Física, J = Instituição, A = Admin
}

interface AutenticacaoContexto {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<RespostaLogin>;
  logout: () => Promise<void>;
  ehPessoaFisica: () => boolean;
  ehInstituicao: () => boolean;
  ehAdmin: () => boolean;
}

// Cria o contexto com um valor inicial
const AutenticacaoContexto = createContext<AutenticacaoContexto | undefined>(undefined);

// Hook personalizado para facilitar o uso do contexto
export const useAutenticacao = () => {
  const contexto = useContext(AutenticacaoContexto);
  if (!contexto) {
    throw new Error('useAutenticacao deve ser usado dentro de um AutenticacaoProvider');
  }
  return contexto;
};

// Provedor do contexto de autenticação
export const AutenticacaoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  useEffect(() => {
    const verificarAutenticacao = async () => {
      try {
        const estaAutenticado = await autenticacaoServico.estaAutenticado();
        
        if (estaAutenticado) {
          const dadosUsuario = await autenticacaoServico.obterUsuarioAtual();
          setUsuario(dadosUsuario);
        }
      } catch (erro) {
        console.error('Erro ao verificar autenticação:', erro);
      } finally {
        setCarregando(false);
      }
    };
    
    verificarAutenticacao();
  }, []); // Remover dependência do usuário
  
  // Listener separado para limpar o usuário quando o token é removido
  useEffect(() => {
    if (!usuario) return;
    
    const interval = setInterval(async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        console.log('Token não encontrado, limpando usuário...');
        setUsuario(null);
      }
    }, 5000); // Aumentar intervalo para 5 segundos
    
    return () => clearInterval(interval);
  }, [usuario]);
  
  const login = useCallback(async (email: string, senha: string) => {
    setCarregando(true);
    try {
      const resposta = await autenticacaoServico.login({ email, senha });
      setUsuario(resposta.usuario);
      return resposta;
    } catch (erro: any) {
      // Detalhes do erro para depuração
      if (erro.message === 'Network Error') {
        console.error('Erro de conexão com o servidor. Verifique se o servidor está rodando e acessível.');
      } else if (erro.response) {
        console.error('Erro ao fazer login:', erro.response.status, erro.response.data);
      } else if (erro.request) {
        console.error('Erro de requisição sem resposta:', erro.request);
      } else {
        console.error('Erro ao fazer login:', erro.message);
      }
      throw erro;
    } finally {
      setCarregando(false);
    }
  }, []);
  
  const logout = useCallback(async () => {
    setCarregando(true);
    try {
      await autenticacaoServico.logout();
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  }, []);
  
  const ehPessoaFisica = useCallback(() => usuario?.tipo === 'F', [usuario?.tipo]);
  const ehInstituicao = useCallback(() => usuario?.tipo === 'J', [usuario?.tipo]);
  const ehAdmin = useCallback(() => usuario?.tipo === 'A', [usuario?.tipo]);
  
  const valor = useMemo(() => ({
    usuario,
    carregando,
    login,
    logout,
    ehPessoaFisica,
    ehInstituicao,
    ehAdmin
  }), [usuario, carregando, login, logout, ehPessoaFisica, ehInstituicao, ehAdmin]);
  
  return (
    <AutenticacaoContexto.Provider value={valor}>
      {children}
    </AutenticacaoContexto.Provider>
  );
};