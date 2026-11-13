const positions=['0% 0%','50% 0%','100% 0%','0% 50%','50% 50%','100% 50%','0% 100%','50% 100%','100% 100%'];
export function rigParts(hero){
  const parts=hero===4?
    [['fin-near',4],['fin-far',5],['whisker-far',6],['whisker-near',7],['crest',8]]:
    [['ear-left',4],['ear-right',5],['tail',6]];
  return parts.map(([joint,frame])=>`<span class="rig-joint joint-${joint}" data-joint="${joint}"><span class="joint-texture" style="--joint-position:${positions[frame]}"></span></span>`).join('');
}
