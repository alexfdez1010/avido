package expo.modules.volumekeys

import android.view.KeyEvent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VolumeKeysModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VolumeKeys")
    Events("onVolumeKey")

    OnCreate { instance = this@VolumeKeysModule }

    OnDestroy {
      if (instance === this@VolumeKeysModule) instance = null
      enabled = false
    }

    Function("setEnabled") { on: Boolean -> enabled = on }
  }

  companion object {
    @Volatile private var instance: VolumeKeysModule? = null
    @Volatile private var enabled = false

    private fun direction(keyCode: Int): Int? = when (keyCode) {
      KeyEvent.KEYCODE_VOLUME_DOWN -> 1
      KeyEvent.KEYCODE_VOLUME_UP -> -1
      else -> null
    }

    /** Called from MainActivity; returns true when the key was consumed. */
    @JvmStatic
    fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
      if (!enabled) return false
      val dir = direction(keyCode) ?: return false
      val module = instance ?: return false
      if ((event?.repeatCount ?: 0) == 0) module.sendEvent("onVolumeKey", mapOf("dir" to dir))
      return true
    }

    @JvmStatic
    fun onKeyUp(keyCode: Int): Boolean = enabled && instance != null && direction(keyCode) != null
  }
}
