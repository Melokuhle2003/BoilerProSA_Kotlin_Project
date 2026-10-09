package za.co.boilerprosa.data

import kotlinx.serialization.Serializable

@Serializable data class User(val id:String, val email:String, val display_name:String, val role:String)
@Serializable data class AuthResponse(val accessToken:String, val refreshToken:String? = null, val user:User)
@Serializable data class Lesson(val id:String, val slug:String, val title:String, val angle:Int?=null, val category:String, val image_asset:String?=null, val content_json:String="{}", val is_published:Boolean=true, val status:String="NOT_STARTED", val percent:Int=0)
@Serializable data class Question(val id:String, val lesson_id:String, val question:String, val options_json:String, val difficulty:String, val explanation:String="")
@Serializable data class Dashboard(val lessonsCompleted:Int=0, val lessonsTotal:Int=0, val questionsAnswered:Int=0, val accuracyPercent:Double=0.0, val bestMockPercent:Double=0.0)
@Serializable data class Readiness(val readiness:Int=0, val level:String="STARTING OUT", val lessons:Map<String,Int> = emptyMap(), val questions:Map<String,Int> = emptyMap(), val mocks:Map<String,Int> = emptyMap())
@Serializable data class PracticalScenario(val id:String,val slug:String,val title:String,val category:String,val duration_minutes:Int,val instructions_json:String,val rubric_json:String)
@Serializable data class PracticalAttempt(val id:String,val score_percent:Int,val elapsed_seconds:Int,val completed_at:String,val title:String)
@Serializable data class TutorReply(val answer:String)
