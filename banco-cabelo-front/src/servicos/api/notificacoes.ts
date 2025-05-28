import cliente from './cliente';

export interface Notificacao {
  id: number;
  usuario_id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  data_hora: string;
  publicacao_id?: number;
  comentario_id?: number;
  solicitacao_id?: number;
  recebimento_id?: number;
  usuario_origem_id?: number;
  UsuarioOrigem?: {
    id: number;
    nome: string;
    tipo: string;
    foto_perfil?: string;
  };
  Publicacao?: {
    id: number;
    titulo: string;
  };
  Comentario?: {
    id: number;
    conteudo: string;
  };
  Solicitacao?: {
    id: number;
    status_solicitacao_id: number;
  };
}

export interface ListaNotificacoesResponse {
  success: boolean;
  count: number;
  totalPages: number;
  currentPage: number;
  data: Notificacao[];
}

export interface ContagemNaoLidasResponse {
  success: boolean;
  count: number;
}

export const notificacoesAPI = {
  // Listar notificações
  listar: async (page = 1, limit = 10, lida?: boolean) => {
    const params: any = { page, limit };
    if (lida !== undefined) {
      params.lida = lida;
    }
    const response = await cliente.get<ListaNotificacoesResponse>('/notificacoes', { params });
    return response.data;
  },

  // Contar notificações não lidas
  contarNaoLidas: async () => {
    const response = await cliente.get<ContagemNaoLidasResponse>('/notificacoes/count');
    return response.data;
  },

  // Marcar como lida
  marcarComoLida: async (id: number) => {
    const response = await cliente.put(`/notificacoes/${id}/lida`);
    return response.data;
  },

  // Marcar todas como lidas
  marcarTodasComoLidas: async () => {
    const response = await cliente.put('/notificacoes/todas/lidas');
    return response.data;
  },

  // Excluir notificação
  excluir: async (id: number) => {
    const response = await cliente.delete(`/notificacoes/${id}`);
    return response.data;
  },

  // Limpar notificações antigas
  limparAntigas: async () => {
    const response = await cliente.delete('/notificacoes/limpar/antigas');
    return response.data;
  }
};