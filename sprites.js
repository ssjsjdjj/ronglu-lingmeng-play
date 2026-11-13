import {rigParts} from './rigs.js';
export const SPRITE_NAMES=['mengchuan','yanjin','jiyuantong','qianmu','heishui','yizhimei'];
export function sprite(hero){
  const name=SPRITE_NAMES[hero]||SPRITE_NAMES[2];
  return `<span class="animal-sprite sprite-${name}${hero<5?' rig-sprite':''}" data-character="${hero}" aria-hidden="true">${hero===5?'<span class="fox-tail"></span>':rigParts(hero)}<span class="sprite-sheet"></span></span>`;
}
