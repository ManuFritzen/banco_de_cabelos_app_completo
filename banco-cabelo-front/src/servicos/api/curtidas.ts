import api from './cliente';

export interface CurtidaResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ListaCurtidasResponse {
  success: boolean;
  data: {
    id: number;
    nome: string;
    tipo: string;
    data_hora: string;
  }[];
}

const curtidasServico = {
  curtirPublicacao: async (publicacaoId: number) => {
    const response = await api.post<CurtidaResponse>(`/curtidas/publicacao/${publicacaoId}`);
    return response.data;
  },

  descurtirPublicacao: async (publicacaoId: number) => {
    const response = await api.delete<CurtidaResponse>(`/curtidas/publicacao/${publicacaoId}`);
    return response.data;
  },

  listarCurtidasPublicacao: async (publicacaoId: number) => {
    const response = await api.get<ListaCurtidasResponse>(`/curtidas/publicacao/${publicacaoId}`);
    return response.data;
  },

  curtirComentario: async (comentarioId: number) => {
    const response = await api.post<CurtidaResponse>(`/curtidas/comentario/${comentarioId}`);
    return response.data;
  },

  descurtirComentario: async (comentarioId: number) => {
    const response = await api.delete<CurtidaResponse>(`/curtidas/comentario/${comentarioId}`);
    return response.data;
  },

  listarCurtidasComentario: async (comentarioId: number) => {
    const response = await api.get<ListaCurtidasResponse>(`/curtidas/comentario/${comentarioId}`);
    return response.data;
  },
};

export default curtidasServico;