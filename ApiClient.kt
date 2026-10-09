package za.co.boilerpro.sa.data

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET

object ApiClient {
    // Replace with the actual deployed HTTPS API base URL, ending in "/".
    private const val BASE_URL = "https://YOUR_API_DOMAIN/"

    val service: BoilerProApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(BoilerProApi::class.java)
    }
}

interface BoilerProApi {
    // Confirm this path and JSON schema against your deployed server.
    @GET("api/lessons")
    suspend fun getLessons(): List<Lesson>
}

data class Lesson(
    val id: String,
    val title: String,
    val description: String? = null,
    val category: String? = null,
    val imageUrl: String? = null
)
