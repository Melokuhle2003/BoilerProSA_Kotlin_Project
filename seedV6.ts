import 'dotenv/config';
import crypto from 'node:crypto';
import {query,pool} from '../db.js';
const rows=[
 {slug:'cone-offset-90-practical',title:'Cone with Off-Set Intersection Pipe — 90°',category:'FABRICATION',duration:45,instructions:['Review the given cone and pipe dimensions.','Calculate mean diameters and circumferences.','Develop the cone and intersection profile.','Check dimensions and fit before final fabrication.'],rubric:['Mean diameter and circumference calculated correctly','Development points transferred correctly','Inside dimensions used for bending-machine work','Final dimensions and fit checked']},
 {slug:'round-square-60-pvw-2-3',title:'Round Pipe with Off-Set Square Pipe — 60° (PVW 2-3)',category:'PRACTICAL TRADE TEST',duration:60,instructions:['Calculate main and branch mean diameters.','Establish the mean-diameter reference.','Transfer profile points to the development.','Join the points and verify the opening profile.','Complete dimensional and quality checks.'],rubric:['Mean diameter rule applied','60° geometry laid out correctly','Profile transferred accurately','Measurements verified before fabrication','Safety and quality checks completed']}
];
for(const s of rows){await query(`INSERT INTO practical_scenarios(id,slug,title,category,duration_minutes,instructions_json,rubric_json,is_published) VALUES($1,$2,$3,$4,$5,$6,$7,true) ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,category=EXCLUDED.category,duration_minutes=EXCLUDED.duration_minutes,instructions_json=EXCLUDED.instructions_json,rubric_json=EXCLUDED.rubric_json,is_published=true`,[crypto.randomUUID(),s.slug,s.title,s.category,s.duration,JSON.stringify(s.instructions),JSON.stringify(s.rubric)]);}
await pool.end();
console.log('v6 practical scenarios seeded');
