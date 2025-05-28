import cliente from './cliente';
import * as FileSystem from 'expo-file-system';

interface NovaSolicitacaoBase64 {
  observacao: string;
  foto_laudo_medico: {
    uri: string;
    name?: string;
    type?: string;
  };
  status_solicitacao_id?: number;
}

export const solicitacaoBase64Servico = {
   //Cria uma nova solicitação usando Base64
  async criarSolicitacaoBase64(dados: NovaSolicitacaoBase64) {
    try {
      
      // Converter imagem para Base64
      const base64 = await FileSystem.readAsStringAsync(dados.foto_laudo_medico.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Criar data URL
      const mimeType = dados.foto_laudo_medico.type || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      const payload = {
        observacao: dados.observacao,
        foto_laudo_medico: dataUrl,
        filename: dados.foto_laudo_medico.name || `laudo_${Date.now()}.jpg`,
        status_solicitacao_id: dados.status_solicitacao_id || 1
      };
      
     
      // Enviar como JSON
      const response = await cliente.post('/solicitacoes/base64', payload);
      
      return response;
    } catch (error: any) {
      console.error('Erro ao criar solicitação Base64:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      throw error;
    }
  }
};