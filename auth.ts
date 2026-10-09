import crypto from 'node:crypto'; import jwt from 'jsonwebtoken'; import {Request,Response,NextFunction} from 'express'; import {query} from './db.js';
const SECRET=process.env.JWT_SECRET; if(!SECRET||SECRET.length<32) throw new Error('JWT_SECRET must be at least 32 characters');
export type AuthUser={id:string,email:string,displayName:string,role:string};
export const signAccessToken=(u:AuthUser)=>jwt.sign({sub:u.id,email:u.email,role:u.role},SECRET,{expiresIn:`${Number(process.env.ACCESS_TOKEN_MINUTES||15)}m`,issuer:'boilerpro-sa-api',audience:'boilerpro-sa'});
export const newRefreshToken=()=>crypto.randomBytes(48).toString('base64url');
export const hashRefreshToken=(t:string)=>crypto.createHash('sha256').update(t).digest('hex');
export async function requireAuth(req:Request,res:Response,next:NextFunction){
 try{const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) return res.status(401).json({error:'Unauthorized'});
 const p=jwt.verify(h.slice(7),SECRET,{issuer:'boilerpro-sa-api',audience:'boilerpro-sa'}) as any;
 const r=await query<any>('SELECT id,email,display_name,role,is_active FROM users WHERE id=$1',[p.sub]); const u=r.rows[0];
 if(!u||!u.is_active)return res.status(401).json({error:'Unauthorized'});
 req.user={id:u.id,email:u.email,displayName:u.display_name,role:u.role}; next();}catch{return res.status(401).json({error:'Unauthorized'});}
}
export const requireRole=(...roles:string[])=> (req:Request,res:Response,next:NextFunction)=>req.user&&roles.includes(req.user.role)?next():res.status(403).json({error:'Forbidden'});
declare global{namespace Express{interface Request{user?:AuthUser}}}
