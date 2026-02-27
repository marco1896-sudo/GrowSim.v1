import { applyAction } from '../systems/plantSystem.js';
import { useAd } from '../systems/adSystem.js';
import { toggleScreen } from './screens.js';

function downloadJsonl(lines, fileName) {
  const blob = new Blob([`${lines.join('\n')}\n`], { type: 'application/x-ndjson' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

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
    const result = useAd(stateRef.current, 'rescue');
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

  if (dom.exportButton) {
    dom.exportButton.addEventListener('click', () => {
      downloadJsonl(stateRef.current.telemetry, `growsim-telemetry-${Date.now()}.jsonl`);
      commit('Telemetry exportiert');
    });
  }
}
