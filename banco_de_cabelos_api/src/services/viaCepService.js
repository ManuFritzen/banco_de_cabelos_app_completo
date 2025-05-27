const axios = require('axios');
const { ApiError } = require('../utils/errorHandler');

class ViaCepService {
  
  static async consultarCep(cep) {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      
      if (cepLimpo.length !== 8) {
        throw new ApiError('CEP inválido: deve conter 8 dígitos numéricos', 400);
      }
      
      const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      
      if (response.data.erro === true) {
        throw new ApiError('CEP não encontrado', 404);
      }
      
      return response.data;
    } catch (error) {
      // Se já for uma ApiError, repassa o erro
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.response) {
        if (error.response.status === 404) {
          throw new ApiError('CEP não encontrado', 404);
        }
        throw new ApiError(`Erro na consulta ao ViaCEP: ${error.response.status}`, 500);
      }
      
      throw new ApiError('Falha na conexão com o serviço de CEP', 500);
    }
  }

  static formatarCep(cep) {
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2-$3');
  }
  
  static limparCep(cep) {
    return cep.replace(/\D/g, '');
  }
}

module.exports = ViaCepService;