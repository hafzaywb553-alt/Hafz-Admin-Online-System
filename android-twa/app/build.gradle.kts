plugins {
    id("com.android.application")
}

android {
    namespace = "app.web.hafz_finance_management.twa"
    compileSdk = 36

    defaultConfig {
        applicationId = "app.web.hafz_finance_management.twa"
        minSdk = 23
        targetSdk = 36
        versionCode = 3
        versionName = "1.2"
    }
}

dependencies {
    implementation("androidx.browser:browser:1.10.0")
}
