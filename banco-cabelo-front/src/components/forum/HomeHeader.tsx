import React from 'react';
import { View, Text } from 'react-native';
import { praiseFont } from '../../styles/CustomFonts';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';
import IconeNotificacoes from '../comuns/IconeNotificacoes';

interface HomeHeaderProps {
  ehAdmin: boolean;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ ehAdmin }) => {
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
        <IconeNotificacoes color="#FFFFFF" size={24} />
      </View>
    </View>
  );
};

export default HomeHeader;