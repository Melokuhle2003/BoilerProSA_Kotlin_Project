plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android { namespace = "za.co.boilerprosa"; compileSdk = 35
    defaultConfig { applicationId = "za.co.boilerprosa"; minSdk = 26; targetSdk = 35; versionCode = 6; versionName = "6.0.0" }
}

kotlin { jvmToolchain(17) }

val composeBom = platform("androidx.compose:compose-bom:2025.01.00")
dependencies {
    implementation(composeBom)
    androidTestImplementation(composeBom)
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    implementation("androidx.work:work-runtime-ktx:2.12.0")
    implementation("androidx.datastore:datastore-preferences:1.1.2")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.credentials:credentials:1.5.0-alpha01")
    implementation("androidx.credentials:credentials-play-services-auth:1.5.0-alpha01")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-kotlinx-serialization:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
}
