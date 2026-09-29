const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './uniwind-types.d.ts',
  extraThemes: ['dark'],
});

// Uniwind 1.12 exports this native-only wrapper without a web implementation.
const resolveWithUniwind = module.exports.resolver.resolveRequest;
module.exports.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === './exports/InputAccessoryView' && context.originModulePath.includes('react-native-web')) {
    return context.resolveRequest(context, moduleName, platform);
  }
  return resolveWithUniwind(context, moduleName, platform);
};
