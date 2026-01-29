"use strict";(()=>{var e={};e.id=689,e.ids=[689],e.modules={5890:e=>{e.exports=require("better-sqlite3")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},3559:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>N,patchFetch:()=>R,requestAsyncStorage:()=>c,routeModule:()=>T,serverHooks:()=>u,staticGenerationAsyncStorage:()=>_});var i={};t.r(i),t.d(i,{GET:()=>d,PATCH:()=>l,dynamic:()=>o});var r=t(9303),n=t(8716),s=t(670),p=t(7070),E=t(5185);let o="force-dynamic";async function d(e,{params:a}){try{let e=parseInt(a.id);if(isNaN(e))return p.NextResponse.json({error:"Invalid application ID"},{status:400});let t=E.M1.findById(e);if(!t)return p.NextResponse.json({error:"Application not found"},{status:404});let i=E.uH.findByApplicationId(e),r=t.application_data||t.expected_label_data,n={...t,application_data:r?JSON.parse(r):null,expected_label_data:r?JSON.parse(r):null,label_images:i.map(e=>({...e,image_data_base64:e.image_data.toString("base64"),extracted_data:e.extracted_data?JSON.parse(e.extracted_data):null,verification_result:e.verification_result?JSON.parse(e.verification_result):null}))};return p.NextResponse.json({application:n})}catch(e){return console.error("Get application error:",e),p.NextResponse.json({error:"Internal server error"},{status:500})}}async function l(e,{params:a}){try{let t=parseInt(a.id);if(isNaN(t))return p.NextResponse.json({error:"Invalid application ID"},{status:400});if(!E.M1.findById(t))return p.NextResponse.json({error:"Application not found"},{status:404});let{status:i,review_notes:r}=await e.json();if(i&&!["pending","needs_review","approved","rejected"].includes(i))return p.NextResponse.json({error:"Invalid status"},{status:400});i&&E.M1.updateStatus(t,i,r||null);let n=E.M1.findById(t),s=n.application_data||n.expected_label_data;return p.NextResponse.json({application:{...n,application_data:s?JSON.parse(s):null,expected_label_data:s?JSON.parse(s):null}})}catch(e){return console.error("Update application error:",e),p.NextResponse.json({error:"Internal server error"},{status:500})}}let T=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/applications/[id]/route",pathname:"/api/applications/[id]",filename:"route",bundlePath:"app/api/applications/[id]/route"},resolvedPagePath:"/Users/michaeltornaritis/Desktop/Treasury_Take_Home/app/api/applications/[id]/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:c,staticGenerationAsyncStorage:_,serverHooks:u}=T,N="/api/applications/[id]/route";function R(){return(0,s.patchFetch)({serverHooks:u,staticGenerationAsyncStorage:_})}},5185:(e,a,t)=>{t.d(a,{M1:()=>r,c8:()=>s,uH:()=>n});var i=t(9487);(0,t(5176).T)();let r={create:(e,a,t,r=null)=>i.Z.prepare(`
      INSERT INTO applications (applicant_name, beverage_type, application_data, assigned_agent_id)
      VALUES (?, ?, ?, ?)
    `).run(e,a,t,r),findById:e=>i.Z.prepare("SELECT * FROM applications WHERE id = ?").get(e),findAll:()=>i.Z.prepare("SELECT * FROM applications ORDER BY created_at DESC").all(),findByStatus:e=>i.Z.prepare("SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC").all(e),updateStatus:(e,a,t=null)=>i.Z.prepare(`
      UPDATE applications 
      SET status = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?
      WHERE id = ?
    `).run(a,t,e)},n={create:(e,a,t,r)=>i.Z.prepare(`
      INSERT INTO label_images (application_id, image_type, image_data, mime_type)
      VALUES (?, ?, ?, ?)
    `).run(e,a,t,r),findByApplicationId:e=>i.Z.prepare("SELECT * FROM label_images WHERE application_id = ?").all(e),updateExtraction:(e,a,t,r,n)=>i.Z.prepare(`
      UPDATE label_images 
      SET extracted_data = ?, verification_result = ?, confidence_score = ?, 
          processed_at = CURRENT_TIMESTAMP, processing_time_ms = ?
      WHERE id = ?
    `).run(a,t,r,n,e)},s={create:(e,a,t=null,r=null)=>i.Z.prepare(`
      INSERT INTO audit_logs (user_id, application_id, action, details)
      VALUES (?, ?, ?, ?)
    `).run(e,t,a,r),findByUserId:(e,a=100)=>i.Z.prepare(`
      SELECT * FROM audit_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(e,a),findByApplicationId:e=>i.Z.prepare(`
      SELECT * FROM audit_logs 
      WHERE application_id = ? 
      ORDER BY timestamp DESC
    `).all(e)}},9487:(e,a,t)=>{t.d(a,{Z:()=>l});var i=t(5890),r=t.n(i),n=t(5315),s=t.n(n),p=t(2048),E=t.n(p);let o=process.env.DATABASE_PATH||"./data/database.db",d=null,l="phase-production-build"===process.env.NEXT_PHASE?new Proxy({},{get:()=>()=>{throw Error("Database not available during build")}}):new Proxy({},{get(e,a){let t=function(){if(!d){if("phase-production-build"===process.env.NEXT_PHASE)throw Error("Database initialization skipped during build phase");try{let e=s().dirname(o);E().existsSync(e)||E().mkdirSync(e,{recursive:!0}),(d=new(r())(o)).pragma("foreign_keys = ON")}catch(e){throw e}}return d}(),i=t[a];return"function"==typeof i?i.bind(t):i}})},5176:(e,a,t)=>{t.d(a,{T:()=>n});var i=t(9487);let r=!1;function n(){if(!r)try{(function(){i.Z.exec(`
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
      application_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      review_notes TEXT,
      FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
    )
  `);try{i.Z.exec(`
      ALTER TABLE applications 
      RENAME COLUMN expected_label_data TO application_data
    `)}catch(e){}i.Z.exec(`
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
      action TEXT NOT NULL CHECK(action IN ('login', 'logout', 'viewed', 'verified', 'approved', 'rejected', 'status_changed', 'created')),
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
  `)})(),r=!0}catch(e){if(process.env.NEXT_PHASE,e instanceof Error&&e.message.includes("Database not available"))return;throw e}}}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),i=a.X(0,[276,972],()=>t(3559));module.exports=i})();