import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = Platform.OS === 'web' ? DefaultTheme : (colorScheme === 'dark' ? DarkTheme : DefaultTheme);

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="dashboard" />
      </Stack>
    </ThemeProvider>
  );
}
