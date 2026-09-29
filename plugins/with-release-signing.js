const { withAppBuildGradle } = require('expo/config-plugins');

const SIGNING = `
        release {
            if (System.getenv('AVIDO_KEYSTORE_PATH')) {
                storeFile file(System.getenv('AVIDO_KEYSTORE_PATH'))
                storePassword System.getenv('AVIDO_KEYSTORE_PASSWORD')
                keyAlias System.getenv('AVIDO_KEY_ALIAS')
                keyPassword System.getenv('AVIDO_KEY_PASSWORD')
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (!src.includes('AVIDO_KEYSTORE_PATH')) {
      src = src.replace(/signingConfigs\s*\{\s*debug\s*\{[^}]*\}/, (m) => m + SIGNING);
      const at = src.indexOf('buildTypes');
      const tail = src.slice(at).replace(/(release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/, '$1signingConfig signingConfigs.release');
      src = src.slice(0, at) + tail;
    }
    cfg.modResults.contents = src;
    return cfg;
  });
};
