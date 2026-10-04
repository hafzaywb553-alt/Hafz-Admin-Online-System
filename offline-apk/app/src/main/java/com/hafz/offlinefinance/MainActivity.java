package com.hafz.offlinefinance;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import java.util.concurrent.Executor;

public class MainActivity extends FragmentActivity {
    private static final String PREFS = "offline_finance_security";
    private static final String BIOMETRIC_ENABLED = "biometric_enabled";
    private WebView webView;
    private SharedPreferences prefs;
    private BiometricPrompt biometricPrompt;
    private BiometricPrompt.PromptInfo promptInfo;
    private boolean unlocked = false;
    private boolean authInProgress = false;
    private boolean enabling = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(7, 22, 49));
        getWindow().setNavigationBarColor(Color.rgb(7, 22, 49));
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        setupWebView();
        setupBiometric();
        if (prefs.getBoolean(BIOMETRIC_ENABLED, false)) {
            authenticate(false);
        }
    }

    private void setupWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7, 22, 49));
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

    private void setupBiometric() {
        Executor executor = ContextCompat.getMainExecutor(this);
        biometricPrompt = new BiometricPrompt(this, executor,
            new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                    super.onAuthenticationSucceeded(result);
                    authInProgress = false;
                    if (enabling) {
                        enabling = false;
                        prefs.edit().putBoolean(BIOMETRIC_ENABLED, true).apply();
                        toast("د Fingerprint امنیت فعال شو.");
                        webView.evaluateJavascript(
                            "window.nativeSecurityChanged && window.nativeSecurityChanged(true);", null
                        );
                    }
                    unlocked = true;
                    webView.setVisibility(View.VISIBLE);
                    webView.evaluateJavascript(
                        "window.onNativeUnlocked && window.onNativeUnlocked();", null
                    );
                }

                @Override
                public void onAuthenticationError(int errorCode, CharSequence errString) {
                    super.onAuthenticationError(errorCode, errString);
                    authInProgress = false;
                    if (enabling) {
                        enabling = false;
                        webView.evaluateJavascript(
                            "window.nativeSecurityChanged && window.nativeSecurityChanged(false);", null
                        );
                        toast("د Fingerprint فعالول لغوه شول.");
                        return;
                    }
                    if (prefs.getBoolean(BIOMETRIC_ENABLED, false)) {
                        unlocked = false;
                        toast("د Fingerprint تصدیق اړین دی.");
                        finish();
                    }
                }

                @Override
                public void onAuthenticationFailed() {
                    super.onAuthenticationFailed();
                    toast("Fingerprint ونه پېژندل شو.");
                }
            });
        promptInfo = new BiometricPrompt.PromptInfo.Builder()
            .setTitle("د مالي مدیریت")
            .setSubtitle("د موبایل Fingerprint")
            .setDescription("ثبت شوی Fingerprint وکاروئ.")
            .setNegativeButtonText("بندول")
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .build();
    }

    private void authenticate(boolean forEnable) {
        if (authInProgress || biometricPrompt == null) return;
        int can = BiometricManager.from(this)
            .canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
        if (can != BiometricManager.BIOMETRIC_SUCCESS) {
            if (forEnable) {
                toast("په دې موبایل کې د Strong Fingerprint/biometric ثبت شوی سیستم نشته.");
                webView.evaluateJavascript(
                    "window.nativeSecurityChanged && window.nativeSecurityChanged(false);", null
                );
            } else if (prefs.getBoolean(BIOMETRIC_ENABLED, false)) {
                toast("د فعال Fingerprint تصدیق ممکن نه شو.");
                finish();
            }
            return;
        }
        enabling = forEnable;
        authInProgress = true;
        biometricPrompt.authenticate(promptInfo);
    }

    private void openExternal(String url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception ignored) {
            toast("د دې لینک لپاره مناسب اپ موجود نه دی.");
        }
    }

    private void toast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (prefs.getBoolean(BIOMETRIC_ENABLED, false) && !unlocked && !authInProgress) {
            authenticate(false);
        }
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (prefs.getBoolean(BIOMETRIC_ENABLED, false)) unlocked = false;
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    public class NativeBridge {
        @JavascriptInterface
        public boolean isBiometricEnabled() {
            return prefs.getBoolean(BIOMETRIC_ENABLED, false);
        }

        @JavascriptInterface
        public void enableBiometric() {
            runOnUiThread(() -> authenticate(true));
        }

        @JavascriptInterface
        public void disableBiometric() {
            prefs.edit().putBoolean(BIOMETRIC_ENABLED, false).apply();
            enabling = false;
            unlocked = true;
            webView.evaluateJavascript(
                "window.nativeSecurityChanged && window.nativeSecurityChanged(false);", null
            );
            toast("Fingerprint امنیت لرې شو.");
        }

        @JavascriptInterface
        public void shareText(String text) {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_TEXT, text);
            startActivity(Intent.createChooser(send, "شریکول"));
        }
    }
}