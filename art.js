import {sprite} from './sprites.js';
export const FACES=[sprite(0),sprite(1),sprite(2),sprite(3),sprite(4),sprite(5)];
export const HEROES=[
  {name:'孟川',kind:'黑白小狼',skill:'雷霆一闪',desc:'清除冰晶最多的一整行',color:'#a9bfc1',feature:'黑白毛色 · 白眉纹 · 红绳发髻'},
  {name:'晏烬',kind:'红纹白兔',skill:'霜雪消融',desc:'命中所有冰晶格一次；没有冰晶时清除中间一行',color:'#ded6ed',feature:'白色长耳 · 红色眼周纹 · 玉坠'},
  {name:'姬元通',kind:'傲娇黑猫',skill:'破阵重击',desc:'清除冰晶最多的 3×3 区域',color:'#b5a0d7',feature:'炭黑绒毛 · 淡绿眼睛 · 红绳花结坠'},
  {name:'千木',kind:'橘红灵狐',skill:'万物生长',desc:'清除棋盘上数量最多的一种元素',color:'#efb176',feature:'橘红毛色 · 金色瞳孔 · 耳环'},
  {name:'黑水',kind:'黑水鲶鱼',skill:'黑水涌流',desc:'清除冰晶最多的两整列',color:'#96bccd',feature:'厚嘴长须 · 紫黑背鳍 · 侧眼神态'},
  {name:'一枝梅',kind:'紫色灵狐',skill:'紫梅幻阵',desc:'清除冰晶最多的一行与一列，形成十字幻阵',color:'#c4a2ed',feature:'紫色绒毛 · 尖耳蓬尾 · 梅元知的小伙伴'}
];
export const NAMES=['孟川·小狼','晏烬·白兔','姬元通·黑猫','千木·灵狐','黑水鲶鱼','一枝梅·紫狐'];
export const ICONS={sound:'<path d="M11 5 6 9H3v6h3l5 4zM15 8q5 4 0 8m3-11q8 7 0 14"/>',muted:'<path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3m0 3v.1"/>',gallery:'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1zm0 0v14M6 8h3m6 0h3M6 11h3m6 0h3"/>',pause:'<path d="M8 5v14M16 5v14"/>',hint:'<path d="M8 15c-6-6-1-13 4-12 7-1 9 8 4 12l-1 3H9zM9 21h6M12 7v4"/>',shuffle:'<path d="M3 7h3c5 0 7 10 12 10h3m-4-4 4 4-4 4M3 17h3c2 0 3-2 5-5m2-2c2-3 3-3 5-3h3m-4-4 4 4-4 4"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',home:'<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>'};
export const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]||ICONS.arrow}</svg>`;
