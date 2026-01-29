"use strict";(()=>{var e={};e.id=108,e.ids=[108],e.modules={5890:e=>{e.exports=require("better-sqlite3")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},7254:(e,a,i)=>{i.r(a),i.d(a,{originalPathname:()=>u,patchFetch:()=>N,requestAsyncStorage:()=>l,routeModule:()=>o,serverHooks:()=>_,staticGenerationAsyncStorage:()=>c});var t={};i.r(t),i.d(t,{GET:()=>d,dynamic:()=>T});var E=i(9303),r=i(8716),s=i(670),n=i(7070),p=i(5185);let T="force-dynamic";async function d(e){try{let{searchParams:a}=new URL(e.url),i=a.get("user_id"),t=a.get("application_id"),E=parseInt(a.get("limit")||"100"),r=(i?p.c8.findByUserId(parseInt(i),E):t?p.c8.findByApplicationId(parseInt(t)):p.c8.findByUserId(0,E)).map(e=>({...e,details:e.details?JSON.parse(e.details):null}));return n.NextResponse.json({logs:r,count:r.length})}catch(e){return console.error("Get audit logs error:",e),n.NextResponse.json({error:"Internal server error"},{status:500})}}let o=new E.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/audit-logs/route",pathname:"/api/audit-logs",filename:"route",bundlePath:"app/api/audit-logs/route"},resolvedPagePath:"/Users/michaeltornaritis/Desktop/Treasury_Take_Home/app/api/audit-logs/route.ts",nextConfigOutput:"",userland:t}),{requestAsyncStorage:l,staticGenerationAsyncStorage:c,serverHooks:_}=o,u="/api/audit-logs/route";function N(){return(0,s.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:c})}},5185:(e,a,i)=>{i.d(a,{M1:()=>E,c8:()=>s,uH:()=>r});var t=i(9487);(0,i(5176).T)();let E={create:(e,a,i,E=null)=>t.Z.prepare(`
      INSERT INTO applications (applicant_name, beverage_type, application_data, assigned_agent_id)
      VALUES (?, ?, ?, ?)
    `).run(e,a,i,E),findById:e=>t.Z.prepare("SELECT * FROM applications WHERE id = ?").get(e),findAll:()=>t.Z.prepare("SELECT * FROM applications ORDER BY created_at DESC").all(),findByStatus:e=>t.Z.prepare("SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC").all(e),updateStatus:(e,a,i=null)=>t.Z.prepare(`
      UPDATE applications 
      SET status = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?
      WHERE id = ?
    `).run(a,i,e)},r={create:(e,a,i,E)=>t.Z.prepare(`
      INSERT INTO label_images (application_id, image_type, image_data, mime_type)
      VALUES (?, ?, ?, ?)
    `).run(e,a,i,E),findByApplicationId:e=>t.Z.prepare("SELECT * FROM label_images WHERE application_id = ?").all(e),updateExtraction:(e,a,i,E,r)=>t.Z.prepare(`
      UPDATE label_images 
      SET extracted_data = ?, verification_result = ?, confidence_score = ?, 
          processed_at = CURRENT_TIMESTAMP, processing_time_ms = ?
      WHERE id = ?
    `).run(a,i,E,r,e)},s={create:(e,a,i=null,E=null)=>t.Z.prepare(`
      INSERT INTO audit_logs (user_id, application_id, action, details)
      VALUES (?, ?, ?, ?)
    `).run(e,i,a,E),findByUserId:(e,a=100)=>t.Z.prepare(`
      SELECT * FROM audit_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(e,a),findByApplicationId:e=>t.Z.prepare(`
      SELECT * FROM audit_logs 
      WHERE application_id = ? 
      ORDER BY timestamp DESC
    `).all(e)}},9487:(e,a,i)=>{i.d(a,{Z:()=>o});var t=i(5890),E=i.n(t),r=i(5315),s=i.n(r),n=i(2048),p=i.n(n);let T=process.env.DATABASE_PATH||"./data/database.db",d=null,o="phase-production-build"===process.env.NEXT_PHASE?new Proxy({},{get:()=>()=>{throw Error("Database not available during build")}}):new Proxy({},{get(e,a){let i=function(){if(!d){if("phase-production-build"===process.env.NEXT_PHASE)throw Error("Database initialization skipped during build phase");try{let e=s().dirname(T);p().existsSync(e)||p().mkdirSync(e,{recursive:!0}),(d=new(E())(T)).pragma("foreign_keys = ON")}catch(e){throw e}}return d}(),t=i[a];return"function"==typeof t?t.bind(i):t}})},5176:(e,a,i)=>{i.d(a,{T:()=>r});var t=i(9487);let E=!1;function r(){if(!E)try{(function(){t.Z.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'agent' CHECK(role IN ('agent', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `),t.Z.exec(`
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
  `);try{t.Z.exec(`
      ALTER TABLE applications 
      RENAME COLUMN expected_label_data TO application_data
    `)}catch(e){}t.Z.exec(`
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
  `),t.Z.exec(`
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
  `),t.Z.exec(`
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_assigned_agent ON applications(assigned_agent_id);
    CREATE INDEX IF NOT EXISTS idx_label_images_application ON label_images(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_application ON audit_logs(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `)})(),E=!0}catch(e){if(process.env.NEXT_PHASE,e instanceof Error&&e.message.includes("Database not available"))return;throw e}}}};var a=require("../../../webpack-runtime.js");a.C(e);var i=e=>a(a.s=e),t=a.X(0,[276,972],()=>i(7254));module.exports=t})();