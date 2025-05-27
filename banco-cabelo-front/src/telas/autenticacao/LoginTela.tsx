import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import { praiseFont } from '../../styles/CustomFonts';
import {
  SafeContainer,
  ScrollContainer,
  Container,
  BotaoIcone,
  Card,
  Titulo,
  TextoLink,
  Divisor,
  Row
} from '../../styles/componentes';
import Botao from '../../components/comuns/Botao';
import CampoEntrada from '../../components/comuns/CampoEntrada';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

const esquemaValidacao = Yup.object().shape({
  email: Yup.string()
    .required('E-mail é obrigatório')
    .email('E-mail inválido'),
  senha: Yup.string()
    .required('Senha é obrigatória')
});

const LoginTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const { login } = useAutenticacao();
  
  const [carregando, setCarregando] = useState(false);
  
  const navegarParaCadastro = () => {
    navigation.navigate('Cadastro');
  };
  
  const voltar = () => {
    navigation.goBack();
  };
  
  const handleSubmit = async (values: { email: string; senha: string }) => {
    setCarregando(true);
    
    try {
      await login(values.email, values.senha);
    } catch (erro: any) {
      const mensagemErro = erro.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      Alert.alert('Erro de Login', mensagemErro);
    } finally {
      setCarregando(false);
    }
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
          
          <Formik
            initialValues={{ email: '', senha: '' }}
            validationSchema={esquemaValidacao}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit }) => (
              <Card style={[tw.border, { borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1 }]}>
                <Titulo style={tw.textCenter}>Login</Titulo>
                
                <CampoEntrada
                  name="email"
                  label="E-mail"
                  placeholder="exemplo@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <CampoEntrada
                  name="senha"
                  label="Senha"
                  placeholder="Entre com sua senha"
                  seguro
                />
                
                <TouchableOpacity
                  style={[tw.selfEnd, tw.mB6]}
                  onPress={() => Alert.alert(
                    'Funcionalidade em Desenvolvimento',
                    'A recuperação de senha será implementada em breve.'
                  )}
                >
                  <TextoLink style={tw.textSm}>
                    Esqueci minha senha
                  </TextoLink>
                </TouchableOpacity>
                
                <Botao
                  titulo="ENTRAR"
                  onPress={handleSubmit}
                  carregando={carregando}
                  variante="secundario"
                  larguraTotal
                  tamanhoTexto="normal"
                  style={{ backgroundColor: '#6366F1', shadowOpacity: 0.3, marginBottom: 16 }}
                />
                
                <Divisor texto="OU" />
                
                <TouchableOpacity
                  style={[tw.flexRow, tw.itemsCenter, tw.justifyCenter, tw.border, tw.borderGray300, tw.roundedFull, tw.pY3, tw.mB4]}
                  onPress={() => Alert.alert(
                    'Funcionalidade em Desenvolvimento',
                    'O login com Google será implementado em breve.'
                  )}
                >
                  <Image
                    source={require('../../../assets/google.icon.jpeg')}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                  <Text style={[tw.textBase, tw.mL2]}>
                    Continuar com Google
                  </Text>
                </TouchableOpacity>
                
                <Row style={[tw.justifyCenter, tw.mT4]}>
                  <Text style={{ color: '#4B5563' }}>
                    Não tem uma conta?
                  </Text>
                  <TouchableOpacity onPress={navegarParaCadastro}>
                    <TextoLink style={tw.mL1}>
                      Cadastre-se
                    </TextoLink>
                  </TouchableOpacity>
                </Row>
              </Card>
            )}
          </Formik>
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

export default LoginTela;