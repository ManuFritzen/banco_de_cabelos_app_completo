import { StyleSheet } from 'react-native';
import tailwindConfig from '../../tailwind.config';

// Extract colors from tailwind config
const { colors } = tailwindConfig.theme.extend;

// Create background color styles
export const bgStyles = StyleSheet.create({
  bgPrimary: { backgroundColor: colors.primary },
  bgSecondary: { backgroundColor: colors.secondary },
  bgBackground: { backgroundColor: colors.background },
  bgCard: { backgroundColor: colors.card },
  bgText: { backgroundColor: colors.text },
  bgError: { backgroundColor: colors.error },
  bgSuccess: { backgroundColor: colors.success },
  bgTransparent: { backgroundColor: 'transparent' },
});

// Create text color styles
export const textStyles = StyleSheet.create({
  textPrimary: { color: colors.primary },
  textSecondary: { color: colors.secondary },
  textBackground: { color: colors.background },
  textCard: { color: colors.card },
  textText: { color: colors.text },
  textError: { color: colors.error },
  textSuccess: { color: colors.success },
});

// Create border color styles
export const borderStyles = StyleSheet.create({
  borderPrimary: { borderColor: colors.primary },
  borderSecondary: { borderColor: colors.secondary },
  borderBackground: { borderColor: colors.background },
  borderCard: { borderColor: colors.card },
  borderText: { borderColor: colors.text },
  borderError: { borderColor: colors.error },
  borderSuccess: { borderColor: colors.success },
});

// Create opacity styles
export const opacityStyles = StyleSheet.create({
  opacity70: { opacity: 0.7 },
  opacity90: { opacity: 0.9 },
});

// Create margin styles
export const marginStyles = StyleSheet.create({
  mb10: { marginBottom: 40 },
  mb12: { marginBottom: 48 },
  mb14: { marginBottom: 56 },
  mt12: { marginTop: 48 },
});

// Create padding styles
export const paddingStyles = StyleSheet.create({
  px10: { paddingHorizontal: 40 }
});

// Create border radius styles
export const borderRadiusStyles = StyleSheet.create({
  roundedXl: { borderRadius: 12 },
});

// Create shadow styles
export const shadowStyles = StyleSheet.create({
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2
  },
});

// Create line height styles
export const lineHeightStyles = StyleSheet.create({
  leading7: { lineHeight: 28 },
});

// Export raw colors
export const color = colors;

// Export combined styles
export default {
  ...bgStyles,
  ...textStyles,
  ...borderStyles,
  ...opacityStyles,
  ...marginStyles,
  ...paddingStyles,
  ...borderRadiusStyles,
  ...shadowStyles,
  ...lineHeightStyles,
  color, // Include the raw colors in the default export
};