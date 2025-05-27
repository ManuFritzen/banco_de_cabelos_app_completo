import React, { useState, useCallback, memo, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '../../styles/tailwind';
import { useField } from 'formik';

interface CampoEntradaProps {
  name?: string;
  
  label?: string;
  placeholder?: string;
  seguro?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  style?: object;
  labelStyle?: object;
  inputStyle?: object;
  mensagemErroStyle?: object;
  
  valor?: string;
  onChangeText?: (texto: string) => void;
  mensagemErro?: string;
  onBlur?: () => void;
}

const mergeStyles = (...styles: any[]) => {
  return StyleSheet.flatten(styles.filter(Boolean));
};

interface CampoEntradaInnerProps {
  valor: string;
  handleChangeText: (texto: string) => void;
  handleBlur?: () => void;
  mensagemErro?: string;
  containerStyle: object;
  labelStyle: object;
  inputStyle: object;
  erroStyle: object;
  label?: string;
  placeholder?: string;
  seguro?: boolean;
  mostrarSenha: boolean;
  toggleSenha: () => void;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  [key: string]: any;
}

const CampoEntradaInner: React.FC<CampoEntradaInnerProps> = ({
  valor,
  handleChangeText,
  handleBlur,
  mensagemErro,
  containerStyle,
  labelStyle,
  inputStyle,
  erroStyle,
  label,
  placeholder,
  seguro,
  mostrarSenha,
  toggleSenha,
  multiline,
  numberOfLines,
  autoCapitalize,
  keyboardType,
  ...props
}) => {
  const inputRef = useRef<TextInput | null>(null);
  
  return (
    <View style={containerStyle}>
      {label && (
        <Text style={labelStyle}>
          {label}
        </Text>
      )}
      
      <View style={tw.relative}>
        <TextInput
          ref={inputRef}
          style={inputStyle}
          value={valor}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          placeholder={placeholder}
          secureTextEntry={seguro && !mostrarSenha}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          placeholderTextColor="#A0A0A0"
          textAlignVertical={multiline ? 'top' : 'center'}
          underlineColorAndroid="transparent"
          autoCorrect={false}
          spellCheck={false}
          {...props}
        />
        
        {seguro && (
          <TouchableOpacity
            style={[tw.absolute, { right: 12, top: '50%', transform: [{ translateY: -12 }] }]}
            onPress={toggleSenha}
            activeOpacity={0.7}
          >
            <Ionicons
              name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color="#A0A0A0"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {mensagemErro && (
        <Text style={erroStyle}>
          {mensagemErro}
        </Text>
      )}
    </View>
  );
};

const MemoizedCampoEntradaInner = memo(CampoEntradaInner);

const CampoEntradaComponent: React.FC<CampoEntradaProps> = ({
  name,
  label,
  placeholder,
  seguro = false,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'none',
  keyboardType = 'default',
  style,
  labelStyle,
  inputStyle,
  mensagemErroStyle,
  valor: valorExterno,
  onChangeText: onChangeTextExterno,
  mensagemErro: mensagemErroExterna,
  onBlur: onBlurExterno,
  ...props
}) => {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  // Tratamento de alteração de senha memoizado para evitar re-renders
  const toggleSenha = useCallback(() => {
    setMostrarSenha(prev => !prev);
  }, []);
  
  const containerStyle = useMemo(() => mergeStyles(
    tw.mB4,
    style
  ), [style]);
  
  const computedLabelStyle = useMemo(() => mergeStyles(
    tw.textBase,
    tw.textSm,
    tw.mB1,
    tw.fontMedium,
    labelStyle
  ), [labelStyle]);
  
  // Se name for fornecido, usa Formik
  if (name) {
    const [field, meta, helpers] = useField(name);
    
    // Funções específicas do Formik memoizadas para evitar re-renders
    const handleChangeText = useCallback((texto: string) => {
      helpers.setValue(texto);
    }, [helpers]);
    
    const handleBlur = useCallback(() => {
      helpers.setTouched(true);
    }, [helpers]);
    
    // Determinar o erro apenas se o campo foi tocado
    const finalError = meta.touched && meta.error ? meta.error : undefined;
    
    const computedInputStyle = useMemo(() => {
      const baseStyles = [
        tw.border,
        tw.roundedLg,
        tw.pX4,
        tw.pY2,
        tw.bgWhite,
      ];
      
      // Adiciona estilo com base no erro
      if (finalError) {
        baseStyles.push({ borderColor: '#EF4444' });
      } else {
        baseStyles.push(tw.borderGray300);
      }
      
      // Adiciona estilo com base em multiline
      if (multiline) {
        baseStyles.push({ height: 96 }, tw.textLeft);
      } else {
        baseStyles.push({ height: 48 });
      }
      
      // Adiciona estilo personalizado
      if (inputStyle) {
        baseStyles.push(inputStyle);
      }
      
      return mergeStyles(...baseStyles);
    }, [finalError, multiline, inputStyle]);
    
    const computedErroStyle = useMemo(() => mergeStyles(
      { color: '#EF4444' },
      tw.textXs,
      tw.mT1,
      mensagemErroStyle
    ), [mensagemErroStyle]);
    
    return (
      <MemoizedCampoEntradaInner
        valor={field.value}
        handleChangeText={handleChangeText}
        handleBlur={handleBlur}
        mensagemErro={finalError}
        containerStyle={containerStyle}
        labelStyle={computedLabelStyle}
        inputStyle={computedInputStyle}
        erroStyle={computedErroStyle}
        label={label}
        placeholder={placeholder}
        seguro={seguro}
        mostrarSenha={mostrarSenha}
        toggleSenha={toggleSenha}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        {...props}
      />
    );
  } else {
    // Quando não estiver usando Formik
    const noopCallback = useCallback(() => {}, []);
    
    const computedInputStyle = useMemo(() => {
      const baseStyles = [
        tw.border,
        tw.roundedLg,
        tw.pX4,
        tw.pY2,
        tw.bgWhite,
      ];
      
      // Adiciona estilo com base no erro
      if (mensagemErroExterna) {
        baseStyles.push({ borderColor: '#EF4444' });
      } else {
        baseStyles.push(tw.borderGray300);
      }
      
      // Adiciona estilo com base em multiline
      if (multiline) {
        baseStyles.push({ height: 96 }, tw.textLeft);
      } else {
        baseStyles.push({ height: 48 });
      }
      
      // Adiciona estilo personalizado
      if (inputStyle) {
        baseStyles.push(inputStyle);
      }
      
      return mergeStyles(...baseStyles);
    }, [mensagemErroExterna, multiline, inputStyle]);
    
    const computedErroStyle = useMemo(() => mergeStyles(
      { color: '#EF4444' },
      tw.textXs,
      tw.mT1,
      mensagemErroStyle
    ), [mensagemErroStyle]);
    
    return (
      <MemoizedCampoEntradaInner
        valor={valorExterno || ''}
        handleChangeText={onChangeTextExterno || noopCallback}
        handleBlur={onBlurExterno}
        mensagemErro={mensagemErroExterna}
        containerStyle={containerStyle}
        labelStyle={computedLabelStyle}
        inputStyle={computedInputStyle}
        erroStyle={computedErroStyle}
        label={label}
        placeholder={placeholder}
        seguro={seguro}
        mostrarSenha={mostrarSenha}
        toggleSenha={toggleSenha}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        {...props}
      />
    );
  }
};

const CampoEntrada = memo(CampoEntradaComponent);
export default CampoEntrada;