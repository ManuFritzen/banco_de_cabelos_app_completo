import cliente from './cliente';

export interface Endereco {
  id?: number;
  usuario_id?: number;
  cep: string;
  rua: string;
  bairro: string;
  numero?: string;
  complemento?: string;
  cidade: string;
  estado: string;
  ibge?: string;
}

export interface CepData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
}

export const enderecoServico = {
  async buscarCep(cep: string): Promise<CepData | null> {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }
      
      console.log('Buscando CEP:', cepLimpo);
      const response = await cliente.get(`/enderecos/cep/${cepLimpo}`);
      console.log('Resposta completa do CEP:', response.data);
      
      if (response.data.success) {
        // O backend retorna os dados diretamente, não dentro de 'data'
        const dados = {
          cep: response.data.cep,
          logradouro: response.data.logradouro,
          bairro: response.data.bairro,
          localidade: response.data.localidade,
          uf: response.data.uf,
          ibge: response.data.ibge
        };
        console.log('Dados formatados do CEP:', dados);
        return dados;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  },

  async listarEnderecosPorUsuario(usuarioId: number) {
    return cliente.get(`/enderecos/usuario/${usuarioId}`);
  },

  async criarEndereco(endereco: Endereco) {
    // Ajustar os campos para corresponder ao backend
    const dados = {
      usuario_id: endereco.usuario_id,
      cep: endereco.cep.replace(/\D/g, ''), // Remove formatação
      rua: endereco.rua,
      bairro: endereco.bairro,
      nro: endereco.numero || '',
      complemento: endereco.complemento || '',
      cidade: endereco.cidade,
      estado: endereco.estado.toUpperCase(),
      ibge: endereco.ibge || '',
      cidade_id: 1 // Por enquanto fixo, depois pode ser ajustado
    };
    
    // Se é durante o cadastro (sem autenticação), usar rota especial
    if (!endereco.usuario_id) {
      return cliente.post('/enderecos', dados);
    } else {
      return cliente.post('/enderecos/cadastro', dados);
    }
  },

  async atualizarEndereco(id: number, endereco: Partial<Endereco>) {
    const dados = {
      ...endereco,
      cep: endereco.cep?.replace(/\D/g, ''),
      nro: endereco.numero,
      estado: endereco.estado?.toUpperCase()
    };
    
    return cliente.put(`/enderecos/${id}`, dados);
  },

  async excluirEndereco(id: number) {
    return cliente.delete(`/enderecos/${id}`);
  }
};