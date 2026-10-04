package com.hafz.offlinefinance;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final int REQUEST_DEVICE_UNLOCK = 9001;
    private WebView webView;
    private boolean needsAuth = true;
    private boolean authInProgress = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(7,16,12));
        getWindow().setNavigationBarColor(Color.rgb(7,16,12));
        setupWebView();
        requestDeviceUnlock();
    }

    private void setupWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7,16,12));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setSupportZoom(false);
        webView.getSettings().setBuiltInZoomControls(false);
        webView.getSettings().setDisplayZoomControls(false);
        webView.addJavascriptInterface(new NativeBridge(), "NativeApp");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                openExternal(request.getUrl().toString());
                return true;
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                openExternal(url);
                return true;
            }
        });
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }

    private void openExternal(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(android.net.Uri.parse(url));
            startActivity(intent);
        } catch (Exception ignored) {
            Toast.makeText(this, "د دې لینک لپاره مناسب اپ موجود نه دی.", Toast.LENGTH_SHORT).show();
        }
    }

    private void requestDeviceUnlock() {
        if (authInProgress) return;
        KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        if (km == null || !km.isDeviceSecure()) {
            new android.app.AlertDialog.Builder(this)
                .setTitle("Fingerprint / د موبایل PIN")
                .setMessage("د دې آفلاین اپ د خلاصولو لپاره د موبایل Fingerprint یا PIN/Pattern باید فعال وي.")
                .setPositiveButton("د امنیت تنظیمات", (d, w) -> {
                    try { startActivity(new Intent(Settings.ACTION_SECURITY_SETTINGS)); } catch (Exception ignored) {}
                })
                .setNegativeButton("بندول", (d, w) -> finish())
                .setCancelable(false)
                .show();
            return;
        }

        authInProgress = true;
        Intent intent = km.createConfirmDeviceCredentialIntent(
            "د مالي مدیریت",
            "د موبایل Fingerprint یا PIN سره اپ خلاص کړئ"
        );
        if (intent == null) {
            authInProgress = false;
            return;
        }
        startActivityForResult(intent, REQUEST_DEVICE_UNLOCK);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (needsAuth && !authInProgress) {
            requestDeviceUnlock();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        needsAuth = true;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_DEVICE_UNLOCK) {
            authInProgress = false;
            if (resultCode == RESULT_OK) {
                needsAuth = false;
                webView.setVisibility(View.VISIBLE);
                webView.evaluateJavascript("window.onNativeUnlocked && window.onNativeUnlocked();", null);
            } else {
                Toast.makeText(this, "Fingerprint/PIN تایید ونه شو.", Toast.LENGTH_SHORT).show();
                finish();
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    public class NativeBridge {
        @JavascriptInterface
        public void openExternal(String url) { MainActivity.this.openExternal(url); }

        @JavascriptInterface
        public void shareText(String text) {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_TEXT, text);
            startActivity(Intent.createChooser(send, "شریکول"));
        }
    }
}