const { withMainActivity } = require('expo/config-plugins');

const MARKER = 'VolumeKeysModule.onKeyDown';
const OVERRIDES = `
  override fun onKeyDown(keyCode: Int, event: android.view.KeyEvent?): Boolean {
    if (expo.modules.volumekeys.VolumeKeysModule.onKeyDown(keyCode, event)) return true
    return super.onKeyDown(keyCode, event)
  }

  override fun onKeyUp(keyCode: Int, event: android.view.KeyEvent?): Boolean {
    if (expo.modules.volumekeys.VolumeKeysModule.onKeyUp(keyCode)) return true
    return super.onKeyUp(keyCode, event)
  }
`;

// Routes hardware volume keys to the local volume-keys module so the reader can turn pages.
module.exports = function withVolumeKeys(config) {
  return withMainActivity(config, (cfg) => {
    const src = cfg.modResults.contents;
    if (src.includes(MARKER)) return cfg;
    const anchor = src.indexOf('class MainActivity');
    const open = src.indexOf('{', anchor);
    if (anchor < 0 || open < 0) throw new Error('withVolumeKeys: MainActivity class not found');
    cfg.modResults.contents = src.slice(0, open + 1) + '\n' + OVERRIDES + src.slice(open + 1);
    return cfg;
  });
};
