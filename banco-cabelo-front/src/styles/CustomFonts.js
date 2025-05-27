import { Platform } from 'react-native';

export const praiseFont = {
  fontFamily: Platform.select({
    ios: 'Praise',
    android: 'Praise',
    default: 'cursive'
  }),
  letterSpacing: 1.5,
};