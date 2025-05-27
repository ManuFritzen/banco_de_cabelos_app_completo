import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';
import { praiseFont } from '../../styles/CustomFonts';
import { carregarFontes } from '../../styles/fontes';
import {
  SafeContainer,
  Container,
  Paragrafo
} from '../../styles/componentes';
import Botao from '../../components/comuns/Botao';
import tw from '../../styles/tailwind';

const BoasVindasTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const [fontesCarregadas, setFontesCarregadas] = useState(false);
  
  // Carregamento da fonte
  useEffect(() => {
    async function iniciarCarregamento() {
      try {
        console.log("Tentando carregar a fonte Praise...");
        const sucesso = await carregarFontes();
        console.log("Resultado do carregamento:", sucesso ? "Sucesso" : "Falha");
        
        // Pequeno atraso para garantir que a fonte seja aplicada
        setTimeout(() => {
          setFontesCarregadas(true);
        }, 500);
      } catch (error) {
        console.error("Erro no carregamento de fontes:", error);
        setFontesCarregadas(true); 
      }
    }
    
    iniciarCarregamento();
  }, []);
  
  const navegarParaLogin = () => {
    navigation.navigate('Login');
  };
  
  if (!fontesCarregadas) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4EB296' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 20 }}>Carregando...</Text>
      </View>
    );
  }
  
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
        <View style={[tw.itemsCenter, tw.wFull, tw.flex1, tw.justifyBetween]}>
          <View style={[tw.itemsCenter, tw.wFull]}>
          <Text 
            style={[
              { 
                color: 'white',
                fontSize: 56,
                marginBottom: 8,
                textAlign: 'center',
                marginTop: 10,
              },
              praiseFont
            ]}
          >
            Banco de Cabelos
          </Text>
          
          <Text style={[tw.textWhite, { opacity: 0.9 }, tw.textLg, tw.textCenter, tw.mB10, tw.italic, tw.fontLight]}>
            conectando solidariedade e autoestima
          </Text>

          <View style={[tw.itemsCenter, tw.justifyCenter, tw.mB12]}>
            <View style={[tw.absolute, { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
            <View style={[tw.absolute, { width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255, 255, 255, 0.03)' }]} />
            <View style={[
              tw.itemsCenter, 
              tw.justifyCenter, 
              tw.p8, 
              tw.roundedFull, 
              tw.shadowLg, 
              { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
            ]}>
              <Image
                source={require('../../../assets/icone-coracao-maos.png')}
                style={{ width: 144, height: 144 }}
                resizeMode="contain"
              />
            </View>
            <View style={[tw.absolute, { width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }]} />
          </View>
          
          <View style={[
            tw.w100,
            tw.p7,
            tw.mB14,
            tw.roundedLg,
            tw.shadow
          ]}>
            <Paragrafo style={[tw.textWhite, tw.pX8, tw.textCenter, { lineHeight: 28 }, tw.fontLight]}>
              Bem-vindo(a) ao nosso App que veio para facilitar
              a conexão entre instituições, doadores de cabelo 
              e pessoas que necessitam de perucas. Juntos, transformamos 
              mechas de cabelo em sorrisos, devolvendo autoestima e 
              confiança durante momentos desafiadores de tratamento.
              Um gesto de amor que transforma vidas.
            </Paragrafo>
          </View>
          
          <View style={[tw.wFull, tw.pX10, tw.mT12]}>
            <Botao
              titulo="ENTRAR"
              onPress={navegarParaLogin}
              variante="secundario"
              larguraTotal
              tamanhoTexto="normal"
              style={{ backgroundColor: '#6366F1', shadowOpacity: 0.3 }}
            />
          </View>

          </View>

          <View style={[tw.wFull, tw.pX10, tw.pY6]}>
            <Text style={[tw.textWhite, { opacity: 0.7 }, tw.textXs, tw.textCenter]}>
              © 2025 Banco de Cabelos - Todos os direitos reservados
            </Text>
          </View>
        </View>
      </SafeContainer>
    </Container>
  );
};

export default BoasVindasTela;