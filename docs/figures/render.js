// node render.js in.svg out.png scale [out.pdf]
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const svg=fs.readFileSync(process.argv[2],'utf8');const m=svg.match(/viewBox="0 0 (\d+) (\d+)"/);const w=+m[1],h=+m[2];
const b=await chromium.launch();const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:Number(process.argv[4]||1)});
await p.setContent('<html><body style="margin:0">'+svg+'</body></html>');
await p.screenshot({path:process.argv[3],clip:{x:0,y:0,width:w,height:h}});
if(process.argv[5]) await p.pdf({path:process.argv[5],width:w+'px',height:h+'px',printBackground:true,pageRanges:'1'});
await b.close()})();
