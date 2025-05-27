import cliente from './cliente';
import * as FileSystem from 'expo-file-system';
import { imagemUtil } from '../util/imagemUtil';

export const fotoPerfilBase64Servico = {
  // Converter imagem para base64
  async converterImagemParaBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Erro ao converter imagem para base64:', error);
      throw error;
    }
  },

  async uploadFotoBase64(usuarioId: number, foto: any) {
    console.log('Iniciando upload base64 para usuário:', usuarioId);
    
    try {
      // Redimensionar imagem para tamanho menor
      const imagemRedimensionada = await imagemUtil.redimensionarImagem(foto.uri, 800);
      
      // Converter imagem redimensionada para base64
      const base64Data = await this.converterImagemParaBase64(imagemRedimensionada.uri);
      
      // Detectar tipo MIME
      const tipoMime = 'image/jpeg'; // Sempre JPEG após manipulação
      
      // Criar data URL
      const dataUrl = `data:${tipoMime};base64,${base64Data}`;
      
      // Verificar tamanho da string resultante
      const tamanhoMB = new Blob([dataUrl]).size / (1024 * 1024);
      console.log(`Tamanho da imagem base64: ${tamanhoMB.toFixed(2)} MB`);
      
      if (tamanhoMB > 5) {
        throw new Error('Imagem muito grande mesmo após redimensionamento. Por favor, escolha uma imagem menor.');
      }
      
      // Enviar como JSON
      const response = await cliente.post(`/usuarios/${usuarioId}/foto-base64`, {
        foto: dataUrl,
        nomeArquivo: foto.fileName || foto.name || 'photo.jpg',
        tipoMime: tipoMime
      });
      
      console.log('Upload base64 concluído:', response.data);
      return response;
      
    } catch (error: any) {
      console.error('Erro no upload base64:', error);
      throw error;
    }
  }
};