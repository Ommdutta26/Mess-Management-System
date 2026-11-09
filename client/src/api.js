import {useEffect,useState} from 'react';
let token=localStorage.getItem('tok');
export const setToken=t=>{token=t;t?localStorage.setItem('tok',t):localStorage.removeItem('tok')};
export async function api(path,{method='GET',body}={}){
 const r=await fetch('/api'+path,{method,headers:{'Content-Type':'application/json',...(token&&{Authorization:'Bearer '+token})},body:body&&JSON.stringify(body)});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Request failed.');return d}
export function useLoad(path){const[d,setD]=useState(null),[n,setN]=useState(0);
 useEffect(()=>{let on=true;api(path).then(x=>on&&setD(x)).catch(()=>{});return()=>{on=false}},[path,n]);return[d,()=>setN(x=>x+1)]}
