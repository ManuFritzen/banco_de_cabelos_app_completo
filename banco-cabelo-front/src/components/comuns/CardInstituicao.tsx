import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface Instituicao {
  id: number;
  nome: string;
  atividade?: string;
  endereco?: string;
}

interface CardInstituicaoProps {
  instituicao: Instituicao;
  permitirDoacao?: boolean;
}

const CardInstituicao: React.FC<CardInstituicaoProps> = ({
  instituicao,
  permitirDoacao = false,
}) => {
  const navigation = useNavigation<any>();
  
  const navegarParaDoacaoCabelo = () => {
    navigation.navigate('DoacaoCabelo', { instituicaoId: instituicao.id });
  };
  
  const verDetalhes = () => {
    navigation.navigate('EmConstrucao', { titulo: 'Detalhes da Instituição' });
  };
  
  return (
    <View style={[tw.bgWhite, tw.roundedLg, themeStyles.shadowSm, tw.p5]}>
      <Text style={[tw.textLg, tw.fontBold, tw.textBlack, tw.mB3]}>
        {instituicao.nome}
      </Text>
      
      {instituicao.atividade && (
        <View style={tw.mB3}>
          <Text style={[tw.textGray500, tw.fontSemibold, tw.textSm, tw.mB1]}>
            Atividade:
          </Text>
          <Text style={[tw.textGray600, tw.textSm]}>
            {instituicao.atividade}
          </Text>
        </View>
      )}
      
      {instituicao.endereco && (
        <View style={tw.mB4}>
          <Text style={[tw.textGray500, tw.fontSemibold, tw.textSm, tw.mB1]}>
            Endereço(s):
          </Text>
          <Text style={[tw.textGray600, tw.textSm]}>
            {instituicao.endereco}
          </Text>
        </View>
      )}
      
      <View style={[tw.flexRow, tw.justifyBetween, tw.mT2]}>
        <TouchableOpacity
          style={[tw.pY2]}
          onPress={verDetalhes}
          activeOpacity={0.7}
        >
          <Text style={[tw.textBlue500, tw.fontMedium]}>
            Ver detalhes
          </Text>
        </TouchableOpacity>

        {permitirDoacao && (
          <TouchableOpacity
            style={[tw.flexRow, tw.itemsCenter, themeStyles.bgSecondary, tw.roundedFull, tw.pX4, tw.pY2]}
            onPress={navegarParaDoacaoCabelo}
            activeOpacity={0.7}
          >
            <Text style={[tw.textWhite, tw.fontBold, tw.mR1]}>
              + DOAR CABELO
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default CardInstituicao;