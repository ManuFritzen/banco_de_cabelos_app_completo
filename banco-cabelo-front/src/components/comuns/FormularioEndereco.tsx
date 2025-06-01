import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CampoEntrada from './CampoEntrada';
import CampoEntradaComMascara from './CampoEntradaComMascara';
import Botao from './Botao';
import { enderecoServico } from '../../servicos/api/endereco';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

const esquemaValidacao = Yup.object().shape({
  cep: Yup.string()
    .required('CEP é obrigatório')
    .matches(/^\d{5}-\d{3}$/, 'CEP deve estar no formato 00000-000'),
  rua: Yup.string()
    .required('Rua é obrigatória')
    .min(3, 'Rua deve ter pelo menos 3 caracteres'),
  numero: Yup.string()
    .required('Número é obrigatório'),
  bairro: Yup.string()
    .required('Bairro é obrigatório')
    .min(3, 'Bairro deve ter pelo menos 3 caracteres'),
  cidade: Yup.string()
    .required('Cidade é obrigatória')
    .min(3, 'Cidade deve ter pelo menos 3 caracteres'),
  estado: Yup.string()
    .required('Estado é obrigatório')
    .length(2, 'Estado deve ter 2 caracteres')
    .matches(/^[A-Z]{2}$/, 'Estado deve ser uma sigla com 2 letras maiúsculas'),
  complemento: Yup.string()
});

interface FormularioEnderecoProps {
  onSubmit: (valores: any) => void;
  valoresIniciais?: any;
  botaoTexto?: string;
  mostrarBotao?: boolean;
}

const FormularioEndereco: React.FC<FormularioEnderecoProps> = ({
  onSubmit,
  valoresIniciais = {
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: ''
  },
  botaoTexto = 'Salvar Endereço',
  mostrarBotao = true
}) => {
  const [buscandoCep, setBuscandoCep] = useState(false);

  const buscarEnderecoPorCep = async (cep: string, setFieldValue: any) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return;
    }

    setBuscandoCep(true);
    
    try {
      const dados = await enderecoServico.buscarCep(cepLimpo);
      
      if (dados) {
        setFieldValue('rua', dados.logradouro);
        setFieldValue('bairro', dados.bairro);
        setFieldValue('cidade', dados.localidade);
        setFieldValue('estado', dados.uf);
        
        if (dados.ibge) {
          setFieldValue('ibge', dados.ibge);
        }
      } else {
        Alert.alert(
          'CEP não encontrado',
          'Não foi possível encontrar o endereço para este CEP. Por favor, preencha manualmente.'
        );
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      Alert.alert(
        'Erro',
        'Não foi possível buscar o CEP. Por favor, preencha o endereço manualmente.'
      );
    } finally {
      setBuscandoCep(false);
    }
  };

  return (
    <Formik
      initialValues={valoresIniciais}
      validationSchema={esquemaValidacao}
      onSubmit={onSubmit}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
        <View>
          <Text style={[themeStyles.textText, tw.textLg, tw.fontBold, tw.mB4]}>
            Endereço
          </Text>

          <CampoEntrada
            label="CEP"
            valor={values.cep}
            onChangeText={(texto: string) => {
              // Aplicar máscara de CEP manualmente
              const mascaraCep = (valor: string) => {
                const numeros = valor.replace(/\D/g, '');
                return numeros.replace(/(\d{5})(\d)/, '$1-$2');
              };
              const cepMascarado = mascaraCep(texto);
              handleChange('cep')(cepMascarado);
              buscarEnderecoPorCep(cepMascarado, setFieldValue);
            }}
            onBlur={() => handleBlur('cep')}
            mensagemErro={touched.cep && errors.cep ? String(errors.cep) : undefined}
            placeholder="00000-000"
            keyboardType="numeric"
          />

          {buscandoCep && (
            <View style={[tw.flexRow, tw.itemsCenter, tw.mB2]}>
              <ActivityIndicator size="small" color={themeStyles.color.primary} />
              <Text style={[tw.mL2, tw.textGray600]}>Buscando endereço...</Text>
            </View>
          )}

          <View style={[tw.flexRow, tw.mB4]}>
            <View style={[tw.flex1, tw.mR2]}>
              <CampoEntrada
                label="Rua"
                valor={values.rua}
                onChangeText={handleChange('rua')}
                onBlur={() => handleBlur('rua')}
                mensagemErro={touched.rua && errors.rua ? String(errors.rua) : undefined}
                placeholder="Nome da rua"
              />
            </View>
            <View style={{ width: 100 }}>
              <CampoEntrada
                label="Número"
                valor={values.numero}
                onChangeText={handleChange('numero')}
                onBlur={() => handleBlur('numero')}
                mensagemErro={touched.numero && errors.numero ? String(errors.numero) : undefined}
                placeholder="Nº"
                keyboardType="numeric"
              />
            </View>
          </View>

          <CampoEntrada
            label="Complemento (opcional)"
            valor={values.complemento}
            onChangeText={handleChange('complemento')}
            onBlur={() => handleBlur('complemento')}
            mensagemErro={touched.complemento && errors.complemento ? String(errors.complemento) : undefined}
            placeholder="Apto, Bloco, etc."
          />

          <CampoEntrada
            label="Bairro"
            valor={values.bairro}
            onChangeText={handleChange('bairro')}
            onBlur={() => handleBlur('bairro')}
            mensagemErro={touched.bairro && errors.bairro ? String(errors.bairro) : undefined}
            placeholder="Nome do bairro"
          />

          <View style={[tw.flexRow, tw.mB4]}>
            <View style={[tw.flex1, tw.mR2]}>
              <CampoEntrada
                label="Cidade"
                valor={values.cidade}
                onChangeText={handleChange('cidade')}
                onBlur={() => handleBlur('cidade')}
                mensagemErro={touched.cidade && errors.cidade ? String(errors.cidade) : undefined}
                placeholder="Nome da cidade"
              />
            </View>
            <View style={{ width: 80 }}>
              <CampoEntrada
                label="Estado"
                valor={values.estado}
                onChangeText={(texto: string) => handleChange('estado')(texto.toUpperCase())}
                onBlur={() => handleBlur('estado')}
                mensagemErro={touched.estado && errors.estado ? String(errors.estado) : undefined}
                placeholder="UF"
              />
            </View>
          </View>

          {mostrarBotao && (
            <Botao 
              titulo={botaoTexto}
              onPress={() => handleSubmit()}
              larguraTotal
            />
          )}
        </View>
      )}
    </Formik>
  );
};

export default FormularioEndereco;