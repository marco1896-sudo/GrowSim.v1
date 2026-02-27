import { getAnalysisSnapshot } from '../systems/analysisSystem.js';

const LARGE_C = 263.89;
const MINI_C = 251.33;

const ringKeys = {
  health: 'health', stress: 'stress', water: 'water', nutrition: 'nutrition', growth: 'growth', risk: 'risk'
};

function setRing(node, value, c) {
  const offset = c - (value / 100) * c;
  node.querySelector('.c-ring__value').style.strokeDasharray = `${c}`;
  node.querySelector('.c-ring__value').style.strokeDashoffset = `${offset}`;
  node.querySelector('[data-role="value"]').textContent = `${Math.round(value)}%`;
}

function formatTime(dateMs) {
  const d = new Date(dateMs);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatCountdown(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function renderDashboard(state, dom) {
  const s = state.stats;
  const statsPct = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v * 100]));

  dom.largeRings.forEach((ring) => setRing(ring, statsPct[ringKeys[ring.dataset.ring]], LARGE_C));
  dom.miniRings.forEach((ring) => setRing(ring, statsPct[ringKeys[ring.dataset.ring]], MINI_C));

  dom.statusChip.dataset.state = state.uiState;
  dom.statusChip.textContent = `Status: ${state.uiState}`;
  dom.alertBanner.dataset.state = state.uiState;
  dom.alertBanner.textContent = state.uiState === 'critical'
    ? 'Kritischer Zustand erkannt — Rettungsaktionen nötig.'
    : state.uiState === 'warning'
      ? 'Warnung: Werte fallen in riskante Bereiche.'
      : '';

  dom.plant.dataset.stage = state.plantStage;
  dom.plant.dataset.uiState = state.uiState;

  dom.largeRings[0].classList.toggle('k-critical-pulse', state.uiState === 'critical');
  dom.dangerButton.dataset.prominent = state.uiState !== 'normal';

  if (dom.adCount) dom.adCount.textContent = `${state.adViewsToday}/6`;
  if (dom.boostMeta) dom.boostMeta.textContent = `Ad supported · ${state.adViewsToday}/6 today`;
  if (dom.simTime) dom.simTime.textContent = formatTime(Date.now());
  if (dom.nextEvent) dom.nextEvent.textContent = `in ${formatCountdown((state.nextEventAt || Date.now()) - Date.now())}`;
  if (dom.nextEventMeta) dom.nextEventMeta.textContent = state.currentEvent ? 'Ereignis aktiv' : 'Nächstes Lernereignis';

  dom.analysisScreen.dataset.locked = String(!state.analysisUnlocked);
  if (state.analysisUnlocked) {
    const a = getAnalysisSnapshot(state);
    dom.analysisData.innerHTML = `
      <div>Hydration: <strong>${a.hydration}%</strong></div>
      <div>Nutrition: <strong>${a.nutrition}%</strong></div>
      <div>Resilience: <strong>${a.resilience}%</strong></div>
      <div>${a.recommendation}</div>
    `;
  }

  dom.historyList.innerHTML = state.history
    .slice(0, 8)
    .map((h) => `<li>${new Date(h.t).toLocaleTimeString()} — ${h.label}</li>`)
    .join('');
}
