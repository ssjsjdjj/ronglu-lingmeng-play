import {BOONS,linkInfo} from './engine.js';
import {HEROES} from './art.js';

export function createStrategyUI({getGame,getHero,onBoon,onLink,onChallenge,onBossInfo}){
  const shell=document.querySelector('.board-shell');
  const bar=document.createElement('button');bar.type='button';bar.className='tactics-bar';bar.id='boon-btn';bar.setAttribute('aria-label','查看本局灵契');bar.addEventListener('click',onBoon);shell.before(bar);
  const bossPanel=document.createElement('button');bossPanel.type='button';bossPanel.id='boss-panel';bossPanel.className='boss-panel';bossPanel.hidden=true;bossPanel.addEventListener('click',onBossInfo);shell.before(bossPanel);
  const linkButton=document.createElement('button');linkButton.type='button';linkButton.id='link-btn';linkButton.className='link-btn';linkButton.disabled=true;linkButton.addEventListener('click',onLink);document.querySelector('#skill-btn').after(linkButton);
  const challengeButton=document.createElement('button');challengeButton.type='button';challengeButton.id='challenge-btn';challengeButton.className='tool-btn challenge-tool';challengeButton.addEventListener('click',onChallenge);document.querySelector('.tools').appendChild(challengeButton);
  return {render(s,{busy,paused}){
    const g=getGame(),hero=getHero(),boon=BOONS.find(b=>b.id===s.boon),info=s.link&&linkInfo(s.link.from,hero),remaining=g.zen?'∞':Math.max(0,2-s.linkUses);
    const boonDetail=!boon?'选择一个增益，再出发':boon.id==='torrent'?'36 点即可放技能':boon.id==='spring'?`返还 ${s.boonCharges}/3 步 · 进度 ${s.boonProgress}/20`:'特效与技能额外破冰';
    bar.innerHTML=`<span class="boon-seal">${boon?.symbol||'契'}</span><span class="boon-copy"><strong>${boon?.name||'本局灵契'}</strong><small>${boonDetail}</small></span><span class="link-count">连携 ${remaining} 次<span>${s.link?'待接招 · '+s.link.turns+' 步':'技能后换人接招'}</span></span>`;
    bar.disabled=busy||paused;bar.setAttribute('aria-label',`本局灵契：${boon?.name||'尚未选择'}，${boonDetail}`);
    const disabled=busy||paused||s.status!=='playing';
    if(s.link){linkButton.innerHTML=info?`<span class="link-glyph">✧</span><span><strong>${info.name}</strong><small>${HEROES[s.link.from].name} → ${HEROES[hero].name} · 免费追击</small></span><b>${s.link.turns}步</b>`:`<span class="link-glyph">✧</span><span><strong>切换角色，接一招</strong><small>点选另一位角色 · ${s.link.turns} 步内有效</small></span>`;}
    else linkButton.innerHTML=`<span class="link-glyph">✧</span><span><strong>连携追击</strong><small>${remaining===0?'本局连携已用完':'放完技能后换人，免费接招'}</small></span><b>${remaining}</b>`;
    linkButton.disabled=disabled||!info||remaining===0;linkButton.classList.toggle('ready',!linkButton.disabled);linkButton.setAttribute('aria-label',info?`${info.name}：${info.desc}，不消耗灵力和步数`:'连携追击：释放技能后，切换另一位角色发动');
    document.querySelectorAll('.hero-option').forEach((e,i)=>e.classList.toggle('can-link',!!s.link&&i!==s.link.from&&!disabled));
    const b=s.boss;bossPanel.hidden=!b;
    if(b){const defeated=b.hp===0;bossPanel.classList.toggle('defeated',defeated);bossPanel.disabled=busy||paused;bossPanel.setAttribute('aria-label',`${b.name}，气血 ${b.hp}/${b.maxHp}，${defeated?'已击退':b.charge+' 步后冻结 '+b.targets.length+' 格，点击查看战斗规则'}`);bossPanel.innerHTML=`<span class="boss-mask">${defeated?'✓':'焰'}</span><span class="boss-copy"><span class="boss-line"><strong>${b.name}</strong><span class="boss-hp">${b.hp}<small> / ${b.maxHp}</small></span>${s.damage?'<b class="damage-number">−'+s.damage+'</b>':''}</span><span class="boss-health" role="progressbar" aria-label="守卫气血" aria-valuemin="0" aria-valuemax="${b.maxHp}" aria-valuenow="${b.hp}"><i style="width:${b.hp/b.maxHp*100}%"></i></span><span class="boss-warning">${defeated?'守卫已击退 · 完成剩余目标即可过关':`<span class="charge-pips">${Array.from({length:4},(_,i)=>`<i class="${i<b.charge?'lit':''}"></i>`).join('')}</span>${b.charge} 步后冻结 ${b.targets.length} 格 · 四消或连锁可打断`}</span></span>`;}
    challengeButton.innerHTML=`<span class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 10l8 6m0-6-8 6"/></svg></span><span>${g.challenge?'回到冒险':'守关挑战'}<small>读懂预告，打断守卫</small></span><b>↗</b>`;challengeButton.disabled=disabled;
  }};
}

export function boonChoiceHTML(challenge){return `<div class="modal-eyebrow">${challenge?'守关挑战 · 战前灵契':'每次出发，都有新选择'}</div><h2 id="modal-title">带上哪一种灵契？</h2><p class="boon-intro">${challenge?'守卫每 4 步冻结标记格。消除标记格削弱攻击，四消、连锁和技能可打断蓄力。':'选一个本局增益，按你喜欢的节奏上山。'}</p><div class="boon-choices">${BOONS.map(b=>`<button class="boon-choice" data-action="boon-pick" data-value="${b.id}"><span class="choice-seal">${b.symbol}</span><span><strong>${b.name}<small>${b.tag}</small></strong><span class="choice-desc">${b.desc}</span></span><b>选择 ›</b></button>`).join('')}</div><p class="boon-note">本局生效 · 重新开局可重新选择 · 无消耗</p>`;}
