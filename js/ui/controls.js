import { applyAction } from '../systems/plantSystem.js';
import { useAd } from '../systems/adSystem.js';
import { toggleScreen } from './screens.js';

export function wireControls(stateRef, dom, commit) {
  document.querySelector('[data-action="water"]').addEventListener('click', () => {
    applyAction(stateRef.current, 'water');
    commit('Wasser gegeben');
  });
  document.querySelector('[data-action="feed"]').addEventListener('click', () => {
    applyAction(stateRef.current, 'feed');
    commit('Nährstoffe gegeben');
  });
  document.querySelector('[data-action="prune"]').addEventListener('click', () => {
    applyAction(stateRef.current, 'prune');
    commit('Pflanze geschnitten');
  });

  document.querySelector('[data-action="open-dashboard"]').addEventListener('click', () => toggleScreen('dashboard'));
  document.querySelector('[data-action="open-analysis"]').addEventListener('click', () => toggleScreen('analysis'));

  dom.dangerButton.addEventListener('click', () => {
    const result = useAd(stateRef.current);
    if (!result.ok) {
      commit(result.reason);
      return;
    }
    dom.toast.textContent = 'Ad abgeschlossen. Analyse entsperrt.';
    dom.toast.dataset.show = 'true';
    dom.scanline.dataset.active = 'true';
    setTimeout(() => {
      dom.toast.dataset.show = 'false';
      dom.scanline.dataset.active = 'false';
    }, 1800);
    commit('Emergency-Ad verwendet');
  });
}
