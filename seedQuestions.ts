import 'dotenv/config'; import crypto from 'node:crypto'; import {query,pool} from '../db.js';
const lessons=await query<any>(`SELECT id,slug FROM lessons WHERE slug IN ('cone-offset-90','round-square-60-pvw-2-3')`); const bySlug=new Map(lessons.rows.map(x=>[x.slug,x.id]));
const qs=[
 {slug:'cone-offset-90',question:'For the cone with D1 = 200 mm and D2 = 400 mm, what is the mean diameter?',options:['200 mm','300 mm','400 mm','600 mm'],correct_index:1,explanation:'Mean diameter = (D1 + D2) ÷ 2 = (200 + 400) ÷ 2 = 300 mm.',difficulty:'EASY'},
 {slug:'cone-offset-90',question:'Using π = 3.142, what circumference follows from a 300 mm mean diameter?',options:['628.4 mm','942.6 mm','1 200 mm','1 884 mm'],correct_index:1,explanation:'C = MD × π = 300 × 3.142 = 942.6 mm.',difficulty:'EASY'},
 {slug:'round-square-60-pvw-2-3',question:'For the 60° lesson, the main pipe OD is 323 mm and ID is 299 mm. What is the mean diameter?',options:['299 mm','311 mm','323 mm','622 mm'],correct_index:1,explanation:'MD = (323 + 299) ÷ 2 = 311 mm.',difficulty:'EASY'},
 {slug:'round-square-60-pvw-2-3',question:'What is the bend-line division angle when a 360° development is divided into 24 equal bend lines?',options:['10°','12°','15°','24°'],correct_index:2,explanation:'360° ÷ 24 = 15° per equal division.',difficulty:'MEDIUM'}
];
for(const q of qs){const lessonId=bySlug.get(q.slug);if(!lessonId)continue;await query(`INSERT INTO practice_questions(id,lesson_id,question,options_json,correct_index,explanation,difficulty,is_published) VALUES($1,$2,$3,$4,$5,$6,$7,true) ON CONFLICT DO NOTHING`,[crypto.randomUUID(),lessonId,q.question,JSON.stringify(q.options),q.correct_index,q.explanation,q.difficulty]);}
await pool.end(); console.log('Practice questions seeded');
