export const ymd=d=>d.toLocaleDateString('en-CA');
export const money=n=>'₹'+Math.round(n).toLocaleString('en-IN');
export const hourNow=()=>{const n=new Date();return n.getHours()+n.getMinutes()/60};
