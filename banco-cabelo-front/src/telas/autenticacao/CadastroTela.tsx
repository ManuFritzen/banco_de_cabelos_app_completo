import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';
import { praiseFont } from '../../styles/CustomFonts';
import {
  SafeContainer,
  ScrollContainer,
  Container,
  BotaoIcone,
  Titulo,
  Paragrafo,
  Card,
  Divisor,
  Row,
  Column,
  TextoLink
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

const CadastroTela: React.FC = () => {
  const navigation = useNavigation<any>();
  
  const voltar = () => {
    navigation.goBack();
  };
  
  const navegarParaCadastroPessoaFisica = () => {
    navigation.navigate('CadastroPessoaFisica');
  };
  
  const navegarParaCadastroInstituicao = () => {
    navigation.navigate('CadastroInstituicao');
  };
  
  return (
    <Container style={tw.flex1}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient
        colors={['#4EB296', '#2d6f5c']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[tw.absolute, { top: -50, left: -50, width: 200, height: 200, backgroundColor: 'white', opacity: 0.05, borderRadius: 100 }]} />
        <View style={[tw.absolute, { bottom: 100, right: -30, width: 180, height: 180, backgroundColor: 'white', opacity: 0.05, borderRadius: 90 }]} />
        <View style={[tw.absolute, { top: 150, right: -20, width: 100, height: 100, backgroundColor: 'white', opacity: 0.05, borderRadius: 50 }]} />
      </LinearGradient>

      <SafeContainer style={tw.flex1}>
        <ScrollContainer keyboardShouldPersistTaps="always" style={tw.flex1} contentContainerStyle={tw.flexGrow}>
          <Container style={tw.p6}>
            <BotaoIcone onPress={voltar}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </BotaoIcone>

            <View style={[tw.itemsCenter, tw.mB8]}>
              <Text
                style={[
                  {
                    color: 'white',
                    fontSize: 42,
                    marginBottom: 8,
                    textAlign: 'center'
                  },
                  praiseFont
                ]}
              >
                Banco de Cabelos
              </Text>
              <Text style={[tw.textWhite, { opacity: 0.9 }, tw.textLg, tw.textCenter, tw.italic, tw.fontLight]}>
                conectando solidariedade e autoestima
              </Text>
            </View>
          
          <Card style={[tw.border, { borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderRadius: 16 }]}>
            <Titulo style={tw.textCenter}>Criar Conta</Titulo>
            
            <Paragrafo style={tw.textCenter}>
              Selecione o tipo de conta que deseja criar:
            </Paragrafo>
            
            <TouchableOpacity
              style={[tw.bgGray100, tw.p4, tw.roundedLg, tw.mB4, tw.flexRow, tw.itemsCenter]}
              onPress={navegarParaCadastroPessoaFisica}
              activeOpacity={0.7}
            >
              <View style={[tw.w10, tw.h10, themeStyles.bgPrimary, tw.roundedFull, tw.itemsCenter, tw.justifyCenter, tw.mR3]}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
              <Column>
                <Text style={[{ color: '#1E293B' }, tw.fontBold, tw.textLg]}>
                  Pessoa Física
                </Text>
                <Text style={{ color: '#4B5563' }}>
                  Para doar cabelo ou solicitar perucas
                </Text>
              </Column>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[tw.bgGray100, tw.p4, tw.roundedLg, tw.mB6, tw.flexRow, tw.itemsCenter]}
              onPress={navegarParaCadastroInstituicao}
              activeOpacity={0.7}
            >
              <View style={[tw.w10, tw.h10, themeStyles.bgSecondary, tw.roundedFull, tw.itemsCenter, tw.justifyCenter, tw.mR3]}>
                <Ionicons name="business" size={20} color="#FFFFFF" />
              </View>
              <Column>
                <Text style={[{ color: '#1E293B' }, tw.fontBold, tw.textLg]}>
                  Instituição
                </Text>
                <Text style={{ color: '#4B5563' }}>
                  Para receber doações e doar perucas
                </Text>
              </Column>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <Divisor texto="OU" />

            <Row style={[tw.justifyCenter, tw.mT4]}>
              <Text style={{ color: '#4B5563' }}>
                Já tem uma conta?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <TextoLink style={tw.mL1}>
                  Faça login
                </TextoLink>
              </TouchableOpacity>
            </Row>
          </Card>
          </Container>

          <View style={[tw.wFull, tw.pX10, tw.pY6]}>
            <Text style={[tw.textWhite, { opacity: 0.7 }, tw.textXs, tw.textCenter]}>
              © 2025 Banco de Cabelos - Todos os direitos reservados
            </Text>
          </View>
        </ScrollContainer>
      </SafeContainer>
    </Container>
  );
};

export default CadastroTela;