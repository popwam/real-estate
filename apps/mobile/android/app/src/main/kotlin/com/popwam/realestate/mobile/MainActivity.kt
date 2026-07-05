package com.popwam.realestate.mobile

import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val channelName = "com.popwam.realestate.mobile/device_integrity"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName).setMethodCallHandler { call, result ->
            when (call.method) {
                "readAndroidDebugSettings" -> result.success(readAndroidDebugSettings())
                else -> result.notImplemented()
            }
        }
    }

    private fun readAndroidDebugSettings(): Map<String, Any?> {
        return try {
            val resolver = applicationContext.contentResolver
            val developerOptions = Settings.Global.getInt(resolver, Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0) == 1
            val adbEnabled = Settings.Global.getInt(resolver, Settings.Global.ADB_ENABLED, 0) == 1
            mapOf(
                "supported" to true,
                "developerOptionsEnabled" to developerOptions,
                "usbDebuggingEnabled" to adbEnabled,
            )
        } catch (error: Exception) {
            mapOf(
                "supported" to false,
                "error" to (error.message ?: "Android debug settings unavailable"),
            )
        }
    }
}
