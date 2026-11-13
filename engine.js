export const SIZE = 8, TYPES = 6, ENERGY_MAX = 48, HERO_COUNT = 6;
export const LEVELS = [
  {name:'山门初遇',tag:'雾隐山门',desc:'跟上小队的脚步，收集散落的灵力。',moves:24,score:1600,ice:0,collect:12,target:0},
  {name:'冰晶小径',tag:'霜落石阶',desc:'消除冰晶上的小兽，打通上山的路。',moves:25,score:2200,ice:12,collect:15,target:1},
  {name:'灵狐秘境',tag:'青木幽谷',desc:'借助灵狐之力，让连锁在林间绽放。',moves:26,score:2800,ice:16,collect:18,target:3},
  {name:'炉心试炼',tag:'赤焰熔窟',desc:'双层冰晶需要命中两次，巧用特效破局。',moves:28,score:3400,ice:20,layers:2,collect:20,target:2},
  {name:'并肩破晓',tag:'熔炉之巅',desc:'收集黑水鲶鱼，冲开冰晶，点亮山顶的最后一盏灯。',moves:30,score:4200,ice:24,layers:2,collect:24,target:4}
];
export const BOONS=[
  {id:'torrent',name:'灵涌之契',symbol:'涌',tag:'更快放技能',desc:'技能只需 36 点灵力，适合频繁切换角色、衔接连携。'},
  {id:'spring',name:'回春之契',symbol:'春',tag:'多一点从容',desc:'每消除 20 格返还 1 步，每局最多返还 3 步。'},
  {id:'shatter',name:'破阵之契',symbol:'破',tag:'特效破冰',desc:'开局赠送一颗爆破。特效和技能命中冰晶时，额外破一层。'}
];
export const CHALLENGE={name:'守关挑战',tag:'炉心竞技场',desc:'击退熔炉守卫，收集黑水鲶鱼，并清空冰晶。',moves:28,score:2600,ice:12,collect:14,target:4};
const BOSS_SPECS={2:{name:'岩甲守卫',maxHp:300,freeze:5},4:{name:'炉心守卫',maxHp:460,freeze:6},challenge:{name:'熔炉守卫',maxHp:420,freeze:6}};
const clone=value=>value==null?null:JSON.parse(JSON.stringify(value));
export function linkInfo(from,to){
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=HERO_COUNT||to>=HERO_COUNT||from===to)return null;
  const pair=[from,to].sort().join('');
  if(pair==='01')return {name:'霜雷双绝',shape:'cross',extraIce:true,desc:'十字消除，冰晶额外破一层'};
  if(pair==='23')return {name:'幻影破阵',shape:'blast',leaveBomb:true,desc:'3×3 消除，留下一颗爆破'};
  if(from===5||to===5)return {name:'紫梅同心',shape:'cross',extraIce:true,desc:'十字消除，冰晶额外破一层'};
  if(from===4||to===4)return {name:'黑水合流',shape:'diagonals',desc:'双对角线清场，打断守卫蓄力'};
  return {name:'同心合击',shape:'cross',desc:'十字消除，不消耗灵力与步数'};
}
export function seeded(seed) {const next=() => {seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t=Math.imul(seed ^ seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};next.getState=()=>seed|0;return next;}
export function adjacent(a,b){return a>=0 && b>=0 && a<64 && b<64 && Math.abs(a%8-b%8)+Math.abs((a/8|0)-(b/8|0))===1;}
export function matches(board){
  const runs=[];
  for(let axis=0;axis<2;axis++)for(let line=0;line<8;line++){
    let run=[];
    const end=()=>{if(run.length>=3)runs.push({cells:[...run],axis});run=[];};
    for(let n=0;n<8;n++){const i=axis? n*8+line:line*8+n;const t=board[i];if(!t||t.special==='rainbow'){end();continue;}if(run.length&&board[run[0]].type!==t.type)end();run.push(i);}end();
  }return runs;
}
export function legalMoves(board){
  const moves=[];
  for(let a=0;a<64;a++)for(const b of [a%8<7?a+1:-1,a+8<64?a+8:-1])if(b>=0){
    if(board[a]?.special||board[b]?.special){moves.push([a,b]);continue;}
    [board[a],board[b]]=[board[b],board[a]];const ok=matches(board).length>0;[board[a],board[b]]=[board[b],board[a]];if(ok)moves.push([a,b]);
  }return moves;
}
function cloneBoard(b){return b.map(t=>t?{...t}:null);}
export class Game {
  constructor({level=0,zen=false,challenge=false,seed=Date.now()}={}){this.rng=seeded(seed);this.serial=0;this.level=level;this.challenge=!!challenge;this.zen=!!zen&&!challenge;this.config=challenge?CHALLENGE:LEVELS[level];this.board=[];this.ice=Array(64).fill(0);this.score=0;this.collected=0;this.energy=0;this.moves=this.config.moves;this.turns=0;this.status='playing';this.boon=null;this.boonProgress=0;this.boonCharges=0;this.link=null;this.linkUses=0;this.boss=null;this.makeBoard();
    if(!this.zen){const order=Array.from({length:64},(_,i)=>i).sort(()=>this.rng()-.5);for(let j=0;j<this.config.ice;j++)this.ice[order[j]]=this.config.layers||1;const spec=BOSS_SPECS[challenge?'challenge':level];if(spec){this.boss={...spec,hp:spec.maxHp,charge:4,targets:[]};this.telegraph();}}
  }
  get energyMax(){return this.boon==='torrent'?36:ENERGY_MAX;}
  telegraph(){if(!this.boss)return;const free=this.ice.flatMap((n,i)=>n===0?[i]:[]);for(let i=free.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[free[i],free[j]]=[free[j],free[i]];}this.boss.targets=this.boss.hp>0?free.slice(0,this.boss.freeze):[];this.boss.charge=4;}
  chooseBoon(id){if(this.status!=='playing'||this.boon||!BOONS.some(b=>b.id===id))return {valid:false,frames:[]};this.boon=id;this.energy=Math.min(this.energy,this.energyMax);if(id==='shatter'){const at=[27,...Array.from({length:64},(_,i)=>i)].find(i=>!this.board[i].special);if(at!==undefined)this.board[at].special='bomb';}return {valid:true,frames:[this.snapshot('boon'),this.snapshot('settled')]};}
  exportState(){return {version:3,level:this.level,zen:this.zen,challenge:this.challenge,board:cloneBoard(this.board),ice:[...this.ice],score:this.score,collected:this.collected,energy:this.energy,moves:this.moves,turns:this.turns,boon:this.boon,boonProgress:this.boonProgress,boonCharges:this.boonCharges,link:clone(this.link),linkUses:this.linkUses,boss:clone(this.boss),rngState:this.rng.getState()};}
  static restore(d){
    const validCell=i=>Number.isInteger(i)&&i>=0&&i<64;
    if(!d||!Number.isInteger(d.level)||d.level<0||d.level>4||!Array.isArray(d.board)||d.board.length!==64||!Array.isArray(d.ice)||d.ice.length!==64||!d.board.every(t=>t&&Number.isInteger(t.id)&&t.id>0&&Number.isInteger(t.type)&&t.type>=0&&t.type<TYPES&&[null,'row','col','bomb','rainbow'].includes(t.special))||new Set(d.board.map(t=>t.id)).size!==64||!d.ice.every(n=>Number.isInteger(n)&&n>=0&&n<=2)||!['moves','score','energy','collected'].every(k=>Number.isFinite(d[k])&&d[k]>=0)||(!d.zen&&d.moves<=0))return null;
    const g=new Game({level:d.level,zen:!!d.zen,challenge:!!d.challenge});Object.assign(g,{board:cloneBoard(d.board),ice:[...d.ice],moves:d.moves,score:d.score,collected:d.collected,turns:Number.isInteger(d.turns)?Math.max(0,d.turns):0,serial:Math.max(...d.board.map(t=>t.id)),boon:BOONS.some(b=>b.id===d.boon)?d.boon:null,boonCharges:Math.min(3,Math.max(0,Number(d.boonCharges)||0)),boonProgress:Math.min(19,Math.max(0,Number(d.boonProgress)||0)),linkUses:Math.max(0,Math.floor(Number(d.linkUses)||0))});g.energy=Math.min(g.energyMax,d.energy);
    if(d.link&&Number.isInteger(d.link.from)&&d.link.from>=0&&d.link.from<HERO_COUNT&&Number.isInteger(d.link.turns)&&d.link.turns>0&&d.link.turns<=3&&(g.zen||g.linkUses<2))g.link=clone(d.link);
    if((d.version||0)<3||d.boss===null)g.boss=null;
    else if(d.boss&&g.boss&&Number.isFinite(d.boss.hp)&&d.boss.hp>=0&&d.boss.hp<=g.boss.maxHp&&Number.isInteger(d.boss.charge)&&d.boss.charge>=1&&d.boss.charge<=4&&Array.isArray(d.boss.targets)&&d.boss.targets.every(validCell)&&new Set(d.boss.targets).size===d.boss.targets.length){g.boss={...g.boss,hp:d.boss.hp,charge:d.boss.charge,targets:d.boss.targets.slice(0,g.boss.freeze)};if(g.boss.hp===0)g.boss.targets=[];}
    if(Number.isInteger(d.rngState))g.rng=seeded(d.rngState);return g;
  }
  tile(){return {id:++this.serial,type:Math.floor(this.rng()*TYPES),special:null};}
  makeBoard(){for(let attempt=0;attempt<200;attempt++){this.board=[];for(let i=0;i<64;i++){let t;do{t=this.tile();}while(i%8>=2&&this.board[i-1].type===t.type&&this.board[i-2].type===t.type||i>=16&&this.board[i-8].type===t.type&&this.board[i-16].type===t.type);this.board.push(t);}if(legalMoves(this.board).length)return;}throw new Error('Unable to create a playable board');}
  iceLeft(){return this.ice.filter(x=>x>0).length;}
  snapshot(phase,extra={}){return {phase,board:cloneBoard(this.board),ice:[...this.ice],score:this.score,collected:this.collected,energy:this.energy,energyMax:this.energyMax,moves:this.moves,iceLeft:this.iceLeft(),status:this.status,boon:this.boon,boonProgress:this.boonProgress,boonCharges:this.boonCharges,link:clone(this.link),linkUses:this.linkUses,boss:clone(this.boss),...extra};}
  expand(cells,rainbowType=null){const result=new Set(cells),queue=[...cells];for(let k=0;k<queue.length;k++){const i=queue[k],t=this.board[i];if(!t?.special)continue;const add=j=>{if(!result.has(j)){result.add(j);queue.push(j);}};if(t.special==='row')for(let c=0;c<8;c++)add((i/8|0)*8+c);if(t.special==='col')for(let r=0;r<8;r++)add(r*8+i%8);if(t.special==='bomb')for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const r=(i/8|0)+dr,c=i%8+dc;if(r>=0&&r<8&&c>=0&&c<8)add(r*8+c);}if(t.special==='rainbow'){const counts=Array(6).fill(0);for(const q of this.board)if(q)counts[q.type]++;const target=rainbowType??counts.indexOf(Math.max(...counts));this.board.forEach((q,j)=>{if(q?.type===target)add(j);});}}return result;}
  specialFrom(runs,preferred){
    const creates=new Map();const all=new Map();for(const run of runs)for(const i of run.cells)all.set(i,(all.get(i)||0)+1);
    for(const [i,n]of all)if(n>1&&!this.board[i].special)creates.set(i,'bomb');
    for(const run of runs){if(run.cells.some(i=>creates.has(i)))continue;if(run.cells.length>=4){const at=preferred.find(i=>run.cells.includes(i)&&!this.board[i].special)??run.cells.find(i=>!this.board[i].special);if(at!==undefined)creates.set(at,run.cells.length>=5?'rainbow':run.axis===0?'row':'col');}}return creates;
  }
  resolve(initial=[],preferred=[],rainbowType=null,action={}){const frames=[];let forced=initial,chain=0,peak=0,stepsGained=0,bossFell=false;
    for(let safeguard=0;safeguard<120;safeguard++){
      const runs=matches(this.board);if(!runs.length&&!forced.length)break;chain++;
      const cells=forced.length?forced:runs.flatMap(r=>r.cells);const creates=forced.length?new Map():this.specialFrom(runs,chain===1?preferred:[]);const clear=this.expand(cells,rainbowType);forced=[];rainbowType=null;
      peak=Math.max(peak,clear.size);let points=0,collected=0;
      const enhanced=this.boon==='shatter'&&(action.kind==='skill'||action.kind==='link'||[...clear].some(i=>this.board[i]?.special)||runs.some(r=>r.cells.length>=4));
      const iceDamage=enhanced||action.extraIce?2:1;
      for(const i of clear){if(this.ice[i]>0)this.ice[i]=Math.max(0,this.ice[i]-iceDamage);if(this.board[i]?.type===this.config.target)collected++;if(!creates.has(i))points+=60*chain;}
      this.score+=points;this.collected+=collected;this.energy=Math.min(this.energyMax,this.energy+clear.size);
      let stepBonus=0;if(this.boon==='spring'&&!this.zen&&this.boonCharges<3){this.boonProgress+=clear.size;while(this.boonProgress>=20&&this.boonCharges<3){this.boonProgress-=20;this.boonCharges++;this.moves++;stepBonus++;stepsGained++;}if(this.boonCharges>=3)this.boonProgress=0;}
      let damage=0;if(this.boss&&this.boss.hp>0){damage=Math.min(this.boss.hp,clear.size*((action.kind==='skill'||action.kind==='link'?8:5)+chain-1));this.boss.hp-=damage;this.boss.targets=this.boss.targets.filter(i=>!clear.has(i));if(this.boss.hp===0){this.boss.targets=[];bossFell=true;}}
      frames.push(this.snapshot('clear',{clear:[...clear].filter(i=>!creates.has(i)),chain,points,damage,stepBonus,creates:[...creates]}));
      for(const i of clear)if(!creates.has(i))this.board[i]=null;
      for(const[i,special]of creates){this.board[i]={...this.board[i],special};}
      for(let c=0;c<8;c++){const kept=[];for(let r=7;r>=0;r--)if(this.board[r*8+c])kept.push(this.board[r*8+c]);for(let r=7;r>=0;r--)this.board[r*8+c]=kept[7-r]??this.tile();}
      frames.push(this.snapshot('fall',{chain}));
    }
    if(matches(this.board).length)throw new Error('Cascade did not settle');
    if(action.leaveBomb){const at=[27,...Array.from({length:64},(_,i)=>i)].find(i=>!this.board[i].special);if(at!==undefined){this.board[at].special='bomb';frames.push(this.snapshot('gift',{gift:at}));}}
    if(action.kind==='skill'&&(this.zen||this.linkUses<2)){this.link={from:action.hero,turns:3};frames.push(this.snapshot('link-ready'));}
    const goalsDone=()=>this.score>=this.config.score&&this.collected>=this.config.collect&&this.iceLeft()===0&&(!this.boss||this.boss.hp===0);
    if(this.boss&&this.boss.hp>0&&!goalsDone()){
      if(peak>=4||chain>=2||action.kind==='skill'||action.kind==='link'){this.telegraph();frames.push(this.snapshot('interrupt'));}
      else if(action.kind==='swap'&&this.moves>0){this.boss.charge--;if(this.boss.charge<=0){const frozen=[...this.boss.targets];for(const i of frozen)this.ice[i]=Math.max(1,this.ice[i]);this.telegraph();frames.push(this.snapshot('attack',{frozen}));}}
    }
    if(bossFell)frames.push(this.snapshot('boss-defeated'));
    if(!this.zen&&goalsDone())this.status='won';
    else if(!this.zen&&this.moves<=0)this.status='lost';
    if(this.status==='playing'&&!legalMoves(this.board).length){this.makeBoard();frames.push(this.snapshot('shuffle'));}
    frames.push(this.snapshot('settled',{chain,stepsGained}));return frames;
  }
  swap(a,b){if(this.status!=='playing'||!adjacent(a,b))return {valid:false,frames:[]};
    const ta=this.board[a],tb=this.board[b];[this.board[a],this.board[b]]=[tb,ta];const frames=[this.snapshot('swap')];
    const special=ta.special||tb.special;
    if(!special&&!matches(this.board).length){[this.board[a],this.board[b]]=[ta,tb];frames.push(this.snapshot('invalid'));return {valid:false,frames};}
    this.turns++;if(!this.zen)this.moves--;if(this.link&&--this.link.turns<=0)this.link=null;let initial=[],rainbowType=null;
    if(special){initial=[a,b];if(ta.special==='rainbow'||tb.special==='rainbow'){const double=ta.special==='rainbow'&&tb.special==='rainbow';rainbowType=ta.special==='rainbow'?tb.type:ta.type;this.board.forEach((t,i)=>{if(double||t.type===rainbowType)initial.push(i);});}}
    frames.push(...this.resolve(initial,[b,a],rainbowType,{kind:'swap'}));return {valid:true,frames};
  }
  skill(hero){if(this.status!=='playing'||this.energy<this.energyMax||!Number.isInteger(hero)||hero<0||hero>=HERO_COUNT)return {valid:false,frames:[]};this.energy=0;let cells=[];
    if(hero===0){let best=-1;for(let r=0;r<8;r++){const n=this.ice.slice(r*8,r*8+8).filter(Boolean).length;if(n>best){best=n;cells=Array.from({length:8},(_,c)=>r*8+c);}}}
    if(hero===1){const frozen=this.ice.map((n,i)=>n?i:-1).filter(i=>i>=0);cells=frozen.length?frozen:Array.from({length:8},(_,i)=>24+i);}
    if(hero===2){let best=-1;for(let r=1;r<7;r++)for(let c=1;c<7;c++){const block=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)block.push((r+dr)*8+c+dc);const n=block.filter(i=>this.ice[i]).length;if(n>best){best=n;cells=block;}}}
    if(hero===3){const counts=Array(6).fill(0);this.board.forEach(t=>counts[t.type]++);const target=counts.indexOf(Math.max(...counts));cells=this.board.flatMap((t,i)=>t.type===target?[i]:[]);}
    if(hero===4){const columns=Array.from({length:8},(_,col)=>({col,ice:this.ice.filter((n,i)=>i%8===col&&n>0).length})).sort((a,b)=>b.ice-a.ice||a.col-b.col).slice(0,2);cells=columns.flatMap(({col})=>Array.from({length:8},(_,row)=>row*8+col));}
    if(hero===5){let best=-1;for(const center of [27,...Array.from({length:64},(_,i)=>i)]){const row=center/8|0,col=center%8;const cross=[...new Set([...Array.from({length:8},(_,n)=>row*8+n),...Array.from({length:8},(_,n)=>n*8+col)])];const value=cross.reduce((sum,i)=>sum+this.ice[i],0);if(value>best){best=value;cells=cross;}}}
    return {valid:true,frames:this.resolve(cells,[],null,{kind:'skill',hero})};
  }
  linkSkill(hero){
    const info=this.link&&linkInfo(this.link.from,hero);if(this.status!=='playing'||!info||this.link.turns<=0||(!this.zen&&this.linkUses>=2))return {valid:false,frames:[]};
    let cells=[];
    if(info.shape==='diagonals')cells=Array.from(new Set(Array.from({length:8},(_,r)=>[r*8+r,r*8+7-r]).flat()));
    else{let best=-1;const centers=info.shape==='blast'?Array.from({length:36},(_,n)=>((n/6|0)+1)*8+n%6+1):[27,...Array.from({length:64},(_,i)=>i)];for(const center of centers){const r=center/8|0,c=center%8;const area=info.shape==='blast'?Array.from({length:9},(_,n)=>(r+(n/3|0)-1)*8+c+n%3-1):Array.from(new Set([...Array.from({length:8},(_,n)=>r*8+n),...Array.from({length:8},(_,n)=>n*8+c)]));const value=area.reduce((sum,i)=>sum+this.ice[i],0);if(value>best){best=value;cells=area;}}}
    this.link=null;this.linkUses++;return {valid:true,info,frames:this.resolve(cells,[],null,{kind:'link',hero,extraIce:info.extraIce,leaveBomb:info.leaveBomb})};
  }
  shuffle(){if(this.status!=='playing')return {valid:false,frames:[]};this.makeBoard();return {valid:true,frames:[this.snapshot('shuffle'),this.snapshot('settled')]};}
}
