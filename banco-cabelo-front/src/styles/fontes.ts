import * as Font from 'expo-font';

export const carregarFontes = async () => {
  try {
    await Font.loadAsync({
      'Praise': require('../../assets/fonts/Praise-Regular.ttf'),
    });
    return true;
  } catch (error) {
    console.error("Erro ao carregar fontes:", error);
    return false;
  }
};