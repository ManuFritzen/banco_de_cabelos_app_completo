import React, { useMemo, memo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface BotaoProps {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'terciario' | 'danger';
  carregando?: boolean;
  desabilitado?: boolean;
  tamanhoTexto?: 'pequeno' | 'normal' | 'grande';
  larguraTotal?: boolean;
  style?: object;
}

const BotaoComponent: React.FC<BotaoProps> = ({
  titulo,
  onPress,
  variante = 'primario',
  carregando = false,
  desabilitado = false,
  tamanhoTexto = 'normal',
  larguraTotal = false,
  style,
}) => {
  const botaoStyle = useMemo(() => {
    const styles = [
      tw.roundedFull,
      tw.pY3,
      tw.pX6,
      tw.itemsCenter,
      tw.justifyCenter,
    ];

    if (larguraTotal) {
      styles.push(tw.wFull);
    }

    switch (variante) {
      case 'primario':
        styles.push(themeStyles.bgPrimary);
        break;
      case 'secundario':
        styles.push(themeStyles.bgSecondary);
        break;
      case 'terciario':
        styles.push(themeStyles.bgTransparent, tw.border, { borderColor: '#4EB296' });
        break;
      case 'danger':
        styles.push(themeStyles.bgError);
        break;
      default:
        styles.push(themeStyles.bgPrimary);
    }

    if (desabilitado || carregando) {
      styles.push({ opacity: 0.5 });
    }

    if (style) {
      styles.push(style);
    }

    return StyleSheet.flatten(styles);
  }, [variante, larguraTotal, desabilitado, carregando, style]);

  const textoStyle = useMemo(() => {
    const styles = [tw.fontBold];

    if (variante === 'terciario') {
      styles.push({ color: '#4EB296' });
    } else {
      styles.push(tw.textWhite);
    }

    switch (tamanhoTexto) {
      case 'pequeno':
        styles.push(tw.textSm);
        break;
      case 'normal':
        styles.push(tw.textBase);
        break;
      case 'grande':
        styles.push(tw.textLg);
        break;
    }

    return StyleSheet.flatten(styles);
  }, [variante, tamanhoTexto]);

  const indicatorColor = useMemo(() =>
    variante === 'terciario' ? '#4EB296' : '#FFFFFF',
  [variante]);

  return (
    <TouchableOpacity
      style={botaoStyle}
      onPress={onPress}
      disabled={desabilitado || carregando}
      activeOpacity={0.7}
    >
      {carregando ? (
        <ActivityIndicator
          size="small"
          color={indicatorColor}
        />
      ) : (
        <Text style={textoStyle}>
          {titulo}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const Botao = memo(BotaoComponent);
export default Botao;