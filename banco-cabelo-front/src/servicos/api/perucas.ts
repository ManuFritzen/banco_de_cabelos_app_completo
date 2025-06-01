import cliente from './cliente';
import { gerarFormData } from '../util/formDataUtil';

interface FiltroPerucas {
  tipo_peruca_id?: number;
  cor_id?: number;
  tamanho?: 'P' | 'M' | 'G';
  instituicao_id?: number;
  disponivel?: boolean;
}

interface NovaPeruca {
  tipo_peruca_id: number;
  cor_id: number;
  comprimento?: number;
  tamanho: 'P' | 'M' | 'G';
  foto_peruca?: any; 
}

export const perucasServico = {
  async listarPerucas(filtros: FiltroPerucas = {}, pagina = 1, limite = 10) {
    return cliente.get('/perucas', {
      params: {
        ...filtros,
        page: pagina,
        limit: limite
      }
    });
  },
  async obterPeruca(id: number) {
    return cliente.get(`/perucas/${id}`);
  },
  async listarPerucasPorInstituicao(instituicaoId: number, pagina = 1, limite = 10) {
    return cliente.get(`/perucas/instituicao/${instituicaoId}`, {
      params: { page: pagina, limit: limite }
    });
  },
  async criarPeruca(dados: NovaPeruca) {
    const formData = new FormData();
    
    // Adicionar todos os campos, exceto a foto
    if (dados.tipo_peruca_id) {
      formData.append('tipo_peruca_id', String(dados.tipo_peruca_id));
    }
    
    if (dados.cor_id) {
      formData.append('cor_id', String(dados.cor_id));
    }
    
    if (dados.comprimento) {
      formData.append('comprimento', String(dados.comprimento));
    }
    
    if (dados.tamanho) {
      formData.append('tamanho', dados.tamanho);
    }
    
    // Adicionar a foto se existir, com verificação de formato
    if (dados.foto_peruca) {
      try {
        // Verificar se a foto está no formato correto
        if (typeof dados.foto_peruca === 'object' && dados.foto_peruca.uri) {
          // Garantir que o tipo mime esteja definido corretamente
          const tipoMime = dados.foto_peruca.type || 'image/jpeg';
          
          // Garantir que o nome do arquivo seja curto para evitar problemas
          let fileName = dados.foto_peruca.name || 'foto_peruca.jpg';
          if (fileName.length > 30) {
            const ext = fileName.split('.').pop() || 'jpg';
            fileName = `peruca_${Date.now() % 10000}.${ext}`;
          }
          
          // Criar objeto de foto no formato que o FormData espera
          const fotoFormatada = {
            uri: dados.foto_peruca.uri,
            type: tipoMime,
            name: fileName
          };
          
          // Anexar ao FormData usando uma chave simplificada
          formData.append('foto_peruca', fotoFormatada as any);
        } else {
          console.warn('Formato de foto inválido:', dados.foto_peruca);
        }
      } catch (erro) {
        console.error('Erro ao adicionar foto ao FormData:', erro);
        throw new Error('Não foi possível processar a imagem. Tente com uma imagem menor.');
      }
    }
    
    try {
      // Aumentar timeout para upload de imagens
      return await cliente.post('/perucas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 segundos
      });
    } catch (erro: any) {
      console.error('Erro na requisição:', erro.message || erro);
      
      if (erro.message === 'Network Error') {
        
        return await cliente.post('/perucas', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000 // 60 segundos
        });
      }
      
      throw erro;
    }
  },
  async atualizarPeruca(id: number, dados: Partial<NovaPeruca>) {
    // Se há uma foto, usa FormData
    if (dados.foto_peruca) {
      const formData = gerarFormData(dados);
      
      return cliente.put(`/perucas/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    
    // Caso contrário, envia como JSON normal
    return cliente.put(`/perucas/${id}`, dados);
  },
  async excluirPeruca(id: number) {
    return cliente.delete(`/perucas/${id}`);
  },
  obterUrlImagemPeruca(id: number, token?: string) {
    // Obtém a base URL e adiciona timestamp para evitar cache
    const baseURL = cliente.defaults.baseURL || '';
    const timestamp = new Date().getTime();
    
    // Usar token fornecido ou tentar do header
    let tokenFinal = token || '';
    if (!tokenFinal && cliente.defaults.headers.common['Authorization']) {
      tokenFinal = String(cliente.defaults.headers.common['Authorization']).replace('Bearer ', '');
    }
    
    const url = `${baseURL}/perucas/${id}/imagem?token=${tokenFinal}&_t=${timestamp}`;
    
    return url;
  },
  async listarCores() {
    return cliente.get('/perucas/cores');
  },
  async listarTiposPeruca() {
    return cliente.get('/perucas/tipos');
  }
};