import mongoose from 'mongoose';
const {Schema,model}=mongoose,ref={type:Schema.Types.ObjectId,ref:'User'};
export const User=model('User',new Schema({rollNo:{type:String,unique:true,uppercase:true,trim:true},name:String,room:String,
 role:{type:String,enum:['student','staff'],default:'student'},level:{type:String,enum:['head','counter','accounts']},password:{type:String,select:false},
 diet:{type:String,default:'Veg'},active:{type:Boolean,default:true},balance:{type:Number,default:0},skips:[String],
 tx:{type:[{n:String,a:Number,d:{type:Date,default:Date.now}}],default:[]}},{timestamps:true}));
const menu=new Schema({day:String,meal:String,items:[String]});menu.index({day:1,meal:1},{unique:true});
export const Menu=model('Menu',menu);
export const Topup=model('Topup',new Schema({user:ref,name:String,amount:Number,ref:{type:String,unique:true},status:{type:String,default:'pending'},decidedBy:String},{timestamps:true}));
const served=new Schema({user:ref,name:String,date:String,meal:String,price:Number},{timestamps:true});served.index({user:1,date:1,meal:1},{unique:true});
export const Served=model('Served',served);
export const Feedback=model('Feedback',new Schema({name:String,meal:String,stars:Number,text:String},{timestamps:true}));
export const Notice=model('Notice',new Schema({text:String,category:{type:String,enum:['General','Urgent','Menu'],default:'General'},target:{type:String,default:'All'},expiresAt:Date},{timestamps:true}));
export const Notification=model('Notification',new Schema({user:ref,message:String,type:String,read:{type:Boolean,default:false}},{timestamps:true}));
export const DietRequest=model('DietRequest',new Schema({user:ref,requestedDiet:{type:String,enum:['Veg','Non-Veg']},status:{type:String,default:'pending'},decidedBy:String},{timestamps:true}));
export const Audit=model('Audit',new Schema({who:String,action:String},{timestamps:true}));
export const Inventory=model('Inventory',new Schema({item:String,qty:Number,min:Number},{timestamps:true}));
