import cliente from './cliente';
import { gerarFormData } from '../util/formDataUtil';

interface NovaDoacaoCabelo {
  instituicao_id: number;
  peso?: number;
  comprimento?: number;
  cor_id?: number;
  observacao?: string;
  foto_cabelo?: any;
}


export const doacaoCabeloServico = {
 
  async listarCores() {
    return cliente.get('/perucas/cores');
  },
  async criarDoacaoCabelo(dados: NovaDoacaoCabelo) {
    const formData = new FormData();
    
    formData.append('instituicao_id', String(dados.instituicao_id));
    
    if (dados.peso !== undefined) {
      formData.append('peso', String(dados.peso));
    }
    
    if (dados.comprimento !== undefined) {
      formData.append('comprimento', String(dados.comprimento));
    }
    
    if (dados.cor_id !== undefined) {
      formData.append('cor_id', String(dados.cor_id));
    }
    
    if (dados.observacao) {
      formData.append('observacao', dados.observacao);
    }
    
    if (dados.foto_cabelo) {
      try {
        // Verificar se a foto está no formato correto
        if (typeof dados.foto_cabelo === 'object' && dados.foto_cabelo.uri) {
          // Garantir que o tipo mime esteja definido corretamente
          const tipoMime = dados.foto_cabelo.type || 'image/jpeg';
          
          // Garantir que o nome do arquivo seja curto para evitar problemas
          let fileName = dados.foto_cabelo.name || 'foto_cabelo.jpg';
          if (fileName.length > 30) {
            const ext = fileName.split('.').pop() || 'jpg';
            fileName = `foto_${Date.now() % 10000}.${ext}`;
          }
          
          const fotoFormatada = {
            uri: dados.foto_cabelo.uri,
            type: tipoMime,
            name: fileName
          };
          // Anexar ao FormData usando uma chave simplificada
          formData.append('foto_cabelo', fotoFormatada as any);
        } else {
          console.warn('Formato de foto inválido:', dados.foto_cabelo);
        }
      } catch (erro) {
        console.error('Erro ao adicionar foto ao FormData:', erro);
        throw new Error('Não foi possível processar a imagem. Tente com uma imagem menor.');
      }
    }
    
    try {
      
      // Aumentar timeout para upload de imagens
      // Endpoint correto para doação de cabelo
      return await cliente.post('/recebimento', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 segundos
      });
    } catch (erro: any) {
      console.error('Erro na requisição:', erro.message || erro);
      
      if (erro.message === 'Network Error') {
        
        return await cliente.post('/recebimento', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000 // 60 segundos
        });
      }
      
      throw erro;
    }
  },
 
  async listarTodasDoacoesCabelo(pagina = 1, limite = 10) {
    return cliente.get('/recebimento', {
      params: { page: pagina, limit: limite }
    });
  },

  async listarMinhasDoacoesCabelo(pagina = 1, limite = 10) {
    return cliente.get('/recebimento/pessoa', {
      params: { page: pagina, limit: limite }
    });
  },
  
  
 
  async listarRecebimentosInstituicao(pagina = 1, limite = 10) {
    return cliente.get('/recebimento/instituicao', {
      params: { page: pagina, limit: limite }
    });
  },
  
  obterUrlImagemCabelo(id: number) {
    return `${cliente.defaults.baseURL}/recebimento/imagem/${id}`;
  }
};