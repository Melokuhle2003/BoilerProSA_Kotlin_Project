package za.co.boilerprosa.data

import android.content.Context
import androidx.room.*

@Entity(tableName="lessons") data class LessonEntity(@PrimaryKey val id:String,val title:String,val slug:String,val category:String,val angle:Int?,val contentJson:String,val imageAsset:String?,val published:Boolean)
@Entity(tableName="questions") data class QuestionEntity(@PrimaryKey val id:String,val lessonId:String,val question:String,val optionsJson:String,val difficulty:String,val explanation:String)
@Entity(tableName="sync_queue") data class SyncQueueEntity(@PrimaryKey(autoGenerate=true) val id:Long=0,val type:String,val refId:String,val payload:String)

@Dao interface LessonDao { @Query("SELECT * FROM lessons ORDER BY title") fun all(): kotlinx.coroutines.flow.Flow<List<LessonEntity>>; @Insert(onConflict=OnConflictStrategy.REPLACE) suspend fun upsertAll(v:List<LessonEntity>); @Query("DELETE FROM lessons") suspend fun clear() }
@Dao interface QuestionDao { @Query("SELECT * FROM questions WHERE lessonId=:lessonId") suspend fun forLesson(lessonId:String):List<QuestionEntity>; @Insert(onConflict=OnConflictStrategy.REPLACE) suspend fun upsertAll(v:List<QuestionEntity>) }
@Dao interface SyncDao { @Insert suspend fun add(v:SyncQueueEntity); @Query("SELECT * FROM sync_queue ORDER BY id") suspend fun all():List<SyncQueueEntity>; @Delete suspend fun remove(v:SyncQueueEntity) }
@Database(entities=[LessonEntity::class,QuestionEntity::class,SyncQueueEntity::class],version=1,exportSchema=false)
abstract class BoilerDb:RoomDatabase(){ abstract fun lessons():LessonDao; abstract fun questions():QuestionDao; abstract fun sync():SyncDao
 companion object { @Volatile private var I:BoilerDb?=null; fun get(c:Context)=I?:synchronized(this){I?:Room.databaseBuilder(c.applicationContext,BoilerDb::class.java,"boilerpro.db").build().also{I=it}} } }
