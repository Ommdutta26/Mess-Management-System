import {useState} from 'react';import {api,useLoad} from './api.js';import {useCtx} from './ctx.js';import {money} from './util.js';

export function Notice(){const{run}=useCtx(),[f,setF]=useState({text:'',category:'General',target:'All',expiresAt:''});
 return<div className="card"><h3>Post a Notice</h3>
 <div className="grid g2">
  <label>Text<textarea value={f.text} onChange={e=>setF({...f,text:e.target.value})} placeholder="Write notice here..."/></label>
  <div className="grid g2">
   <label>Category<select value={f.category} onChange={e=>setF({...f,category:e.target.value})}>
    <option>General</option><option>Urgent</option><option>Menu</option>
   </select></label>
   <label>Target<input value={f.target} onChange={e=>setF({...f,target:e.target.value})} placeholder="All or Room (e.g. 101)"/></label>
  </div>
  <label>Expires At<input type="date" value={f.expiresAt} onChange={e=>setF({...f,expiresAt:e.target.value})}/></label>
  <button className="btn g" onClick={async()=>{if(await run(()=>api('/notices',{method:'POST',body:f}),'Notice posted successfully.')){setF({text:'',category:'General',target:'All',expiresAt:''})}}}>Post Notice</button>
 </div></div>;
}

export function Inventory(){const{run}=useCtx(),[inv,reload]=useLoad('/admin/inventory'),[f,setF]=useState({item:'',qty:'',min:''});
 const edit=x=>{setF({item:x.item,qty:x.qty,min:x.min})};
 return<div className="grid g1"><div className="card"><h3>{f.item?'Edit Item':'Manage Inventory'}</h3>
  <div className="grid g3">
   <label>Item name<input value={f.item} onChange={e=>setF({...f,item:e.target.value})} placeholder="Item name"/></label>
   <label>Quantity<input type="number" value={f.qty} onChange={e=>setF({...f,qty:e.target.value})} placeholder="Quantity"/></label>
   <label>Min threshold<input type="number" value={f.min} onChange={e=>setF({...f,min:e.target.value})} placeholder="Min threshold"/></label>
  </div>
  <div style={{display:'flex',gap:8,marginTop:12}}>
   <button className="btn g" onClick={async()=>{if(await run(()=>api('/admin/inventory',{method:'POST',body:f}),'Inventory updated.')){setF({item:'',qty:'',min:''});reload()}}}>Save Stock</button>
   {f.item&&<button className="btn ghost" onClick={()=>setF({item:'',qty:'',min:''})}>Cancel</button>}
  </div>
 </div>
 <div className="card" style={{marginTop:18}}><h3>Current Stock</h3>
  <div className="tbl"><table><tbody><tr><th>Item</th><th>Qty</th><th>Min</th><th>Status</th><th></th></tr>
  {inv?.map(x=><tr key={x._id}><td>{x.item}</td><td>{x.qty}</td><td>{x.min}</td><td><span className={x.qty<=x.min?'pill neg':'pill resolved'}>{x.qty<=x.min?'Low Stock':'OK'}</span></td>
  <td><div className="grid g2" style={{gap:4}}><button className="btn ghost sm" onClick={()=>edit(x)}>Edit</button><button className="btn ghost sm" onClick={async()=>{if(confirm('Delete '+x.item+'?')){if(await run(()=>api(`/admin/inventory/${x._id}`,{method:'DELETE'}),'Item removed.'))reload()}}} style={{color:'var(--neg)'}}>Delete</button></div></td></tr>)}</tbody></table></div></div></div>;
}

export function FeedbackPage(){const{run}=useCtx(),[d,rd]=useLoad('/feedback');
 return<div className="card"><h3>Student Feedback</h3>
  <div className="grid g2">
   <div className="card"><h3>Ratings by Meal</h3>{d?.avg.map(x=><div className="tx" key={x._id}><span>{x._id}</span><b>⭐ {x.avg.toFixed(1)}</b> <small>({x.n} reviews)</small></div>)}</div>
   <div className="card"><h3>Recent Comments</h3>{d?.recent.map(x=><div className="tx" key={x._id}><div className="grid g2" style={{gap:4}}><b>{x.meal}</b> <span>{'⭐'.repeat(x.stars)}</span></div><p>{x.text}</p><small>{x.name}</small></div>)}</div>
  </div></div>;
}

export function Overview(){const{run}=useCtx(),[o,ro]=useLoad('/admin/overview'),[tp,rtp]=useLoad('/topups'),[st,rst]=useLoad('/admin/students'),[q,setQ]=useState('');

 const all=()=>{ro();rtp();rst()},mx=Math.max(1,...(o?.plates||[]).map(p=>p.expected)),pend=tp?.filter(x=>x.status==='pending')||[];
 const decide=async(id,status)=>{if(await run(()=>api(`/topups/${id}/decide`,{method:'POST',body:{status}}),status==='approved'?'Approved. Wallet credited.':'Request rejected.'))all()};
 const act=async(fn,ok)=>{if(await run(fn,ok))all()};
 return<><div className="grid g4" style={{marginBottom:18}}>
  <div className="card stat g"><small>Active students</small><span className="big">{o?.students??'–'}</span></div>
  <div className="card stat"><small>Wallet money held</small><span className="big">{money(o?.held||0)}</span></div>
  <div className="card stat o"><small>Low balance (under ₹300)</small><span className="big">{o?.low??'–'}</span></div>
  <div className="card stat"><small>Pending top-ups</small><span className="big">{o?.pending??'–'}</span></div></div>
 <div className="grid g2"><div className="card"><h3>Expected plates today</h3><p className="legend">Served out of expected. Cook to the expected number to cut waste.</p>
  <div className="bars">{o?.plates.map(p=><div className="bar" key={p.meal}><span>{p.meal}</span><i style={{'--w':p.expected/mx*100+'%'}}/><b>{p.served}/{p.expected}</b></div>)}</div></div>
 <div className="card"><h3>Top-up requests</h3>{pend.length?pend.map(x=><div className="tx" key={x._id}><span><b>{x.name}</b> · {money(x.amount)}<br/><small>Ref {x.ref}</small></span>
  <span><button className="btn g sm" onClick={()=>decide(x._id,'approved')}>Approve</button> <button className="btn ghost sm" onClick={()=>decide(x._id,'rejected')}>Reject</button></span></div>):<p className="legend">No pending requests.</p>}</div>
 <div className="card" style={{gridColumn:'1/-1'}}><h3>Students</h3><input placeholder="Search by name, ID or room" value={q} onChange={e=>setQ(e.target.value)}/>
  <div className="tbl"><table><tbody><tr><th>ID</th><th>Name</th><th>Room</th><th>Diet</th><th>Balance</th><th>Status</th><th></th></tr>
  {st?.filter(x=>(x.rollNo+x.name+x.room).toLowerCase().includes(q.toLowerCase())).map(x=><tr key={x.rollNo}><td>{x.rollNo}</td><td>{x.name}</td><td>{x.room}</td>
   <td><span className="pill">{x.diet}</span>{x.dietRequest&&<button className="btn g sm" style={{marginLeft:4}} onClick={()=>act(()=>api(`/admin/diet/approve/${x._id}`,{method:'POST'}),'Diet approved.')}>Approve {x.dietRequest}</button>}</td>
   <td className={x.balance<300?'neg':''}>{money(x.balance)}</td><td><span className={'pill '+(x.active?'resolved':'open')}>{x.active?'active':'suspended'}</span></td>
   <td><button className="btn ghost sm" onClick={()=>act(()=>api(`/admin/students/${x.rollNo}/credit`,{method:'POST',body:{amount:500}}),'₹500 credited.')}>Cash ₹500</button> <button className="btn ghost sm" onClick={()=>act(()=>api(`/admin/students/${x.rollNo}/toggle`,{method:'POST'}),'Status updated.')}>{x.active?'Suspend':'Activate'}</button></td></tr>)}</tbody></table></div></div></div></>}

export function Counter(){const{cfg,run}=useCtx(),names=Object.keys(cfg.meals),[q,setQ]=useState(''),[log,rl]=useLoad('/counter/today');
 const h=new Date().getHours()+new Date().getMinutes()/60,[meal,setMeal]=useState(names.find(m=>h<cfg.meals[m].end)||names[0]);
 const serve=async()=>{if(await run(()=>api('/counter/serve',{method:'POST',body:{query:q,meal}}),'Meal marked as eaten and charged.')){setQ('');rl()}};
 return<div className="grid g2"><div className="card"><h3>Serve a meal</h3><p className="legend">Type the roll number or paste the pass code. The meal price is taken from the wallet.</p>
 <label>Roll number<input autoFocus value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&serve()} placeholder="B2024CSE045"/></label>
 <label>Meal<select value={meal} onChange={e=>setMeal(e.target.value)}>{names.map(m=><option key={m}>{m}</option>)}</select></label><button className="btn g" onClick={serve}>Mark as eaten</button></div>
 <div className="card"><h3>Served today</h3>{log?.length?log.map(x=><div className="tx" key={x._id}><span><b>{x.name}</b> · {x.meal}<br/><small>{new Date(x.createdAt).toLocaleTimeString()}</small></span><b>{money(x.price)}</b></div>):<p className="legend">Nobody served yet today.</p>}</div></div>}

export function Records(){const[a]=useLoad('/admin/audit');
 return<div className="card"><h3>Audit log</h3><div className="tbl"><table><tbody><tr><th>When</th><th>Who</th><th>Action</th></tr>{a?.map(x=><tr key={x._id}><td>{new Date(x.createdAt).toLocaleString()}</td><td>{x.who}</td><td>{x.action}</td></tr>)}</tbody></table></div></div>}
