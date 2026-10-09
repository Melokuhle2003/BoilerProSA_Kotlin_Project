import crypto from 'node:crypto'; import argon2 from 'argon2'; import {query,pool} from '../db.js';
const email=process.env.ADMIN_EMAIL?.trim().toLowerCase(), name=process.env.ADMIN_NAME?.trim(), password=process.env.ADMIN_PASSWORD;
if(!email||!name||!password) throw new Error('ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD are required');
if(password.length<15) throw new Error('Admin password must be at least 15 characters');
const hash=await argon2.hash(password,{type:argon2.argon2id});
await query(`INSERT INTO users(id,email,display_name,password_hash,role) VALUES($1,$2,$3,$4,'ADMIN')
ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name,password_hash=EXCLUDED.password_hash,role='ADMIN',is_active=TRUE,updated_at=NOW()`,
[crypto.randomUUID(),email,name,hash]); console.log('Admin account ready:',email); await pool.end();
