import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { praiseFont } from '../../styles/CustomFonts';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface HomeHeaderProps {
  ehAdmin: boolean;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ ehAdmin }) => {
  const navigation = useNavigation<any>();
  
  return (
    <View style={[themeStyles.bgPrimary, tw.pX4, tw.pY3, tw.flexRow, tw.itemsCenter, tw.justifyBetween]}>
      <View style={[tw.flexRow, tw.itemsCenter]}>
        <Text 
          style={[
            { 
              color: 'white', 
              fontSize: 24,
              marginRight: 4
            },
            praiseFont
          ]}
        >
          Banco de Cabelos
        </Text>
        
        {ehAdmin && (
          <View style={[{backgroundColor: '#F59E0B'}, tw.roundedFull, tw.pX2, {paddingVertical: 2}, tw.mL2]}>
            <Text style={[tw.textWhite, tw.textXs, tw.fontBold]}>
              ADMIN
            </Text>
          </View>
        )}
      </View>
      
      <View style={[tw.flexRow]}>
        <TouchableOpacity 
          style={[{width: 40, height: 40}, tw.itemsCenter, tw.justifyCenter]}
          onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Notificações' })}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeHeader;