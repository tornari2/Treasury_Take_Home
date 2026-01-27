"use strict";(()=>{var e={};e.id=108,e.ids=[108],e.modules={5890:e=>{e.exports=require("better-sqlite3")},2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6005:e=>{e.exports=require("node:crypto")},7254:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>m,patchFetch:()=>_,requestAsyncStorage:()=>E,routeModule:()=>c,serverHooks:()=>g,staticGenerationAsyncStorage:()=>R});var a={};r.r(a),r.d(a,{GET:()=>d,dynamic:()=>u});var n=r(9303),i=r(8716),s=r(670),o=r(7070),p=r(2704),l=r(909);let u="force-dynamic";async function d(e){try{let t=await (0,p.k)(e);if(t instanceof o.NextResponse)return t;let{searchParams:r}=new URL(e.url),a=r.get("user_id"),n=r.get("application_id"),i=parseInt(r.get("limit")||"100"),s=(a?l.c8.findByUserId(parseInt(a),i):n?l.c8.findByApplicationId(parseInt(n)):l.c8.findByUserId(0,i)).map(e=>({...e,details:e.details?JSON.parse(e.details):null}));return o.NextResponse.json({logs:s,count:s.length})}catch(e){return console.error("Get audit logs error:",e),o.NextResponse.json({error:"Internal server error"},{status:500})}}let c=new n.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/audit-logs/route",pathname:"/api/audit-logs",filename:"route",bundlePath:"app/api/audit-logs/route"},resolvedPagePath:"/Users/michaeltornaritis/Desktop/Treasury_Take_Home/app/api/audit-logs/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:E,staticGenerationAsyncStorage:R,serverHooks:g}=c,m="/api/audit-logs/route";function _(){return(0,s.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:R})}},9178:(e,t,r)=>{r.d(t,{SO:()=>l,So:()=>u,ed:()=>p,ts:()=>d});var a=r(8691),n=r(8547),i=r(909);let s=new Map;async function o(e,t){return a.ZP.compare(e,t)}function p(e){let t=(0,n.Z)(),r=Date.now()+864e5;return s.set(t,{userId:e,expiresAt:r}),function(){let e=Date.now();for(let[t,r]of s.entries())e>r.expiresAt&&s.delete(t)}(),t}function l(e){s.delete(e)}async function u(e,t){let r=i.tJ.findByEmail(e);return r&&await o(t,r.password_hash)?(i.tJ.updateLastLogin(r.id),i.c8.create(r.id,"login"),r):null}function d(e){if(!e)return null;let t=function(e){let t=s.get(e);return t?Date.now()>t.expiresAt?(s.delete(e),null):{userId:t.userId}:null}(e);return t&&i.tJ.findById(t.userId)||null}},909:(e,t,r)=>{r.d(t,{M1:()=>E,c8:()=>g,uH:()=>R,tJ:()=>c});var a=r(5890),n=r.n(a),i=r(5315),s=r.n(i),o=r(2048),p=r.n(o);let l=process.env.DATABASE_PATH||"./data/database.db",u=s().dirname(l);p().existsSync(u)||p().mkdirSync(u,{recursive:!0});let d=new(n())(l);d.pragma("foreign_keys = ON");let c={create:(e,t,r,a="agent")=>d.prepare(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `).run(e,t,r,a),findByEmail:e=>d.prepare("SELECT * FROM users WHERE email = ?").get(e),findById:e=>d.prepare("SELECT * FROM users WHERE id = ?").get(e),updateLastLogin:e=>d.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(e)},E={create:(e,t,r,a=null)=>d.prepare(`
      INSERT INTO applications (applicant_name, beverage_type, expected_label_data, assigned_agent_id)
      VALUES (?, ?, ?, ?)
    `).run(e,t,r,a),findById:e=>d.prepare("SELECT * FROM applications WHERE id = ?").get(e),findAll:()=>d.prepare("SELECT * FROM applications ORDER BY created_at DESC").all(),findByStatus:e=>d.prepare("SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC").all(e),updateStatus:(e,t,r=null)=>d.prepare(`
      UPDATE applications 
      SET status = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?
      WHERE id = ?
    `).run(t,r,e)},R={create:(e,t,r,a)=>d.prepare(`
      INSERT INTO label_images (application_id, image_type, image_data, mime_type)
      VALUES (?, ?, ?, ?)
    `).run(e,t,r,a),findByApplicationId:e=>d.prepare("SELECT * FROM label_images WHERE application_id = ?").all(e),updateExtraction:(e,t,r,a,n)=>d.prepare(`
      UPDATE label_images 
      SET extracted_data = ?, verification_result = ?, confidence_score = ?, 
          processed_at = CURRENT_TIMESTAMP, processing_time_ms = ?
      WHERE id = ?
    `).run(t,r,a,n,e)},g={create:(e,t,r=null,a=null)=>d.prepare(`
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
    `).all(e)}},2704:(e,t,r)=>{r.d(t,{k:()=>o,m:()=>s});var a=r(7070),n=r(9178),i=r(1615);async function s(e){let t=await (0,i.cookies)(),r=t.get("session")?.value;if(!r)return a.NextResponse.json({error:"Authentication required"},{status:401});let s=(0,n.ts)(r);return s?{user:s}:a.NextResponse.json({error:"Invalid session"},{status:401})}async function o(e){let t=await s(e);return t instanceof a.NextResponse?t:"admin"!==t.user.role?a.NextResponse.json({error:"Admin access required"},{status:403}):t}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[276,2],()=>r(7254));module.exports=a})();