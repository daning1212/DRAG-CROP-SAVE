'use strict';
const $=id=>document.getElementById(id), v=$('video'), layer=$('overlay'), ctx=layer.getContext('2d');
let crop=null,start=null,busy=false,fileName='video',sourceURL,resultURL,audio,sourceNode,destination,monitorGain,abortExport;
let previewVolume=1;
function applyVolume(){if(monitorGain){v.volume=1;monitorGain.gain.value=busy?0:previewVolume;}else v.volume=previewVolume;}
const volumeWrap=document.createElement('label');volumeWrap.className='volume';volumeWrap.textContent='🔊 ';
const volumeSlider=document.createElement('input');volumeSlider.type='range';volumeSlider.min='0';volumeSlider.max='1';volumeSlider.step='0.01';volumeSlider.value='1';volumeSlider.setAttribute('aria-label','미리보기 볼륨');volumeSlider.title='미리보기 볼륨 (저장 파일의 소리는 유지)';volumeWrap.append(volumeSlider);$('play').after(volumeWrap);
volumeSlider.oninput=()=>{previewVolume=Number(volumeSlider.value);applyVolume();volumeWrap.firstChild.textContent=previewVolume===0?'🔇 ':'🔊 ';};
const status=s=>$('status').textContent=s;
const format=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function full(){return {x:0,y:0,w:v.videoWidth,h:v.videoHeight};}
function draw(){if(!v.videoWidth)return;layer.width=v.videoWidth;layer.height=v.videoHeight;ctx.clearRect(0,0,layer.width,layer.height);if(crop){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,layer.width,layer.height);ctx.clearRect(crop.x,crop.y,crop.w,crop.h);ctx.strokeStyle='#d4ef86';ctx.lineWidth=Math.max(2,v.videoWidth/250);ctx.strokeRect(crop.x,crop.y,crop.w,crop.h);}$('size').textContent=crop?`${Math.round(crop.w)} × ${Math.round(crop.h)} px`:'영상을 드래그해 영역을 선택하세요';}
function point(e){const r=layer.getBoundingClientRect();return {x:Math.max(0,Math.min(v.videoWidth,(e.clientX-r.left)/r.width*v.videoWidth)),y:Math.max(0,Math.min(v.videoHeight,(e.clientY-r.top)/r.height*v.videoHeight))};}
function reset(){crop=null;draw();}
layer.onpointerdown=e=>{if(busy||!v.videoWidth)return;v.pause();start=point(e);layer.setPointerCapture(e.pointerId);};
layer.onpointermove=e=>{if(!start)return;const p=point(e);crop={x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(p.x-start.x),h:Math.abs(p.y-start.y)};draw();};
layer.onpointerup=e=>{if(!start)return;layer.onpointermove(e);start=null;if(crop.w<4||crop.h<4)reset();};
layer.onpointercancel=()=>{start=null;reset();};
$('reset').onclick=reset;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!busy)reset();});
function loadFile(f){if(!f||busy)return;if(!(f.type.startsWith('video/')||/\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(f.name))){status('영상 파일을 선택해주세요.');return;}v.pause();if(sourceURL)URL.revokeObjectURL(sourceURL);if(resultURL)URL.revokeObjectURL(resultURL);$('output').removeAttribute('src');$('output').load();$('result').hidden=true;fileName=f.name.replace(/\.[^.]+$/,'');sourceURL=URL.createObjectURL(f);v.src=sourceURL;$('editor').hidden=true;crop=null;applyVolume();status('영상을 불러오는 중…');}
$('file').onchange=()=>loadFile($('file').files[0]);
$('upload').lastElementChild.textContent='영상 파일을 여기에 끌어놓으세요 · 클릭해서 선택도 가능';
let dragDepth=0;
document.addEventListener('dragenter',e=>{if(!Array.from(e.dataTransfer?.types||[]).includes('Files'))return;e.preventDefault();dragDepth++;if(!busy)$('upload').classList.add('dragover');});
document.addEventListener('dragover',e=>{if(!Array.from(e.dataTransfer?.types||[]).includes('Files'))return;e.preventDefault();e.dataTransfer.dropEffect=busy?'none':'copy';});
document.addEventListener('dragleave',()=>{dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)$('upload').classList.remove('dragover');});
document.addEventListener('drop',e=>{e.preventDefault();dragDepth=0;$('upload').classList.remove('dragover');if(busy)return;const files=Array.from(e.dataTransfer?.files||[]);if(files.length>1){status('영상은 한 번에 하나씩 끌어놓아 주세요.');return;}loadFile(files[0]);});
v.onloadedmetadata=()=>{if(!Number.isFinite(v.duration)||v.duration<=0){status('영상 길이를 읽지 못했습니다. 다른 파일을 선택해주세요.');return;}$('editor').hidden=false;$('name').textContent=fileName;$('meta').textContent=`${v.videoWidth} × ${v.videoHeight} · ${format(v.duration)}`;$('seek').max=v.duration;draw();status('영상에서 남길 부분을 드래그한 뒤 “잘라서 저장”을 누르세요.');};
v.onerror=()=>{status('이 브라우저에서 재생할 수 없는 영상입니다. MP4 또는 WebM 파일을 시도해주세요.');abortExport?.(new Error('영상 재생 오류'));};
$('play').onclick=async()=>{if(busy)return;if(v.paused){if(audio)await audio.resume();try{await v.play();}catch{status('재생하지 못했습니다. 다른 영상 파일을 선택해주세요.');}}else v.pause();};
v.onplay=()=>$('play').textContent='Ⅱ 일시정지';v.onpause=()=>$('play').textContent='▶ 재생';v.ontimeupdate=()=>{$('seek').value=v.currentTime;$('time').textContent=format(v.currentTime);if(busy)$('progress').value=v.currentTime/v.duration;};
$('seek').oninput=()=>{if(!busy)v.currentTime=Number($('seek').value);};
function lock(on){busy=on;for(const id of ['file','play','seek','reset','export'])$(id).disabled=on;$('cancel').hidden=!on;$('progress').hidden=!on;}
function seekZero(){return new Promise((resolve,reject)=>{if(v.currentTime===0)return resolve();const timeout=setTimeout(()=>{v.removeEventListener('seeked',done);reject(new Error('영상 시작 위치를 불러오지 못했습니다.'));},10000);function done(){clearTimeout(timeout);resolve();}v.addEventListener('seeked',done,{once:true});v.currentTime=0;});}
$('cancel').onclick=()=>abortExport?.(new Error('저장을 취소했습니다.'));
$('export').onclick=async()=>{
 if(busy||!v.videoWidth)return;
 if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){status('최신 Chrome 또는 Edge에서 열어주세요.');return;}
 const area=crop||full(), box={x:Math.floor(area.x),y:Math.floor(area.y),w:Math.floor(area.w/2)*2,h:Math.floor(area.h/2)*2};
 if(box.w<2||box.h<2){status('조금 더 큰 영역을 선택해주세요.');return;}
 lock(true);$('progress').value=0;$('result').hidden=true;status('저장 중… 완료될 때까지 이 탭을 열어두세요.');
 const canvas=document.createElement('canvas');canvas.width=box.w;canvas.height=box.h;const c=canvas.getContext('2d');let stream,rec,raf,timer,recordingError;
 const before=v.currentTime;
 try{
  v.pause();v.playbackRate=1;await seekZero();
  if(!audio){audio=new AudioContext();sourceNode=audio.createMediaElementSource(v);destination=audio.createMediaStreamDestination();monitorGain=audio.createGain();sourceNode.connect(destination);sourceNode.connect(monitorGain);monitorGain.connect(audio.destination);}applyVolume();await audio.resume();
  const paint=()=>{c.drawImage(v,box.x,box.y,box.w,box.h,0,0,box.w,box.h);raf=requestAnimationFrame(paint);};paint();stream=canvas.captureStream(30);for(const track of destination.stream.getAudioTracks())stream.addTrack(track.clone());
  const mime=['video/mp4;codecs=avc1.42001E,mp4a.40.2','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw new Error('이 브라우저는 영상 저장 형식을 지원하지 않습니다.');
  rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000,audioBitsPerSecond:128000});const chunks=[];
  const blob=await new Promise((resolve,reject)=>{
   const stop=err=>{if(err)recordingError=err;v.pause();if(rec.state!=='inactive')rec.stop();else reject(err||new Error('녹화를 시작하지 못했습니다.'));};abortExport=stop;
   v.onended=()=>stop();rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onerror=e=>stop(e.error||new Error('저장 오류'));rec.onstop=()=>recordingError?reject(recordingError):resolve(new Blob(chunks,{type:rec.mimeType}));
   timer=setTimeout(()=>stop(new Error('처리 시간이 초과됐습니다. 탭을 열어두고 다시 시도해주세요.')),(v.duration+30)*1000);rec.start(250);v.play().catch(stop);
  });
  if(blob.size<100)throw new Error('영상 저장에 실패했습니다. 다시 시도해주세요.');if(resultURL)URL.revokeObjectURL(resultURL);resultURL=URL.createObjectURL(blob);$('output').src=resultURL;const a=$('download');a.href=resultURL;a.download=`${fileName}-crop-${box.w}x${box.h}.${blob.type.includes('mp4')?'mp4':'webm'}`;$('result').hidden=false;a.click();status('완료! 다운로드가 시작됐습니다. 아래에서 결과를 확인하거나 다시 저장하세요.');
 }catch(e){status(e.message||'저장하지 못했습니다. 다시 시도해주세요.');}
 finally{clearTimeout(timer);cancelAnimationFrame(raf);v.pause();v.onended=null;abortExport=null;stream?.getTracks().forEach(t=>t.stop());lock(false);applyVolume();v.currentTime=Math.min(before,v.duration||0);}
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&busy)abortExport?.(new Error('탭을 벗어나 저장을 중단했습니다. 이 탭을 열어둔 채 다시 저장해주세요.'));});
