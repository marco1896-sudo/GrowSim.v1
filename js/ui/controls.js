import { applyAction } from '../systems/plantSystem.js';
import { useAd } from '../systems/adSystem.js';
import { toggleScreen } from './screens.js';

let controlsWired = false;

function downloadJsonl(lines = [], fileName) {
  const safeLines = Array.isArray(lines) ? lines : [];
  const blob = new Blob([`${safeLines.join('\n')}\n`], { type: 'application/x-ndjson' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setSheet(dom, open, type) {
  const eventOpen = type === 'event' ? open : dom.eventWrap?.dataset.open === 'true';
  const careOpen = type === 'care' ? open : dom.careWrap?.dataset.open === 'true';

  if (type === 'event' && dom.eventWrap) {
    dom.eventWrap.dataset.open = String(open);
    dom.eventWrap.hidden = !open;
  }

  if (type === 'care' && dom.careWrap) {
    dom.careWrap.dataset.open = String(open);
    dom.careWrap.hidden = !open;
  }

  if (dom.sheetBackdrop) dom.sheetBackdrop.hidden = !(eventOpen || careOpen);
}

function attachClick(selector, handler) {
  document.querySelectorAll(selector).forEach((node) => node.addEventListener('click', handler));
}

export function wireControls(stateRef, dom, commit, services = {}) {
  if (controlsWired) return;
  controlsWired = true;

  attachClick('[data-action="water"]', () => {
    applyAction(stateRef.current, 'water');
    commit('Wasser gegeben');
  });

  attachClick('[data-action="feed"]', () => {
    applyAction(stateRef.current, 'feed');
    commit('Nährstoffe gegeben');
  });

  attachClick('[data-action="prune"]', () => {
    applyAction(stateRef.current, 'prune');
    commit('Pflanze geschnitten');
  });

  attachClick('[data-action="open-dashboard"]', () => {
    toggleScreen('dashboard');
    setSheet(dom, false, 'care');
  });

  attachClick('[data-action="open-analysis"]', () => {
    toggleScreen('analysis');
    setSheet(dom, false, 'care');
  });

  dom.openCareButton?.addEventListener('click', () => setSheet(dom, true, 'care'));
  dom.closeCareButton?.addEventListener('click', () => setSheet(dom, false, 'care'));
  dom.closeEventButton?.addEventListener('click', () => setSheet(dom, false, 'event'));


  dom.sheetBackdrop?.addEventListener('click', () => {
    setSheet(dom, false, 'care');
    setSheet(dom, false, 'event');
  });

  dom.dangerButton?.addEventListener('click', () => {
    const result = useAd(stateRef.current, 'rescue');
    if (!result.ok) {
      commit(result.reason);
      return;
    }

    if (dom.toast) {
      dom.toast.textContent = 'Emergency-Ad abgeschlossen.';
      dom.toast.dataset.show = 'true';
    }
    if (dom.scanline) dom.scanline.dataset.active = 'true';

    window.setTimeout(() => {
      if (dom.toast) dom.toast.dataset.show = 'false';
      if (dom.scanline) dom.scanline.dataset.active = 'false';
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
    services.fastForwardMinutes?.(30);
    commit('Boost-Ad verwendet (+30 Min)');
  });

  attachClick('[data-action="analysis-ad"]', () => {
    const result = useAd(stateRef.current, 'analysis');
    if (!result.ok) {
      commit(result.reason);
      return;
    }
    commit('Analyse-Ad verwendet');
  });

  dom.exportButton?.addEventListener('click', () => {
    downloadJsonl(stateRef.current.telemetry, `growsim-telemetry-${Date.now()}.jsonl`);
    commit('Telemetry exportiert');
  });
}

export function syncSheetBackdrop(dom) {
  const eventOpen = dom.eventWrap?.dataset.open === 'true';
  const careOpen = dom.careWrap?.dataset.open === 'true';
  if (dom.sheetBackdrop) dom.sheetBackdrop.hidden = !(eventOpen || careOpen);
}
