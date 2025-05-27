import cliente from './cliente';

interface Publicacao {
  id: number;
  titulo: string;
  conteudo: string;
  data_hora: string;
  qtd_curtidas: number;
  usuario: {
    id: number;
    nome: string;
    tipo: string;
  };
  comentarios: Comentario[];
}

interface Comentario {
  id: number;
  conteudo: string;
  data_hora: string;
  qtd_curtidas: number;
  usuario: {
    id: number;
    nome: string;
    tipo: string;
  };
}

interface NovaPublicacao {
  titulo: string;
  conteudo: string;
}

interface NovoComentario {
  conteudo: string;
}

export interface ImagemPublicacao {
  uri: string;
  name: string;
  type: string;
}

export const publicacoesServico = {
  
  getBaseURL() {
    return cliente.defaults.baseURL || '';
  },
  
  async listarPublicacoes(pagina = 1, limite = 10) {
    try {
      const resposta = await cliente.get('/publicacoes', {
        params: {
          page: pagina,
          limit: limite,
          includeComentariosCount: true  // Solicita contagem de comentários
        }
      });


      return resposta;
    } catch (error) {
      console.error('Erro ao listar publicações:', error);
      throw error;
    }
  },
  
  async obterPublicacao(id: number) {
    return cliente.get(`/publicacoes/${id}`, {
      params: {
        includeComentariosCount: true  // Solicita contagem de comentários
      }
    });
  },
  
  async criarPublicacao(dados: NovaPublicacao) {
    return cliente.post('/publicacoes', dados);
  },
  
  async atualizarPublicacao(id: number, dados: NovaPublicacao) {
    return cliente.put(`/publicacoes/${id}`, dados);
  },
  
  
  async excluirPublicacao(id: number) {
    return cliente.delete(`/publicacoes/${id}`);
  },
  
  async curtirPublicacao(id: number) {
    return cliente.post(`/publicacoes/${id}/curtir`);
  },
  
  async descurtirPublicacao(id: number) {
    return cliente.delete(`/publicacoes/${id}/curtir`);
  },
  
  async verificarCurtida(id: number) {
    return cliente.get(`/publicacoes/${id}/curtida`);
  },
  
  async adicionarComentario(publicacaoId: number, dados: NovoComentario) {
    return cliente.post(`/comentarios/publicacao/${publicacaoId}`, dados);
  },
  
  async listarComentarios(publicacaoId: number, pagina = 1, limite = 20) {
    return cliente.get(`/comentarios/publicacao/${publicacaoId}`, {
      params: { page: pagina, limit: limite }
    });
  },
  
  async adicionarAnexo(publicacaoId: number, imagem: ImagemPublicacao) {
    // Criar FormData para upload de arquivo
    const formData = new FormData();
    
    // Formatar corretamente o objeto de imagem para o React Native
    const imagemFormatada = {
      uri: imagem.uri,
      type: imagem.type || 'image/jpeg',
      name: imagem.name || `anexo_${Date.now()}.jpg`
    };
    
    formData.append('foto_anexo', imagemFormatada as any);
    
    // Configuração especial para upload de arquivos
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    return cliente.post(`/anexos/publicacao/${publicacaoId}`, formData, config);
  },
  
  async listarAnexos(publicacaoId: number) {
    return cliente.get(`/anexos/publicacao/${publicacaoId}`);
  },

  async obterAnexo(anexoId: number) {
    return cliente.get(`/anexos/${anexoId}`, { responseType: 'blob' });
  },
  
  async removerAnexo(anexoId: number) {
    return cliente.delete(`/anexos/${anexoId}`);
  }
};