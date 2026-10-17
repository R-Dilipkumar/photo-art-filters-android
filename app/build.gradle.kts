plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.kotlin.compose)
}

android {
  namespace = "com.artisan.nprstudio"
  compileSdk { version = release(36) }

  defaultConfig {
    applicationId = "com.artisan.nprstudio"
    // 29+: ImageDecoder and MediaStore saving work with no storage permission (see AUDIT.md C4).
    minSdk = 29
    targetSdk = 36
    versionCode = 1
    versionName = "0.1.0"

    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
  }

  buildTypes {
    release {
      isMinifyEnabled = true
      isShrinkResources = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  buildFeatures {
    compose = true
  }
}

dependencies {
  implementation(platform(libs.androidx.compose.bom))
  implementation(libs.androidx.compose.ui)
  implementation(libs.androidx.compose.material3)
  implementation(libs.androidx.compose.ui.tooling.preview)
  debugImplementation(libs.androidx.compose.ui.tooling)
  implementation(libs.androidx.activity.compose)
  implementation(libs.androidx.lifecycle.viewmodel.compose)
  implementation(libs.androidx.lifecycle.runtime.compose)
  implementation(libs.kotlinx.coroutines.android)

  testImplementation(libs.junit)

  androidTestImplementation(libs.androidx.test.runner)
  androidTestImplementation(libs.androidx.test.junit)
  androidTestImplementation(libs.junit)
}
