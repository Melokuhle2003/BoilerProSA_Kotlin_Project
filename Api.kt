package za.co.boilerprosa.data

import retrofit2.Response
import retrofit2.http.*

interface BoilerApi {
 @POST("api/auth/login") suspend fun login(@Body body:Map<String,String>): AuthResponse
 @POST("api/auth/register") suspend fun register(@Body body:Map<String,String>): AuthResponse
 @GET("api/me") suspend fun me(@Header("Authorization") auth:String): Map<String,User>
 @GET("api/lessons") suspend fun lessons(@Header("Authorization") auth:String): Map<String,List<Lesson>>
 @GET("api/lessons/{id}/questions") suspend fun questions(@Header("Authorization") auth:String,@Path("id") id:String): Map<String,List<Question>>
 @POST("api/lessons/{id}/progress") suspend fun progress(@Header("Authorization") auth:String,@Path("id") id:String,@Body body:Map<String,Any>): Response<Unit>
 @POST("api/questions/{id}/attempt") suspend fun attempt(@Header("Authorization") auth:String,@Path("id") id:String,@Body body:Map<String,Any>): Response<Unit>
 @GET("api/dashboard") suspend fun dashboard(@Header("Authorization") auth:String): Dashboard
 @GET("api/readiness") suspend fun readiness(@Header("Authorization") auth:String): Readiness
 @GET("api/mock-tests/random") suspend fun mock(@Header("Authorization") auth:String): Map<String,List<Question>>
 @POST("api/mock-tests/submit") suspend fun submitMock(@Header("Authorization") auth:String,@Body body:Map<String,Any>): Map<String,Any>
 @GET("api/mock-tests/history") suspend fun mockHistory(@Header("Authorization") auth:String): Map<String,List<Map<String,Any>>>
 @GET("api/practical-scenarios") suspend fun practicalScenarios(@Header("Authorization") auth:String): Map<String,List<PracticalScenario>>
 @POST("api/practical-scenarios/{id}/submit") suspend fun submitPractical(@Header("Authorization") auth:String,@Path("id") id:String,@Body body:Map<String,Any>): Map<String,Any>
 @GET("api/practical-scenarios/history") suspend fun practicalHistory(@Header("Authorization") auth:String): Map<String,List<PracticalAttempt>>
 @POST("api/tutor/ask") suspend fun tutor(@Header("Authorization") auth:String,@Body body:Map<String,String>): TutorReply
}
