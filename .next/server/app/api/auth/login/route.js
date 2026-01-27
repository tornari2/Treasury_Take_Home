"use strict";(()=>{var e={};e.id=873,e.ids=[873],e.modules={5890:e=>{e.exports=require("better-sqlite3")},2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6005:e=>{e.exports=require("node:crypto")},7817:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>_,patchFetch:()=>g,requestAsyncStorage:()=>E,routeModule:()=>c,serverHooks:()=>R,staticGenerationAsyncStorage:()=>m});var a={};r.r(a),r.d(a,{POST:()=>d,dynamic:()=>u});var n=r(9303),i=r(8716),s=r(670),o=r(7070),p=r(9178),l=r(1615);let u="force-dynamic";async function d(e){try{let{email:t,password:r}=await e.json();if(!t||!r)return o.NextResponse.json({error:"Email and password are required"},{status:400});let a=await (0,p.So)(t,r);if(!a)return o.NextResponse.json({error:"Invalid email or password"},{status:401});let n=(0,p.ed)(a.id);return(await (0,l.cookies)()).set("session",n,{httpOnly:!0,secure:!0,sameSite:"lax",maxAge:86400,path:"/"}),o.NextResponse.json({success:!0,user:{id:a.id,email:a.email,name:a.name,role:a.role}})}catch(e){return console.error("Login error:",e),o.NextResponse.json({error:"Internal server error"},{status:500})}}let c=new n.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/auth/login/route",pathname:"/api/auth/login",filename:"route",bundlePath:"app/api/auth/login/route"},resolvedPagePath:"/Users/michaeltornaritis/Desktop/Treasury_Take_Home/app/api/auth/login/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:E,staticGenerationAsyncStorage:m,serverHooks:R}=c,_="/api/auth/login/route";function g(){return(0,s.patchFetch)({serverHooks:R,staticGenerationAsyncStorage:m})}},9178:(e,t,r)=>{r.d(t,{SO:()=>l,So:()=>u,ed:()=>p,ts:()=>d});var a=r(8691),n=r(8547),i=r(909);let s=new Map;async function o(e,t){return a.ZP.compare(e,t)}function p(e){let t=(0,n.Z)(),r=Date.now()+864e5;return s.set(t,{userId:e,expiresAt:r}),function(){let e=Date.now();for(let[t,r]of s.entries())e>r.expiresAt&&s.delete(t)}(),t}function l(e){s.delete(e)}async function u(e,t){let r=i.tJ.findByEmail(e);return r&&await o(t,r.password_hash)?(i.tJ.updateLastLogin(r.id),i.c8.create(r.id,"login"),r):null}function d(e){if(!e)return null;let t=function(e){let t=s.get(e);return t?Date.now()>t.expiresAt?(s.delete(e),null):{userId:t.userId}:null}(e);return t&&i.tJ.findById(t.userId)||null}},909:(e,t,r)=>{r.d(t,{M1:()=>E,c8:()=>R,uH:()=>m,tJ:()=>c});var a=r(5890),n=r.n(a),i=r(5315),s=r.n(i),o=r(2048),p=r.n(o);let l=process.env.DATABASE_PATH||"./data/database.db",u=s().dirname(l);p().existsSync(u)||p().mkdirSync(u,{recursive:!0});let d=new(n())(l);d.pragma("foreign_keys = ON");let c={create:(e,t,r,a="agent")=>d.prepare(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `).run(e,t,r,a),findByEmail:e=>d.prepare("SELECT * FROM users WHERE email = ?").get(e),findById:e=>d.prepare("SELECT * FROM users WHERE id = ?").get(e),updateLastLogin:e=>d.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(e)},E={create:(e,t,r,a=null)=>d.prepare(`
      INSERT INTO applications (applicant_name, beverage_type, expected_label_data, assigned_agent_id)
      VALUES (?, ?, ?, ?)
    `).run(e,t,r,a),findById:e=>d.prepare("SELECT * FROM applications WHERE id = ?").get(e),findAll:()=>d.prepare("SELECT * FROM applications ORDER BY created_at DESC").all(),findByStatus:e=>d.prepare("SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC").all(e),updateStatus:(e,t,r=null)=>d.prepare(`
      UPDATE applications 
      SET status = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?
      WHERE id = ?
    `).run(t,r,e)},m={create:(e,t,r,a)=>d.prepare(`
      INSERT INTO label_images (application_id, image_type, image_data, mime_type)
      VALUES (?, ?, ?, ?)
    `).run(e,t,r,a),findByApplicationId:e=>d.prepare("SELECT * FROM label_images WHERE application_id = ?").all(e),updateExtraction:(e,t,r,a,n)=>d.prepare(`
      UPDATE label_images 
      SET extracted_data = ?, verification_result = ?, confidence_score = ?, 
          processed_at = CURRENT_TIMESTAMP, processing_time_ms = ?
      WHERE id = ?
    `).run(t,r,a,n,e)},R={create:(e,t,r=null,a=null)=>d.prepare(`
      INSERT INTO audit_logs (user_id, application_id, action, details)
      VALUES (?, ?, ?, ?)
    `).run(e,r,t,a),findByUserId:(e,t=100)=>d.prepare(`
      SELECT * FROM audit_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(e,t),findByApplicationId:e=>d.prepare(`
      SELECT * FROM audit_logs 
      WHERE application_id = ? 
      ORDER BY timestamp DESC
    `).all(e)}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[276,2],()=>r(7817));module.exports=a})();