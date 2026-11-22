plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "vn.tetcountdown"
    compileSdk = 35

    defaultConfig {
        applicationId = "vn.tetcountdown"
        minSdk = 26
        // Giữ 34 để Android 15 không ép giao diện tràn viền dưới thanh trạng thái
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Ký bằng debug key để cài thẳng APK release lên máy (không đưa lên Play Store)
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    // Giao diện app dùng chung code PWA trong src/pwa, không chép trùng
    sourceSets["main"].assets.srcDirs("../../pwa")
}
