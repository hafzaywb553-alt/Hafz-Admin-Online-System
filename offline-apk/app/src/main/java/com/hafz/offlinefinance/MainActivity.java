package com.hafz.offlinefinance;

import android.content.ClipData;
import android.content.ClipboardManager;
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
    private boolean pageLoaded = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(3, 11, 25));
        getWindow().setNavigationBarColor(Color.rgb(3, 11, 25));
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        setupWebView();
        setupBiometric();
    }

    private void setupWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(3, 11, 25));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVisibility(View.INVISIBLE);
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
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                pageLoaded = true;
                webView.setVisibility(View.VISIBLE);
                if (prefs.getBoolean(BIOMETRIC_ENABLED, false)) {
                    showLock();
                    authenticate(false);
                } else {
                    hideLock();
                    unlocked = true;
                }
            }

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
                        evaluate("window.nativeSecurityChanged && window.nativeSecurityChanged(true);");
                    }
                    unlocked = true;
                    hideLock();
                    evaluate("window.onNativeUnlocked && window.onNativeUnlocked();");
                }

                @Override
                public void onAuthenticationError(int errorCode, CharSequence errString) {
                    super.onAuthenticationError(errorCode, errString);
                    authInProgress = false;
                    if (enabling) {
                        enabling = false;
                        hideLock();
                        evaluate("window.nativeSecurityChanged && window.nativeSecurityChanged(false);");
                        toast("د Fingerprint فعالول لغوه شول.");
                        return;
                    }
                    if (prefs.getBoolean(BIOMETRIC_ENABLED, false)) {
                        unlocked = false;
                        showLock();
                        toast("د Fingerprint تصدیق اړین دی. د بیا هڅې تڼۍ وکاروئ.");
                    }
                }

                @Override
                public void onAuthenticationFailed() {
                    super.onAuthenticationFailed();
                    showLock();
                    toast("Fingerprint ونه پېژندل شو.");
                }
            });

        promptInfo = new BiometricPrompt.PromptInfo.Builder()
            .setTitle("د مالي مدیریت")
            .setSubtitle("سخت امنیت • Fingerprint")
            .setDescription("د اپ د خلاصولو لپاره خپله ثبت شوې ګوته وکاروئ.")
            .setNegativeButtonText("بندول")
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .build();
    }

    private void authenticate(boolean forEnable) {
        if (!pageLoaded || authInProgress || biometricPrompt == null) return;
        int can = BiometricManager.from(this)
            .canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);

        if (can != BiometricManager.BIOMETRIC_SUCCESS) {
            if (forEnable) {
                enabling = false;
                evaluate("window.nativeSecurityChanged && window.nativeSecurityChanged(false);");
                toast("په دې موبایل کې د Strong Fingerprint/biometric ثبت شوی سیستم نشته.");
            } else if (prefs.getBoolean(BIOMETRIC_ENABLED, false)) {
                unlocked = false;
                showLock();
                toast("د فعال Fingerprint تصدیق ممکن نه شو.");
            }
            return;
        }

        enabling = forEnable;
        authInProgress = true;
        showLock();
        biometricPrompt.authenticate(promptInfo);
    }

    private void showLock() {
        if (!pageLoaded) return;
        evaluate("window.showNativeLock && window.showNativeLock();");
    }

    private void hideLock() {
        if (!pageLoaded) return;
        evaluate("window.hideNativeLock && window.hideNativeLock();");
    }

    private void evaluate(String javascript) {
        if (webView != null && pageLoaded) {
            webView.evaluateJavascript(javascript, null);
        }
    }

    private void openExternal(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(Intent.createChooser(intent, "لینک پرانیستل"));
        } catch (Exception ignored) {
            toast("د دې لینک لپاره مناسب اپ/براوزر موجود نه دی.");
        }
    }

    private void dial(String number) {
        try {
            Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + number.replaceAll("[^0-9+]", "")));
            startActivity(intent);
        } catch (Exception ignored) {
            toast("د زنګ اپراتور/اپ پرانیستل نه شول.");
        }
    }

    private void copyText(String text) {
        try {
            ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            clipboard.setPrimaryClip(ClipData.newPlainText("اړیکې", text));
            toast("د اړیکو معلومات کاپي شول.");
        } catch (Exception ignored) {
            toast("کاپي کول ممکن نه شول.");
        }
    }

    private void toast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (pageLoaded && prefs.getBoolean(BIOMETRIC_ENABLED, false) && !unlocked && !authInProgress) {
            showLock();
            authenticate(false);
        }
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (prefs.getBoolean(BIOMETRIC_ENABLED, false)) {
            unlocked = false;
        }
    }

    @Override
    public void onBackPressed() {
        if (prefs.getBoolean(BIOMETRIC_ENABLED, false) && !unlocked) {
            finish();
            return;
        }
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
            runOnUiThread(() -> {
                if (!pageLoaded) return;
                showLock();
                authenticate(true);
            });
        }

        @JavascriptInterface
        public void retryBiometric() {
            runOnUiThread(() -> {
                if (prefs.getBoolean(BIOMETRIC_ENABLED, false)) authenticate(false);
            });
        }

        @JavascriptInterface
        public void disableBiometric() {
            runOnUiThread(() -> {
                prefs.edit().putBoolean(BIOMETRIC_ENABLED, false).apply();
                enabling = false;
                authInProgress = false;
                unlocked = true;
                hideLock();
                evaluate("window.nativeSecurityChanged && window.nativeSecurityChanged(false);");
                toast("Fingerprint امنیت لرې شو.");
            });
        }

        @JavascriptInterface
        public void shareText(String text) {
            runOnUiThread(() -> {
                try {
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType("text/plain");
                    send.putExtra(Intent.EXTRA_TEXT, text);
                    startActivity(Intent.createChooser(send, "نورو ته لېږل"));
                } catch (Exception ignored) {
                    toast("د شریکولو لپاره مناسب اپ موجود نه دی.");
                }
            });
        }

        @JavascriptInterface
        public void openUrl(String url) {
            runOnUiThread(() -> openExternal(url));
        }

        @JavascriptInterface
        public void dial(String number) {
            runOnUiThread(() -> dial(number));
        }

        @JavascriptInterface
        public void copyText(String text) {
            runOnUiThread(() -> copyText(text));
        }

        @JavascriptInterface
        public void closeLocked() {
            runOnUiThread(() -> finish());
        }
    }
}