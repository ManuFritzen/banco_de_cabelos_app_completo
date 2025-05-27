import cliente from './cliente';
import { gerarFormData } from '../util/formDataUtil';
import * as SecureStore from 'expo-secure-store';

interface NovaSolicitacao {
  observacao?: string;
  foto_laudo_medico: any;
  status_solicitacao_id?: number; // ID do status da solicitação (padrão: 1 - Pendente)
}

export const solicitacoesServico = {

  async listarSolicitacoes(params: any) {
    return cliente.get('/solicitacoes', {
      params: params
    });
  },
  async obterSolicitacao(id: number) {
    return cliente.get(`/solicitacoes/${id}`);
  },
  async listarSolicitacoesPorUsuario(usuarioId: number, pagina = 1, limite = 10) {
    return cliente.get(`/solicitacoes/usuario/${usuarioId}`, {
      params: { page: pagina, limit: limite }
    });
  },
  async criarSolicitacao(dados: NovaSolicitacao) {
    // Adicionar o status_solicitacao_id se não estiver presente
    const dadosCompletos = {
      ...dados,
      status_solicitacao_id: 1  // Status "Pendente"
    };
    
    const formData = gerarFormData(dadosCompletos);
    
    return cliente.post('/solicitacoes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  async atualizarStatusSolicitacao(id: number, statusId: number, observacao?: string) {
    return cliente.put(`/solicitacoes/${id}/status`, {
      status_solicitacao_id: statusId,
      observacao
    });
  },
  async atualizarObservacaoSolicitacao(id: number, observacao: string) {
    return cliente.put(`/solicitacoes/${id}/observacao`, { observacao });
  },
  async excluirSolicitacao(id: number) {
    return cliente.delete(`/solicitacoes/${id}`);
  },
  async obterUrlLaudoMedico(id: number) {
    // Obtém o token diretamente do SecureStore
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      console.error('Token não encontrado para exibir laudo médico');
      throw new Error('Token de autenticação não disponível');
    }
    
    // Adiciona timestamp para evitar cache
    const timestamp = new Date().getTime();
    const url = `${cliente.defaults.baseURL}/solicitacoes/${id}/laudo?token=${token}&_t=${timestamp}`;
    return url;
  },
  async obterLaudoMedicoParaImagem(id: number) {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        throw new Error('Token de autenticação não disponível');
      }
      
      const timestamp = new Date().getTime();
      return `${cliente.defaults.baseURL}/solicitacoes/${id}/laudo?token=${token}&_t=${timestamp}`;
    } catch (erro) {
      console.error('Erro ao obter laudo médico para imagem:', erro);
      throw erro;
    }
  }
};