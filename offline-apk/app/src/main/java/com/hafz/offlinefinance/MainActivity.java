package com.hafz.offlinefinance;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.pm.PackageManager;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.fragment.app.FragmentActivity;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.concurrent.Executor;

public class MainActivity extends FragmentActivity {
    private static final String PREFS = "offline_finance_security";
    private static final String BIOMETRIC_ENABLED = "biometric_enabled";
    private static final int COMMISSION_STORAGE_PERMISSION_REQUEST = 4182;
    private static final String COMMISSION_APK_URL =
        "https://raw.githubusercontent.com/hafzaywb553-alt/Hafz-Admin-Online-System/offline-three-sections-v2/karah-commission.apk";

    private WebView webView;
    private SharedPreferences prefs;
    private BiometricPrompt biometricPrompt;
    private BiometricPrompt.PromptInfo promptInfo;
    private boolean unlocked = false;
    private boolean authInProgress = false;
    private boolean enabling = false;
    private boolean pageLoaded = false;
    private boolean enrollmentPending = false;
    private boolean disabling = false;

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
                return handleUri(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUri(Uri.parse(url));
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
                        enrollmentPending = false;
                        prefs.edit().putBoolean(BIOMETRIC_ENABLED, true).apply();
                        toast("د Fingerprint امنیت فعال شو؛ له دې وروسته بیا ننوتل اجباري دي.");
                        evaluate("window.nativeSecurityChanged && window.nativeSecurityChanged(true);");
                        evaluate("window.nativeBiometricEnrollmentNeeded && window.nativeBiometricEnrollmentNeeded(false);");
                    } else if (disabling) {
                        disabling = false;
                        prefs.edit().putBoolean(BIOMETRIC_ENABLED, false).apply();
                        toast("د Fingerprint امنیت د تصدیق وروسته لرې شو.");
                        evaluate("window.nativeSecurityChanged && window.nativeSecurityChanged(false);");
                    }
                    unlocked = true;
                    hideLock();
                    evaluate("window.onNativeUnlocked && window.onNativeUnlocked();");
                }

                @Override
                public void onAuthenticationError(int errorCode, CharSequence errString) {
                    super.onAuthenticationError(errorCode, errString);
                    authInProgress = false;
                    if (disabling) {
                        disabling = false;
                        hideLock();
                        toast("Fingerprint تصدیق ونه شو؛ امنیت هماغسې فعال پاتې شو.");
                        return;
                    }
                    if (enabling && !enrollmentPending) {
                        enabling = false;
                        hideLock();
                        evaluate("window.nativeSecurityChanged && window.nativeSecurityChanged(false);");
                        evaluate("window.nativeBiometricEnrollmentNeeded && window.nativeBiometricEnrollmentNeeded(false);");
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
                boolean noneEnrolled = can == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED;
                if (noneEnrolled) {
                    enabling = true;
                    enrollmentPending = true;
                    evaluate("window.nativeSecurityChanged && window.nativeSecurityChanged(false);");
                    evaluate("window.nativeBiometricEnrollmentNeeded && window.nativeBiometricEnrollmentNeeded(true);");
                    toast("Fingerprint ثبت شوی نه دی. د موبایل اصلي ثبتولو پاڼه پرانیستل کېږي.");
                    openBiometricSettings();
                } else {
                    enabling = false;
                    enrollmentPending = false;
                    evaluate("window.nativeSecurityChanged && window.nativeSecurityChanged(false);");
                    toast("په دې موبایل کې مناسب Strong biometric موجود نه دی.");
                }
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

    private boolean handleUri(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        if (!"hafz".equals(scheme)) {
            openExternal(uri.toString());
            return true;
        }

        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        String path = uri.getPath() == null ? "" : uri.getPath().toLowerCase();

        if ("nav".equals(host)) {
            String section = "salarySection";
            if (path.contains("contact")) section = "contactSection";
            if (path.contains("settings")) section = "settingsSection";
            final String js = "window.showSection && window.showSection('" + section
                    + "',document.querySelector('[data-section=\"" + section + "\"]'));";
            evaluate(js);
            return true;
        }

        if ("share".equals(host) && path.contains("contact")) {
            shareTextNative(contactShareText());
            return true;
        }

        if ("share".equals(host) && path.contains("app")) {
            shareCurrentApk();
            return true;
        }

        if ("download".equals(host) && path.contains("commission")) {
            downloadCommissionApk();
            return true;
        }

        if ("copy".equals(host) && path.contains("contact")) {
            copyText(contactShareText());
            return true;
        }

        if ("fingerprint".equals(host)) {
            if (path.contains("enable")) runOnUiThread(() -> {
                if (pageLoaded) {
                    showLock();
                    authenticate(true);
                }
            });
            else if (path.contains("disable")) {
                runOnUiThread(() -> {
                    if (!pageLoaded || !prefs.getBoolean(BIOMETRIC_ENABLED, false)) {
                        toast("Fingerprint لا دمخه بند دی.");
                        return;
                    }
                    disabling = true;
                    showLock();
                    authenticate(false);
                });
            } else if (path.contains("settings")) {
                openBiometricSettings();
            }
            return true;
        }

        if ("settings".equals(host)) {
            if (path.contains("resetappearance")) {
                evaluate("window.resetAppearance && window.resetAppearance();");
                toast("د بڼې تنظیمات اصلي حالت ته راوګرځول شول.");
            } else if (path.contains("resetcolors")) {
                evaluate("window.resetColors && window.resetColors();");
                toast("رنګونه اصلي حالت ته راوګرځول شول.");
            } else if (path.contains("resetall")) {
                prefs.edit().putBoolean(BIOMETRIC_ENABLED, false).apply();
                enrollmentPending = false;
                disabling = false;
                unlocked = true;
                evaluate("window.resetAllNative && window.resetAllNative();");
                toast("ټول تنظیمات اصلي حالت ته راوګرځول شول.");
            } else if (path.contains("cleardata")) {
                prefs.edit().putBoolean(BIOMETRIC_ENABLED, false).apply();
                enrollmentPending = false;
                disabling = false;
                unlocked = true;
                evaluate("window.clearAllNative && window.clearAllNative();");
                toast("ټول محلي معلومات پاکېږي.");
            }
            return true;
        }

        return true;
    }

    private String contactShareText() {
        return "د مالي مدیریت - اړیکې\n"
            + "حافظ محیب الله ایوب\n"
            + "ولایت: ارزګان | ولسوالۍ: چوره | قریه: خواجه خدیر\n"
            + "تلیفون: 0705965475\n"
            + "WhatsApp: Message مجاهد on WhatsApp. https://wa.me/93705965475\n"
            + "YouTube: https://youtube.com/channel/UCgilh9KTiPaLGCsDELLNcjw?si=zypPIMpBe6sVpUIm\n"
            + "Facebook: https://www.facebook.com/share/193AP34ZUS/";
    }

    /**
     * Shares the APK that is currently installed on this device.
     * Copying it into app cache lets FileProvider expose a safe content:// URI.
     */
    private void shareCurrentApk() {
        try {
            File shareDir = new File(getCacheDir(), "share");
            if (!shareDir.exists() && !shareDir.mkdirs()) {
                throw new IOException("Could not create APK share cache.");
            }

            File sourceApk = new File(getApplicationInfo().sourceDir);
            if (!sourceApk.isFile() || sourceApk.length() <= 0) {
                throw new IOException("Installed APK file is not available.");
            }

            File sharedApk = new File(shareDir, "Finance-App-V18.apk");
            try (FileInputStream input = new FileInputStream(sourceApk);
                 FileOutputStream output = new FileOutputStream(sharedApk, false)) {
                byte[] buffer = new byte[16 * 1024];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    output.write(buffer, 0, count);
                }
                output.flush();
            }

            if (sharedApk.length() != sourceApk.length()) {
                throw new IOException("The shared APK copy is incomplete.");
            }

            Uri apkUri = FileProvider.getUriForFile(
                this,
                getPackageName() + ".fileprovider",
                sharedApk
            );

            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("application/vnd.android.package-archive");
            send.putExtra(Intent.EXTRA_STREAM, apkUri);
            send.putExtra(Intent.EXTRA_SUBJECT, "د مالي مدیریت اصلي APK");
            send.setClipData(ClipData.newUri(
                getContentResolver(), "Finance-App-V18.apk", apkUri
            ));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(send, "د مالي مدیریت اصلي APK شریکول");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(chooser);
        } catch (Exception error) {
            toast("د اصلي APK شریکول ممکن نه شول: " + error.getMessage());
        }
    }

    /**
     * Starts a direct system-managed download of the Karah Commission APK.
     */
    private void downloadCommissionApk() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P
                && ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                COMMISSION_STORAGE_PERMISSION_REQUEST
            );
            return;
        }
        try {
            DownloadManager manager =
                (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) {
                toast("د Android ډاونلوډ خدمت په دې موبایل کې موجود نه دی.");
                return;
            }

            DownloadManager.Request request =
                new DownloadManager.Request(Uri.parse(COMMISSION_APK_URL));
            request.setTitle("د کره کمیسیون د فورمو د ثبت او مدیریت سیستم");
            request.setDescription("د APK فایل ښکته کېږي؛ له بشپړېدو وروسته یې له Downloads څخه نصب کړئ.");
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );
            request.setDestinationInExternalPublicDir(
                Environment.DIRECTORY_DOWNLOADS, "Karah-Commission.apk"
            );
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);

            long downloadId = manager.enqueue(request);
            toast("د کره کمیسیون اپ ډاونلوډ پیل شو. د ډاونلوډ پېژند: " + downloadId);
        } catch (Exception error) {
            toast("ډاونلوډ پیل نه شو: " + error.getMessage());
        }
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == COMMISSION_STORAGE_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                downloadCommissionApk();
            } else {
                toast("د ډاونلوډ لپاره د Downloads فولډر د لیکلو اجازه اړینه ده.");
            }
        }
    }

    private void shareTextNative(String text) {
        try {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_TEXT, text);
            startActivity(Intent.createChooser(send, "د اړیکو معلومات شریکول"));
        } catch (Exception ignored) {
            toast("د شریکولو لپاره مناسب اپ موجود نه دی.");
        }
    }

    private void openExternal(String url) {
        Uri uri = Uri.parse(url);
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        String[] packages = null;
        if (host.contains("wa.me") || host.contains("whatsapp.com")) {
            packages = new String[]{"com.whatsapp", "com.whatsapp.w4b"};
        } else if (host.contains("youtube.com") || host.contains("youtu.be")) {
            packages = new String[]{"com.google.android.youtube"};
        } else if (host.contains("facebook.com") || host.contains("fb.com")) {
            packages = new String[]{"com.facebook.katana"};
        }
        if (packages != null) {
            for (String pkg : packages) {
                try {
                    Intent direct = new Intent(Intent.ACTION_VIEW, uri);
                    direct.setPackage(pkg);
                    direct.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(direct);
                    return;
                } catch (Exception ignored) {}
            }
        }
        toast("اړوند اپ نصب شوی نه دی؛ دا آفلاین APK هېڅ Browser نه پرانیزي.");
    }

    private void dial(String number) {
        try {
            Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + number.replaceAll("[^0-9+]", "")));
            startActivity(intent);
        } catch (Exception ignored) {
            toast("د زنګ اپراتور/اپ پرانیستل نه شول.");
        }
    }

    private void openBiometricSettings() {
        enrollmentPending = true;
        try {
            Intent intent;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                intent = new Intent(Settings.ACTION_BIOMETRIC_ENROLL);
                intent.putExtra(Settings.EXTRA_BIOMETRIC_AUTHENTICATORS_ALLOWED,
                    BiometricManager.Authenticators.BIOMETRIC_STRONG);
            } else {
                intent = new Intent(Settings.ACTION_SECURITY_SETTINGS);
            }
            startActivity(intent);
        } catch (Exception ignored) {
            try {
                startActivity(new Intent(Settings.ACTION_SECURITY_SETTINGS));
            } catch (Exception ignoredAgain) {
                enrollmentPending = false;
                toast("د موبایل د امنیتي تنظیماتو پاڼه نه پرانیستل شوه.");
            }
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
        if (!pageLoaded) return;
        if (enrollmentPending) {
            int can = BiometricManager.from(this)
                .canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
            if (can == BiometricManager.BIOMETRIC_SUCCESS) {
                enrollmentPending = false;
                evaluate("window.nativeBiometricEnrollmentNeeded && window.nativeBiometricEnrollmentNeeded(false);");
                authenticate(true);
            } else {
                evaluate("window.nativeBiometricEnrollmentNeeded && window.nativeBiometricEnrollmentNeeded(true);");
                toast("Fingerprint لا ثبت شوی نه دی؛ لومړی یې په موبایل کې ثبت کړئ.");
            }
            return;
        }
        if (prefs.getBoolean(BIOMETRIC_ENABLED, false) && !unlocked && !authInProgress) {
            showLock();
            authenticate(false);
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (prefs.getBoolean(BIOMETRIC_ENABLED, false) && !isChangingConfigurations()) {
            unlocked = false;
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
                if (!prefs.getBoolean(BIOMETRIC_ENABLED, false)) {
                    toast("Fingerprint لا دمخه بند دی.");
                    return;
                }
                disabling = true;
                showLock();
                authenticate(false);
            });
        }

        @JavascriptInterface
        public void shareText(String text) {
            runOnUiThread(() -> shareTextNative(text));
        }

        @JavascriptInterface
        public void openUrl(String url) {
            runOnUiThread(() -> openExternal(url));
        }

        @JavascriptInterface
        public void openBiometricSettings() {
            runOnUiThread(() -> MainActivity.this.openBiometricSettings());
        }

        @JavascriptInterface
        public void dial(String number) {
            runOnUiThread(() -> MainActivity.this.dial(number));
        }

        @JavascriptInterface
        public void copyText(String text) {
            runOnUiThread(() -> MainActivity.this.copyText(text));
        }

        @JavascriptInterface
        public void shareCurrentApk() {
            runOnUiThread(() -> MainActivity.this.shareCurrentApk());
        }

        @JavascriptInterface
        public void downloadCommissionApk() {
            runOnUiThread(() -> MainActivity.this.downloadCommissionApk());
        }

        @JavascriptInterface
        public void closeLocked() {
            runOnUiThread(() -> finish());
        }
    }
}