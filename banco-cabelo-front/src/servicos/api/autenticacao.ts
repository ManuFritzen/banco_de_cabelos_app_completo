import cliente from './cliente';
import * as SecureStore from 'expo-secure-store';

export interface CredenciaisLogin {
  email: string;
  senha: string;
}

export interface RespostaLogin {
  success: boolean;
  token: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    tipo: 'F' | 'J' | 'A'; // F = Pessoa Física, J = Instituição, A = Admin
  };
}

export interface DadosCadastroUsuario {
  nome: string;
  email: string;
  senha: string;
  tipo: 'F' | 'J';
  cpf?: string;
  cnpj?: string;
  telefone?: string;
}

export const autenticacaoServico = {
  
  async login(credenciais: CredenciaisLogin): Promise<RespostaLogin> {
    const resposta = await cliente.post<RespostaLogin>('/usuarios/login', credenciais);
    
    if (resposta.data.token) {
      await SecureStore.setItemAsync('token', resposta.data.token);
      await SecureStore.setItemAsync('usuario', JSON.stringify(resposta.data.usuario));
    }
    
    return resposta.data;
  },
 
  async logout(): Promise<void> {
    try {
      await cliente.post('/usuarios/logout');
    } finally {
      // Mesmo que ocorra um erro na API, limpa os dados locais
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('usuario');
    }
  },
  
  
  async cadastrar(dados: DadosCadastroUsuario) {
    return cliente.post('/usuarios', dados);
  },
  
  async estaAutenticado(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('token');
    return !!token;
  },
 
  async obterUsuarioAtual() {
    const usuarioJson = await SecureStore.getItemAsync('usuario');
    return usuarioJson ? JSON.parse(usuarioJson) : null;
  },

  async verificarCPFExistente(cpf: string): Promise<boolean> {
    try {
      const resposta = await cliente.get(`/usuarios/verificar/cpf/${cpf}`);
      // Se retornar status 200, significa que o CPF é único (não existe)
      return false;
    } catch (erro: any) {
      if (erro.response?.status === 409) {
        return true; // CPF já existe
      }
      // Outros erros podem ocorrer, mas não significa que o CPF existe
      return false;
    }
  },

  async verificarCNPJExistente(cnpj: string): Promise<boolean> {
    try {
      const resposta = await cliente.get(`/usuarios/verificar/cnpj/${cnpj}`);
      // Se retornar status 200, significa que o CNPJ é único (não existe)
      return false;
    } catch (erro: any) {
      // Se retornar erro, pode significar que o CNPJ já existe
      if (erro.response?.status === 409) {
        return true; // CNPJ já existe
      }
      // Outros erros podem ocorrer, mas não significa que o CNPJ existe
      return false;
    }
  },

  async verificarEmailExistente(email: string): Promise<boolean> {
    try {
      const resposta = await cliente.get(`/usuarios/verificar/email/${email}`);
      // Se retornar status 200, significa que o email é único (não existe)
      return false;
    } catch (erro: any) {
      // Se retornar erro, pode significar que o email já existe
      if (erro.response?.status === 409) {
        return true; // Email já existe
      }
      // Outros erros podem ocorrer, mas não significa que o email existe
      return false;
    }
  }
};