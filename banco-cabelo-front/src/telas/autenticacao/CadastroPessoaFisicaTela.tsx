import React, { useState } from 'react';
import { View, Alert, Text, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';
import CampoEntrada from '../../components/comuns/CampoEntrada';
import CampoEntradaComMascara from '../../components/comuns/CampoEntradaComMascara';
import Botao from '../../components/comuns/Botao';
import { autenticacaoServico } from '../../servicos/api/autenticacao';
import { apenasNumeros } from '../../servicos/util/mascaraUtil';
import {
  SafeContainer,
  ScrollContainer,
  Container,
  BotaoIcone,
  Card,
  TextoLink
} from '../../styles/componentes';
import tw from '../../styles/tailwind';

interface FormularioCadastroValues {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

const esquemaValidacao = Yup.object().shape({
  nome: Yup.string().required('Nome é obrigatório'),
  email: Yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  cpf: Yup.string()
    .required('CPF é obrigatório')
    .test('cpf-valido', 'CPF deve conter 11 dígitos numéricos', value => 
      !value || apenasNumeros(value).length === 11
    ),
  telefone: Yup.string()
    .test('telefone-valido', 'Telefone deve conter 10 ou 11 dígitos numéricos', value => 
      !value || [10, 11].includes(apenasNumeros(value).length)
    ),
  senha: Yup.string().min(6, 'Senha deve ter pelo menos 6 caracteres').required('Senha é obrigatória'),
  confirmarSenha: Yup.string()
    .oneOf([Yup.ref('senha')], 'As senhas não coincidem')
    .required('Confirme sua senha'),
});

const CadastroPessoaFisicaTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  
  const voltar = () => {
    navigation.goBack();
  };
  
  const handleSubmit = async (values: FormularioCadastroValues, { setSubmitting }: any) => {
    try {
      setMensagemErro(null);
      
      const dadosUsuario = {
        nome: values.nome,
        email: values.email,
        senha: values.senha,
        tipo: 'F' as 'F', // Pessoa Física - usando type assertion
        cpf: apenasNumeros(values.cpf),
        telefone: values.telefone ? apenasNumeros(values.telefone) : undefined
      };
      
      await autenticacaoServico.cadastrar(dadosUsuario);
      
      Alert.alert(
        'Cadastro realizado',
        'Seu cadastro foi realizado com sucesso. Faça login para continuar.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (erro: any) {
      console.error('Erro ao cadastrar:', erro);
      
      let mensagem = erro.response?.data?.message || 
                     erro.response?.data?.error || 
                     'Ocorreu um erro ao realizar o cadastro. Tente novamente.';
      
      if (mensagem.includes('cpf must be unique') || mensagem.includes('CPF já cadastrado')) {
        mensagem = 'Este CPF já está cadastrado no sistema. Por favor, utilize outro CPF ou faça login caso já possua uma conta.';
      } else if (mensagem.includes('email must be unique') || mensagem.includes('Email já cadastrado')) {
        mensagem = 'Este e-mail já está cadastrado no sistema. Por favor, utilize outro e-mail ou faça login caso já possua uma conta.';
      } else if (mensagem.includes('CPF inválido')) {
        mensagem = 'O CPF informado é inválido. Por favor, verifique se o número é válido e tente novamente.';
      } else if (mensagem.includes('telefone')) {
        mensagem = 'O telefone informado já está em uso por outro usuário.';
      } else if (mensagem.includes('processar dados')) {
        mensagem = 'Há um problema com os dados informados. Por favor, verifique CPF e outros campos.';
      }
      
      setMensagemErro(mensagem);
    } finally {
      setSubmitting(false);
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
        <ScrollContainer keyboardShouldPersistTaps="handled" style={tw.flex1} contentContainerStyle={tw.flexGrow}>
          <Container style={tw.p6}>
            <BotaoIcone onPress={voltar}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </BotaoIcone>

            <View style={[tw.itemsCenter, tw.mB6]}>
              <Text style={[tw.textWhite, tw.text2xl, tw.fontBold, tw.textCenter]}>
                Cadastro de Pessoa Física
              </Text>
            </View>
          
          <Formik
            initialValues={{
              nome: '',
              email: '',
              cpf: '',
              telefone: '',
              senha: '',
              confirmarSenha: '',
            }}
            validationSchema={esquemaValidacao}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, isSubmitting }) => (
              <Card style={[tw.border, { borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderRadius: 16 }, tw.p6]}>
                {mensagemErro && (
                  <View style={[{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8 }, tw.p4, tw.mB4]}>
                    <Text style={[{ color: '#EF4444' }, tw.textCenter]}>
                      {mensagemErro}
                    </Text>
                  </View>
                )}
                
                <CampoEntrada
                  name="nome"
                  label="Nome completo"
                  placeholder="Digite seu nome completo"
                  autoCapitalize="words"
                />
                
                <CampoEntrada
                  name="email"
                  label="E-mail"
                  placeholder="Digite seu e-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <CampoEntradaComMascara
                  name="cpf"
                  label="CPF"
                  tipoMascara="cpf"
                  verificarUnico={true}
                />
                
                <CampoEntradaComMascara
                  name="telefone"
                  label="Telefone"
                  tipoMascara="telefone"
                />
                
                <CampoEntrada
                  name="senha"
                  label="Senha"
                  placeholder="Mínimo de 6 caracteres"
                  seguro
                />
                
                <CampoEntrada
                  name="confirmarSenha"
                  label="Confirmar Senha"
                  placeholder="Confirme sua senha"
                  seguro
                />
                
                <Botao
                  titulo="CRIAR CONTA"
                  onPress={handleSubmit}
                  carregando={isSubmitting}
                  variante="secundario"
                  larguraTotal
                  tamanhoTexto="normal"
                  style={{ backgroundColor: '#6366F1', shadowOpacity: 0.3, marginTop: 16, marginBottom: 24 }}
                />

                <View style={[tw.flexRow, tw.justifyCenter]}>
                  <Text style={{ color: '#4B5563' }}>
                    Já possui uma conta?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <TextoLink style={tw.mL1}>
                      Faça login
                    </TextoLink>
                  </TouchableOpacity>
                </View>
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

export default CadastroPessoaFisicaTela;