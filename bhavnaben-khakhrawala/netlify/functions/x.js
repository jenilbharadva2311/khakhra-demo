const crypto=require('crypto'),E=process.env;
const q=async(sql,p=[])=>{const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${E.CF_ACCOUNT_ID}/d1/database/${E.CF_DATABASE_ID}/query`,{method:'POST',headers:{Authorization:'Bearer '+E.CF_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({sql,params:p})}),j=await r.json();if(!j.success)throw new Error(JSON.stringify(j.errors));const x=j.result[0],rs=x.results||[];rs.id=x.meta&&x.meta.last_row_id;return rs};
const sig=t=>crypto.createHmac('sha256',E.SESSION_SECRET).update(t).digest('hex');
const sign=u=>{const p=Buffer.from(JSON.stringify({id:u.id,role:u.role,name:u.name,exp:Date.now()+432e5})).toString('base64url');return p+'.'+sig(p)};
const who=req=>{const m=(req.headers.cookie||'').match(/bk=([^;]+)/);if(!m)return null;const[p,s]=m[1].split('.');if(!s||sig(p)!==s)return null;const u=JSON.parse(Buffer.from(p,'base64url'));return u.exp>Date.now()?u:null};
const hash=(pw,salt)=>{salt=salt||crypto.randomBytes(12).toString('hex');return salt+':'+crypto.scryptSync(pw,salt,32).toString('hex')};
const check=(pw,h)=>{try{return crypto.timingSafeEqual(Buffer.from(hash(pw,h.split(':')[0])),Buffer.from(h))}catch(e){return false}};
const s=(v,n=200)=>String(v==null?'':v).slice(0,n);
const slug=t=>s(t,40).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const SQL=require('./sql.js');let READY=null;
async function setup(){if(READY)return READY;READY=(async()=>{for(const x of SQL.schema)await q(x);const n=await q('SELECT COUNT(*) c FROM categories');if(!n[0].c)for(const x of SQL.seed)await q(x)})().catch(e=>{READY=null;throw e});return READY}
async function img(d){const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(d||'');if(!m||d.length>700000)return null;const r=await q('INSERT INTO images(mime,data) VALUES(?,?)',[m[1],m[2]]);return '/api/img/'+r.id}
async function adm(req,b,res){
 if(b.act=='login'){const em=s(b.email,80).toLowerCase();let u=(await q('SELECT * FROM users WHERE email=? AND active=1',[em]))[0];
  if(!u&&E.ADMIN_EMAIL&&em==E.ADMIN_EMAIL.toLowerCase()&&b.password==E.ADMIN_PASSWORD&&!(await q('SELECT id FROM users LIMIT 1')).length){const r=await q("INSERT INTO users(email,name,password_hash,role) VALUES(?,?,?,'admin')",[em,'Admin',hash(b.password)]);u={id:r.id,name:'Admin',role:'admin'}}
  else if(!u||!check(b.password||'',u.password_hash))throw 401;
  res.setHeader('Set-Cookie','bk='+sign(u)+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200');return{name:u.name,role:u.role}}
 if(b.act=='logout'){res.setHeader('Set-Cookie','bk=; Path=/; Max-Age=0');return{}}
 const u=who(req);if(!u)throw 401;const ad=()=>{if(u.role!='admin')throw 403},id=+b.id;
 const T={f:'flavours',z:'sizes',p:'products'};
 switch(b.act){
 case'me':return u;
 case'orders':{const o=await q('SELECT * FROM orders ORDER BY id DESC LIMIT 300');const i=o.length?await q('SELECT * FROM order_items WHERE order_id>=?',[o[o.length-1].id]):[];return o.map(x=>({...x,items:i.filter(y=>y.order_id==x.id)}))}
 case'status':await q('UPDATE orders SET status=? WHERE id=?',[s(b.v,20),id]);return{};
 case'stats':{const f="FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.status<>'cancelled' GROUP BY k ORDER BY k DESC LIMIT ";return{m:await q("SELECT strftime('%Y-%m',o.created_at) k,COUNT(DISTINCT o.id) orders,SUM(i.qty) packs "+f+'24'),y:await q("SELECT strftime('%Y',o.created_at) k,COUNT(DISTINCT o.id) orders,SUM(i.qty) packs "+f+'10'),top:await q("SELECT i.product_name||' - '||i.flavour k,SUM(i.qty) packs FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.status<>'cancelled' GROUP BY k ORDER BY packs DESC LIMIT 10")}}
 case'prods':{const p=await q('SELECT id,name,image,in_stock FROM products ORDER BY sort,id'),z=await q('SELECT id,product_id,label,in_stock FROM sizes ORDER BY grams'),f=await q('SELECT id,product_id,name,grp,in_stock FROM flavours ORDER BY sort,id');return p.map(x=>({...x,sizes:z.filter(y=>y.product_id==x.id),fl:f.filter(y=>y.product_id==x.id)}))}
 case'addP':{ad();const im=await img(b.image),sl=slug(b.name)+'-'+Date.now().toString(36),c=await q('INSERT INTO categories(slug,name,description,image,shelf_life) VALUES(?,?,?,?,?)',[sl,s(b.name,80),s(b.desc,500),im,s(b.shelf,30)||'45 days']),p=await q('INSERT INTO products(category_id,slug,name,description,image,sort) VALUES(?,?,?,?,?,(SELECT COALESCE(MAX(sort),0)+1 FROM products))',[c.id,sl,s(b.name,80),s(b.desc,500),im]);for(const l of s(b.sizes,100).split(',').map(x=>x.trim()).filter(Boolean))await q('INSERT INTO sizes(product_id,label,grams) VALUES(?,?,?)',[p.id,l,parseInt(l)||0]);return{}}
 case'delP':ad();await q('DELETE FROM products WHERE id=?',[id]);return{};
 case'tog':if(!T[b.t])throw 400;await q(`UPDATE ${T[b.t]} SET in_stock=? WHERE id=?`,[b.v?1:0,id]);return{};
 case'addS':ad();await q('INSERT INTO sizes(product_id,label,grams) VALUES(?,?,?)',[+b.pid,s(b.label,20),parseInt(b.label)||0]);return{};
 case'delS':ad();await q('DELETE FROM sizes WHERE id=?',[id]);return{};
 case'addF':ad();await q('INSERT INTO flavours(product_id,name,grp,image,sort) VALUES(?,?,?,?,(SELECT COALESCE(MAX(sort),0)+1 FROM flavours WHERE product_id=?))',[+b.pid,s(b.name,60),s(b.grp,30)||'Flavour',await img(b.image),+b.pid]);return{};
 case'delF':ad();await q('DELETE FROM flavours WHERE id=?',[id]);return{};
 case'revs':return q('SELECT * FROM reviews ORDER BY (status=\'pending\') DESC,id DESC LIMIT 200');
 case'rev':if(b.v=='delete'){ad();await q('DELETE FROM reviews WHERE id=?',[id])}else await q('UPDATE reviews SET status=? WHERE id=?',[b.v=='approved'?'approved':'rejected',id]);return{};
 case'ws':return q('SELECT * FROM wholesale_inquiries ORDER BY id DESC LIMIT 200');
 case'wst':await q('UPDATE wholesale_inquiries SET status=? WHERE id=?',[s(b.v,20),id]);return{};
 case'manual':{const it=(Array.isArray(b.items)?b.items:[]).filter(i=>i&&i.product&&i.flavour).slice(0,40);if(!it.length)throw 400;const no='M'+Date.now().toString(36).toUpperCase(),dt=/^\d{4}-\d{2}-\d{2}$/.test(b.date||'')?b.date+' 12:00:00':null,o=await q("INSERT INTO orders(order_no,name,phone,notes,status,source,created_at) VALUES(?,?,?,?,?,'manual',COALESCE(?,CURRENT_TIMESTAMP))",[no,s(b.name,80)||'Walk-in',s(b.phone,20),s(b.notes,300),['new','packed','shipped','delivered'].includes(b.status)?b.status:'delivered',dt]);for(const i of it)await q('INSERT INTO order_items(order_id,product_name,flavour,size_label,qty) VALUES(?,?,?,?,?)',[o.id,s(i.product,60),s(i.flavour,60),s(i.size,20),Math.max(1,Math.min(9999,+i.qty||1))]);return{order_no:no}}
 case'delO':ad();await q('DELETE FROM orders WHERE id=?',[id]);return{};
 case'delWs':ad();await q('DELETE FROM wholesale_inquiries WHERE id=?',[id]);return{};
 case'clear':{ad();const t={orders:'orders',reviews:'reviews',wholesale:'wholesale_inquiries'}[b.t];if(!t||b.confirm!='DELETE')throw 400;await q('DELETE FROM '+t);return{}}
 case'users':ad();return q('SELECT id,email,name,role FROM users');
 case'addU':ad();if(!b.email||s(b.password).length<6)throw 400;await q('INSERT INTO users(email,name,password_hash,role) VALUES(?,?,?,?)',[s(b.email,80).toLowerCase(),s(b.name,60),hash(b.password),b.role=='admin'?'admin':'staff']);return{};
 case'delU':ad();if(id==u.id)throw 400;await q('DELETE FROM users WHERE id=?',[id]);return{};
 }throw 400}
async function handle(req,res){const[a,arg]=req.a.split('/'),b=req.body||{};
 try{if(a=='health'){const miss=['CF_ACCOUNT_ID','CF_DATABASE_ID','CF_API_TOKEN','SESSION_SECRET','ADMIN_EMAIL','ADMIN_PASSWORD'].filter(k=>!E[k]);if(miss.length)return res.json({ok:0,missing_env:miss});try{await setup();return res.json({ok:1,categories:(await q('SELECT COUNT(*) c FROM categories'))[0].c})}catch(e){return res.json({ok:0,db_error:String(e.message).slice(0,300)})}}await setup();
 if(a=='products'){const ps=await q('SELECT p.id,p.name,p.description d,p.image,p.slug,p.in_stock,c.shelf_life sh FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.active=1 ORDER BY p.sort,p.id'),z=await q('SELECT product_id,label,in_stock FROM sizes WHERE active=1 ORDER BY grams'),f=await q('SELECT product_id,name,grp,image,in_stock FROM flavours WHERE active=1 ORDER BY sort,id');return res.json({cats:ps.map(p=>({slug:p.slug,name:p.name,desc:p.d,img:p.image,shelf:p.sh||'45 days',sizes:z.filter(x=>x.product_id==p.id).map(x=>({l:x.label,s:p.in_stock&&x.in_stock?1:0})),fl:f.filter(x=>x.product_id==p.id).map(x=>({n:x.name,g:x.grp||'Flavour',i:x.image,s:p.in_stock&&x.in_stock?1:0}))}))})}
 if(a=='order'){if(!b.name||!b.phone||!b.address||!Array.isArray(b.items)||!b.items.length||b.items.length>40)throw 400;const no='BK'+Date.now().toString(36).toUpperCase(),o=await q('INSERT INTO orders(order_no,name,phone,email,address,city,pincode,notes) VALUES(?,?,?,?,?,?,?,?)',[no,s(b.name,80),s(b.phone,20),s(b.email,80),s(b.address,300),s(b.city,60),s(b.pincode,10),s(b.notes,300)]);for(const i of b.items)await q('INSERT INTO order_items(order_id,product_name,flavour,size_label,qty) VALUES(?,?,?,?,?)',[o.id,s(i.product,60),s(i.flavour,60),s(i.size,20),Math.max(1,Math.min(99,+i.qty||1))]);return res.json({order_no:no})}
 if(a=='reviews'){if(req.method=='POST'){if(!b.name||!b.body)throw 400;await q('INSERT INTO reviews(name,city,rating,body,image) VALUES(?,?,?,?,?)',[s(b.name,60),s(b.city,60),Math.max(1,Math.min(5,+b.rating||5)),s(b.body,600),await img(b.image)]);return res.json({ok:1})}return res.json(await q("SELECT name,city,rating,body,image FROM reviews WHERE status='approved' ORDER BY id DESC LIMIT 50"))}
 if(a=='wholesale'){if(!b.business_name||!b.phone)throw 400;await q('INSERT INTO wholesale_inquiries(business_name,contact_name,phone,email,city,business_type,products_interested,monthly_qty,message) VALUES(?,?,?,?,?,?,?,?,?)',['business_name','contact_name','phone','email','city','business_type','products_interested','monthly_qty','message'].map(k=>s(b[k],300)));return res.json({ok:1})}
 if(a=='img'){const r=(await q('SELECT mime,data FROM images WHERE id=?',[+arg]))[0];if(!r)throw 404;return res.bin(r.mime,r.data)}
 if(a=='admin')return res.json(await adm(req,b,res));
 if(a=='export'){const u=who(req);if(!u||u.role!='admin')throw 401;const r=await q('SELECT o.order_no,o.created_at,o.name,o.phone,o.address,o.city,o.pincode,o.source,o.status,i.product_name,i.flavour,i.size_label,i.qty FROM orders o LEFT JOIN order_items i ON i.order_id=o.id ORDER BY o.id DESC'),k=Object.keys(r[0]||{order_no:1}),c=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';res.setHeader('Content-Type','text/csv');res.setHeader('Content-Disposition','attachment; filename=orders.csv');return res.end([k.join(','),...r.map(x=>k.map(y=>c(x[y])).join(','))].join('\n'))}
 throw 404}catch(e){if(typeof e!='number')console.error('ERR',e&&e.message||e);res.status(typeof e=='number'?e:500).json({error:1})}}
exports.handler=async ev=>{const R={statusCode:200,headers:{},body:''},res={setHeader:(k,v)=>{R.headers[k]=v},status:c=>{R.statusCode=c;return res},json:d=>{R.headers['Content-Type']='application/json';R.body=JSON.stringify(d)},end:d=>{R.body=d||''},bin:(m,d)=>{R.headers['Content-Type']=m;R.headers['Cache-Control']='public,max-age=31536000';R.body=d;R.isBase64Encoded=true}};
 let body={};try{body=JSON.parse(ev.body||'{}')}catch(e){}
 await handle({a:(ev.queryStringParameters||{}).a||'',method:ev.httpMethod,headers:ev.headers||{},body},res);return R};
