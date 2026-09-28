package app.web.hafz_finance_management.twa;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import androidx.browser.customtabs.CustomTabsIntent;

public class MainActivity extends Activity {
    private static final String START_URL = "https://app-d81fic.v2.appdeploy.ai/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        launchWebApp();
    }

    private void launchWebApp() {
        Uri uri = Uri.parse(START_URL);
        try {
            CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                    .setShowTitle(false)
                    .build();
            customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            customTabsIntent.launchUrl(this, uri);
        } catch (Exception customTabError) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException ignored) {
                // Nothing else can be launched on this device.
            }
        }
        finish();
    }
}
