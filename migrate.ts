import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pool, query} from '../db.js';
const dir=path.dirname(fileURLToPath(import.meta.url));
for(const f of ['001_init.sql','002_v3_admin.sql','003_v4_learner_progress.sql','004_v6_trade_simulator.sql']){
  const sql=fs.readFileSync(path.join(dir,'../../sql',f),'utf8');
  await query(sql);
}
await pool.end();
console.log('Database migrations complete');
