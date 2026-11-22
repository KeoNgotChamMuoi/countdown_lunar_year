package vn.tetcountdown

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.webkit.WebView

/** Mở giao diện đếm ngược (code PWA trong assets). */
class MainActivity : Activity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#7a0a0a"))
            settings.javaScriptEnabled = true
            loadUrl("file:///android_asset/index.html")
        }
        setContentView(web)
        TetWidget.updateAll(this)
    }

    override fun onDestroy() {
        web.destroy()
        super.onDestroy()
    }
}
