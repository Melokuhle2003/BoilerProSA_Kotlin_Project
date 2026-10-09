import pg from 'pg'; import 'dotenv/config';
export const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:10,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:true}:false});
export async function query<T=any>(text:string,params:any[]=[]){return pool.query<T>(text,params);}
