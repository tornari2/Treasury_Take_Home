"use strict";(()=>{var e={};e.id=569,e.ids=[569],e.modules={5890:e=>{e.exports=require("better-sqlite3")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},7485:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>g,patchFetch:()=>I,requestAsyncStorage:()=>N,routeModule:()=>T,serverHooks:()=>R,staticGenerationAsyncStorage:()=>_});var i={};a.r(i),a.d(i,{GET:()=>u,POST:()=>c,dynamic:()=>d});var r=a(9303),s=a(8716),n=a(670),p=a(7070),o=a(5185),l=a(6101),E=a(9487);let d="force-dynamic";async function u(e){try{let{searchParams:t}=new URL(e.url),a=t.get("status"),i=(a?o.M1.findByStatus(a):o.M1.findAll()).map(e=>{let t=e.application_data||e.expected_label_data;return{...e,application_data:t?JSON.parse(t):null,expected_label_data:t?JSON.parse(t):null}});return p.NextResponse.json({applications:i,count:i.length})}catch(e){return console.error("Get applications error:",e),p.NextResponse.json({error:"Internal server error"},{status:500})}}async function c(e){try{let t;let a=await e.formData(),i=a.get("applicationData");if(!i)return p.NextResponse.json({error:"Application data is required"},{status:400});try{t=JSON.parse(i)}catch(e){return p.NextResponse.json({error:"Invalid application data format"},{status:400})}if(!t.beverageType||!Object.values(l.c_).includes(t.beverageType))return p.NextResponse.json({error:"Invalid beverage type"},{status:400});if(!t.originType||!Object.values(l.F).includes(t.originType))return p.NextResponse.json({error:"Invalid origin type"},{status:400});if(!t.brandName?.trim())return p.NextResponse.json({error:"Brand name is required"},{status:400});if(!t.producerName?.trim())return p.NextResponse.json({error:"Producer name is required"},{status:400});if(!t.producerAddress?.city?.trim()||!t.producerAddress?.state?.trim())return p.NextResponse.json({error:"Producer address (city and state) is required"},{status:400});if(t.beverageType===l.c_.WINE){if(null!==t.appellation&&void 0!==t.appellation&&"string"!=typeof t.appellation)return p.NextResponse.json({error:"Invalid appellation format"},{status:400});if(null!==t.varietal&&void 0!==t.varietal&&"string"!=typeof t.varietal)return p.NextResponse.json({error:"Invalid varietal format"},{status:400});if(null!==t.vintageDate&&void 0!==t.vintageDate&&"string"!=typeof t.vintageDate)return p.NextResponse.json({error:"Invalid vintage date format"},{status:400})}else t.appellation=null,t.varietal=null,t.vintageDate=null;let r=a.getAll("images"),s=a.getAll("imageTypes");if(0===r.length)return p.NextResponse.json({error:"At least one image is required"},{status:400});if(s.length!==r.length)return p.NextResponse.json({error:"Image type must be specified for each image"},{status:400});let n=[];for(let e of s){let t=String(e);if(!["front","back","side","neck"].includes(t))return p.NextResponse.json({error:"Invalid image type"},{status:400});n.push(t)}for(let e of r){if(!(e instanceof File))return p.NextResponse.json({error:"Invalid file format"},{status:400});if(!e.type.startsWith("image/"))return p.NextResponse.json({error:"Only image files are allowed"},{status:400});if(e.size>10485760)return p.NextResponse.json({error:"Image size must be less than 10MB"},{status:400})}let d={...t,id:"",labelImages:[]},u=JSON.stringify(d),c=o.M1.create(t.producerName.trim(),t.beverageType,u,null).lastInsertRowid,T=[];for(let e=0;e<r.length;e++){let t=r[e],a=n[e],i=await t.arrayBuffer(),s=Buffer.from(i),p=t.type||"image/jpeg",l=o.uH.create(c,a,s,p);T.push(l.lastInsertRowid)}let N={...d,id:String(c),labelImages:T.map(e=>String(e))},_=JSON.stringify(N);E.Z.prepare("UPDATE applications SET application_data = ? WHERE id = ?").run(_,c);let R=o.M1.findById(c);if(!R)return p.NextResponse.json({error:"Failed to retrieve created application"},{status:500});let g=R.application_data||R.expected_label_data,I={...R,application_data:g?JSON.parse(g):null,expected_label_data:g?JSON.parse(g):null};return p.NextResponse.json({application:I,message:"Application created successfully"},{status:201})}catch(e){return console.error("Create application error:",e),p.NextResponse.json({error:"Internal server error"},{status:500})}}let T=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/applications/route",pathname:"/api/applications",filename:"route",bundlePath:"app/api/applications/route"},resolvedPagePath:"/Users/michaeltornaritis/Desktop/Treasury_Take_Home/app/api/applications/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:N,staticGenerationAsyncStorage:_,serverHooks:R}=T,g="/api/applications/route";function I(){return(0,n.patchFetch)({serverHooks:R,staticGenerationAsyncStorage:_})}},5185:(e,t,a)=>{a.d(t,{M1:()=>r,c8:()=>n,uH:()=>s});var i=a(9487);(0,a(5176).T)();let r={create:(e,t,a,r=null)=>i.Z.prepare(`
      INSERT INTO applications (applicant_name, beverage_type, application_data, assigned_agent_id)
      VALUES (?, ?, ?, ?)
    `).run(e,t,a,r),findById:e=>i.Z.prepare("SELECT * FROM applications WHERE id = ?").get(e),findAll:()=>i.Z.prepare("SELECT * FROM applications ORDER BY created_at DESC").all(),findByStatus:e=>i.Z.prepare("SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC").all(e),updateStatus:(e,t,a=null)=>i.Z.prepare(`
      UPDATE applications 
      SET status = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?
      WHERE id = ?
    `).run(t,a,e)},s={create:(e,t,a,r)=>i.Z.prepare(`
      INSERT INTO label_images (application_id, image_type, image_data, mime_type)
      VALUES (?, ?, ?, ?)
    `).run(e,t,a,r),findByApplicationId:e=>i.Z.prepare("SELECT * FROM label_images WHERE application_id = ?").all(e),updateExtraction:(e,t,a,r,s)=>i.Z.prepare(`
      UPDATE label_images 
      SET extracted_data = ?, verification_result = ?, confidence_score = ?, 
          processed_at = CURRENT_TIMESTAMP, processing_time_ms = ?
      WHERE id = ?
    `).run(t,a,r,s,e)},n={create:(e,t,a=null,r=null)=>i.Z.prepare(`
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
    `).all(e)}},9487:(e,t,a)=>{a.d(t,{Z:()=>d});var i=a(5890),r=a.n(i),s=a(5315),n=a.n(s),p=a(2048),o=a.n(p);let l=process.env.DATABASE_PATH||"./data/database.db",E=null,d="phase-production-build"===process.env.NEXT_PHASE?new Proxy({},{get:()=>()=>{throw Error("Database not available during build")}}):new Proxy({},{get(e,t){let a=function(){if(!E){if("phase-production-build"===process.env.NEXT_PHASE)throw Error("Database initialization skipped during build phase");try{let e=n().dirname(l);o().existsSync(e)||o().mkdirSync(e,{recursive:!0}),(E=new(r())(l)).pragma("foreign_keys = ON")}catch(e){throw e}}return E}(),i=a[t];return"function"==typeof i?i.bind(a):i}})},5176:(e,t,a)=>{a.d(t,{T:()=>s});var i=a(9487);let r=!1;function s(){if(!r)try{(function(){i.Z.exec(`
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
  `)})(),r=!0}catch(e){if(process.env.NEXT_PHASE,e instanceof Error&&e.message.includes("Database not available"))return;throw e}}},6101:(e,t,a)=>{var i,r,s;a.d(t,{F:()=>r,Gp:()=>s,c_:()=>i}),function(e){e.BEER="beer",e.WINE="wine",e.SPIRITS="spirits"}(i||(i={})),function(e){e.DOMESTIC="domestic",e.IMPORTED="imported"}(r||(r={})),function(e){e.MATCH="match",e.SOFT_MISMATCH="soft_mismatch",e.HARD_MISMATCH="hard_mismatch",e.NOT_FOUND="not_found",e.NOT_APPLICABLE="not_applicable",e.SURFACED="surfaced"}(s||(s={}))}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),i=t.X(0,[276,972],()=>a(7485));module.exports=i})();