import {Router} from 'express';import bcrypt from 'bcryptjs';
import {User,Menu,Topup,Served,Feedback,Notice,Audit,Notification,DietRequest,Inventory} from './models.js';
import {MEALS,DAYS,ymd} from './config.js';import {auth,can,sign,bad,log} from './auth.js';
const r=Router(),MIN=()=>+process.env.MIN_BALANCE||0;
const pub=u=>({id:u.rollNo,name:u.name,room:u.room,role:u.role,level:u.level,diet:u.diet,balance:u.balance});
const hash=p=>bcrypt.hash(p,10);

const notify=async(uId,m,t='General')=>await Notification.create({user:uId,message:m,type:t});

/* auth */
r.post('/auth/register',async(q,s)=>{const{id,name,room,password}=q.body;
 if(!/^[A-Za-z0-9]{6,14}$/.test(id||''))bad('Roll number should be 6 to 14 letters or digits.');if(String(name||'').trim().length<2)bad('Enter your full name.');if(String(password||'').length<6)bad('Password needs at least 6 characters.');
 if(await User.exists({rollNo:id.toUpperCase()}))bad('This roll number already has an account.',409);
 const u=await User.create({rollNo:id,name:name.trim(),room:String(room||'Hostel').slice(0,60),password:await hash(password)});s.status(201).json({token:sign(u),user:pub(u)})});
r.post('/auth/login',async(q,s)=>{const{id,password,staff}=q.body,u=await User.findOne({rollNo:String(id||'').toUpperCase()}).select('+password');
 if(!u||u.role!==(staff?'staff':'student')||!(await bcrypt.compare(String(password||''),u.password)))bad('ID or password is incorrect.',401);
 if(!u.active)bad('This account is suspended.',403);s.json({token:sign(u),user:pub(u)})});
r.get('/me',auth,(q,s)=>s.json(pub(q.user)));
r.get('/config',(q,s)=>s.json({meals:MEALS,days:DAYS,minBalance:MIN()}));

/* menu + notices */
r.get('/menu',auth,async(q,s)=>{const m={};(await Menu.find()).forEach(x=>(m[x.day]??={})[x.meal]=x.items);s.json(m)});
r.put('/menu',auth,can('head'),async(q,s)=>{const{day,meal,items}=q.body;if(!DAYS.includes(day)||!MEALS[meal]||!Array.isArray(items)||!items.length)bad('Invalid menu.');
 await Menu.updateOne({day,meal},{items:items.map(x=>String(x).slice(0,60))},{upsert:true});await log(q.user,`Edited ${day} ${meal} menu`);s.json({ok:true})});
r.get('/notices',auth,async(q,s)=>{
	const now=new Date();
	const notices=await Notice.find({
		$or:[{target:'All'},{target:q.user.room}],
		$or:[{expiresAt:{$exists:false}},{expiresAt:{$gt:now}}]
	}).sort('-createdAt');
	s.json(notices)
});
r.post('/notices',auth,can('head'),async(q,s)=>{
	const{text,category,target,expiresAt}=q.body;
	const t=String(text||'').trim().slice(0,160);
	if(!t)bad('Write a notice first.');
	await Notice.create({text:t,category,target,expiresAt:expiresAt?new Date(expiresAt):undefined});
	await log(q.user,`Posted notice: ${t.slice(0,50)}`);
			if(category==='Urgent')await Notification.createMany(await User.find({role:'student'}).select('_id').then(u=>u.map(x=>({user:x._id,message:`Urgent Notice: ${t.slice(0,30)}...`,type:'Notice'}))));
	s.status(201).json({ok:true})});

/* skips */
r.get('/skips',auth,(q,s)=>s.json(q.user.skips));
r.post('/skips/toggle',auth,async(q,s)=>{const{date,meal}=q.body,m=MEALS[meal];if(!m||!/^\d{4}-\d\d-\d\d$/.test(date||''))bad('Invalid meal.');
 const n=new Date(),h=n.getHours()+n.getMinutes()/60;if(date<ymd(n)||(date===ymd(n)&&h>m.start-2))bad('Changes close 2 hours before the meal.');
 const k=`${date}|${meal}`,has=q.user.skips.includes(k);if(has&&q.user.balance-m.price<MIN())bad('Wallet is too low to book this meal.');
 await User.updateOne({_id:q.user._id},has?{$pull:{skips:k}}:{$addToSet:{skips:k}});	 await User.updateOne({_id:q.user._id},has?{$pull:{skips:k}}:{$addToSet:{skips:k}});s.json({skipped:!has})});

r.post('/admin/skips/toggle',auth,can('acc'),async(q,s)=>{
	const{id,date,meal}=q.body;
	const m=MEALS[meal];if(!m||!/^\d{4}-\d\d-\d\d$/.test(date||''))bad('Invalid meal.');
	const k=`${date}|${meal}`,u=await User.findOne({rollNo:id.toUpperCase(),role:'student'});
	if(!u)bad('Student not found.',404);
	const has=u.skips.includes(k);
	await User.updateOne({_id:u._id},has?{$pull:{skips:k}}:{$addToSet:{skips:k}});
	await log(q.user,`${has?'Unskipped':'Skipped'} ${u.rollNo} for ${date} ${meal}`);
	s.json({skipped:!has})});

/* wallet + top-ups */
r.get('/wallet',auth,(q,s)=>s.json({balance:q.user.balance,tx:[...q.user.tx].reverse().slice(0,30)}));
r.post('/topups',auth,async(q,s)=>{const a=+q.body.amount,ref=String(q.body.ref||'').trim();if(!(a>=1&&a<=20000))bad('Enter an amount between ₹1 and ₹20,000.');if(ref.length<6)bad('Enter the payment reference (at least 6 characters).');
 if(await Topup.exists({ref}))bad('This payment reference was already submitted.',409);await Topup.create({user:q.user._id,name:q.user.name,amount:a,ref});s.status(201).json({ok:true})});
r.get('/topups',auth,async(q,s)=>{const st=q.user.role==='staff';if(st&&!['head','accounts'].includes(q.user.level))bad('No access.',403);s.json(await Topup.find(st?{}:{user:q.user._id}).sort('-createdAt').limit(100))});
r.post('/topups/:id/decide',auth,can('acc'),async(q,s)=>{const st=q.body.status;if(!['approved','rejected'].includes(st))bad('Invalid status.');
	const t=await Topup.findOneAndUpdate({_id:q.params.id,status:'pending'},{status:st,decidedBy:q.user.name},{new:true});if(!t)bad('This request was already decided.',409);
	if(st==='approved'){
		await User.updateOne({_id:t.user},{$inc:{balance:t.amount},$push:{tx:{n:`Top-up approved by ${q.user.name} (ref ${t.ref})`,a:t.amount}}});
		await notify(t.user,'Your wallet top-up of ₹'+t.amount+' has been approved!','Payment');
	}else{
		await notify(t.user,'Your wallet top-up request of ₹'+t.amount+' was rejected.','Payment');
	}
	await log(q.user,`${st==='approved'?'Approved':'Rejected'} ₹${t.amount} top-up for ${t.name}`);s.json(t)});

r.post('/topups/verify',auth,async(q,s)=>{
	const{ref,amount}=q.body;
	const t=await Topup.findOne({ref,amount: +amount,status:'pending'});
	if(!t)bad('Payment verification failed. No matching pending request found.',404);
	await Topup.updateOne({_id:t._id},{status:'approved',decidedBy:'System'});
	await User.updateOne({_id:t.user},{$inc:{balance:t.amount},$push:{tx:{n:`Instant top-up approved (ref ${t.ref})`,a:t.amount}}});
	await notify(t.user,'Your instant top-up of ₹'+t.amount+' was successful!','Payment');
	s.json({ok:true});
});

/* notifications */
r.get('/notifications',auth,async(q,s)=>s.json(await Notification.find({user:q.user._id}).sort('-createdAt').limit(20)));
r.post('/notifications/:id/read',auth,async(q,s)=>{await Notification.updateOne({_id:q.params.id,user:q.user._id},{read:true});s.json({ok:true})});

/* diet requests */
r.post('/diet/request',auth,async(q,s)=>{
	const{diet}=q.body;
	if(!['Veg','Non-Veg'].includes(diet))bad('Invalid diet choice.');
	await User.updateOne({_id:q.user._id},{$set:{dietRequest:diet}});
	await notify(q.user._id,'Your diet change request to '+diet+' has been submitted.','Diet');
	s.json({ok:true})});
r.post('/admin/diet/approve/:id',auth,can('acc'),async(q,s)=>{
	const u=await User.findOne({_id:q.params.id});
	if(!u)bad('Student not found.',404);
	if(!u.dietRequest)bad('No pending diet request for this student.',404);
	const newDiet=u.dietRequest;
	await User.updateOne({_id:u._id},{$set:{diet:newDiet,$unset:{dietRequest:''}}});
	await notify(u._id,'Your diet change to '+newDiet+' has been approved!','Diet');
	await log(q.user,`Approved diet change to ${newDiet} for ${u.rollNo}`);
	s.json({ok:true})});

/* counter: atomic wallet charge, one serving per meal per day */
r.post('/counter/serve',auth,can('cnt'),async(q,s)=>{const meal=q.body.meal,m=MEALS[meal],key=String(q.body.query||'').split('|')[0].trim();if(!m||!key)bad('Enter a roll number and pick a meal.');
	const u=await User.findOne({rollNo:key.toUpperCase(),role:'student'});if(!u)bad(`No student found for "${key}".`,404);if(!u.active)bad('This account is suspended.',403);
	const date=ymd(new Date());if(u.skips.includes(`${date}|${meal}`))bad(`${u.name} skipped this meal.`,409);
	try{await Served.create({user:u._id,name:u.name,date,meal,price:m.price})}catch{bad('Already served this meal today.',409)}
	const ok=await User.findOneAndUpdate({_id:u._id,balance:{$gte:m.price+MIN()}},{$inc:{balance:-m.price},$push:{tx:{n:`${meal} eaten`,a:-m.price}}});
	if(!ok){await Served.deleteOne({user:u._id,date,meal});bad(`Wallet is too low (₹${u.balance}). Ask for a top-up.`,402)}
	await log(q.user,`Served ${meal} to ${u.rollNo}`);s.json({name:u.name,balance:u.balance-m.price})});
r.get('/counter/today',auth,can('cnt'),async(q,s)=>s.json(await Served.find({date:ymd(new Date())}).sort('-createdAt').limit(20)));

/* feedback */
r.post('/feedback',auth,async(q,s)=>{const{meal,stars,text}=q.body;if(!MEALS[meal]||!(stars>=1&&stars<=5))bad('Pick a meal and a 1 to 5 star rating.');
	await Feedback.create({name:q.user.name,meal,stars,text:String(text||'').slice(0,240)});s.status(201).json({ok:true})});
r.get('/feedback',auth,async(q,s)=>s.json({avg:await Feedback.aggregate([{$group:{_id:'$meal',avg:{$avg:'$stars'},n:{$sum:1}}}]),recent:await Feedback.find().sort('-createdAt').limit(8)}));

/* mess office */
r.get('/admin/overview',auth,can('acc'),async(q,s)=>{const date=ymd(new Date()),stu=await User.find({role:'student'}).select('balance active skips'),act=stu.filter(x=>x.active);
	const served=await Served.aggregate([{$match:{date}},{$group:{_id:'$meal',n:{$sum:1}}}]);
	const week=await Served.aggregate([{$match:{date:{$gte:ymd(new Date(Date.now()-6*864e5))}}},{$group:{_id:'$date',n:{$sum:1},amount:{$sum:'$price'}}},{$sort:{_id:1}}]);
	s.json({students:act.length,held:stu.reduce((a,x)=>a+x.balance,0),low:stu.filter(x=>x.balance<300).length,pending:await Topup.countDocuments({status:'pending'}),week,
	  plates:Object.keys(MEALS).map(m=>({meal:m,expected:act.filter(x=>!x.skips.includes(`${date}|${m}`)).length,served:served.find(v=>v._id===m)?.n||0}))})});
r.get('/admin/students',auth,can('acc'),async(q,s)=>s.json(await User.find({role:'student'}).select('rollNo name room diet balance active').sort('rollNo')));
r.post('/admin/students/:id/credit',auth,can('acc'),async(q,s)=>{const a=+q.body.amount;if(!(a>0&&a<=20000))bad('Enter an amount up to ₹20,000.');
	const u=await User.findOneAndUpdate({rollNo:q.params.id.toUpperCase(),role:'student'},{$inc:{balance:a},$push:{tx:{n:'Cash credited by mess office',a}}});if(!u)bad('Student not found.',404);
	await log(q.user,`Recorded cash ₹${a} for ${u.rollNo}`);s.json({ok:true})});
r.post('/admin/students/:id/toggle',auth,can('acc'),async(q,s)=>{const u=await User.findOne({rollNo:q.params.id.toUpperCase(),role:'student'});if(!u)bad('Student not found.',404);
	u.active=!u.active;await u.save();await log(q.user,`${u.active?'Activated':'Suspended'} ${u.rollNo}`);s.json({active:u.active})});
r.post('/admin/staff',auth,can('head'),async(q,s)=>{const{id,name,level,password}=q.body;if(!/^[A-Za-z0-9]{4,14}$/.test(id||'')||String(name||'').length<2||String(password||'').length<6||!['counter','accounts'].includes(level))bad('Check the staff ID, name, access level and password (6+ characters).');
	if(await User.exists({rollNo:id.toUpperCase()}))bad('That ID is already in use.',409);await User.create({rollNo:id,name,role:'staff',level,room:'Mess office',password:await hash(password)});await log(q.user,`Created staff account ${id.toUpperCase()} (${level})`);s.status(201).json({ok:true})});
r.get('/admin/audit',auth,can('acc'),async(q,s)=>s.json(await Audit.find().sort('-createdAt').limit(100)));
r.get('/admin/inventory',auth,can('acc'),async(q,s)=>s.json(await Inventory.find()));
r.post('/admin/inventory',auth,can('acc'),async(q,s)=>{
	const{item,qty,min}=q.body;
	const i=await Inventory.findOneAndUpdate({item},{$set:{qty,min}},{upsert:true,new:true});
	await log(q.user,`Updated ${item} to ${qty}`);
	if(qty<=min)await Notification.create({user:null,message:`Low Stock Alert: ${item} is down to ${qty}!`,type:'Inventory'});
	s.json(i)});

r.delete('/admin/inventory/:id',auth,can('acc'),async(q,s)=>{
	const i=await Inventory.findByIdAndDelete(q.params.id);
	if(!i)bad('Item not found.',404);
	await log(q.user,`Deleted ${i.item} from inventory`);
	s.json({ok:true})});
r.get('/admin/inventory',auth,can('acc'),async(q,s)=>s.json(await Inventory.find()));
r.post('/admin/inventory',auth,can('acc'),async(q,s)=>{
	const{item,qty,min}=q.body;
	const i=await Inventory.findOneAndUpdate({item},{$set:{qty,min}},{upsert:true,new:true});
	await log(q.user,`Updated ${item} to ${qty}`);
	if(qty<=min)await Notification.create({user:null,message:`Low Stock Alert: ${item} is down to ${qty}!`,type:'Inventory'});
	s.json(i)});

r.delete('/admin/inventory/:id',auth,can('acc'),async(q,s)=>{
	const i=await Inventory.findByIdAndDelete(q.params.id);
	if(!i)bad('Item not found.',404);
	await log(q.user,`Deleted ${i.item} from inventory`);
	s.json({ok:true})});
export default r;
