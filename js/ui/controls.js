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

function setSheet(dom, open, type = 'care') {
  const eventOpen = type === 'event' ? open : dom.eventWrap?.dataset.open === 'true';
  const careOpen = type === 'care' ? open : dom.careWrap?.dataset.open === 'true';
  if (dom.eventWrap && type === 'event') {
    dom.eventWrap.dataset.open = String(open);
    dom.eventWrap.hidden = !open;
  }
  if (dom.careWrap && type === 'care') {
    dom.careWrap.dataset.open = String(open);
    dom.careWrap.hidden = !open;
  }
  if (dom.sheetBackdrop) {
    dom.sheetBackdrop.hidden = !(eventOpen || careOpen);
  }
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

  document.querySelector('[data-action="open-dashboard"]').addEventListener('click', () => {
    toggleScreen('dashboard');
    setSheet(dom, false, 'care');
  });

  document.querySelector('[data-action="open-analysis"]').addEventListener('click', () => {
    toggleScreen('analysis');
    setSheet(dom, false, 'care');
  });

  dom.openCareButton?.addEventListener('click', () => setSheet(dom, true, 'care'));
  dom.closeCareButton?.addEventListener('click', () => setSheet(dom, false, 'care'));
  dom.sheetBackdrop?.addEventListener('click', () => {
    setSheet(dom, false, 'care');
    if (dom.eventWrap?.dataset.open === 'false') dom.sheetBackdrop.hidden = true;
  });

  dom.dangerButton.addEventListener('click', () => {
    const result = useAd(stateRef.current, 'rescue');
    if (!result.ok) {
      commit(result.reason);
      return;
    }
    dom.toast.textContent = 'Emergency-Ad abgeschlossen.';
    dom.toast.dataset.show = 'true';
    dom.scanline.dataset.active = 'true';
    setTimeout(() => {
      dom.toast.dataset.show = 'false';
      dom.scanline.dataset.active = 'false';
    }, 1800);
    commit('Emergency-Ad verwendet');
    setSheet(dom, false, 'care');
  });

  dom.boostButton?.addEventListener('click', () => {
    const result = useAd(stateRef.current, 'skip-time');
    if (!result.ok) {
      commit(result.reason);
      return;
    }
    commit('Boost-Ad verwendet (+30 Min Demo)');
  });

  if (dom.exportButton) {
    dom.exportButton.addEventListener('click', () => {
      downloadJsonl(stateRef.current.telemetry, `growsim-telemetry-${Date.now()}.jsonl`);
      commit('Telemetry exportiert');
    });
  }
}

export function syncSheetBackdrop(dom) {
  const eventOpen = dom.eventWrap?.dataset.open === 'true';
  const careOpen = dom.careWrap?.dataset.open === 'true';
  if (dom.sheetBackdrop) dom.sheetBackdrop.hidden = !(eventOpen || careOpen);
}
