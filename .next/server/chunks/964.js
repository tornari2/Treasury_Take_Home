"use strict";exports.id=964,exports.ids=[964],exports.modules={9178:(e,t,a)=>{a.d(t,{SO:()=>E,So:()=>c,ed:()=>l,ts:()=>d});var i=a(3400),n=a(8547),r=a(5185);let s=new Map;async function o(e,t){return i.ZP.compare(e,t)}function l(e){let t=(0,n.Z)(),a=Date.now()+864e5;return s.set(t,{userId:e,expiresAt:a}),function(){let e=Date.now();for(let[t,a]of s.entries())e>a.expiresAt&&s.delete(t)}(),t}function E(e){s.delete(e)}async function c(e,t){let a=r.tJ.findByEmail(e);return a&&await o(t,a.password_hash)?(r.tJ.updateLastLogin(a.id),r.c8.create(a.id,"login"),a):null}function d(e){if(!e)return null;let t=function(e){let t=s.get(e);return t?Date.now()>t.expiresAt?(s.delete(e),null):{userId:t.userId}:null}(e);return t&&r.tJ.findById(t.userId)||null}},5185:(e,t,a)=>{a.d(t,{M1:()=>r,c8:()=>o,tJ:()=>n,uH:()=>s});var i=a(9487);(0,a(5176).T)();let n={create:(e,t,a,n="agent")=>i.Z.prepare(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `).run(e,t,a,n),findByEmail:e=>i.Z.prepare("SELECT * FROM users WHERE email = ?").get(e),findById:e=>i.Z.prepare("SELECT * FROM users WHERE id = ?").get(e),updateLastLogin:e=>i.Z.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(e)},r={create:(e,t,a,n=null)=>i.Z.prepare(`
      INSERT INTO applications (applicant_name, beverage_type, expected_label_data, assigned_agent_id)
      VALUES (?, ?, ?, ?)
    `).run(e,t,a,n),findById:e=>i.Z.prepare("SELECT * FROM applications WHERE id = ?").get(e),findAll:()=>i.Z.prepare("SELECT * FROM applications ORDER BY created_at DESC").all(),findByStatus:e=>i.Z.prepare("SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC").all(e),updateStatus:(e,t,a=null)=>i.Z.prepare(`
      UPDATE applications 
      SET status = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?
      WHERE id = ?
    `).run(t,a,e)},s={create:(e,t,a,n)=>i.Z.prepare(`
      INSERT INTO label_images (application_id, image_type, image_data, mime_type)
      VALUES (?, ?, ?, ?)
    `).run(e,t,a,n),findByApplicationId:e=>i.Z.prepare("SELECT * FROM label_images WHERE application_id = ?").all(e),updateExtraction:(e,t,a,n,r)=>i.Z.prepare(`
      UPDATE label_images 
      SET extracted_data = ?, verification_result = ?, confidence_score = ?, 
          processed_at = CURRENT_TIMESTAMP, processing_time_ms = ?
      WHERE id = ?
    `).run(t,a,n,r,e)},o={create:(e,t,a=null,n=null)=>i.Z.prepare(`
      INSERT INTO audit_logs (user_id, application_id, action, details)
      VALUES (?, ?, ?, ?)
    `).run(e,a,t,n),findByUserId:(e,t=100)=>i.Z.prepare(`
      SELECT * FROM audit_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(e,t),findByApplicationId:e=>i.Z.prepare(`
      SELECT * FROM audit_logs 
      WHERE application_id = ? 
      ORDER BY timestamp DESC
    `).all(e)}},9487:(e,t,a)=>{a.d(t,{Z:()=>d});var i=a(5890),n=a.n(i),r=a(5315),s=a.n(r),o=a(2048),l=a.n(o);let E=process.env.DATABASE_PATH||"./data/database.db",c=null,d="phase-production-build"===process.env.NEXT_PHASE?new Proxy({},{get:()=>()=>{throw Error("Database not available during build")}}):new Proxy({},{get(e,t){let a=function(){if(!c){if("phase-production-build"===process.env.NEXT_PHASE)throw Error("Database initialization skipped during build phase");try{let e=s().dirname(E);l().existsSync(e)||l().mkdirSync(e,{recursive:!0}),(c=new(n())(E)).pragma("foreign_keys = ON")}catch(e){throw e}}return c}(),i=a[t];return"function"==typeof i?i.bind(a):i}})},2704:(e,t,a)=>{a.d(t,{k:()=>o,m:()=>s});var i=a(7070),n=a(9178),r=a(1615);async function s(e){let t=await (0,r.cookies)(),a=t.get("session")?.value;if(!a)return i.NextResponse.json({error:"Authentication required"},{status:401});let s=(0,n.ts)(a);return s?{user:s}:i.NextResponse.json({error:"Invalid session"},{status:401})}async function o(e){let t=await s(e);return t instanceof i.NextResponse?t:"admin"!==t.user.role?i.NextResponse.json({error:"Admin access required"},{status:403}):t}},5176:(e,t,a)=>{a.d(t,{T:()=>r});var i=a(9487);let n=!1;function r(){if(!n)try{i.Z.exec(`
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
  `),n=!0}catch(e){if(process.env.NEXT_PHASE,e instanceof Error&&e.message.includes("Database not available"))return;throw e}}},354:(e,t,a)=>{a.d(t,{T:()=>n});let i=new(a(1088)).ZP({apiKey:process.env.OPENAI_API_KEY});async function n(e,t,a){let n=Date.now(),r=e.toString("base64"),s=`data:${t};base64,${r}`,o={brand_name:"Brand name",class_type:"Class/type designation",alcohol_content:"Alcohol content percentage",net_contents:"Net contents (volume)",producer_name:"Producer name",producer_address:"Producer address",health_warning:"Government health warning statement (must be exact)"};"spirits"===a?(o.age_statement="Age statement (if applicable)",o.country_of_origin="Country of origin (if imported)"):"wine"===a?(o.appellation_of_origin="Appellation of origin (if applicable)",o.sulfite_declaration="Sulfite declaration",o.country_of_origin="Country of origin (if imported)"):"beer"===a&&(o.sulfite_declaration="Sulfite declaration (if applicable)",o.country_of_origin="Country of origin (if imported)");let l=Object.entries(o).map(([e,t])=>`- ${e}: ${t}`).join("\n");try{let e=await i.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"system",content:`You are an expert at extracting structured data from alcohol beverage labels. Extract the following fields from the label image and return them as JSON with confidence scores (0-1) for each field. If a field is not found, omit it from the response. For the health_warning field, extract the EXACT text including case and formatting.

Fields to extract:
${l}

Return JSON in this format:
{
  "brand_name": { "value": "...", "confidence": 0.95 },
  "alcohol_content": { "value": "...", "confidence": 0.92 },
  ...
}`},{role:"user",content:[{type:"text",text:"Extract all label information from this image. Pay special attention to the health warning - it must be extracted exactly as shown, including all caps and formatting."},{type:"image_url",image_url:{url:s}}]}],response_format:{type:"json_object"},max_tokens:2e3}),t=e.choices[0]?.message?.content;if(!t)throw Error("No response from OpenAI");let a=JSON.parse(t),r={};for(let[e,t]of Object.entries(a))t&&"object"==typeof t&&"value"in t&&"confidence"in t&&(r[e]={value:String(t.value),confidence:Number(t.confidence)});let o=Object.values(r).map(e=>e.confidence),E=o.length>0?o.reduce((e,t)=>e+t,0)/o.length:0,c=Date.now()-n;return{extractedData:r,confidence:E,processingTimeMs:c}}catch(e){throw console.error("OpenAI extraction error:",e),e}}},307:(e,t,a)=>{function i(e){return e.toLowerCase().trim().replace(/\s+/g," ")}function n(e,t){let a={};for(let[n,r]of Object.entries(e))if(r){let e=t[n];a[n]=function(e,t,a){if(!a||!a.value)return{match:!1,type:"not_found",expected:t};if(!t)return{match:!0,type:"match",extracted:a.value};if("health_warning"===e){var n;let e=t===(n=a.value)?{match:!0,type:"match"}:n.toUpperCase().startsWith("GOVERNMENT WARNING:")&&t===n?{match:!0,type:"match"}:{match:!1,type:"hard_mismatch"};return{match:e.match,type:e.type,expected:t,extracted:a.value}}return t===a.value?{match:!0,type:"match",expected:t,extracted:a.value}:i(t)===i(a.value)||function(e,t){let a=i(e),n=i(t);if(a===n&&e!==t)return!0;let r=a.replace(/[^\w\s]/g,"").trim(),s=n.replace(/[^\w\s]/g,"").trim();return!!(r===s&&r.length>0||s.includes(r)&&r.length>0)}(t,a.value)?{match:!1,type:"soft_mismatch",expected:t,extracted:a.value}:{match:!1,type:"hard_mismatch",expected:t,extracted:a.value}}(n,r,e)}return a}function r(e){let t=Object.values(e).some(e=>"hard_mismatch"===e.type||"not_found"===e.type),a=Object.values(e).some(e=>"soft_mismatch"===e.type);return t?"pending":a?"needs_review":"pending"}a.d(t,{Kz:()=>r,sr:()=>n})}};