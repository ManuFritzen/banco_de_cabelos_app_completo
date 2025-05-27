import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  SafeContainer,
  Container,
  Titulo,
  Paragrafo
} from '../../styles/componentes';
import Botao from '../../components/comuns/Botao';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

const EmConstrucaoTela: React.FC = () => {
  const navigation = useNavigation();
  
  const voltar = () => {
    navigation.goBack();
  };
  
  return (
    <SafeContainer style={themeStyles.bgBackground}>
      <Container style={[tw.justifyCenter, tw.itemsCenter, tw.p6]}>
        <Ionicons name="construct-outline" size={100} color="#4EB296" />
        
        <Titulo style={[tw.mT6, tw.textCenter]}>
          Estamos trabalhando nisso!
        </Titulo>
        
        <Paragrafo style={[tw.textLg, tw.mT4, tw.textCenter]}>
          Esta funcionalidade está em desenvolvimento e estará disponível em breve.
        </Paragrafo>
        
        <Botao
          titulo="Voltar"
          onPress={voltar}
          variante="primario"
          tamanhoTexto="normal"
          style={tw.mT8}
        />
      </Container>
    </SafeContainer>
  );
};

export default EmConstrucaoTela;