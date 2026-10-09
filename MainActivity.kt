package za.co.boilerprosa

import android.content.Intent
import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Bundle
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonPrimitive
import za.co.boilerprosa.data.*
import za.co.boilerprosa.worker.StudyReminderWorker

class MainActivity:ComponentActivity(){
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState); if(android.os.Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED) ActivityCompat.requestPermissions(this,arrayOf(Manifest.permission.POST_NOTIFICATIONS),1001); StudyReminderWorker.schedule(this); setContent{BoilerProApp(this)}}
}

@Composable fun BoilerProApp(activity:MainActivity){
 val api=remember{Services.api()}; val session=remember{Session(activity)}
 var email by remember{mutableStateOf("")}; var password by remember{mutableStateOf("")}; var logged by remember{mutableStateOf(session.access!=null)}; var loading by remember{mutableStateOf(false)}; var error by remember{mutableStateOf("")}; var tab by remember{mutableIntStateOf(0)}
 var lessons by remember{mutableStateOf<List<Lesson>>(emptyList())}; var syncMessage by remember{mutableStateOf("")}
 LaunchedEffect(logged){if(logged){session.access?.let{a->try{lessons=api.lessons("Bearer $a")["lessons"]?:emptyList();syncMessage="Live server connected"}catch(_:Exception){syncMessage="Unable to reach the live server. Connect to mobile data or Wi‑Fi."}}}}
 MaterialTheme{
  if(!logged){
   Column(Modifier.fillMaxSize().padding(24.dp),verticalArrangement=Arrangement.Center){Text("BoilerPro SA",style=MaterialTheme.typography.headlineLarge);Text("Prepare. Practise. Pass.",style=MaterialTheme.typography.titleMedium);Spacer(Modifier.height(20.dp));OutlinedTextField(email,{email=it},label={Text("Email")},modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(8.dp));OutlinedTextField(password,{password=it},label={Text("Password")},modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(14.dp));Button(enabled=!loading,onClick={loading=true;error="";activity.lifecycleScope.launch{try{val r=api.login(mapOf("email" to email,"password" to password));session.access=r.accessToken;r.refresh?.let{session.refresh=it};logged=true;try{lessons=api.lessons("Bearer ${r.accessToken}")["lessons"]?:emptyList();syncMessage="Live server connected"}catch(_:Exception){syncMessage="Unable to load live lessons. Check your data connection."}}catch(_:Exception){error="Sign in failed. Check your details and server connection."};loading=false}},modifier=Modifier.fillMaxWidth()){Text(if(loading)"Signing in…" else "Sign in")};if(error.isNotBlank())Text(error,color=MaterialTheme.colorScheme.error);Spacer(Modifier.height(12.dp));Text("ONLINE / DATA MODE — sign in requires an internet connection.",style=MaterialTheme.typography.bodySmall)}
  } else {
   Scaffold(bottomBar={NavigationBar{listOf("Learn","Practice","Mock Test","Practical","Readiness","Tutor").forEachIndexed{i,label->NavigationBarItem(tab==i,{tab=i},icon={},label={Text(label)})}}}){pad->Column(Modifier.padding(pad).padding(14.dp)){Text("BoilerPro SA",style=MaterialTheme.typography.headlineMedium);Text("Prepare. Practise. Pass.");OnlineStatus();if(syncMessage.isNotBlank())Text(syncMessage,style=MaterialTheme.typography.bodySmall);Spacer(Modifier.height(10.dp));when(tab){0->LessonList(lessons);1->PracticeScreen(api,session,lessons);2->MockScreen(api,session);3->PracticalScreen(api,session);4->ReadinessScreen(api,session);5->TutorScreen(api,session)};Spacer(Modifier.height(12.dp));OutlinedButton(onClick={session.clear();logged=false}){Text("Sign out")}}}
  }
 }
}

fun opts(json:String):List<String> = try{Json.parseToJsonElement(json).jsonArray.map{it.jsonPrimitive.content}}catch(_:Exception){emptyList()}

@Composable fun OnlineStatus(){
 val context=LocalContext.current
 var online by remember{mutableStateOf(false)}
 var cellular by remember{mutableStateOf(false)}
 DisposableEffect(Unit){
  val cm=context.getSystemService(ConnectivityManager::class.java)
  fun update(n:Network?){
   val caps=n?.let{cm.getNetworkCapabilities(it)}
   online=caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)==true
   cellular=caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)==true
  }
  update(cm.activeNetwork)
  val cb=object:ConnectivityManager.NetworkCallback(){
   override fun onAvailable(n:Network){update(n)}
   override fun onCapabilitiesChanged(n:Network,c:NetworkCapabilities){online=c.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);cellular=c.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)}
   override fun onLost(n:Network){update(cm.activeNetwork)}
  }
  cm.registerDefaultNetworkCallback(cb)
  onDispose{cm.unregisterNetworkCallback(cb)}
 }
 Card(Modifier.fillMaxWidth().padding(vertical=6.dp)){
  Row(Modifier.padding(12.dp),verticalAlignment=Alignment.CenterVertically){
   Text(if(online)"🟢 ONLINE / DATA MODE" else "🔴 OFFLINE — SERVER REQUIRED",style=MaterialTheme.typography.titleMedium)
   Spacer(Modifier.width(8.dp))
   Text(if(online&&cellular)"Mobile data" else if(online)"Wi‑Fi / Internet" else "Connect to mobile data or Wi‑Fi",style=MaterialTheme.typography.bodySmall)
  }
 }
}

@Composable fun LessonList(lessons:List<Lesson>){
 if(lessons.isEmpty())Text("No live lessons loaded. Connect to the BoilerPro SA server and sign in.")
 else LazyColumn{items(lessons){l->Card(Modifier.fillMaxWidth().padding(vertical=5.dp)){Column(Modifier.padding(15.dp)){Text(l.title,style=MaterialTheme.typography.titleLarge);Text("${l.category}${l.angle?.let{" • ${it}°"}?:""}");LinearProgressIndicator(progress={l.percent/100f},modifier=Modifier.fillMaxWidth().padding(vertical=8.dp));Text("${l.percent}% • ${l.status}")}}}}
}

@Composable fun PracticeScreen(api:BoilerApi,session:Session,lessons:List<Lesson>){val scope=rememberCoroutineScope();var questions by remember{mutableStateOf<List<Question>>(emptyList())};var selected by remember{mutableIntStateOf(-1)};var message by remember{mutableStateOf("Choose a lesson to practise.")};var idx by remember{mutableIntStateOf(0)};var loading by remember{mutableStateOf(false)};Column{lessons.forEach{l->Button(enabled=!loading,onClick={loading=true;idx=0;selected=-1;message="Loading…";session.access?.let{a->scope.launch{try{questions=api.questions("Bearer $a",l.id)["questions"]?:emptyList();message="${questions.size} questions loaded"}catch(_:Exception){message="Could not load questions."};loading=false}}}){Text(l.title)}};if(questions.isNotEmpty()){val q=questions[idx];Text(q.question,style=MaterialTheme.typography.titleMedium);opts(q.options_json).forEachIndexed{i,o->RadioButtonRow(o,selected==i){selected=i}};Button(enabled=selected>=0,onClick={session.access?.let{a->scope.launch{try{val r=api.attempt("Bearer $a",q.id,mapOf("selectedIndex" to selected));message=if(r.isSuccessful)"Answer recorded." else "Answer not recorded."}catch(_:Exception){message="Connection lost. Reconnect to mobile data or Wi‑Fi and submit again."};if(idx<questions.lastIndex){idx++;selected=-1}}}}){Text("Submit answer")};Text(message)}}}

@Composable fun RadioButtonRow(text:String,checked:Boolean,onClick:()->Unit){Row(Modifier.fillMaxWidth().padding(2.dp)){RadioButton(checked,onClick);Text(text,Modifier.padding(top=12.dp))}}

@Composable fun MockScreen(api:BoilerApi,session:Session){val scope=rememberCoroutineScope();var qs by remember{mutableStateOf<List<Question>>(emptyList())};var answers by remember{mutableStateOf(mutableMapOf<String,Int>())};var index by remember{mutableIntStateOf(0)};var seconds by remember{mutableIntStateOf(30*60)};var started by remember{mutableStateOf(false)};var result by remember{mutableStateOf("")};LaunchedEffect(started,seconds){if(started&&seconds>0){delay(1000);seconds--}else if(started&&seconds==0){result="Time expired — submit the test."}};Column{if(!started&&qs.isEmpty()){Button(onClick={session.access?.let{a->scope.launch{try{qs=api.mock("Bearer $a")["questions"]?:emptyList();seconds=30*60;started=true;result=""}catch(_:Exception){result="Connect to the server to start a timed mock."}}}}){Text("Start 30-minute Mock Trade Test")}};if(started&&qs.isNotEmpty()){val q=qs[index];Text("Question ${index+1}/${qs.size} • ${seconds/60}:${(seconds%60).toString().padStart(2,'0')}",style=MaterialTheme.typography.titleMedium);Text(q.question,Modifier.padding(vertical=10.dp));opts(q.options_json).forEachIndexed{i,o->RadioButtonRow(o,answers[q.id]==i){answers=answers.toMutableMap().also{m->m[q.id]=i}}};Row{if(index>0)Button(onClick={index--}){Text("Back")};Spacer(Modifier.width(8.dp));if(index<qs.lastIndex)Button(onClick={index++}){Text("Next")};else Button(onClick={session.access?.let{a->{scope.launch{try{val body=answers.map{mapOf("questionId" to it.key,"selectedIndex" to it.value)};val r=api.submitMock("Bearer $a",mapOf("answers" to body));result="Mock result: ${r["scorePercent"]}%";started=false}catch(_:Exception){result="Could not submit mock."}}}}}){Text("Finish")}}};if(result.isNotBlank())Text(result,style=MaterialTheme.typography.titleMedium)}}}

@Composable fun PracticalScreen(api:BoilerApi,session:Session){val scope=rememberCoroutineScope();var scenarios by remember{mutableStateOf<List<PracticalScenario>>(emptyList())};var current by remember{mutableStateOf<PracticalScenario?>(null)};var checks by remember{mutableStateOf<List<Boolean>>(emptyList())};var seconds by remember{mutableIntStateOf(0)};var active by remember{mutableStateOf(false)};var result by remember{mutableStateOf("")};LaunchedEffect(active,seconds){if(active&&seconds>0){delay(1000);seconds--}else if(active&&seconds==0)result="Time reached. Complete the checklist and submit."};Column{if(scenarios.isEmpty())Button(onClick={session.access?.let{a->scope.launch{try{scenarios=api.practicalScenarios("Bearer $a")["scenarios"]?:emptyList()}catch(_:Exception){result="Connect to load practical scenarios."}}}}){Text("Load Practical Simulations")};scenarios.forEach{s->OutlinedButton(onClick={current=s;checks=try{List(Json.parseToJsonElement(s.rubric_json).jsonArray.size){false}}catch(_:Exception){emptyList()};seconds=s.duration_minutes*60;active=true;result=""}){Text(s.title)}};current?.let{s->Text(s.title,style=MaterialTheme.typography.titleLarge);Text("Time ${seconds/60}:${(seconds%60).toString().padStart(2,'0')}");val rub=try{Json.parseToJsonElement(s.rubric_json).jsonArray.map{it.jsonPrimitive.content}}catch(_:Exception){emptyList()};rub.forEachIndexed{i,item->Row{Checkbox(checks.getOrElse(i){false},{checks=checks.toMutableList().also{m->m[i]=!m[i]}});Text(item,Modifier.padding(top=12.dp))}};Button(onClick={session.access?.let{a->scope.launch{val score=if(checks.isEmpty())0 else checks.count{it}*100/checks.size;try{api.submitPractical("Bearer $a",s.id,mapOf("scorePercent" to score,"elapsedSeconds" to (s.duration_minutes*60-seconds),"checklist" to checks));result="Practical score: $score%${if(score>=80)" — training pass indicator" else " — revise weak areas"}";active=false}catch(_:Exception){result="Could not save practical result."}}}}){Text("Submit Practical Assessment")};Text("Training simulation only — follow the official job specification and assessor instructions.")};if(result.isNotBlank())Text(result)}}

@Composable fun ReadinessScreen(api:BoilerApi,session:Session){var r by remember{mutableStateOf<Readiness?>(null)};var text by remember{mutableStateOf("Loading readiness…")};LaunchedEffect(Unit){session.access?.let{try{r=api.readiness("Bearer $it");text=""}catch(_:Exception){text="Connect to update readiness."}}};r?.let{Text("${it.readiness}%",style=MaterialTheme.typography.displaySmall);Text(it.level,style=MaterialTheme.typography.headlineSmall);Text("Readiness is a BoilerPro training indicator, not an official trade-test result.");Button(onClick={}){Text("Readiness report available in the dashboard")}};if(text.isNotBlank())Text(text)}

@Composable fun TutorScreen(api:BoilerApi,session:Session){val scope=rememberCoroutineScope();var q by remember{mutableStateOf("")};var answer by remember{mutableStateOf("")};Column{OutlinedTextField(q,{q=it},label={Text("Ask a boilermaking question")},modifier=Modifier.fillMaxWidth());Button(onClick={session.access?.let{a->scope.launch{try{answer=api.tutor("Bearer $a",mapOf("question" to q)).answer}catch(_:Exception){answer="Tutor unavailable. Check your connection."}}}}){Text("Ask BoilerPro Tutor")};if(answer.isNotBlank())Card(Modifier.fillMaxWidth().padding(top=12.dp)){Text(answer,Modifier.padding(16.dp))};Text("Tutor guidance is for training practice. Verify work against the drawing/specification, approved procedure and instructor/assessor guidance.")}}

