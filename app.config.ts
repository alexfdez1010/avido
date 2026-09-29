import type { ConfigContext, ExpoConfig } from 'expo/config';

const fontFiles = [
  'fraunces/400Regular/Fraunces_400Regular.ttf',
  'fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf',
  'fraunces/600SemiBold/Fraunces_600SemiBold.ttf',
  'fraunces/600SemiBold_Italic/Fraunces_600SemiBold_Italic.ttf',
  'fraunces/700Bold/Fraunces_700Bold.ttf',
  'fraunces/900Black/Fraunces_900Black.ttf',
  'fraunces/900Black_Italic/Fraunces_900Black_Italic.ttf',
  'bricolage-grotesque/400Regular/BricolageGrotesque_400Regular.ttf',
  'bricolage-grotesque/500Medium/BricolageGrotesque_500Medium.ttf',
  'bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf',
  'bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf',
  'jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf',
  'jetbrains-mono/600SemiBold/JetBrainsMono_600SemiBold.ttf',
  'literata/400Regular/Literata_400Regular.ttf',
  'literata/400Regular_Italic/Literata_400Regular_Italic.ttf',
  'literata/700Bold/Literata_700Bold.ttf',
  'newsreader/400Regular/Newsreader_400Regular.ttf',
  'newsreader/400Regular_Italic/Newsreader_400Regular_Italic.ttf',
  'newsreader/700Bold/Newsreader_700Bold.ttf',
  'atkinson-hyperlegible/400Regular/AtkinsonHyperlegible_400Regular.ttf',
  'atkinson-hyperlegible/400Regular_Italic/AtkinsonHyperlegible_400Regular_Italic.ttf',
  'atkinson-hyperlegible/700Bold/AtkinsonHyperlegible_700Bold.ttf',
].map((f) => `./node_modules/@expo-google-fonts/${f}`);

const buildNumber = Number(process.env.BUILD_NUMBER ?? '1');
const version = process.env.APP_VERSION ?? '1.0.0';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Ávido',
  slug: 'avido',
  version,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'avido',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#100E0B',
  android: {
    package: 'com.alexfdez.avido',
    versionCode: buildNumber,
    adaptiveIcon: {
      backgroundColor: '#100E0B',
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['android.permission.POST_NOTIFICATIONS', 'android.permission.VIBRATE'],
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#100E0B',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
      },
    ],
    ['expo-font', { fonts: fontFiles }],
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#FF5B24',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          enableProguardInReleaseBuilds: false,
          enableShrinkResourcesInReleaseBuilds: false,
        },
      },
    ],
    'react-native-blob-util',
    './plugins/with-release-signing',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
