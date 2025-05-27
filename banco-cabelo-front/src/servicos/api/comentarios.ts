import cliente from './cliente';

export interface Comentario {
  id: number;
  publicacao_id: number;
  usuario_id: number;
  conteudo: string;
  data_hora: string;
  qtd_curtidas: number;
  curtiu?: boolean; 
  usuario?: {
    id: number;
    nome: string;
    tipo: string;
  };
}

export interface DadosComentario {
  conteudo: string;
}

export const comentariosServico = {
  async listarComentariosPorPublicacao(publicacaoId: number, page: number = 1, limit: number = 20) {
    try {
      const resposta = await cliente.get(`/comentarios/publicacao/${publicacaoId}`, {
        params: {
          page,
          limit
        }
      });

      console.log(`Comentários para publicação ${publicacaoId}:`, {
        count: resposta.data.count,
        totalPages: resposta.data.totalPages,
        items: resposta.data.data?.length || 0
      });

      return resposta;
    } catch (erro) {
      console.error(`Erro ao listar comentários da publicação ${publicacaoId}:`, erro);
      throw erro;
    }
  },

  async obterComentarioPorId(comentarioId: number) {
    return cliente.get(`/comentarios/${comentarioId}`);
  },

  async criarComentario(publicacaoId: number, dados: DadosComentario) {
    return cliente.post(`/comentarios/publicacao/${publicacaoId}`, dados);
  },

  async atualizarComentario(comentarioId: number, dados: DadosComentario) {
    return cliente.put(`/comentarios/${comentarioId}`, dados);
  },

  async excluirComentario(comentarioId: number) {
    return cliente.delete(`/comentarios/${comentarioId}`);
  },

};