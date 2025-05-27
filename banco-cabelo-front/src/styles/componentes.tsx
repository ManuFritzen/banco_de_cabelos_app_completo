import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from './tailwind';
import themeStyles from './theme';

// Componentes básicos estilizados usando react-native-tailwindcss
// Esta abordagem substitui o uso de NativeWind e StyledComponent

// Container básico com fundo
export const Container = ({ children, style, ...props }: any) => (
  <View style={[tw.flex1, style]} {...props}>
    {children}
  </View>
);

// Container primário com fundo verde
export const ContainerPrimario = ({ children, style, ...props }: any) => (
  <View style={[tw.flex1, themeStyles.bgPrimary, style]} {...props}>
    {children}
  </View>
);

// SafeAreaView estilizado
export const SafeContainer = ({ children, style, ...props }: any) => (
  <SafeAreaView style={[tw.flex1, style]} {...props}>
    {children}
  </SafeAreaView>
);

// SafeAreaView com fundo primário
export const SafeContainerPrimario = ({ children, style, ...props }: any) => (
  <SafeAreaView style={[tw.flex1, themeStyles.bgPrimary, style]} {...props}>
    {children}
  </SafeAreaView>
);

// ScrollView estilizado
export const ScrollContainer = ({ children, style, ...props }: any) => (
  <ScrollView 
    style={[tw.flex1, style]} 
    contentContainerStyle={props.contentContainerStyle}
    {...props}
  >
    {children}
  </ScrollView>
);

// Card branco com sombra
export const Card = ({ children, style, ...props }: any) => (
  <View 
    style={[
      tw.bgWhite, 
      tw.p6, 
      tw.roundedL, 
      { 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
      },
      style
    ]} 
    {...props}
  >
    {children}
  </View>
);

// Texto estilizado
export const Texto = ({ children, style, ...props }: any) => (
  <Text style={[{ color: '#1E293B' }, style]} {...props}>
    {children}
  </Text>
);

// Títulos
export const Titulo = ({ children, style, ...props }: any) => (
  <Text style={[tw.textXl, tw.fontBold, { color: '#1E293B' }, tw.mB4, style]} {...props}>
    {children}
  </Text>
);

export const TituloPrimario = ({ children, style, ...props }: any) => (
  <Text style={[tw.text2xl, tw.fontBold, tw.textWhite, tw.mB6, tw.textCenter, style]} {...props}>
    {children}
  </Text>
);

export const Subtitulo = ({ children, style, ...props }: any) => (
  <Text style={[tw.textLg, tw.fontMedium, { color: '#1E293B' }, tw.mB3, style]} {...props}>
    {children}
  </Text>
);

// Texto para descrição ou parágrafos
export const Paragrafo = ({ children, style, ...props }: any) => (
  <Text style={[tw.textBase, { color: '#4B5563' }, tw.mB4, style]} {...props}>
    {children}
  </Text>
);

// Botão básico de ícone
export const BotaoIcone = ({ children, style, ...props }: any) => (
  <TouchableOpacity
    style={[tw.w10, tw.h10, tw.itemsCenter, tw.justifyCenter, tw.mB4, style]}
    activeOpacity={0.7}
    {...props}
  >
    {children}
  </TouchableOpacity>
);

// Linha divisora com texto opcional
export const Divisor = ({ texto, style, ...props }: { texto?: string, style?: any, [key: string]: any }) => (
  <View style={[tw.flexRow, tw.itemsCenter, tw.mY4, style]} {...props}>
    <View style={[tw.flex1, tw.h1, { backgroundColor: '#D1D5DB' }]} />
    {texto && <Text style={[tw.mX4, { color: '#6B7280' }]}>{texto}</Text>}
    <View style={[tw.flex1, tw.h1, { backgroundColor: '#D1D5DB' }]} />
  </View>
);

// Row e Column para layouts flexbox
export const Row = ({ children, style, ...props }: any) => (
  <View style={[tw.flexRow, tw.itemsCenter, style]} {...props}>
    {children}
  </View>
);

export const Column = ({ children, style, ...props }: any) => (
  <View style={[tw.flex1, style]} {...props}>
    {children}
  </View>
);

// Componente para links e textos clicáveis
export const TextoLink = ({ children, style, ...props }: any) => (
  <Text style={[themeStyles.textPrimary, tw.fontBold, style]} {...props}>
    {children}
  </Text>
);

// Pílula (badge) para status ou tags
export const Pilula = ({ children, style, tipo = 'padrao', ...props }: any) => {
  let estiloBase = [tw.pX3, tw.pY1, tw.roundedFull, tw.textCenter];

  switch (tipo) {
    case 'primario':
      estiloBase.push(themeStyles.bgPrimary, tw.textWhite);
      break;
    case 'secundario':
      estiloBase.push(themeStyles.bgSecondary, tw.textWhite);
      break;
    case 'sucesso':
      estiloBase.push(themeStyles.bgSuccess, tw.textWhite);
      break;
    case 'erro':
      estiloBase.push(themeStyles.bgError, tw.textWhite);
      break;
    default:
      estiloBase.push({ backgroundColor: '#E5E7EB', color: '#374151' });
  }

  return (
    <View style={[...estiloBase, style]} {...props}>
      <Text style={tipo !== 'padrao' ? tw.textWhite : { color: '#374151' }}>
        {children}
      </Text>
    </View>
  );
};

// Exporta um objeto com todos os componentes para facilitar importações
export const Componentes = {
  Container,
  ContainerPrimario,
  SafeContainer,
  SafeContainerPrimario,
  ScrollContainer,
  Card,
  Texto,
  Titulo,
  TituloPrimario,
  Subtitulo,
  Paragrafo,
  BotaoIcone,
  Divisor,
  Row,
  Column,
  TextoLink,
  Pilula
};