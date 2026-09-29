import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [loaded, error] = useFonts({
    Fraunces_400Regular: require('@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.ttf'),
    Fraunces_400Regular_Italic: require('@expo-google-fonts/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf'),
    Fraunces_600SemiBold: require('@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf'),
    Fraunces_600SemiBold_Italic: require('@expo-google-fonts/fraunces/600SemiBold_Italic/Fraunces_600SemiBold_Italic.ttf'),
    Fraunces_700Bold: require('@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.ttf'),
    Fraunces_900Black: require('@expo-google-fonts/fraunces/900Black/Fraunces_900Black.ttf'),
    Fraunces_900Black_Italic: require('@expo-google-fonts/fraunces/900Black_Italic/Fraunces_900Black_Italic.ttf'),
    BricolageGrotesque_400Regular: require('@expo-google-fonts/bricolage-grotesque/400Regular/BricolageGrotesque_400Regular.ttf'),
    BricolageGrotesque_500Medium: require('@expo-google-fonts/bricolage-grotesque/500Medium/BricolageGrotesque_500Medium.ttf'),
    BricolageGrotesque_700Bold: require('@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf'),
    BricolageGrotesque_800ExtraBold: require('@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf'),
    JetBrainsMono_400Regular: require('@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf'),
    JetBrainsMono_600SemiBold: require('@expo-google-fonts/jetbrains-mono/600SemiBold/JetBrainsMono_600SemiBold.ttf'),
    Literata_400Regular: require('@expo-google-fonts/literata/400Regular/Literata_400Regular.ttf'),
    Literata_400Regular_Italic: require('@expo-google-fonts/literata/400Regular_Italic/Literata_400Regular_Italic.ttf'),
    Literata_700Bold: require('@expo-google-fonts/literata/700Bold/Literata_700Bold.ttf'),
    Newsreader_400Regular: require('@expo-google-fonts/newsreader/400Regular/Newsreader_400Regular.ttf'),
    Newsreader_400Regular_Italic: require('@expo-google-fonts/newsreader/400Regular_Italic/Newsreader_400Regular_Italic.ttf'),
    Newsreader_700Bold: require('@expo-google-fonts/newsreader/700Bold/Newsreader_700Bold.ttf'),
    AtkinsonHyperlegible_400Regular: require('@expo-google-fonts/atkinson-hyperlegible/400Regular/AtkinsonHyperlegible_400Regular.ttf'),
    AtkinsonHyperlegible_400Regular_Italic: require('@expo-google-fonts/atkinson-hyperlegible/400Regular_Italic/AtkinsonHyperlegible_400Regular_Italic.ttf'),
    AtkinsonHyperlegible_700Bold: require('@expo-google-fonts/atkinson-hyperlegible/700Bold/AtkinsonHyperlegible_700Bold.ttf'),
  });
  return loaded || !!error;
}
