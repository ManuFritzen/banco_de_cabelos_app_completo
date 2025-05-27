import cliente from './cliente';
import * as FileSystem from 'expo-file-system';

interface AnexoBase64 {
  publicacaoId: number;
  imagem: {
    uri: string;
    name?: string;
    type?: string;
  };
}

export const anexoBase64Servico = {
 
  async adicionarAnexoBase64({ publicacaoId, imagem }: AnexoBase64) {
    try {
      const base64 = await FileSystem.readAsStringAsync(imagem.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const mimeType = imagem.type || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      const response = await cliente.post(`/anexos/publicacao/${publicacaoId}/base64`, {
        foto_anexo: dataUrl,
        filename: imagem.name || `anexo_${Date.now()}.jpg`
      });
      
      return response;
    } catch (error: any) {
      throw error;
    }
  }
};