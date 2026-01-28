"use strict";(()=>{var e={};e.id=716,e.ids=[716],e.modules={5890:e=>{e.exports=require("better-sqlite3")},2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6005:e=>{e.exports=require("node:crypto")},5404:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>R,patchFetch:()=>I,requestAsyncStorage:()=>c,routeModule:()=>u,serverHooks:()=>N,staticGenerationAsyncStorage:()=>_});var i={};a.r(i),a.d(i,{POST:()=>l,dynamic:()=>d});var r=a(9303),n=a(8716),s=a(670),E=a(7070),o=a(9178),p=a(1615),T=a(5185);let d="force-dynamic";async function l(e){try{let e=await (0,p.cookies)(),t=e.get("session")?.value;if(t){let e=(0,o.ts)(t);e&&T.c8.create(e.id,"logout"),(0,o.SO)(t)}return e.delete("session"),E.NextResponse.json({success:!0})}catch(e){return console.error("Logout error:",e),E.NextResponse.json({error:"Internal server error"},{status:500})}}let u=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/auth/logout/route",pathname:"/api/auth/logout",filename:"route",bundlePath:"app/api/auth/logout/route"},resolvedPagePath:"/Users/michaeltornaritis/Desktop/Treasury_Take_Home/app/api/auth/logout/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:c,staticGenerationAsyncStorage:_,serverHooks:N}=u,R="/api/auth/logout/route";function I(){return(0,s.patchFetch)({serverHooks:N,staticGenerationAsyncStorage:_})}},9178:(e,t,a)=>{a.d(t,{SO:()=>p,So:()=>T,ed:()=>o,ts:()=>d});var i=a(3400),r=a(8547),n=a(5185);let s=new Map;async function E(e,t){return i.ZP.compare(e,t)}function o(e){let t=(0,r.Z)(),a=Date.now()+864e5;return s.set(t,{userId:e,expiresAt:a}),function(){let e=Date.now();for(let[t,a]of s.entries())e>a.expiresAt&&s.delete(t)}(),t}function p(e){s.delete(e)}async function T(e,t){let a=n.tJ.findByEmail(e);return a&&await E(t,a.password_hash)?(n.tJ.updateLastLogin(a.id),n.c8.create(a.id,"login"),a):null}function d(e){if(!e)return null;let t=function(e){let t=s.get(e);return t?Date.now()>t.expiresAt?(s.delete(e),null):{userId:t.userId}:null}(e);return t&&n.tJ.findById(t.userId)||null}},5185:(e,t,a)=>{a.d(t,{M1:()=>n,c8:()=>E,tJ:()=>r,uH:()=>s});var i=a(9487);(0,a(5176).T)();let r={create:(e,t,a,r="agent")=>i.Z.prepare(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `).run(e,t,a,r),findByEmail:e=>i.Z.prepare("SELECT * FROM users WHERE email = ?").get(e),findById:e=>i.Z.prepare("SELECT * FROM users WHERE id = ?").get(e),updateLastLogin:e=>i.Z.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(e)},n={create:(e,t,a,r=null)=>i.Z.prepare(`
      INSERT INTO applications (applicant_name, beverage_type, expected_label_data, assigned_agent_id)
      VALUES (?, ?, ?, ?)
    `).run(e,t,a,r),findById:e=>i.Z.prepare("SELECT * FROM applications WHERE id = ?").get(e),findAll:()=>i.Z.prepare("SELECT * FROM applications ORDER BY created_at DESC").all(),findByStatus:e=>i.Z.prepare("SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC").all(e),updateStatus:(e,t,a=null)=>i.Z.prepare(`
      UPDATE applications 
      SET status = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?
      WHERE id = ?
    `).run(t,a,e)},s={create:(e,t,a,r)=>i.Z.prepare(`
      INSERT INTO label_images (application_id, image_type, image_data, mime_type)
      VALUES (?, ?, ?, ?)
    `).run(e,t,a,r),findByApplicationId:e=>i.Z.prepare("SELECT * FROM label_images WHERE application_id = ?").all(e),updateExtraction:(e,t,a,r,n)=>i.Z.prepare(`
      UPDATE label_images 
      SET extracted_data = ?, verification_result = ?, confidence_score = ?, 
          processed_at = CURRENT_TIMESTAMP, processing_time_ms = ?
      WHERE id = ?
    `).run(t,a,r,n,e)},E={create:(e,t,a=null,r=null)=>i.Z.prepare(`
      INSERT INTO audit_logs (user_id, application_id, action, details)
      VALUES (?, ?, ?, ?)
    `).run(e,a,t,r),findByUserId:(e,t=100)=>i.Z.prepare(`
      SELECT * FROM audit_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(e,t),findByApplicationId:e=>i.Z.prepare(`
      SELECT * FROM audit_logs 
      WHERE application_id = ? 
      ORDER BY timestamp DESC
    `).all(e)}},9487:(e,t,a)=>{a.d(t,{Z:()=>d});var i=a(5890),r=a.n(i),n=a(5315),s=a.n(n),E=a(2048),o=a.n(E);let p=process.env.DATABASE_PATH||"./data/database.db",T=null,d="phase-production-build"===process.env.NEXT_PHASE?new Proxy({},{get:()=>()=>{throw Error("Database not available during build")}}):new Proxy({},{get(e,t){let a=function(){if(!T){if("phase-production-build"===process.env.NEXT_PHASE)throw Error("Database initialization skipped during build phase");try{let e=s().dirname(p);o().existsSync(e)||o().mkdirSync(e,{recursive:!0}),(T=new(r())(p)).pragma("foreign_keys = ON")}catch(e){throw e}}return T}(),i=a[t];return"function"==typeof i?i.bind(a):i}})},5176:(e,t,a)=>{a.d(t,{T:()=>n});var i=a(9487);let r=!1;function n(){if(!r)try{i.Z.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'agent' CHECK(role IN ('agent', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `),i.Z.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_name TEXT NOT NULL,
      beverage_type TEXT NOT NULL CHECK(beverage_type IN ('spirits', 'wine', 'beer')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'needs_review', 'approved', 'rejected')),
      assigned_agent_id INTEGER,
      expected_label_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      review_notes TEXT,
      FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
    )
  `),i.Z.exec(`
    CREATE TABLE IF NOT EXISTS label_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      image_type TEXT NOT NULL CHECK(image_type IN ('front', 'back', 'side', 'neck')),
      image_data BLOB NOT NULL,
      mime_type TEXT NOT NULL,
      extracted_data TEXT,
      verification_result TEXT,
      confidence_score REAL,
      processed_at DATETIME,
      processing_time_ms INTEGER,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )
  `),i.Z.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      application_id INTEGER,
      action TEXT NOT NULL CHECK(action IN ('login', 'logout', 'viewed', 'verified', 'approved', 'rejected', 'status_changed')),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      details TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
    )
  `),i.Z.exec(`
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_assigned_agent ON applications(assigned_agent_id);
    CREATE INDEX IF NOT EXISTS idx_label_images_application ON label_images(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_application ON audit_logs(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `),r=!0}catch(e){if(process.env.NEXT_PHASE,e instanceof Error&&e.message.includes("Database not available"))return;throw e}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),i=t.X(0,[276,972,955],()=>a(5404));module.exports=i})();