package za.co.boilerpro.sa.data

/**
 * Integration point for login/register/refresh/logout.
 * Implement request and response models to match the deployed v6 API.
 * Keep access tokens short-lived and refresh tokens in secure platform storage.
 * Never store plaintext passwords or put admin/API secrets in the APK.
 */
class AuthRepository {
    fun validateCredentials(email: String, password: String): Boolean =
        email.isNotBlank() && password.isNotBlank()
}
