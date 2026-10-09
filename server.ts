import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import argon2 from 'argon2';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import {z} from 'zod';
import {query} from './db.js';
import {requireAuth,requireRole,signAccessToken,newRefreshToken,hashRefreshToken} from './auth.js';

const app=express();
app.disable('x-powered-by'); app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'1mb'}));
const origins=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
app.use(cors({origin:(o,cb)=>!o||origins.includes(o)?cb(null,true):cb(new Error('CORS blocked')),methods:['GET','POST','PUT','DELETE'],allowedHeaders:['Content-Type','Authorization']}));
app.use((req,_res,next)=>{const raw=req.headers.cookie||'';const cookies:Record<string,string>=Object.create(null);for(const part of raw.split(';')){const i=part.indexOf('=');if(i>0)cookies[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim())} (req as any).cookies=cookies;next();});
const loginLimiter=rateLimit({windowMs:15*60*1000,max:10,standardHeaders:true,legacyHeaders:false});
const adminDir=path.resolve(process.env.ADMIN_UI_DIR||path.join(process.cwd(),'admin'));
const uploadDir=path.resolve(process.env.UPLOAD_DIR||path.join(process.cwd(),'public/uploads'));
fs.mkdirSync(uploadDir,{recursive:true});
const storage=multer.diskStorage({destination:uploadDir,filename:(_req,file,cb)=>{const ext=path.extname(file.originalname).toLowerCase();cb(null,`${crypto.randomUUID()}${ext}`)}});
const upload=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(_req,file,cb)=>cb(null,['image/png','image/jpeg','image/webp'].includes(file.mimetype))});
const audit=async(userId:string,action:string,targetType:string|null,targetId:string|null,req:express.Request,metadata:any={})=>{await query(`INSERT INTO audit_logs(user_id,action,target_type,target_id,ip,user_agent,metadata) VALUES($1,$2,$3,$4,$5,$6,$7)`,[userId,action,targetType,targetId,req.ip,req.get('user-agent')||'',JSON.stringify(metadata)])};
const setRefreshCookie=(res:express.Response,token:string)=>res.cookie('bp_refresh',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/auth',maxAge:Number(process.env.REFRESH_TOKEN_DAYS||30)*86400000});

app.get('/health',(_q,r)=>r.json({ok:true,service:'boilerpro-sa-api',version:'6.0.0'}));

app.post('/api/auth/login',loginLimiter,async(req,res)=>{
 const p=z.object({email:z.string().email().max(254),password:z.string().min(1).max(200)}).safeParse(req.body); if(!p.success)return res.status(400).json({error:'Invalid credentials'});
 const r=await query<any>('SELECT id,email,display_name,password_hash,role,is_active FROM users WHERE email=$1',[p.data.email.toLowerCase()]); const u=r.rows[0];
 if(!u||!u.is_active)return res.status(401).json({error:'Invalid credentials'}); if(!await argon2.verify(u.password_hash,p.data.password))return res.status(401).json({error:'Invalid credentials'});
 const au={id:u.id,email:u.email,displayName:u.display_name,role:u.role}; const accessToken=signAccessToken(au),refreshToken=newRefreshToken();
 await query(`INSERT INTO refresh_sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,NOW()+($4||' days')::interval)`,[crypto.randomUUID(),u.id,hashRefreshToken(refreshToken),Number(process.env.REFRESH_TOKEN_DAYS||30)]);
 await audit(u.id,'LOGIN',null,null,req); setRefreshCookie(res,refreshToken); res.json({accessToken,refreshToken,user:au});
});
app.post('/api/auth/register',loginLimiter,async(req,res)=>{
 const p=z.object({email:z.string().email().max(254),displayName:z.string().min(2).max(120),password:z.string().min(12).max(200)}).safeParse(req.body);
 if(!p.success)return res.status(400).json({error:'Enter a valid name, email and password of at least 12 characters'});
 const email=p.data.email.toLowerCase();
 const exists=await query<any>('SELECT id FROM users WHERE email=$1',[email]);
 if(exists.rows[0])return res.status(409).json({error:'An account with that email already exists'});
 const hash=await argon2.hash(p.data.password,{type:argon2.argon2id});
 const id=crypto.randomUUID();
 await query(`INSERT INTO users(id,email,display_name,password_hash,role,is_active) VALUES($1,$2,$3,$4,'LEARNER',true)`,[id,email,p.data.displayName,hash]);
 const au={id,email,displayName:p.data.displayName,role:'LEARNER'}; const accessToken=signAccessToken(au),refreshToken=newRefreshToken();
 await query(`INSERT INTO refresh_sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,NOW()+($4||' days')::interval)`,[crypto.randomUUID(),id,hashRefreshToken(refreshToken),Number(process.env.REFRESH_TOKEN_DAYS||30)]);
 await audit(id,'REGISTER',null,null,req); setRefreshCookie(res,refreshToken);
 res.status(201).json({accessToken,refreshToken,user:au});
});
app.post('/api/auth/refresh',async(req,res)=>{const supplied=(typeof req.body?.refreshToken==='string'&&req.body.refreshToken.length>40)?req.body.refreshToken:(req as any).cookies?.bp_refresh; const p=z.object({refreshToken:z.string().min(40).max(200)}).safeParse({refreshToken:supplied});if(!p.success)return res.status(401).json({error:'Unauthorized'});
 const r=await query<any>(`SELECT rs.id,rs.user_id,u.email,u.display_name,u.role,u.is_active FROM refresh_sessions rs JOIN users u ON u.id=rs.user_id WHERE rs.token_hash=$1 AND rs.revoked_at IS NULL AND rs.expires_at>NOW()`,[hashRefreshToken(p.data.refreshToken)]);const x=r.rows[0];if(!x||!x.is_active)return res.status(401).json({error:'Unauthorized'});
 const nt=newRefreshToken();await query('UPDATE refresh_sessions SET revoked_at=NOW(),last_used_at=NOW() WHERE id=$1',[x.id]);await query(`INSERT INTO refresh_sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,NOW()+($4||' days')::interval)`,[crypto.randomUUID(),x.user_id,hashRefreshToken(nt),Number(process.env.REFRESH_TOKEN_DAYS||30)]);
 setRefreshCookie(res,nt); res.json({accessToken:signAccessToken({id:x.user_id,email:x.email,displayName:x.display_name,role:x.role}),refreshToken:nt});
});
app.post('/api/auth/logout',requireAuth,async(req,res)=>{const token=typeof req.body?.refreshToken==='string'?req.body.refreshToken:(req as any).cookies?.bp_refresh;if(token)await query('UPDATE refresh_sessions SET revoked_at=NOW() WHERE token_hash=$1 AND user_id=$2',[hashRefreshToken(token),req.user!.id]);res.clearCookie('bp_refresh',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/auth'});await audit(req.user!.id,'LOGOUT',null,null,req);res.json({ok:true});});
app.get('/api/me',requireAuth,(req,res)=>res.json({user:req.user}));

// Learner APIs: published content, server-side progress, quiz attempts and readiness.
app.get('/api/lessons',requireAuth,async(req,res)=>{
 const r=await query<any>(`SELECT l.id,l.slug,l.title,l.angle,l.category,l.image_asset,l.content_json,COALESCE(lp.status,'NOT_STARTED') status,COALESCE(lp.percent,0) percent,lp.last_viewed_at,lp.completed_at FROM lessons l LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$1 WHERE l.is_published=true ORDER BY l.title`,[req.user!.id]);
 res.json({lessons:r.rows});
});
app.get('/api/lessons/:id/questions',requireAuth,async(req,res)=>{const r=await query<any>(`SELECT id,lesson_id,question,options_json,difficulty,explanation FROM practice_questions WHERE lesson_id=$1 AND is_published=true ORDER BY created_at`,[req.params.id]);res.json({questions:r.rows});});
app.post('/api/lessons/:id/progress',requireAuth,async(req,res)=>{
 const p=z.object({percent:z.number().int().min(0).max(100),status:z.enum(['NOT_STARTED','IN_PROGRESS','COMPLETED']).optional()}).safeParse(req.body); if(!p.success)return res.status(400).json({error:'Invalid progress'});
 const lesson=await query<any>('SELECT id FROM lessons WHERE id=$1 AND is_published=true',[req.params.id]); if(!lesson.rows[0])return res.status(404).json({error:'Lesson not found'});
 const status=p.data.percent>=100?'COMPLETED':(p.data.status||'IN_PROGRESS'); const completed=status==='COMPLETED';
 const r=await query<any>(`INSERT INTO lesson_progress(id,user_id,lesson_id,status,percent,last_viewed_at,completed_at) VALUES($1,$2,$3,$4,$5,NOW(),CASE WHEN $4='COMPLETED' THEN NOW() ELSE NULL END) ON CONFLICT(user_id,lesson_id) DO UPDATE SET status=EXCLUDED.status,percent=GREATEST(lesson_progress.percent,EXCLUDED.percent),last_viewed_at=NOW(),completed_at=CASE WHEN EXCLUDED.status='COMPLETED' THEN NOW() ELSE lesson_progress.completed_at END RETURNING *`,[crypto.randomUUID(),req.user!.id,req.params.id,status,p.data.percent]);
 res.json({progress:r.rows[0]});
});
app.post('/api/questions/:id/attempt',requireAuth,async(req,res)=>{
 const p=z.object({selectedIndex:z.number().int().min(0).max(5)}).safeParse(req.body); if(!p.success)return res.status(400).json({error:'Invalid answer'});
 const q=await query<any>('SELECT id,lesson_id,correct_index,explanation FROM practice_questions WHERE id=$1 AND is_published=true',[req.params.id]); const row=q.rows[0]; if(!row)return res.status(404).json({error:'Question not found'});
 const correct=p.data.selectedIndex===row.correct_index; await query(`INSERT INTO question_attempts(id,user_id,question_id,selected_index,is_correct) VALUES($1,$2,$3,$4,$5)`,[crypto.randomUUID(),req.user!.id,row.id,p.data.selectedIndex,correct]);
 res.json({correct,explanation:row.explanation});
});
app.get('/api/dashboard',requireAuth,async(req,res)=>{
 const [lessons,attempts,mocks,recent]=await Promise.all([
  query<any>(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE status='COMPLETED')::int completed,COALESCE(ROUND(AVG(percent)),0)::int avg_percent FROM lesson_progress WHERE user_id=$1`,[req.user!.id]),
  query<any>(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE is_correct)::int correct,COALESCE(ROUND(100.0*AVG(CASE WHEN is_correct THEN 1 ELSE 0 END)),0)::int accuracy FROM question_attempts WHERE user_id=$1`,[req.user!.id]),
  query<any>(`SELECT COUNT(*)::int total,COALESCE(ROUND(AVG(score_percent)),0)::int avg_score,MAX(score_percent)::int best_score FROM mock_attempts WHERE user_id=$1`,[req.user!.id]),
  query<any>(`SELECT id,title,category FROM lessons WHERE is_published=true ORDER BY title LIMIT 6`)
 ]);
 const l=lessons.rows[0],a=attempts.rows[0],m=mocks.rows[0]; const readiness=Math.min(100,Math.round((Number(l.avg_percent||0)*0.4)+(Number(a.accuracy||0)*0.3)+(Number(m.avg_score||0)*0.3)));
 const level=readiness>=85?'TRADE-TEST READY':readiness>=70?'NEARLY READY':readiness>=50?'BUILDING SKILL':'STARTING OUT';
 res.json({lessons:l,attempts:a,mocks:m,readiness,readinessLevel:level,recommended:recent.rows});
});
app.get('/api/readiness',requireAuth,async(req,res)=>{
 const [l,a,m]=await Promise.all([query<any>(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE status='COMPLETED')::int completed,COALESCE(ROUND(AVG(percent)),0)::int avg_percent FROM lesson_progress WHERE user_id=$1`,[req.user!.id]),query<any>(`SELECT COUNT(*)::int total,COALESCE(ROUND(100.0*AVG(CASE WHEN is_correct THEN 1 ELSE 0 END)),0)::int accuracy FROM question_attempts WHERE user_id=$1`,[req.user!.id]),query<any>(`SELECT COUNT(*)::int total,COALESCE(ROUND(AVG(score_percent)),0)::int avg_score,MAX(score_percent)::int best_score FROM mock_attempts WHERE user_id=$1`,[req.user!.id])]);
 const readiness=Math.min(100,Math.round((Number(l.rows[0].avg_percent||0)*0.4)+(Number(a.rows[0].accuracy||0)*0.3)+(Number(m.rows[0].avg_score||0)*0.3)));
 res.json({readiness,lessons:l.rows[0],questions:a.rows[0],mocks:m.rows[0],level:readiness>=85?'TRADE-TEST READY':readiness>=70?'NEARLY READY':readiness>=50?'BUILDING SKILL':'STARTING OUT'});
});
app.get('/api/mock-tests/random',requireAuth,async(_req,res)=>{const r=await query<any>(`SELECT id,lesson_id,question,options_json,difficulty FROM practice_questions WHERE is_published=true ORDER BY random() LIMIT 20`);res.json({questions:r.rows});});
app.post('/api/mock-tests/submit',requireAuth,async(req,res)=>{
 const p=z.object({answers:z.array(z.object({questionId:z.string().uuid(),selectedIndex:z.number().int().min(0).max(5)})).min(1).max(50)}).safeParse(req.body); if(!p.success)return res.status(400).json({error:'Invalid mock test submission'});
 const ids=p.data.answers.map(x=>x.questionId); const r=await query<any>(`SELECT id,correct_index FROM practice_questions WHERE id=ANY($1::uuid[]) AND is_published=true`,[ids]); const byId=new Map(r.rows.map(x=>[x.id,x.correct_index])); let correct=0; for(const a of p.data.answers){if(byId.has(a.questionId)&&byId.get(a.questionId)===a.selectedIndex)correct++;}
 const score=Math.round(100*correct/Math.max(1,r.rows.length)); const id=crypto.randomUUID(); await query(`INSERT INTO mock_attempts(id,user_id,total_questions,correct_answers,score_percent,answers_json) VALUES($1,$2,$3,$4,$5,$6)`,[id,req.user!.id,r.rows.length,correct,score,JSON.stringify(p.data.answers)]);
 res.json({attemptId:id,totalQuestions:r.rows.length,correctAnswers:correct,scorePercent:score,passed:score>=80});
});
app.get('/api/mock-tests/history',requireAuth,async(req,res)=>{const r=await query<any>(`SELECT id,total_questions,correct_answers,score_percent,completed_at FROM mock_attempts WHERE user_id=$1 ORDER BY completed_at DESC LIMIT 20`,[req.user!.id]);res.json({attempts:r.rows});});\napp.get('/api/practical-scenarios',requireAuth,async(_req,res)=>{const r=await query<any>(`SELECT id,slug,title,category,duration_minutes,instructions_json,rubric_json FROM practical_scenarios WHERE is_published=true ORDER BY title`);res.json({scenarios:r.rows});});
app.post('/api/practical-scenarios/:id/submit',requireAuth,async(req,res)=>{const p=z.object({scorePercent:z.number().int().min(0).max(100),elapsedSeconds:z.number().int().min(0).max(10800),checklist:z.array(z.boolean()).max(30)}).safeParse(req.body);if(!p.success)return res.status(400).json({error:'Invalid practical attempt'});const s=await query<any>('SELECT id FROM practical_scenarios WHERE id=$1 AND is_published=true',[req.params.id]);if(!s.rows[0])return res.status(404).json({error:'Scenario not found'});const id=crypto.randomUUID();await query(`INSERT INTO practical_attempts(id,user_id,scenario_id,score_percent,elapsed_seconds,checklist_json) VALUES($1,$2,$3,$4,$5,$6)`,[id,req.user!.id,req.params.id,p.data.scorePercent,p.data.elapsedSeconds,JSON.stringify(p.data.checklist)]);res.json({attemptId:id,scorePercent:p.data.scorePercent,passed:p.data.scorePercent>=80});});
app.get('/api/practical-scenarios/history',requireAuth,async(req,res)=>{const r=await query<any>(`SELECT p.id,p.score_percent,p.elapsed_seconds,p.completed_at,s.title FROM practical_attempts p JOIN practical_scenarios s ON s.id=p.scenario_id WHERE p.user_id=$1 ORDER BY p.completed_at DESC LIMIT 20`,[req.user!.id]);res.json({attempts:r.rows});});
app.post('/api/tutor/ask',requireAuth,async(req,res)=>{const p=z.object({question:z.string().min(2).max(1000)}).safeParse(req.body);if(!p.success)return res.status(400).json({error:'Enter a training question'});const q=p.data.question.toLowerCase();let answer='Use the job drawing/specification and your approved workplace procedure first. BoilerPro SA can help you practise the underlying fabrication principle, but it does not replace an instructor, trade-test assessor or job specification.';if(q.includes('mean diameter')||q.includes('circumference'))answer='For the BoilerPro SA fabrication principle, use mean diameter: MD = (OD + ID) ÷ 2, then circumference C = MD × π. Example: OD 150 mm and ID 140 mm gives MD 145 mm and C ≈ 455.3 mm using π ≈ 3.142.';else if(q.includes('bend')&&q.includes('line'))answer='For equally spaced divisions around a 360° development: angle per bend-line division = 360° ÷ number of equally spaced bend lines. 12 lines = 30°; 24 lines = 15°. Check the actual job specification and approved method for allowances and tolerances.';else if(q.includes('inside')||q.includes('bending machine'))answer='For the BoilerPro SA training principle, when a bending-machine job specifies an inside dimension, use the specified inside size as the reference for bending set-out and final dimensional checking.';else if(q.includes('60')&&q.includes('pipe'))answer='For the PVW 2-3 60° exercise: main pipe OD 323 mm, ID 309 mm gives MD 316 mm and circumference ≈ 992.7 mm. Branch OD 168 mm, ID 154 mm gives MD 161 mm and circumference ≈ 505.9 mm. Transfer the required profile points from the mean-diameter reference to the main-pipe development.';else if(q.includes('cone')||q.includes('90'))answer='For the 90° cone/off-set pipe exercise: cone D1 200 mm, D2 400 mm, H 600 mm gives MD 300 mm and circumference ≈ 942.6 mm. Cone slant height is about 608.3 mm. The pipe OD 150 mm and ID 140 mm gives MD 145 mm and circumference ≈ 455.3 mm.';
 if(process.env.TUTOR_PROVIDER==='openai' && process.env.OPENAI_API_KEY){try{const rr=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-6-luna',instructions:'You are BoilerPro SA Tutor, a South African boilermaking training assistant. Stay within boilermaking fabrication, measuring, marking, calculations, cutting/forming, tools/materials, safety, inspection and trade-test preparation. Do not teach welding or engineering drawing. Treat user-supplied fabrication principles as training principles and tell learners to verify job specifications and approved procedures. Be concise and educational.',input:p.data.question})});const data:any=await rr.json();if(rr.ok&&typeof data.output_text==='string'&&data.output_text.trim())answer=data.output_text.trim();}catch{}};await query(`INSERT INTO tutor_logs(id,user_id,question,answer) VALUES($1,$2,$3,$4)`,[crypto.randomUUID(),req.user!.id,p.data.question,answer]);res.json({answer});});


// Admin/instructor dashboard
app.get('/api/admin/dashboard',requireAuth,requireRole('ADMIN','INSTRUCTOR'),async(_req,res)=>{
 const [lessons,users,questions,auditRows]=await Promise.all([
  query<any>('SELECT COUNT(*)::int count,COUNT(*) FILTER (WHERE is_published)::int published FROM lessons'),
  query<any>(`SELECT COUNT(*)::int total,COUNT(*) FILTER (WHERE role='LEARNER')::int learners,COUNT(*) FILTER (WHERE role='INSTRUCTOR')::int instructors,COUNT(*) FILTER (WHERE role='ADMIN')::int admins FROM users`),
  query<any>('SELECT COUNT(*)::int count,COUNT(*) FILTER (WHERE is_published)::int published FROM practice_questions'),
  query<any>('SELECT id,action,target_type,target_id,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10')
 ]); res.json({lessons:lessons.rows[0],users:users.rows[0],questions:questions.rows[0],recentAudit:auditRows.rows});
});
app.get('/api/admin/lessons',requireAuth,requireRole('ADMIN','INSTRUCTOR'),async(_q,res)=>{const r=await query<any>('SELECT id,slug,title,angle,category,image_asset,content_json,is_published,updated_at FROM lessons ORDER BY title');res.json({lessons:r.rows});});

const lessonSchema=z.object({slug:z.string().regex(/^[a-z0-9-]+$/).max(120),title:z.string().min(1).max(200),angle:z.number().int().min(0).max(360).nullable().optional(),category:z.string().min(1).max(100),content_json:z.record(z.any()),image_asset:z.string().max(500).nullable().optional(),is_published:z.boolean().optional()});
app.post('/api/admin/lessons',requireAuth,requireRole('ADMIN','INSTRUCTOR'),async(req,res)=>{const p=lessonSchema.safeParse(req.body);if(!p.success)return res.status(400).json({error:'Invalid lesson'});const d=p.data;const id=crypto.randomUUID();
 const r=await query<any>(`INSERT INTO lessons(id,slug,title,angle,category,image_asset,content_json,is_published,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[id,d.slug,d.title,d.angle??null,d.category,d.image_asset??null,JSON.stringify(d.content_json),d.is_published??false,req.user!.id]);await audit(req.user!.id,'LESSON_CREATE','lesson',id,req);res.status(201).json({lesson:r.rows[0]});});
app.put('/api/admin/lessons/:id',requireAuth,requireRole('ADMIN','INSTRUCTOR'),async(req,res)=>{const p=lessonSchema.partial().safeParse(req.body);if(!p.success)return res.status(400).json({error:'Invalid lesson update'});const d=p.data;const f:string[]=[],v:any[]=[];let i=1;for(const [k,val] of Object.entries(d)){if(val===undefined)continue;const col=k==='content_json'?'content_json':k;f.push(`${col}=$${i++}`);v.push(k==='content_json'?JSON.stringify(val):val)}if(!f.length)return res.status(400).json({error:'Nothing to update'});f.push(`updated_by=$${i++}`,`updated_at=NOW()`);v.push(req.user!.id,req.params.id);const r=await query<any>(`UPDATE lessons SET ${f.join(',')} WHERE id=$${i} RETURNING *`,v);if(!r.rows[0])return res.status(404).json({error:'Lesson not found'});await audit(req.user!.id,'LESSON_UPDATE','lesson',req.params.id,req);res.json({lesson:r.rows[0]});});
app.delete('/api/admin/lessons/:id',requireAuth,requireRole('ADMIN'),async(req,res)=>{const r=await query<any>('DELETE FROM lessons WHERE id=$1 RETURNING id',[req.params.id]);if(!r.rows[0])return res.status(404).json({error:'Lesson not found'});await audit(req.user!.id,'LESSON_DELETE','lesson',req.params.id,req);res.json({ok:true});});
app.post('/api/admin/lessons/:id/image',requireAuth,requireRole('ADMIN','INSTRUCTOR'),upload.single('image'),async(req,res)=>{if(!req.file)return res.status(400).json({error:'Image required'});const asset=`/uploads/${req.file.filename}`;const r=await query<any>('UPDATE lessons SET image_asset=$1,updated_by=$2,updated_at=NOW() WHERE id=$3 RETURNING id,image_asset',[asset,req.user!.id,req.params.id]);if(!r.rows[0])return res.status(404).json({error:'Lesson not found'});await audit(req.user!.id,'LESSON_IMAGE_UPLOAD','lesson',req.params.id,req,{asset});res.json({lesson:r.rows[0]});});

const qSchema=z.object({lesson_id:z.string().uuid(),question:z.string().min(1).max(1000),options_json:z.array(z.string().min(1).max(300)).min(2).max(6),correct_index:z.number().int().min(0).max(5),explanation:z.string().max(2000).default(''),difficulty:z.enum(['EASY','MEDIUM','HARD']).default('MEDIUM'),is_published:z.boolean().default(false)}).refine(x=>x.correct_index<x.options_json.length,{path:['correct_index'],message:'Correct answer must match an option'});
app.get('/api/admin/questions',requireAuth,requireRole('ADMIN','INSTRUCTOR'),async(_req,res)=>{const r=await query<any>(`SELECT q.*,l.title lesson_title FROM practice_questions q JOIN lessons l ON l.id=q.lesson_id ORDER BY q.created_at DESC`);res.json({questions:r.rows});});
app.post('/api/admin/questions',requireAuth,requireRole('ADMIN','INSTRUCTOR'),async(req,res)=>{const p=qSchema.safeParse(req.body);if(!p.success)return res.status(400).json({error:'Invalid question'});const d=p.data,id=crypto.randomUUID();const r=await query<any>(`INSERT INTO practice_questions(id,lesson_id,question,options_json,correct_index,explanation,difficulty,is_published,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING *`,[id,d.lesson_id,d.question,JSON.stringify(d.options_json),d.correct_index,d.explanation,d.difficulty,d.is_published,req.user!.id]);await audit(req.user!.id,'QUESTION_CREATE','question',id,req);res.status(201).json({question:r.rows[0]});});
app.put('/api/admin/questions/:id',requireAuth,requireRole('ADMIN','INSTRUCTOR'),async(req,res)=>{const p=qSchema.partial().safeParse(req.body);if(!p.success)return res.status(400).json({error:'Invalid question update'});const d=p.data;const f:string[]=[],v:any[]=[];let i=1;for(const [k,val] of Object.entries(d)){if(val===undefined)continue;f.push(`${k}=$${i++}`);v.push(k==='options_json'?JSON.stringify(val):val)}f.push(`updated_by=$${i++}`,`updated_at=NOW()`);v.push(req.user!.id,req.params.id);const r=await query<any>(`UPDATE practice_questions SET ${f.join(',')} WHERE id=$${i} RETURNING *`,v);if(!r.rows[0])return res.status(404).json({error:'Question not found'});await audit(req.user!.id,'QUESTION_UPDATE','question',req.params.id,req);res.json({question:r.rows[0]});});
app.delete('/api/admin/questions/:id',requireAuth,requireRole('ADMIN'),async(req,res)=>{const r=await query<any>('DELETE FROM practice_questions WHERE id=$1 RETURNING id',[req.params.id]);if(!r.rows[0])return res.status(404).json({error:'Question not found'});await audit(req.user!.id,'QUESTION_DELETE','question',req.params.id,req);res.json({ok:true});});

app.get('/api/admin/users',requireAuth,requireRole('ADMIN'),async(_req,res)=>{const r=await query<any>('SELECT id,email,display_name,role,is_active,created_at,updated_at FROM users ORDER BY created_at DESC');res.json({users:r.rows});});
app.put('/api/admin/users/:id',requireAuth,requireRole('ADMIN'),async(req,res)=>{const p=z.object({role:z.enum(['ADMIN','INSTRUCTOR','LEARNER']).optional(),is_active:z.boolean().optional(),display_name:z.string().min(1).max(120).optional()}).safeParse(req.body);if(!p.success)return res.status(400).json({error:'Invalid user update'});if(req.params.id===req.user!.id&&p.data.is_active===false)return res.status(400).json({error:'You cannot deactivate your own account'});const f:string[]=[],v:any[]=[];let i=1;for(const [k,val] of Object.entries(p.data)){if(val!==undefined){f.push(`${k}=$${i++}`);v.push(val)}}if(!f.length)return res.status(400).json({error:'Nothing to update'});f.push(`updated_at=NOW()`);v.push(req.params.id);const r=await query<any>(`UPDATE users SET ${f.join(',')} WHERE id=$${i} RETURNING id,email,display_name,role,is_active,updated_at`,v);if(!r.rows[0])return res.status(404).json({error:'User not found'});await audit(req.user!.id,'USER_UPDATE','user',req.params.id,req,{changes:p.data});res.json({user:r.rows[0]});});

app.get('/api/admin/practical-attempts',requireAuth,requireRole('ADMIN','INSTRUCTOR'),async(_req,res)=>{const r=await query<any>(`SELECT p.id,u.display_name,u.email,s.title,p.score_percent,p.elapsed_seconds,p.completed_at FROM practical_attempts p JOIN users u ON u.id=p.user_id JOIN practical_scenarios s ON s.id=p.scenario_id ORDER BY p.completed_at DESC LIMIT 200`);res.json({attempts:r.rows});});
app.get('/api/admin/progress',requireAuth,requireRole('ADMIN','INSTRUCTOR'),async(_req,res)=>{
 const r=await query<any>(`SELECT u.id,u.display_name,u.email,COALESCE((SELECT ROUND(AVG(percent))::int FROM lesson_progress WHERE user_id=u.id),0)::int lesson_percent,COALESCE((SELECT COUNT(*)::int FROM lesson_progress WHERE user_id=u.id AND status='COMPLETED'),0)::int completed_lessons,COALESCE((SELECT ROUND(100.0*AVG(CASE WHEN is_correct THEN 1 ELSE 0 END))::int FROM question_attempts WHERE user_id=u.id),0)::int quiz_accuracy,COALESCE((SELECT MAX(score_percent)::int FROM mock_attempts WHERE user_id=u.id),0)::int best_mock FROM users u WHERE u.role='LEARNER' ORDER BY u.display_name`);
 res.json({learners:r.rows});
});
app.get('/api/admin/audit',requireAuth,requireRole('ADMIN'),async(req,res)=>{const limit=Math.min(Number(req.query.limit||100),500);const r=await query<any>(`SELECT a.*,u.email,u.display_name FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT $1`,[limit]);res.json({logs:r.rows});});

// Learner UI is served from the same origin.
const learnerDir=path.resolve(process.env.LEARNER_UI_DIR||path.join(process.cwd(),'public/learner'));
app.use('/',express.static(learnerDir));
// Admin UI is served by the same origin, reducing CORS exposure in production.
app.use('/admin',express.static(adminDir));
app.use('/uploads',express.static(uploadDir,{fallthrough:false}));
app.use((_e:any,_q:any,res:any,_n:any)=>res.status(500).json({error:'Internal server error'}));
app.listen(Number(process.env.PORT||8443),()=>console.log('BoilerPro SA v4 API ready'));
