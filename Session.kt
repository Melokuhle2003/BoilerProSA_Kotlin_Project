package za.co.boilerprosa.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class Session(context:Context){
 private val key=MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
 private val p=EncryptedSharedPreferences.create(context,"bp_session",key,EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
 var access:String? get()=p.getString("access",null) set(v){p.edit().putString("access",v).apply()}
 var refresh:String? get()=p.getString("refresh",null) set(v){p.edit().putString("refresh",v).apply()}
 fun clear(){p.edit().clear().apply()}
}
