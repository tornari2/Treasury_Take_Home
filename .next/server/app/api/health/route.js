"use strict";(()=>{var e={};e.id=829,e.ids=[829],e.modules={5890:e=>{e.exports=require("better-sqlite3")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},4534:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>_,patchFetch:()=>I,requestAsyncStorage:()=>c,routeModule:()=>N,serverHooks:()=>u,staticGenerationAsyncStorage:()=>l});var i={};a.r(i),a.d(i,{GET:()=>d,dynamic:()=>p});var E=a(9303),r=a(8716),s=a(670),n=a(7070),T=a(9487),o=a(5176);let p="force-dynamic";async function d(){try{return T.Z.prepare("SELECT 1").get(),n.NextResponse.json({status:"healthy",timestamp:new Date().toISOString(),database:"connected"},{status:200})}catch(e){return n.NextResponse.json({status:"unhealthy",timestamp:new Date().toISOString(),database:"disconnected",error:e instanceof Error?e.message:"Unknown error"},{status:503})}}(0,o.T)();let N=new E.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/health/route",pathname:"/api/health",filename:"route",bundlePath:"app/api/health/route"},resolvedPagePath:"/Users/michaeltornaritis/Desktop/Treasury_Take_Home/app/api/health/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:c,staticGenerationAsyncStorage:l,serverHooks:u}=N,_="/api/health/route";function I(){return(0,s.patchFetch)({serverHooks:u,staticGenerationAsyncStorage:l})}},9487:(e,t,a)=>{a.d(t,{Z:()=>d});var i=a(5890),E=a.n(i),r=a(5315),s=a.n(r),n=a(2048),T=a.n(n);let o=process.env.DATABASE_PATH||"./data/database.db",p=null,d="phase-production-build"===process.env.NEXT_PHASE?new Proxy({},{get:()=>()=>{throw Error("Database not available during build")}}):new Proxy({},{get(e,t){let a=function(){if(!p){if("phase-production-build"===process.env.NEXT_PHASE)throw Error("Database initialization skipped during build phase");try{let e=s().dirname(o);T().existsSync(e)||T().mkdirSync(e,{recursive:!0}),(p=new(E())(o)).pragma("foreign_keys = ON")}catch(e){throw e}}return p}(),i=a[t];return"function"==typeof i?i.bind(a):i}})},5176:(e,t,a)=>{a.d(t,{T:()=>r});var i=a(9487);let E=!1;function r(){if(!E)try{(function(){i.Z.exec(`
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
  `)})(),E=!0}catch(e){if(process.env.NEXT_PHASE,e instanceof Error&&e.message.includes("Database not available"))return;throw e}}}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),i=t.X(0,[276,972],()=>a(4534));module.exports=i})();