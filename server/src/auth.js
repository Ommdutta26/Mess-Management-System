import jwt from 'jsonwebtoken';
import {User,Audit} from './models.js';import {PERM} from './config.js';
export const bad=(m,c=400)=>{throw Object.assign(new Error(m),{status:c})};
export const sign=u=>jwt.sign({id:u._id},process.env.JWT_SECRET,{expiresIn:'8h'});
export const auth=async(q,s,n)=>{try{const p=jwt.verify((q.headers.authorization||'').replace('Bearer ',''),process.env.JWT_SECRET),u=await User.findById(p.id);if(!u||!u.active)throw 0;q.user=u;n()}catch{s.status(401).json({error:'Please sign in again.'})}};
export const can=p=>(q,s,n)=>q.user.role==='staff'&&PERM[q.user.level].includes(p)?n():s.status(403).json({error:'You do not have access to this.'});
export const log=(u,action)=>Audit.create({who:`${u.name} (${u.rollNo})`,action});
