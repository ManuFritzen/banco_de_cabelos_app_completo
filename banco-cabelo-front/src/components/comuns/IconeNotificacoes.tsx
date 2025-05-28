import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { notificacoesAPI } from '../../servicos/api/notificacoes';
import themeStyles from '../../styles/theme';
const { cores } = themeStyles;

interface IconeNotificacoesProps {
  color?: string;
  size?: number;
}

const IconeNotificacoes: React.FC<IconeNotificacoesProps> = ({ 
  color = cores.white, 
  size = 24 
}) => {
  const navigation = useNavigation<any>();
  const [contagemNaoLidas, setContagemNaoLidas] = useState(0);
  
  const carregarContagemNotificacoes = async () => {
    try {
      const resposta = await notificacoesAPI.contarNaoLidas();
      if (resposta.success) {
        setContagemNaoLidas(resposta.count);
      }
    } catch (erro) {
      console.error('Erro ao carregar contagem de notificações:', erro);
    }
  };
  
  useFocusEffect(
    React.useCallback(() => {
      carregarContagemNotificacoes();
      
      // Atualizar a cada 30 segundos
      const interval = setInterval(carregarContagemNotificacoes, 30000);
      
      return () => clearInterval(interval);
    }, [])
  );
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => navigation.navigate('Notificacoes')}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {contagemNaoLidas > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {contagemNaoLidas > 99 ? '99+' : contagemNaoLidas.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: cores.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: cores.white,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default IconeNotificacoes;