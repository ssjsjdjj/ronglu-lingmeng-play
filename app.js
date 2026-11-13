import {Game,LEVELS,BOONS,linkInfo,legalMoves,adjacent} from './engine.js';
import {createStrategyUI,boonChoiceHTML} from './strategy-ui.js';
import {createJuice} from './juice.js';
import {FACES,HEROES,NAMES,icon} from './art.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='ronglu-lingmeng-v1';
let progress={unlocked:0,stars:[],best:[],hero:0,sound:false}, active=null;
try{const p=JSON.parse(localStorage.getItem(KEY));if(p&&Array.isArray(p.stars)&&Array.isArray(p.best)){progress={...progress,...p,unlocked:Math.max(0,Math.min(4,Number(p.unlocked)||0)),hero:Math.max(0,Math.min(HEROES.length-1,Number(p.hero)||0))};active=p.active;}}catch{}
let game=new Game({level:progress.unlocked}),hero=progress.hero,selected=-1,busy=false,sound=!!progress.sound,paused=false,shuffles=2,view,toastTimer,comboTimer,pointerStart=null,audio,lastFocus;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const restored=Game.restore(active);if(restored){game=restored;shuffles=Number.isInteger(active.shuffles)?Math.max(0,Math.min(2,active.shuffles)):2;}
function save(){try{progress.hero=hero;progress.sound=sound;progress.active=game.status==='playing'?{...game.exportState(),shuffles}:null;localStorage.setItem(KEY,JSON.stringify(progress));}catch{}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
function audioInit(){if(!audio){const C=window.AudioContext||window.webkitAudioContext;if(C)audio=new C();}audio?.resume().catch(()=>{});}
function tone(freq,time=.1,delay=0,type='sine',gain=.035){if(!sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,audio.currentTime+delay);g.gain.linearRampToValueAtTime(gain,audio.currentTime+delay+.008);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+delay+time);o.connect(g);g.connect(audio.destination);o.start(audio.currentTime+delay);o.stop(audio.currentTime+delay+time+.02);}
function updateSound(){$('#sound-btn').innerHTML=icon(sound?'sound':'muted');$('#sound-btn').setAttribute('aria-label',sound?'关闭音效':'开启音效');$('#sound-btn').setAttribute('aria-pressed',String(sound));}
$('#help-btn').innerHTML=icon('help');$('#pause-btn').innerHTML=icon('pause');$('#hint-btn .tool-icon').innerHTML=icon('hint');$('#shuffle-btn .tool-icon').innerHTML=icon('shuffle');updateSound();
const galleryButton=document.createElement('button');galleryButton.className='icon-btn';galleryButton.id='gallery-btn';galleryButton.setAttribute('aria-label','角色图鉴');galleryButton.title='角色图鉴';galleryButton.innerHTML=icon('gallery');$('.top-actions').insertBefore(galleryButton,$('#help-btn'));
$('#slots').innerHTML=Array.from({length:64},()=>'<div class="slot"></div>').join('');
const mobileScore=document.createElement('div');mobileScore.className='mobile-score';$('.mission').appendChild(mobileScore);
const strategyUI=createStrategyUI({getGame:()=>game,getHero:()=>hero,onBoon:showBoons,onChallenge:confirmBattle,onBossInfo:bossGuide,onLink:async()=>{if(busy||paused)return;const partner=game.link?.from,info=game.link&&linkInfo(partner,hero);if(info){audioInit();await animate(game.linkSkill(hero),info.name,{partner});}}});
$('#hero-options').innerHTML=HEROES.map((h,i)=>`<button class="hero-option" data-hero="${i}" aria-label="选择${h.name}：${h.desc}" title="${h.name} · ${h.skill}">${FACES[i]}</button>`).join('');
const juice=createJuice({board:$('#board'),shell:$('.board-shell'),getAudio:()=>audio,isSoundOn:()=>sound,reduced});
$$('.hero-option').forEach((el,i)=>el.style.setProperty('--idle-delay',(-i*1.4)+'s'));
function updateHero(){const h=HEROES[hero];$$('.hero-option').forEach((e,i)=>{e.classList.toggle('active',i===hero);e.setAttribute('aria-pressed',String(i===hero));});$('#hero-name').textContent=h.name;$('#hero-kind').textContent=h.kind;$('#hero-desc').textContent=h.desc;$('#skill-label').textContent=h.skill;$('#skill-btn').setAttribute('aria-label',`${h.name}：${h.desc}，需 ${game.energyMax} 点灵力`);}
function updateMap(){ $('#journey-map').innerHTML=LEVELS.map((l,i)=>{const completed=progress.stars[i]>0,current=i===game.level&&!game.zen&&!game.challenge,unlocked=i<=progress.unlocked;return `<button class="journey-node ${current?'current':completed?'completed':''}" data-level="${i}" ${unlocked?'':'disabled'} aria-label="第 ${i+1} 关 ${l.name}${unlocked?'':'，尚未解锁'}"><span class="node-circle">${completed?'✓':String(i+1).padStart(2,'0')}</span><span class="node-copy"><strong>${l.name}</strong><small>${completed?'✦'.repeat(progress.stars[i]):l.tag}</small></span></button>`;}).join('');$('#zen-btn').innerHTML=`<span class="zen-icon">${game.zen?'♧':'☁'}</span><span><strong>${game.zen?'回到山间旅程':'只想放松一下？'}</strong><small>${game.zen?'冒险模式 · 继续闯关':'随心模式 · 不限步数'}</small></span><span class="zen-arrow">↗</span>`;}
function goalHTML(face,label,value,done){return `<div class="goal ${done?'done':''}"><span class="goal-face">${face}</span><span class="goal-title">${label}<strong>${value}</strong></span>${done?'<span class="check">✓</span>':''}</div>`;}
function renderHUD(s){document.body.classList.toggle('game-paused',paused);const c=game.config;
  $('#score').textContent=s.score.toLocaleString();$('#moves').textContent=game.zen?'∞':s.moves;$('#steps-label').textContent=game.zen?'慢慢来':'剩余步数';$('.steps').classList.toggle('low',!game.zen&&s.moves<=5);$('#score-target').textContent=c.score.toLocaleString();$('#score-progress').style.width=Math.min(100,s.score/c.score*100)+'%';$$('.star').forEach((e,i)=>e.classList.toggle('lit',s.score>=c.score*(i+1)/3));
  mobileScore.textContent=game.zen?`已收集 ${s.score.toLocaleString()} 灵力`:`收集灵力 ${s.score.toLocaleString()} / ${c.score.toLocaleString()}`;
  mobileScore.hidden=game.zen||c.ice===0;
  $('#energy-number').textContent=`${s.energy} / ${game.energyMax}`;$('#energy-progress').style.width=s.energy/game.energyMax*100+'%';$('#skill-btn').disabled=busy||paused||s.status!=='playing'||s.energy<game.energyMax;$('#skill-state').textContent=s.energy>=game.energyMax?'可释放':`${s.energy}/${game.energyMax}`;
  if(game.zen){$('#goals').innerHTML=goalHTML(FACES[4],'随心收集',`${s.score.toLocaleString()} 灵力`,false);}
  else {let goals=goalHTML(FACES[c.target],'收集伙伴',`${Math.min(c.collect,s.collected)} / ${c.collect}`,s.collected>=c.collect);if(c.ice)goals+=goalHTML('<svg viewBox="0 0 40 40"><path d="m20 3 14 8v18l-14 8-14-8V11z" fill="#a2dfe373" stroke="#b6e6e2"/><path d="m20 3 0 34m-14-26 28 18m0-18L6 29" stroke="#e0f8ee99"/></svg>',s.boss?'清空冰晶':'清除冰晶',s.boss?(s.iceLeft?'还剩 '+s.iceLeft+' 格':'已清空'):`${c.ice-s.iceLeft} / ${c.ice}`,s.iceLeft===0);else goals+=goalHTML('<svg viewBox="0 0 40 40"><path d="m20 3 5 12 13 2-10 9 3 12-11-7-11 7 3-12-10-9 13-2z" fill="#e1c087"/></svg>','收集灵力',`${Math.min(c.score,s.score)} / ${c.score}`,s.score>=c.score);$('#goals').innerHTML=goals;}
  $('#hint-btn').disabled=busy||paused||s.status!=='playing';$('#shuffle-btn').disabled=busy||paused||s.status!=='playing'||(!game.zen&&shuffles<=0);$('#shuffle-count').textContent=game.zen?'∞':shuffles;strategyUI.render(s,{busy,paused});
}
function render(s){view=s;document.body.classList.toggle('battle-view',!!s.boss);const container=$('#tiles'),existing=new Map([...container.children].map(e=>[Number(e.dataset.id),e]));const live=new Set();const clear=new Set(s.clear||[]);
  s.board.forEach((t,i)=>{if(!t)return;live.add(t.id);let el=existing.get(t.id),fresh=!el;if(!el){el=document.createElement('button');el.type='button';el.className='tile new';el.dataset.id=t.id;container.appendChild(el);setTimeout(()=>el.classList.remove('new'),300);}const special=t.special||'';if(el.dataset.special!==special||fresh){el.innerHTML=special==='rainbow'?'<span class="rainbow-orb">✦</span>':FACES[t.type]+(special?`<span class="special-mark special-${special}"></span>`:'');el.dataset.special=special;}el.style.setProperty('--idle-delay',(-t.id%23*.31)+'s');el.style.setProperty('--blink-period',(6+t.id%7*.55)+'s');el.dataset.i=i;el.dataset.type=t.type;el.style.transform=`translate(${i%8*100}%,${(i/8|0)*100}%)`;el.setAttribute('aria-label',`第${(i/8|0)+1}行第${i%8+1}列 ${t.special==='rainbow'?'五彩灵珠':NAMES[t.type]}${t.special&&t.special!=='rainbow'?'，'+({row:'横向雷光',col:'纵向雷光',bomb:'范围爆破'}[t.special]):''}${s.ice[i]?'，'+s.ice[i]+'层冰晶':''}`);el.classList.toggle('selected',i===selected);el.setAttribute('aria-pressed',String(i===selected));el.classList.toggle('dying',clear.has(i));el.disabled=paused;});
  for(const[id,el]of existing)if(!live.has(id))el.remove();const threatened=new Set(s.boss?.targets||[]);$$('.slot').forEach((el,i)=>{el.className='slot'+(s.ice[i]?' ice':'')+(s.ice[i]>1?' double':'')+(threatened.has(i)?' threat':'');});$('#board').classList.toggle('busy',busy);$('#board').setAttribute('aria-busy',String(busy));renderHUD(s);
}
function setSelection(i){selected=i;$$('.tile').forEach(e=>{const on=Number(e.dataset.i)===i;e.classList.toggle('selected',on);e.setAttribute('aria-pressed',String(on));});}
function clearHints(){$$('.hinted').forEach(e=>e.classList.remove('hinted'));}
function combo(chain,points){if(chain<2)return;const el=$('#combo-banner');el.innerHTML=`${['','','双重连消！','妙不可言！','灵力迸发！'][Math.min(chain,4)]}<small>COMBO ×${chain} · +${points} 灵力</small>`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(comboTimer);comboTimer=setTimeout(()=>el.classList.remove('show'),850);}
const wait=ms=>new Promise(r=>setTimeout(r,reduced?Math.min(ms,20):ms));
async function animate(plan,skillName,castOptions={}){
  if(!plan.frames.length)return;busy=true;clearHints();setSelection(-1);
  if(skillName){toast(`${HEROES[hero].name} · ${skillName}`);render({...view,clear:[]});const first=plan.frames.find(f=>f.phase==='clear');await juice.cast({hero,name:skillName,targets:first?.clear||[],partner:castOptions.partner??null});}
  for(const frame of plan.frames){
    render(frame);
    if(frame.phase==='clear'){juice.clear(frame);combo(frame.chain,frame.points);$('#board-message').textContent=frame.chain>1?`${frame.chain} 次连锁！${frame.damage?'对守卫造成 '+frame.damage+' 点伤害':'伙伴们的灵力正在汇聚'}`:`+${frame.points} 灵力${frame.damage?' · 守卫 −'+frame.damage:''}${frame.creates?.length?' · 新特效出现':''}`;if(frame.stepBonus)toast(`回春之契 · +${frame.stepBonus} 步`);await wait(205+Math.min(frame.chain,4)*12);}
    else if(frame.phase==='swap'){tone(330,.07,0,'sine',.012);await wait(185);}
    else if(frame.phase==='invalid'){tone(180,.12,0,'sine',.025);$('#board-message').textContent='这一步没有连成三个，不扣步数，再试试别处吧';await wait(185);}
    else if(frame.phase==='fall')await wait(225);
    else if(frame.phase==='shuffle'){toast('清风吹过，新的机会出现了');await wait(300);}
    else if(frame.phase==='interrupt'){$('#board-message').textContent='蓄力打断！守卫重新准备攻势';$('.boss-panel')?.classList.add('staggered');tone(880,.12);await wait(250);$('.boss-panel')?.classList.remove('staggered');}
    else if(frame.phase==='attack'){toast(frame.frozen.length?`守卫冻结了 ${frame.frozen.length} 格 · 下次用四消或连锁打断它`:'预告格已全部化解，守卫本次冻结失败');$('#board-message').textContent='清除紫色预告格，可以削弱下一次冻结';$('.board-shell').classList.add('frost-impact');tone(130,.2,0,'triangle',.025);await wait(400);$('.board-shell').classList.remove('frost-impact');}
    else if(frame.phase==='boss-defeated'){juice.celebrate();const el=$('#combo-banner');el.innerHTML='守卫击破！<small>炉火，重新亮起来了</small>';el.classList.remove('show');void el.offsetWidth;el.classList.add('show');tone(1046,.3);await wait(500);}
    else if(frame.phase==='gift'){toast('幻影破阵 · 一颗爆破留在了棋盘上');await wait(180);}
    else if(frame.phase==='boon'){toast(`${BOONS.find(b=>b.id===game.boon).name} · 本局生效`);await wait(150);}
    else if(frame.phase==='link-ready')$('#board-message').textContent='换一位角色，3 步内可免费连携追击';
  }
  busy=false;render(game.snapshot('settled'));save();
  if(game.status==='won')won();else if(game.status==='lost')lost();
  else if(game.link)$('#board-message').textContent=`换一位角色，${game.link.turns} 步内可免费连携追击`;
  else if(game.energy>=game.energyMax)$('#board-message').textContent=`灵力已满，点击「${HEROES[hero].skill}」释放技能`;
  else if(game.boss?.hp>0)$('#board-message').textContent=`${game.boss.charge} 步后冻结 · 消除标记格削弱，四消或连锁打断`;
  else if(!plan.valid)setTimeout(()=>{if(!busy)$('#board-message').textContent='交换相邻小兽，三个相连就能消除';},2200);
}
async function move(a,b){if(busy||paused||game.status!=='playing')return;await animate(game.swap(a,b));}
function tap(i){if(busy||paused||game.status!=='playing')return;audioInit();clearHints();if(selected<0){setSelection(i);tone(440,.06,0,'sine',.015);}else if(selected===i)setSelection(-1);else if(adjacent(selected,i))move(selected,i);else setSelection(i);}
$('#board').addEventListener('pointerdown',e=>{const tile=e.target.closest('.tile');if(!tile||busy||paused)return;pointerStart={id:e.pointerId,i:Number(tile.dataset.i),x:e.clientX,y:e.clientY};tile.setPointerCapture(e.pointerId);});
$('#board').addEventListener('pointerup',e=>{if(!pointerStart||e.pointerId!==pointerStart.id)return;const {i,x,y}=pointerStart;pointerStart=null;const dx=e.clientX-x,dy=e.clientY-y;audioInit();if(Math.max(Math.abs(dx),Math.abs(dy))>18){const horizontal=Math.abs(dx)>Math.abs(dy);const j=horizontal?i+(dx>0?1:-1):i+(dy>0?8:-8);if(adjacent(i,j))move(i,j);else setSelection(-1);}else tap(i);});
$('#board').addEventListener('pointercancel',()=>{pointerStart=null;});
$('#board').addEventListener('click',e=>{if(e.detail===0){const tile=e.target.closest('.tile');if(tile)tap(Number(tile.dataset.i));}});
$('#board').addEventListener('keydown',e=>{const tile=e.target.closest('.tile');if(!tile||busy||paused)return;const i=Number(tile.dataset.i),dir={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8}[e.key];if(dir){e.preventDefault();const j=i+dir;if(!adjacent(i,j))return;if(e.shiftKey){move(i,j);}else $(`.tile[data-i="${j}"]`)?.focus();}});
$('#hero-options').addEventListener('click',e=>{const el=e.target.closest('[data-hero]');if(!el||busy)return;hero=Number(el.dataset.hero);juice.select(hero);updateHero();renderHUD(view);save();if(game.energy>=game.energyMax)$('#board-message').textContent=`点击「${HEROES[hero].skill}」释放技能`;});
$('#skill-btn').addEventListener('click',async()=>{if(busy||paused)return;audioInit();await animate(game.skill(hero),HEROES[hero].skill);});
$('#hint-btn').addEventListener('click',()=>{if(busy||paused)return;clearHints();setSelection(-1);const moves=legalMoves(game.board);if(!moves.length){toast('清风正在寻找新的机会');animate(game.shuffle());return;}const pair=moves.find(([a,b])=>!game.board[a].special&&!game.board[b].special)||moves[0];pair.forEach(i=>$(`.tile[data-i="${i}"]`)?.classList.add('hinted'));$('#board-message').textContent='试着交换发光的两只小兽';tone(659,.12);});
$('#shuffle-btn').addEventListener('click',()=>{if(busy||paused||!game.zen&&shuffles<=0)return;if(!game.zen)shuffles--;animate(game.shuffle());});
$('#sound-btn').addEventListener('click',()=>{sound=!sound;if(sound){audioInit();tone(523,.12);tone(783,.12,.09);}updateSound();save();toast(sound?'山间音效已开启':'已静音，安静地消一会儿');});
function closeModal(){if(!$('#modal-backdrop').hidden){$('#modal-backdrop').hidden=true;paused=false;render(view||game.snapshot('settled'));lastFocus?.focus?.();}}
function showModal(html,{closable=true}={}){lastFocus=document.activeElement;paused=true;$('#modal').innerHTML=(closable?`<button class="modal-close" data-action="close" aria-label="关闭">${icon('close')}</button>`:'')+html;$('#modal-backdrop').hidden=false;$('#modal-backdrop').dataset.closable=String(closable);renderHUD(view||game.snapshot('settled'));$('#modal').focus();}
function showBoons(){if(busy)return;const boon=BOONS.find(b=>b.id===game.boon);if(boon){showModal(`<div class="modal-eyebrow">本局灵契</div><h2 id="modal-title">${boon.name}</h2><div class="large-seal">${boon.symbol}</div><p>${boon.desc}</p><p>重新开局时可以选择另一种灵契。</p><div class="modal-actions"><button class="primary-btn" data-action="close">继续冒险</button></div>`);}else showModal(boonChoiceHTML(game.challenge),{closable:game.zen});}
function bossGuide(){if(busy)return;showModal(`<div class="modal-eyebrow">守关战 · 读懂预告再出招</div><h2 id="modal-title">消除，也是战斗</h2><div class="rules"><div class="rule"><span class="rule-num">01</span><div><strong>每次消除都会造成伤害</strong><p>连锁越高，伤害越高；角色技能和连携有更高伤害。</p></div></div><div class="rule"><span class="rule-num">02</span><div><strong>先看紫色的预告格</strong><p>守卫每 4 个有效交换后冻结标记格。提前消除标记格，会减少本次冻结数量。无效交换、提示和重排不推进蓄力。</p></div></div><div class="rule"><span class="rule-num">03</span><div><strong>用四消、连锁或技能打断</strong><p>单次消除至少 4 格、触发 2 次连锁，或使用角色技能、连携，都会让守卫重新蓄力。灵力可以攒到关键时刻再用。</p></div></div><div class="rule"><span class="rule-num">04</span><div><strong>击退守卫，再完成本关目标</strong><p>守卫被击退后不会再冻结。收集、灵力和清空冰晶目标也要一起完成。</p></div></div></div><div class="modal-actions"><button class="primary-btn" data-action="close">明白了，见招拆招</button></div>`);}
function confirmBattle(){if(busy)return;showModal(`<div class="modal-eyebrow">${game.challenge?'歇一歇，继续上山':'全新玩法 · 守关挑战'}</div><h2 id="modal-title">${game.challenge?'回到冒险旅程？':'与熔炉守卫过过招？'}</h2><p>${game.challenge?'已解锁的冒险关卡和最佳成绩会保留。':'读懂冻结预告，用连锁、技能和角色连携打断它。<br>独立挑战，随时可玩。'}</p><p style="font-size:10px">当前棋盘会重新开始。</p><div class="modal-actions"><button class="primary-btn" data-action="${game.challenge?'adventure':'battle-start'}">${game.challenge?'继续冒险':'挑战熔炉守卫'}</button><button class="secondary-btn" data-action="close">先把这一局玩完</button></div>`);}
function help(){if(busy)return;showModal(`<div class="modal-eyebrow">山间小手册</div><h2 id="modal-title">一点就会，一消就爱</h2><div class="rules"><div class="rule"><span class="rule-num">01</span><div><strong>交换小兽，三个相连</strong><p>点击两只相邻小兽，或直接滑动交换。相同形象横排、竖排三个即可消除；紫狐一枝梅与黑猫姬元通分别匹配，无效交换不扣步数。</p></div></div><div class="rule"><span class="rule-num">02</span><div><strong>多连一点，惊喜多一点</strong><p>四消生成整行或整列雷光，五消生成五彩灵珠；T / L 形相连生成范围爆破。交换特效即可触发。</p></div></div><div class="rule"><span class="rule-num">03</span><div><strong>蓄满灵力，伙伴来助阵</strong><p>每消除一格积攒一点灵力。48 点即可释放技能（灵涌之契只需 36 点），不消耗步数。放完后换一位角色，3 个有效步内可免费连携，每局 2 次。</p></div></div><div class="rule"><span class="rule-num">04</span><div><strong>慢慢想，找到自己的节奏</strong><p>冒险中需同时完成灵力、收集和冰晶目标。提示不限次，每关可重排两次。开局先选灵契。守关挑战可随时进入，点击守卫血条查看战斗规则；暂停菜单可进入随心模式。</p></div></div></div><div class="modal-actions"><button class="primary-btn" data-action="close">知道啦，出发</button></div><p style="font-size:9px">键盘：Enter 选中 · 方向键移动焦点 · Shift＋方向键交换</p>`);}
$('#help-btn').addEventListener('click',help);
function showGallery(){
  if(busy)return;
  showModal(`<div class="modal-eyebrow">熔炉山 · 小妖怪图鉴</div><h2 id="modal-title">小家伙们，露一手</h2><p class="gallery-subtitle">点击角色，观看专属动作与技能特效。</p><div class="portrait-gallery">${HEROES.map((h,i)=>`<button class="portrait-card" data-action="hero-preview" data-value="${i}" aria-label="试演${h.name}的${h.skill}" style="--idle-delay:${-i*1.1}s">${FACES[i]}<strong>${i===4?'黑水鲶鱼':h.name}</strong><small>${h.skill}</small><span class="preview-label">▶ 动作试演</span></button>`).join('')}</div><p style="font-size:9px">试演不消耗灵力和步数。<br>一枝梅是紫狐伙伴，黑猫是姬元通。六种小兽分别三消。</p><div class="modal-actions"><button class="primary-btn" data-action="close">回到棋盘</button></div>`);
}
async function previewHero(id){
  if(busy||!Number.isInteger(id)||id<0||id>=HEROES.length)return;
  closeModal();busy=true;clearHints();setSelection(-1);render({...view,clear:[]});audioInit();
  let targets=[];
  if(id===0)targets=Array.from({length:8},(_,c)=>24+c);
  if(id===1)targets=game.ice.flatMap((n,i)=>n?[i]:[]);if(id===1&&!targets.length)targets=Array.from({length:8},(_,c)=>24+c);
  if(id===2)targets=[18,19,20,26,27,28,34,35,36];
  if(id===3){const counts=Array(6).fill(0);game.board.forEach(t=>counts[t.type]++);const type=counts.indexOf(Math.max(...counts));targets=game.board.flatMap((t,i)=>t.type===type?[i]:[]);}
  if(id===4)targets=Array.from({length:8},(_,r)=>[r*8+2,r*8+5]).flat();
  if(id===5)targets=[...new Set([...Array.from({length:8},(_,n)=>24+n),...Array.from({length:8},(_,n)=>n*8+3)])];
  await juice.cast({hero:id,name:HEROES[id].skill,targets,preview:true});
  busy=false;render(game.snapshot('settled'));showGallery();
}
galleryButton.addEventListener('click',showGallery);
function pause(){if(busy)return;showModal(`<div class="modal-animal">${FACES[hero]}</div><div class="modal-eyebrow">山风轻轻，歇一歇</div><h2 id="modal-title">伙伴们在等你</h2><p>${game.zen?'没有时间限制，也不必着急。':`第 ${game.level+1} 关 · ${game.config.name}<br>还剩 ${game.moves} 步，慢慢想下一步。`}</p><div class="modal-actions"><button class="primary-btn" data-action="close">继续冒险</button><button class="secondary-btn" data-action="battle-confirm">${game.challenge?'回到冒险旅程':'守关挑战 · 与守卫过招'}</button><button class="secondary-btn" data-action="restart-confirm">重新开始本关</button><button class="secondary-btn" data-action="mode-confirm">${game.zen?'回到冒险模式':'进入随心模式 · 不限步数'}</button></div>`);}
$('#pause-btn').addEventListener('click',pause);$('#brand').addEventListener('click',e=>{e.preventDefault();pause();});
function confirmRestart(mode=false,level=null){if(busy)return;showModal(`<div class="modal-eyebrow">新的风景在前面</div><h2 id="modal-title">${level!==null?'前往另一段旅程？':mode?(game.zen?'回到冒险？':'随心消一会儿？'):'再出发一次？'}</h2><p>当前棋盘将重新开始，已经解锁的关卡和最佳成绩会保留。</p><div class="modal-actions"><button class="primary-btn" data-action="${level!==null?'goto-level':mode?'switch-mode':'restart'}" ${level!==null?`data-value="${level}"`:''}>${level!==null?'出发':mode?'出发吧':'重新开始'}</button><button class="secondary-btn" data-action="close">留在这里</button></div>`);}
$('#zen-btn').addEventListener('click',()=>confirmRestart(true));
$('#journey-map').addEventListener('click',e=>{const b=e.target.closest('[data-level]');if(!b||b.disabled)return;const i=Number(b.dataset.level);if(i===game.level&&!game.zen)return;confirmRestart(false,i);});
function showLevel(){
  $('#level-name').textContent=game.zen?'随心小憩':game.config.name;$('#level-desc').textContent=game.zen?'跟着山风，慢慢收集属于你的灵力。':game.config.desc;$('#level-count').textContent=game.zen?'∞':game.challenge?'守关':`${String(game.level+1).padStart(2,'0')} / 05`;$('#location-name').textContent=game.zen?'山间小憩':game.config.tag;$('#mode-name').textContent=game.zen?'随心模式':game.challenge?'守关挑战':'冒险模式';
}
function start(level=game.level,zen=game.zen,challenge=game.challenge){
  closeModal();juice.reset();game=new Game({level,zen,challenge});shuffles=2;selected=-1;busy=false;paused=false;$('#tiles').innerHTML='';$('#particles').innerHTML='';$('#combo-banner').classList.remove('show');showLevel();$('#board-message').textContent=game.zen?'没有步数限制，按自己的节奏来':'交换相邻小兽，三个相连就能消除';updateHero();updateMap();render(game.snapshot('start'));save();if(!game.zen&&!game.boon)showBoons();
}
function wonChallenge(){
  progress.challengeBest=Math.max(Number(progress.challengeBest)||0,game.score);progress.challengeWins=(Number(progress.challengeWins)||0)+1;save();tone(523,.25);tone(659,.25,.13);tone(1046,.4,.26);
  showModal(`<div class="modal-animal">${FACES[hero]}</div><div class="modal-eyebrow">守关挑战完成</div><h2 id="modal-title">守卫击破，炉心重燃</h2><div class="modal-stars">✦✦✦</div><p>守卫、冰晶和收集目标全部完成！<br>下次换一种灵契，试试另一组连携。</p><div class="result-stats"><span>收集灵力<b>${game.score.toLocaleString()}</b></span><span>剩余步数<b>${game.moves}</b></span><span>连携次数<b>${game.linkUses}</b></span></div><p style="font-size:10px">挑战最佳灵力：${progress.challengeBest.toLocaleString()}</p><div class="modal-actions"><button class="primary-btn" data-action="restart">换种灵契，再战一局</button><button class="secondary-btn" data-action="adventure">回到冒险旅程</button></div>`,{closable:false});
}
function won(){if(game.challenge){wonChallenge();return;}const stars=game.moves>=8?3:game.moves>=3?2:1;progress.stars[game.level]=Math.max(progress.stars[game.level]||0,stars);progress.best[game.level]=Math.max(progress.best[game.level]||0,game.score);progress.unlocked=Math.max(progress.unlocked,Math.min(4,game.level+1));save();updateMap();tone(523,.25);tone(659,.25,.13);tone(784,.25,.26);tone(1046,.4,.39);showModal(`<div class="modal-animal">${FACES[hero]}</div><div class="modal-eyebrow">山灯又亮了一盏</div><h2 id="modal-title">${game.level===4?'并肩，抵达破晓':'这一路，真漂亮'}</h2><div class="modal-stars" aria-label="${stars} 星">${'✦'.repeat(stars)}<span style="opacity:.18">${'✦'.repeat(3-stars)}</span></div><p>${game.level===4?'五段旅程全部完成！伙伴们一起点亮了熔炉山。':`${game.config.name}已完成，新的山间旅程解锁了。`}</p><div class="result-stats"><span>收集灵力<b>${game.score.toLocaleString()}</b></span><span>剩余步数<b>${game.moves}</b></span></div><div class="modal-actions"><button class="primary-btn" data-action="${game.level<4?'next':'zen'}">${game.level<4?'下一站 · '+LEVELS[game.level+1].name:'在随心模式再玩一会儿'}</button><button class="secondary-btn" data-action="restart">重游这一关</button></div>`,{closable:false});}
function lost(){showModal(`<div class="modal-animal">${FACES[1]}</div><div class="modal-eyebrow">小憩一下，再试一次</div><h2 id="modal-title">好风景值得再来</h2><p>这次收集了 ${game.score.toLocaleString()} 点灵力。<br>${game.boss?.hp>0?'把技能留到守卫蓄力时，再切换角色免费连携。':'换一种灵契，或试试技能后的角色连携。'}</p><div class="modal-actions"><button class="primary-btn" data-action="restart">换种灵契，免费重试</button>${game.challenge?'<button class="secondary-btn" data-action="adventure">回到冒险旅程</button>':''}<button class="secondary-btn" data-action="zen">去随心模式放松一下</button></div>`,{closable:false});}
$('#modal').addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b)return;
  switch(b.dataset.action){
    case 'close':closeModal();break;
    case 'hero-preview':await previewHero(Number(b.dataset.value));break;
    case 'boon-pick':{const plan=game.chooseBoon(b.dataset.value);if(plan.valid){closeModal();updateHero();await animate(plan);}break;}
    case 'restart-confirm':confirmRestart();break;
    case 'mode-confirm':confirmRestart(true);break;
    case 'battle-confirm':confirmBattle();break;
    case 'restart':start();break;
    case 'switch-mode':start(game.zen?progress.unlocked:game.level,!game.zen,false);break;
    case 'goto-level':start(Number(b.dataset.value),false,false);break;
    case 'next':start(game.level+1,false,false);break;
    case 'zen':start(game.level,true,false);break;
    case 'battle-start':start(game.level,false,true);break;
    case 'adventure':start(progress.unlocked,false,false);break;
  }
});
$('#modal-backdrop').addEventListener('click',e=>{if(e.target===$('#modal-backdrop')&&e.currentTarget.dataset.closable==='true')closeModal();});
document.addEventListener('keydown',e=>{if(!$('#modal-backdrop').hidden){if(e.key==='Escape'&&$('#modal-backdrop').dataset.closable==='true'){e.preventDefault();closeModal();}if(e.key==='Tab'){const buttons=$$('#modal button:not(:disabled)');const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('#modal'))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}else if(e.key==='Escape'&&!busy)pause();});
showLevel();updateHero();updateMap();render(game.snapshot('start'));save();if(!game.zen&&!game.boon)showBoons();
