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
        versionCode = 1
        versionName = "1.0"
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.3")
}
