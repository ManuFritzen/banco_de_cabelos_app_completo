import * as ImageManipulator from 'expo-image-manipulator';

export const imagemUtil = {
  // Redimensionar imagem antes do upload
  async redimensionarImagem(uri: string, larguraMaxima: number = 800) {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: larguraMaxima } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      return result;
    } catch (error) {
      console.error('Erro ao redimensionar imagem:', error);
      throw error;
    }
  }
};