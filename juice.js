import {sprite} from './sprites.js';
import {CAST_PROFILES,drawCharacterBeam} from './character-fx.js';

const COLORS=[['#c8edff','#74c8ff','#f5fbff'],['#edf8ff','#b8c5ff','#88ddf8'],['#ffe3a5','#d6c0e9','#f3d49b'],['#cfefac','#8acdb2','#ffe3a4'],['#99f1ee','#74bedd','#c7b7ed'],['#d9b7ff','#b98bed','#f4defb']];
const ACCENTS=['#a9dfff','#d1e9ff','#f2d49d','#c0e6a0','#8ce4e6','#d3a9fa'];
const BLAST_COLORS=['#ffe3a5','#ffdd9e','#fff5cb'];
const PAW='<svg viewBox="0 0 60 60" fill="currentColor" aria-hidden="true"><ellipse cx="18" cy="19" rx="6" ry="8" transform="rotate(-25 18 19)"/><ellipse cx="30" cy="13" rx="6" ry="8"/><ellipse cx="43" cy="19" rx="6" ry="8" transform="rotate(25 43 19)"/><path d="M14 42c0-9 9-18 16-18s17 9 17 18c0 14-11 6-17 6s-16 8-16-6"/></svg>';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const point=(index,w,h)=>({x:(index%8+.5)*w/8,y:((index/8|0)+.5)*h/8});

export function createJuice({board,shell,getAudio,isSoundOn,reduced=false}){
  const canvas=document.createElement('canvas');canvas.className='juice-canvas';canvas.setAttribute('aria-hidden','true');board.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  const stage=document.createElement('div');stage.id='skill-stage';stage.className='skill-stage';stage.hidden=true;stage.setAttribute('aria-hidden','true');board.appendChild(stage);
  const floats=document.createElement('div');floats.className='juice-floats';floats.setAttribute('aria-hidden','true');board.appendChild(floats);
  let w=1,h=1,raf=0,lastTime=0,particles=[],rings=[],beams=[],impactTimer,castSerial=0;
  const resize=()=>{w=Math.max(1,board.clientWidth);h=Math.max(1,board.clientHeight);const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);};
  new ResizeObserver(resize).observe(board);resize();
  const cap=()=>window.innerWidth<700?290:480;
  function wake(){if(!raf&&!document.hidden){lastTime=performance.now();raf=requestAnimationFrame(tick);}}
  function emit(x,y,count,colors,shape='spark',strength=1){
    if(reduced||document.hidden)return;const room=Math.max(0,cap()-particles.length);
    for(let n=0;n<Math.min(count,room);n++){const angle=Math.random()*Math.PI*2,speed=(35+Math.random()*85)*strength;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-15,age:0,life:.32+Math.random()*.38,size:1.5+Math.random()*3.3,color:colors[n%colors.length],shape,angle:Math.random()*6.28,spin:(Math.random()-.5)*8});}wake();
  }
  function ring(x,y,color,radius=42,duration=.4){if(reduced||document.hidden)return;rings.push({x,y,color,radius,life:duration,age:0});if(rings.length>22)rings.shift();wake();}
  function petalSpiral(x,y,count=44){
    if(reduced||document.hidden)return;const room=Math.max(0,cap()-particles.length);
    for(let n=0;n<Math.min(count,room);n++){const angle=n/count*Math.PI*4,radius=w*(.07+.19*n/count),speed=60+Math.random()*45;particles.push({x:x+Math.cos(angle)*radius,y:y+Math.sin(angle)*radius*.68,vx:Math.cos(angle+1.2)*speed,vy:Math.sin(angle+1.2)*speed*.7-14,age:0,life:.55+Math.random()*.45,size:2+Math.random()*2.8,color:COLORS[5][n%3],shape:n%5===0?'star':'petal',angle,spin:4+Math.random()*4});}wake();
  }
  function beam(kind,position,color,duration=.48,extra={}){if(reduced||document.hidden)return;beams.push({kind,position,color,life:duration,age:0,...extra});if(beams.length>18)beams.shift();wake();}
  function tick(now){
    raf=0;if(!ctx)return;if(document.hidden){particles=[];rings=[];beams=[];ctx.clearRect(0,0,w,h);return;}
    const dt=Math.min(.034,(now-lastTime)/1000);lastTime=now;ctx.clearRect(0,0,w,h);
    for(const b of beams){b.age+=dt;drawBeam(b);}
    for(const r of rings){r.age+=dt;const p=r.age/r.life;if(p>=1)continue;ctx.globalAlpha=(1-p)*.75;ctx.strokeStyle=r.color;ctx.lineWidth=2*(1-p)+.4;ctx.beginPath();ctx.arc(r.x,r.y,5+r.radius*(1-(1-p)**2),0,Math.PI*2);ctx.stroke();}
    for(const p of particles){p.age+=dt;const life=p.age/p.life;if(life>=1)continue;p.vx*=Math.exp(-1.8*dt);p.vy+=75*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=(1-life)**.75;ctx.fillStyle=p.color;ctx.strokeStyle=p.color;const s=p.size*(1-life*.4);
      if(p.shape==='bubble'){ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,s,0,Math.PI*2);ctx.stroke();}
      else if(p.shape==='leaf'){ctx.beginPath();ctx.ellipse(0,0,s*.55,s*1.7,.2,0,Math.PI*2);ctx.fill();}
      else if(p.shape==='petal'){ctx.beginPath();ctx.moveTo(0,-s*1.6);ctx.bezierCurveTo(s*1.8,-s*.3,s*.9,s*1.6,0,s);ctx.bezierCurveTo(-s*.9,s*1.6,-s*1.8,-s*.3,0,-s*1.6);ctx.fill();}
      else if(p.shape==='shard'){ctx.beginPath();ctx.moveTo(0,-s*1.8);ctx.lineTo(s,s);ctx.lineTo(-s,s*.8);ctx.closePath();ctx.fill();}
      else if(p.shape==='star'){ctx.beginPath();for(let n=0;n<8;n++){const a=n*Math.PI/4,r=n%2?s*.3:s*1.6;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();}
      else{ctx.lineWidth=Math.max(.8,s*.5);ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(0,s*2);ctx.stroke();}
      ctx.restore();
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;particles=particles.filter(p=>p.age<p.life);rings=rings.filter(r=>r.age<r.life);beams=beams.filter(b=>b.age<b.life);
    if(particles.length||rings.length||beams.length)raf=requestAnimationFrame(tick);
  }
  function drawBeam(b){
    const p=b.age/b.life;if(p>=1)return;const alpha=Math.sin(Math.PI*Math.min(1,p*1.5))*(1-p*.55);ctx.save();ctx.globalAlpha=Math.max(0,alpha);ctx.lineCap='round';ctx.strokeStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=12;
    if(b.kind==='row'||b.kind==='col'||b.kind==='slash'){
      const vertical=b.kind==='col',at=b.position;
      const x1=b.kind==='slash'?w*.05:vertical?at:0,y1=b.kind==='slash'?h*(b.reverse?.9:.1):vertical?0:at,x2=b.kind==='slash'?w*.95:vertical?at:w,y2=b.kind==='slash'?h*(b.reverse?.1:.9):vertical?h:at;
      ctx.lineWidth=Math.max(1,(b.wide?19:10)*(1-p));ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#f3fcf1';ctx.lineWidth=Math.max(.8,3*(1-p));ctx.beginPath();ctx.moveTo(x1,y1);for(let n=1;n<=12;n++){const t=n/12,offset=n===12?0:(n%2?1:-1)*(b.kind==='slash'?4:6)*(1-p);ctx.lineTo(x1+(x2-x1)*t+(vertical?offset:0),y1+(y2-y1)*t+(!vertical?offset:0));}ctx.stroke();
    }else if(b.kind==='claws'){
      ctx.lineWidth=4*(1-p)+1;for(let n=-1;n<=1;n++){ctx.beginPath();ctx.moveTo(w*.24+n*w*.06,h*.26);ctx.quadraticCurveTo(w*.42+n*w*.06,h*.65,w*.69+n*w*.06,h*.72);ctx.stroke();}
    }else if(b.kind==='wave'){
      ctx.shadowBlur=8;ctx.lineWidth=(11+Math.sin(p*Math.PI)*12)*(1-p)+1;const x=b.position;ctx.beginPath();for(let n=0;n<=24;n++){const y=h*n/24,xx=x+Math.sin(n*.7-p*9)*w*.028;n?ctx.lineTo(xx,y):ctx.moveTo(xx,y);}ctx.stroke();
    }else if(b.kind==='orbit'){
      ctx.lineWidth=2*(1-p)+1;ctx.beginPath();ctx.ellipse(w/2,h/2,w*(.15+p*.32),h*.13,p*3,0,Math.PI*1.7);ctx.stroke();
    }else if(b.kind==='tail-sweep'){
      const sweep=1-(1-p)**2,cx=w*.43,cy=h*.64,rx=w*.43,ry=h*.29,start=-Math.PI*.15,span=-Math.PI*.88,from=Math.max(0,sweep-.5),opacity=Math.sin(Math.PI*p)**.6;
      ctx.globalCompositeOperation='lighter';ctx.shadowBlur=18;
      for(let n=0;n<16;n++){const a=from+(sweep-from)*n/16,z=from+(sweep-from)*(n+1)/16;ctx.globalAlpha=opacity*(.12+n/22);ctx.strokeStyle=n%3===0?'#f4d8ae':b.color;ctx.lineWidth=(3+n*.75)*(1-p*.45);ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,-.2,start+span*a,start+span*z,true);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#f9ecff';ctx.lineWidth=1+n*.12;ctx.stroke();ctx.shadowBlur=18;}
      const angle=start+span*sweep,xx=rx*Math.cos(angle),yy=ry*Math.sin(angle),x=cx+xx*Math.cos(-.2)-yy*Math.sin(-.2),y=cy+xx*Math.sin(-.2)+yy*Math.cos(-.2);ctx.globalAlpha=opacity;ctx.fillStyle='#fff2d5';ctx.shadowColor='#dbb1ff';ctx.shadowBlur=24;ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fill();ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.moveTo(x,y-10);ctx.lineTo(x,y+10);ctx.stroke();
    }else if(b.kind==='tail-bloom'){
      const x=b.x??w/2,y=b.y??h/2,r=w*(.12+p*.34);ctx.globalAlpha=Math.sin(Math.PI*p)*.75;ctx.globalCompositeOperation='lighter';ctx.translate(x,y);ctx.rotate(-p*.7);ctx.strokeStyle='#dec0ff';ctx.shadowBlur=15;ctx.lineWidth=1.4;
      for(let n=0;n<12;n++){const a=n*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.7,Math.sin(a)*r*.7);ctx.lineTo(Math.cos(a)*r*1.15,Math.sin(a)*r*1.15);ctx.stroke();ctx.fillStyle=n%2?'#e1beff':'#ffdfaa';ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,2.1,0,Math.PI*2);ctx.fill();}
      ctx.beginPath();ctx.arc(0,0,r*.78,0,Math.PI*2);ctx.stroke();
    }else if(b.kind==='sigil'){
      const radius=w*(.15+.2*Math.min(1,p*3));ctx.translate(b.x??w/2,b.y??h/2);ctx.rotate(p*.8);ctx.lineWidth=1.5;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,radius*.72,0,Math.PI*2);ctx.stroke();
      for(let n=0;n<6;n++){const a=n*Math.PI/3;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(radius*.3,-radius*.25,radius*.75,-radius*.2,radius,0);ctx.bezierCurveTo(radius*.75,radius*.2,radius*.3,radius*.25,0,0);ctx.stroke();ctx.restore();}
      ctx.fillStyle='#f6e8ff';for(let n=0;n<6;n++){const a=n*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(a)*radius,Math.sin(a)*radius,2.4,0,Math.PI*2);ctx.fill();}
      if(b.grand){ctx.rotate(-p*1.7);ctx.strokeStyle='#f0d2aa';ctx.globalAlpha*=.65;ctx.lineWidth=1;ctx.setLineDash([3,8]);ctx.beginPath();ctx.arc(0,0,radius*1.13,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let n=0;n<12;n++){const a=n*Math.PI/6,x=Math.cos(a)*radius*1.13,y=Math.sin(a)*radius*1.13;ctx.save();ctx.translate(x,y);ctx.rotate(a+p);ctx.strokeRect(-2.5,-2.5,5,5);ctx.restore();}}
    }else drawCharacterBeam(ctx,b,w,h);
    ctx.restore();
  }
  function popNumber(frame){
    if(!frame.points||!frame.clear?.length)return;const average=frame.clear.reduce((a,i)=>{const p=point(i,w,h);a.x+=p.x;a.y+=p.y;return a;},{x:0,y:0});const el=document.createElement('div');el.className='clear-score'+(frame.chain>1?' big':'');el.style.left=Math.max(16,Math.min(w-70,average.x/frame.clear.length))+'px';el.style.top=Math.max(30,Math.min(h-30,average.y/frame.clear.length))+'px';el.textContent='+'+frame.points;floats.appendChild(el);while(floats.children.length>7)floats.firstChild.remove();setTimeout(()=>el.remove(),750);
  }
  function impact(chain=1){if(reduced)return;clearTimeout(impactTimer);shell.classList.remove('juice-hit');void shell.offsetWidth;shell.style.setProperty('--hit-size',Math.min(3,chain)*1.2+'px');shell.classList.add('juice-hit');impactTimer=setTimeout(()=>shell.classList.remove('juice-hit'),180);}
  function soundTone(frequency,duration=.14,{delay=0,type='sine',gain=.025,end=frequency}={}){
    const audio=getAudio();if(!isSoundOn()||!audio)return;const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(Math.max(40,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.02);
  }
  function noise(duration=.055,frequency=2000,gain=.018){
    const audio=getAudio();if(!isSoundOn()||!audio)return;const buffer=audio.createBuffer(1,Math.max(1,Math.floor(audio.sampleRate*duration)),audio.sampleRate),data=buffer.getChannelData(0);for(let n=0;n<data.length;n++)data[n]=(Math.random()*2-1)*(1-n/data.length);const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),g=audio.createGain();src.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;g.gain.value=gain;src.connect(filter);filter.connect(g);g.connect(audio.destination);src.start();
  }
  function soundClear(chain,special){const notes=[523,659,784,1046,1318,1568];const k=Math.min(chain-1,5);soundTone(notes[k],.12,{gain:.03});soundTone(notes[Math.min(k+1,5)],.17,{delay:.045,gain:.017});soundTone(special?150:210,.07,{type:'triangle',gain:special?.035:.018,end:65});noise(special?.1:.035,special?1600:2800,special?.025:.013);}
  function soundSkill(hero,linked){
    const base=[392,659,196,523,220,740][hero];soundTone(base,.24,{gain:.03,type:hero===2?'triangle':'sine',end:base*1.5});soundTone(base*1.5,.25,{delay:.1,gain:.025});soundTone(base*2,.25,{delay:.21,gain:.02});noise(hero===4?.22:.1,hero===1?4500:hero===4?1100:2300,.02);if(hero===5)soundTone(1480,.4,{delay:.18,gain:.012,end:2220});if(linked)soundTone(base*3,.32,{delay:.16,gain:.018});
  }
  function clear(frame){
    resize();const indices=frame.clear||[],specialKeys=new Set();
    for(const i of indices){const p=point(i,w,h),type=frame.board[i]?.type??0,colors=COLORS[type]||COLORS[0];emit(p.x,p.y,frame.chain>=3?7:5,colors,type===1?'shard':type===3?'leaf':type===4?'bubble':type===5?'petal':'spark',Math.min(1.5,1+frame.chain*.12));if(frame.chain>=2)ring(p.x,p.y,colors[0],w/8*.6,.28);const special=frame.board[i]?.special;
      if(special){const key=special==='row'?'r'+(i/8|0):special==='col'?'c'+i%8:special+i;if(specialKeys.has(key))continue;specialKeys.add(key);if(special==='row')beam('row',p.y,'#dcefff',.44,{wide:true});else if(special==='col')beam('col',p.x,'#dcefff',.44,{wide:true});else if(special==='bomb'){ring(p.x,p.y,'#ffe4a3',w*.25,.46);emit(p.x,p.y,24,BLAST_COLORS,'star',1.6);}else if(special==='rainbow'){for(let n=0;n<6;n++)ring(p.x,p.y,COLORS[n][0],w*(.14+n*.045),.5+n*.035);emit(p.x,p.y,35,COLORS.flat(),'star',1.7);}}
    }
    if(indices.length){const center=indices[Math.floor(indices.length/2)],p=point(center,w,h);ring(p.x,p.y,COLORS[frame.board[center]?.type||0][0],w*.13,.36);}
    popNumber(frame);impact(frame.chain);soundClear(frame.chain,specialKeys.size>0);
    const selected=document.querySelector('.hero-option.active');if(selected){selected.classList.remove('pet-cheer');void selected.offsetWidth;selected.classList.add('pet-cheer');setTimeout(()=>selected.classList.remove('pet-cheer'),340);}
  }
  function castEffects(hero,targets,linked){
    const color=ACCENTS[hero],centers=targets.map(i=>point(i,w,h));const rows=[...new Set(targets.map(i=>i/8|0))],cols=[...new Set(targets.map(i=>i%8))];
    if(hero===0){for(const row of(rows.length<4?rows:[3])){const y=(row+.5)*h/8;beam('row',y,color,.86,{wide:true});beam('thunder',0,color,.78,{y});for(let n=0;n<6;n++)emit(w*(.1+n*.16),y,5,COLORS[0],'star',1.4);}beam('slash',0,color,.65);}
    if(hero===1){for(const p of centers){ring(p.x,p.y,color,w/8,.62);emit(p.x,p.y,4,COLORS[1],'shard',1.2);}ring(w/2,h/2,color,w*.44,.85);beam('frost-crystal',0,color,.95);for(let n=0;n<7;n++)emit(w*(.1+n*.13),h*.44,5,COLORS[1],'shard',1.3);}
    if(hero===2){const p=centers.length?centers.reduce((a,b)=>({x:a.x+b.x/centers.length,y:a.y+b.y/centers.length}),{x:0,y:0}):{x:w/2,y:h*.54};beam('claws',0,color,.85);beam('earth-cracks',0,color,.9,p);ring(p.x,p.y,color,w*.4,.8);ring(p.x,p.y,'#fff2c7',w*.24,.6);emit(p.x,p.y,32,COLORS[2],'star',1.7);emit(p.x,p.y,18,['#cab9a0','#9c9385','#ede0bc'],'shard',1.6);}
    if(hero===3){beam('verdant-vines',0,color,1);for(let n=0;n<3;n++)beam('orbit',0,n===1?'#ebd5a3':color,.8+n*.08);for(let n=0;n<5;n++)emit(w*(.2+n*.15),h*.58,12,COLORS[3],'leaf',1.5);ring(w*.5,h*.55,'#d6eeb7',w*.38,.8);}
    if(hero===4){for(const col of(cols.length<4?cols:[2,5])){const x=(col+.5)*w/8;beam('wave',x,color,1);beam('tidal-crown',0,color,.95,{x});for(let n=0;n<8;n++)emit(x,h*n/8,4,COLORS[4],'bubble',1.3);}beam('water-jet',0,color,.8);ring(w/2,h*.7,color,w*.45,.9);emit(w*.25,h*.6,22,COLORS[4],'bubble',1.7);}
    if(hero===5){const countRow=r=>targets.filter(i=>(i/8|0)===r).length,countCol=c=>targets.filter(i=>i%8===c).length;const row=rows.reduce((a,b)=>countRow(b)>countRow(a)?b:a,3),col=cols.reduce((a,b)=>countCol(b)>countCol(a)?b:a,3),p=point(row*8+col,w,h);beam('sigil',0,color,1.1,{x:p.x,y:p.y,grand:true});beam('tail-bloom',0,color,.8,{x:p.x,y:p.y});beam('row',p.y,color,.95,{wide:true});beam('col',p.x,color,.95,{wide:true});ring(p.x,p.y,'#efdaff',w*.44,.9);ring(p.x,p.y,'#f0d6ad',w*.29,.7);petalSpiral(p.x,p.y,52);emit(p.x,p.y,38,COLORS[5],'petal',1.8);for(const center of centers.slice(0,24))emit(center.x,center.y,3,COLORS[5],'petal',1.2);}
    if(linked){beam('slash',0,'#fff0bb',.75,{wide:true});beam('slash',0,color,.75,{reverse:true,wide:true});emit(w/2,h*.48,32,[color,'#fff0b0','#f9fcf0'],'star',1.8);}
    for(const p of centers.slice(0,24))emit(p.x,p.y,2,[color,'#f4ffed'],'star',1.1);
  }
  async function cast({hero,name,targets=[],partner=null,preview=false}){
    const serial=++castSerial,linked=partner!==null,purple=hero===5||partner===5,profile=CAST_PROFILES[hero],other=linked?CAST_PROFILES[partner]:null;
    const prepareTime=Math.max(profile.prepare,other?.prepare||0)+(preview?80:0),strikeTime=Math.max(profile.strike,other?.strike||0)+(preview?140:0),impactTime=Math.max(profile.impact,other?.impact||0),recoverTime=Math.max(profile.recover,other?.recover||0)+(preview?40:0);
    resize();const rect=board.getBoundingClientRect();if(rect.top<18||rect.bottom>window.innerHeight-18)board.scrollIntoView({block:'center',behavior:reduced?'auto':'smooth'});
    shell.style.setProperty('--cast-color',ACCENTS[purple?5:hero]);shell.classList.add('is-casting');shell.classList.toggle('tail-casting',purple);
    stage.className=`skill-stage cast-hero-${hero}${linked?' is-linked':''}`;stage.dataset.hero=String(hero);stage.dataset.preview=String(preview);stage.dataset.purple=String(purple);stage.dataset.phase='prepare';stage.dataset.beat='windup';
    stage.style.setProperty('--tail-strike',strikeTime+'ms');stage.style.setProperty('--strike-time',strikeTime+'ms');stage.style.setProperty('--prepare-time',prepareTime+'ms');
    const actor=(id,role)=>`<div class="cast-pet ${role} actor-${id}${id===5?' purple-actor':''}">${sprite(id)}</div>`;
    stage.innerHTML=`<div class="cast-aura"></div><div class="element-halo"></div>${purple?'<div class="tail-halo"><i></i><i></i><i></i></div>':''}${hero===3&&!linked?`<div class="cast-ghosts"><span>${sprite(3)}</span><span>${sprite(3)}</span></div>`:''}<div class="cast-actors">${linked?actor(partner,'partner'):''}${actor(hero,'lead')}</div><div class="cast-caption"><small>${preview?'技能试演':linked?'双人连携':'小兽出招'}</small><strong>${name}</strong><span>${preview?'不消耗灵力与步数':linked?'同心一击，灵力共鸣':profile.caption}</span></div>${hero===2||partner===2?'<div class="cast-paw">'+PAW+'</div>':''}`;
    stage.hidden=false;
    if(reduced){soundSkill(hero,linked);await sleep(140);if(serial!==castSerial)return;stage.hidden=true;shell.classList.remove('is-casting','tail-casting');return;}
    const charge=[190,440,105,330,130,240][hero];soundTone(charge,prepareTime/1000,{gain:.015,end:[392,659,196,523,220,740][hero]});
    beam('element-charge',0,ACCENTS[hero],prepareTime/1000+.45,{hero});if(purple)beam('sigil',0,'#ba92e2',1.5,{x:w*.5,y:h*.5,grand:true});
    await sleep(prepareTime);if(serial!==castSerial)return;
    stage.dataset.phase='strike';stage.dataset.beat='sweep';noise(hero===4?.18:.09,hero===4?900:1800,.018);
    if(purple){beam('tail-sweep',0,'#c9a2f9',.76);petalSpiral(w*.4,h*.61,28);}
    await sleep(impactTime);if(serial!==castSerial)return;
    stage.dataset.beat='bloom';soundSkill(hero,linked);if(hero===2)soundTone(90,.16,{type:'triangle',gain:.035,end:48});if(hero===1)soundTone(2093,.28,{gain:.012});if(hero===4)soundTone(75,.2,{gain:.025,end:45});
    castEffects(hero,targets,linked);if(linked)castEffects(partner,targets,false);impact(linked?3:2);document.querySelector(`.hero-option[data-hero="${hero}"]`)?.classList.add('pet-casting');
    await sleep(strikeTime-impactTime-160);if(serial!==castSerial)return;stage.dataset.beat='afterglow';await sleep(160);if(serial!==castSerial)return;
    stage.dataset.phase='recover';await sleep(recoverTime);if(serial!==castSerial)return;
    stage.hidden=true;stage.dataset.phase='idle';stage.dataset.beat='rest';shell.classList.remove('is-casting','tail-casting');document.querySelectorAll('.pet-casting').forEach(el=>el.classList.remove('pet-casting'));
  }
  function reset(){castSerial++;stage.hidden=true;stage.dataset.phase='idle';shell.classList.remove('is-casting','juice-hit','tail-casting');particles=[];rings=[];beams=[];floats.replaceChildren();ctx?.clearRect(0,0,w,h);if(raf){cancelAnimationFrame(raf);raf=0;}}
  return {clear,cast,reset,select(hero){soundTone([440,587,349,659,392,784][hero],.075,{gain:.012});},celebrate(){for(let n=0;n<8;n++)emit(w*(.1+n*.11),h*.25,12,COLORS[n%6],'star',1.5);},get activeParticles(){return particles.length;}};
}
