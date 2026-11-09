import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import 'dotenv/config';import mongoose from 'mongoose';import bcrypt from 'bcryptjs';
import {User,Menu} from './models.js';import {DAYS} from './config.js';
const M={Breakfast:[["Idli","Sambar","Chutney","Tea"],["Poori","Aloo curry","Banana","Milk"],["Poha","Jalebi","Boiled egg","Tea"],["Dosa","Sambar","Chutney","Coffee"]],
Lunch:[["Rice","Dal tadka","Aloo gobi","Salad","Curd"],["Rice","Rajma","Mixed veg","Roti"],["Veg pulao","Raita","Paneer masala","Roti"],["Rice","Dalma","Besara","Fish/Paneer curry"]],
Snacks:[["Samosa","Tea"],["Bread pakoda","Tea"],["Pav bhaji","Tea"],["Maggi","Coffee"]],
Dinner:[["Roti","Paneer butter masala","Dal fry","Rice"],["Roti","Aloo matar","Dal","Rice"],["Chapati","Egg curry/Soya chunk","Dal","Rice"],["Roti","Mix veg","Dal makhani","Rice","Kheer"]]};
await mongoose.connect(process.env.MONGO_URI);await User.deleteMany();await Menu.deleteMany();
const h=await bcrypt.hash('student@123',10),a=await bcrypt.hash('admin@123',10),t=await bcrypt.hash('staff@123',10);
await User.insertMany([
 {rollNo:'ADMIN',name:'Mess Office',role:'staff',level:'head',room:'Admin block',password:a},
 {rollNo:'COUNTER01',name:'Counter Staff',role:'staff',level:'counter',room:'Mess counter',password:t},
 {rollNo:'ACCOUNTS01',name:'Accounts Staff',role:'staff',level:'accounts',room:'Mess office',password:t},
 {rollNo:'B2024CSE045',name:'Aarav Mishra',room:'Hostel 3, Room 118',password:h,balance:2500},
 {rollNo:'B2024ECE012',name:'Ananya Rout',room:'Hostel 5, Room 204',password:h,balance:1800},
 {rollNo:'B2023IT033',name:'Rohit Sahu',room:'Hostel 2, Room 310',password:h,balance:150}]);
await Menu.insertMany(DAYS.flatMap((day,i)=>Object.entries(M).map(([meal,l])=>({day,meal,items:l[i%l.length]}))));
console.log('Seeded. Logins: ADMIN/admin@123, COUNTER01 and ACCOUNTS01 /staff@123, B2024CSE045/student@123');process.exit(0);
