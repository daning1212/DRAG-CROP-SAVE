const fs=require('fs'),vm=require('vm'),assert=require('assert');
const els=new Map(),context={clearRect(){},fillRect(){},strokeRect(){}};
function el(id){if(!els.has(id))els.set(id,{textContent:'',hidden:false,firstChild:{textContent:''},lastElementChild:{textContent:''},after(){},append(){},setAttribute(){},classList:{add(){},remove(){}},getContext:()=>context,addEventListener(){},getBoundingClientRect:()=>({left:10,top:20,width:960,height:540}),setPointerCapture(){},pause(){},load(){},removeAttribute(){},videoWidth:1920,videoHeight:1080});return els.get(id);}
const events={};const s={document:{getElementById:el,createElement:tag=>el('new-'+tag),addEventListener:(type,fn)=>events[type]=fn},window:{},HTMLCanvasElement:{prototype:{}},console};vm.createContext(s);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),s);
let p=vm.runInContext('point({clientX:490,clientY:290})',s);assert.equal(p.x,960);assert.equal(p.y,540);
p=vm.runInContext('point({clientX:-200,clientY:9999})',s);assert.equal(p.x,0);assert.equal(p.y,1080);
const l=el('overlay');l.onpointerdown({clientX:490,clientY:290,pointerId:1});l.onpointerup({clientX:250,clientY:155});const crop=vm.runInContext('crop',s);assert.equal(crop.x,480);assert.equal(crop.y,270);assert.equal(crop.w,480);assert.equal(crop.h,270);
console.log('PASS: scaled coordinates, bounds, reverse drag');
vm.runInContext('previewVolume=.25;applyVolume()',s);assert.equal(el('video').volume,.25);
vm.runInContext('monitorGain={gain:{value:1}};busy=true;applyVolume()',s);assert.equal(vm.runInContext('monitorGain.gain.value',s),0);assert.equal(el('video').volume,1);
vm.runInContext('busy=false;applyVolume()',s);assert.equal(vm.runInContext('monitorGain.gain.value',s),.25);
let prevented=false;events.drop({preventDefault(){prevented=true;},dataTransfer:{files:[{name:'wrong.txt',type:'text/plain'}]}});assert(prevented);assert(el('status').textContent.includes('영상 파일'));
events.drop({preventDefault(){},dataTransfer:{files:[{},{}]}});assert(el('status').textContent.includes('하나씩'));
console.log('PASS: preview volume, silent export, volume restoration, drop validation');
