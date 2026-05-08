import java.util.Properties
import org.gradle.api.GradleException

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.serialization")
}

val localProperties = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) {
        file.inputStream().use(::load)
    }
}

fun localProperty(name: String): String =
    localProperties.getProperty(name)?.trim()
        ?: providers.gradleProperty(name).orNull?.trim()
        ?: providers.environmentVariable(name).orNull?.trim()
        ?: ""

fun requiredLocalProperty(name: String): String =
    localProperty(name).takeIf { it.isNotBlank() }
        ?: throw GradleException(
            "$name wajib diisi di local.properties, Gradle property, atau environment variable sebelum build Android."
        )

fun normalizeBaseUrl(value: String): String =
    value.trim().trimEnd('/').takeIf { it.isNotBlank() } ?: ""

fun deriveWebsiteApiUrl(websiteBaseUrl: String, path: String): String {
    val normalizedBaseUrl = normalizeBaseUrl(websiteBaseUrl)
    return if (normalizedBaseUrl.isBlank()) "" else "$normalizedBaseUrl$path"
}

fun deriveRegisterApiUrl(resetPasswordApiUrl: String): String {
    val normalizedUrl = normalizeBaseUrl(resetPasswordApiUrl)
    val marker = "/api/auth/request-password-reset"
    return if (normalizedUrl.endsWith(marker)) {
        normalizedUrl.removeSuffix(marker) + "/api/auth/register-alumni"
    } else {
        ""
    }
}

fun String.toBuildConfigString(): String =
    "\"${replace("\\", "\\\\").replace("\"", "\\\"")}\""

val supabaseUrl = requiredLocalProperty("SUPABASE_URL")
val supabaseAnonKey = requiredLocalProperty("SUPABASE_ANON_KEY")
val websiteBaseUrl = localProperty("WEBSITE_BASE_URL")
val resetPasswordApiUrl = localProperty("RESET_PASSWORD_API_URL").takeIf { it.isNotBlank() }
    ?: deriveWebsiteApiUrl(websiteBaseUrl, "/api/auth/request-password-reset").takeIf { it.isNotBlank() }
    ?: throw GradleException(
        "WEBSITE_BASE_URL atau RESET_PASSWORD_API_URL wajib diisi sebelum build Android."
    )
val registerApiUrl = localProperty("REGISTER_API_URL").takeIf { it.isNotBlank() }
    ?: deriveWebsiteApiUrl(websiteBaseUrl, "/api/auth/register-alumni").takeIf { it.isNotBlank() }
    ?: deriveRegisterApiUrl(resetPasswordApiUrl).takeIf { it.isNotBlank() }
    ?: throw GradleException(
        "REGISTER_API_URL wajib diisi atau WEBSITE_BASE_URL/RESET_PASSWORD_API_URL harus mengarah ke endpoint website yang benar."
    )

android {
    namespace = "com.unihaz.tracerstudy"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.unihaz.tracerstudy"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "SUPABASE_URL", supabaseUrl.toBuildConfigString())
        buildConfigField("String", "SUPABASE_ANON_KEY", supabaseAnonKey.toBuildConfigString())
        buildConfigField("String", "RESET_PASSWORD_API_URL", resetPasswordApiUrl.toBuildConfigString())
        buildConfigField("String", "REGISTER_API_URL", registerApiUrl.toBuildConfigString())
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    buildFeatures {
        buildConfig = true
        viewBinding = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        jvmToolchain(21)
        compilerOptions {
            jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        }
    }

    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.navigation:navigation-fragment-ktx:2.7.6")
    implementation("androidx.navigation:navigation-ui-ktx:2.7.6")
    implementation("androidx.recyclerview:recyclerview:1.3.2")
    implementation("androidx.viewpager2:viewpager2:1.1.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")

    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    implementation("androidx.activity:activity-ktx:1.8.2")
    implementation("androidx.fragment:fragment-ktx:1.6.2")

    implementation("io.ktor:ktor-client-android:3.2.3")
    implementation("io.ktor:ktor-client-core:3.2.3")
    implementation("io.ktor:ktor-client-logging:3.2.3")

    implementation("io.insert-koin:koin-android:3.5.3")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("io.coil-kt:coil:2.5.0")
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("androidx.arch.core:core-testing:2.2.0")

    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test:core:1.7.0")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
    androidTestImplementation("androidx.test:runner:1.7.0")
    androidTestImplementation("androidx.test:rules:1.7.0")
}
