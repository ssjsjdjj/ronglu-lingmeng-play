export const CAST_PROFILES=[
  {prepare:300,strike:650,impact:140,recover:220,caption:'竖耳蓄势，雷光突进'},
  {prepare:350,strike:740,impact:240,recover:240,caption:'长耳回弹，霜华绽放'},
  {prepare:320,strike:720,impact:190,recover:240,caption:'压耳甩尾，重爪破阵'},
  {prepare:340,strike:780,impact:220,recover:240,caption:'旋尾分影，灵叶回旋'},
  {prepare:360,strike:780,impact:200,recover:240,caption:'张鳍摆须，双流破冰'},
  {prepare:340,strike:700,impact:180,recover:260,caption:'狐尾流光，紫梅成阵'}
];

export function drawCharacterBeam(ctx,b,w,h){
  const p=b.age/b.life;if(p>=1)return;
  const fade=Math.sin(Math.PI*p)**.65,ease=1-(1-p)**3;
  ctx.save();ctx.globalAlpha=fade;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=b.color;ctx.shadowBlur=12;ctx.strokeStyle=b.color;
  if(b.kind==='element-charge'){
    const radius=w*(.34-.15*p);ctx.translate(w*.5,h*.51);ctx.rotate(p*(b.hero===3?-2:1.3));ctx.lineWidth=1;
    for(let n=0;n<6;n++){const a=n*Math.PI/3;ctx.beginPath();ctx.ellipse(0,0,radius,radius*.65,a,a+.2,a+1.1);ctx.stroke();ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(Math.cos(a)*radius,Math.sin(a)*radius*.65,2.1,0,Math.PI*2);ctx.fill();}
  }else if(b.kind==='thunder'){
    const y=b.y??h*.45,phase=Math.floor(p*16),points=Array.from({length:25},(_,n)=>({x:n*w/24,y:y+(n===0||n===24?0:Math.sin(n*1.83+phase)*8*(1-p*.5))}));
    ctx.globalCompositeOperation='lighter';ctx.lineWidth=5*(1-p)+1;ctx.beginPath();points.forEach((q,n)=>n?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.shadowBlur=0;ctx.lineWidth=1.4;ctx.strokeStyle='#f6fcff';ctx.stroke();
    for(let n=1;n<5;n++){const q=points[n*5],dir=n%2?1:-1;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x+w*.04,q.y+h*.035*dir);ctx.lineTo(q.x+w*.09,q.y+h*.12*dir);ctx.lineTo(q.x+w*.11,q.y+h*.13*dir);ctx.stroke();}
    const head=w*Math.min(1,p*2.6);ctx.fillStyle='#e0f4ff';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(head,y,4*(1-p)+1,0,Math.PI*2);ctx.fill();
  }else if(b.kind==='frost-crystal'){
    const radius=w*(.09+.28*ease);ctx.translate(b.x??w/2,b.y??h/2);ctx.rotate(p*.5);ctx.lineWidth=1.7;
    for(let n=0;n<6;n++){const a=n*Math.PI/3;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(radius,0);for(const at of [.42,.72]){const x=radius*at;ctx.moveTo(x-radius*.14,-radius*.12);ctx.lineTo(x,0);ctx.lineTo(x-radius*.14,radius*.12);}ctx.stroke();ctx.restore();}
    ctx.shadowBlur=5;ctx.strokeStyle='#f0fbff';ctx.lineWidth=1;ctx.beginPath();for(let n=0;n<=6;n++){const a=n*Math.PI/3;const x=Math.cos(a)*radius*.72,y=Math.sin(a)*radius*.72;n?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    for(let n=0;n<6;n++){const a=n*Math.PI/3;ctx.save();ctx.translate(Math.cos(a)*radius,Math.sin(a)*radius);ctx.rotate(a+p);ctx.fillStyle='#dcefff';ctx.fillRect(-2,-4,4,8);ctx.restore();}
  }else if(b.kind==='earth-cracks'){
    const x=b.x??w*.5,y=b.y??h*.54,radius=w*(.04+.29*ease);ctx.translate(x,y);ctx.lineWidth=2.1;
    for(let n=0;n<8;n++){const a=n*Math.PI/4;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(radius*.35,radius*.045);ctx.lineTo(radius*.47,-radius*.07);ctx.lineTo(radius*.7,radius*.025);ctx.lineTo(radius,-radius*.03);ctx.stroke();ctx.fillStyle=n%2?'#ddc4a0':'#8b8172';ctx.translate(radius*.85,radius*.02);ctx.rotate(n+p);ctx.beginPath();ctx.moveTo(0,-5*(1-p));ctx.lineTo(4,3);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();}
    ctx.strokeStyle='#ffedb5';ctx.lineWidth=2*(1-p)+.5;ctx.beginPath();ctx.ellipse(0,0,radius*1.2,radius*.44,0,0,Math.PI*2);ctx.stroke();
  }else if(b.kind==='verdant-vines'){
    const x=w*.5,y=h*.57,r=w*(.1+.28*ease);ctx.translate(x,y);ctx.rotate(-p*.4);ctx.lineWidth=1.6;
    for(let n=0;n<5;n++){ctx.save();ctx.rotate(n*Math.PI*2/5);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(r*.2,-r*.3,r*.7,-r*.4,r,0);ctx.stroke();for(const t of [.48,.78]){ctx.save();ctx.translate(r*t,-r*.24);ctx.rotate(t+n);ctx.fillStyle=n%2?'#d7ebb0':'#96d6b2';ctx.beginPath();ctx.ellipse(0,0,3+2*(1-p),7+4*(1-p),-.7,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.restore();}
    ctx.strokeStyle='#f1d7a3';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,r*.95,r*.4,p*2,0,Math.PI*1.8);ctx.stroke();
  }else if(b.kind==='tidal-crown'){
    const x=b.x??w*.5,y=h*.68,r=w*(.08+.16*ease);ctx.translate(x,y);ctx.lineWidth=3*(1-p)+1;ctx.globalCompositeOperation='lighter';
    for(let n=0;n<3;n++){const yy=-r*(n*.38+p*.6);ctx.beginPath();ctx.moveTo(-r,yy);ctx.bezierCurveTo(-r*.5,yy-r*.55,-r*.2,yy-r*.55,0,yy);ctx.bezierCurveTo(r*.2,yy+r*.4,r*.65,yy+r*.4,r,yy-r*.15);ctx.stroke();}
    ctx.fillStyle='#d2fffa';ctx.shadowBlur=7;for(let n=0;n<8;n++){const a=n*Math.PI*2/8;ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*.6-r*.5,1.5+(1-p)*1.5,0,Math.PI*2);ctx.fill();}
  }else if(b.kind==='water-jet'){
    ctx.lineWidth=(12*(1-p)+2);ctx.globalCompositeOperation='lighter';ctx.beginPath();ctx.moveTo(w*.22,h*.66);ctx.bezierCurveTo(w*.15,h*.43,w*.45,h*.3,w*.66,h*.44);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#e1fffc';ctx.shadowBlur=5;ctx.stroke();
    for(let n=0;n<7;n++){const t=(p+n/7)%1,x=w*(.2+t*.46),y=h*(.65-.37*Math.sin(t*Math.PI));ctx.beginPath();ctx.arc(x,y,2+(1-t)*2,0,Math.PI*2);ctx.stroke();}
  }
  ctx.restore();
}
