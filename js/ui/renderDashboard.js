import { getAnalysisSnapshot } from '../systems/analysisSystem.js';
import { isEmergencyAvailable, DAILY_AD_LIMIT } from '../systems/adSystem.js';

const LARGE_C = 263.89;
const MINI_C = 251.33;

const ringKeys = {
  health: 'health', stress: 'stress', water: 'water', nutrition: 'nutrition', growth: 'growth', risk: 'risk'
};

function setRing(node, value, c) {
  const safe = Math.max(0, Math.min(100, value || 0));
  const offset = c - (safe / 100) * c;
  node.querySelector('.c-ring__value').style.strokeDasharray = `${c}`;
  node.querySelector('.c-ring__value').style.strokeDashoffset = `${offset}`;
  node.querySelector('[data-role="value"]').textContent = `${Math.round(safe)}%`;
}

function formatTime(dateMs) {
  const d = new Date(dateMs);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatCountdown(minutes) {
  const sec = Math.max(0, Math.floor((minutes || 0) * 60));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function renderDashboard(state, dom) {
  const s = state.stats;

  dom.largeRings.forEach((ring) => setRing(ring, s[ringKeys[ring.dataset.ring]], LARGE_C));
  dom.miniRings.forEach((ring) => setRing(ring, s[ringKeys[ring.dataset.ring]], MINI_C));

  dom.statusChip.dataset.state = state.uiState;
  dom.statusChip.textContent = `Status: ${state.uiState}`;
  dom.alertBanner.dataset.state = state.uiState;
  dom.alertBanner.textContent = state.uiState === 'critical'
    ? 'Kritischer Zustand erkannt — Rettungsaktionen nötig.'
    : state.uiState === 'warning'
      ? 'Warnung: Werte fallen in riskante Bereiche.'
      : '';

  dom.root.dataset.uiState = state.uiState;
  dom.plant.dataset.stage = state.plantStage;
  dom.plant.dataset.uiState = state.uiState;

  dom.largeRings[0]?.classList.toggle('k-critical-pulse', state.uiState === 'critical');

  if (dom.boostMeta) dom.boostMeta.textContent = `Ad supported · ${state.adViewsToday}/${DAILY_AD_LIMIT} today`;
  if (dom.simTime) dom.simTime.textContent = formatTime(Date.now());
  if (dom.nextEvent) dom.nextEvent.textContent = `in ${formatCountdown(10 - state.minutesSinceLastEventRoll)}`;
  if (dom.nextEventMeta) dom.nextEventMeta.textContent = state.currentEvent ? 'Ereignis aktiv' : 'Nächstes Lernereignis';

  if (dom.dangerButton) {
    dom.dangerButton.disabled = !isEmergencyAvailable(state);
    dom.dangerButton.dataset.prominent = String(isEmergencyAvailable(state));
  }

  dom.analysisScreen.dataset.locked = String(!state.analysisUnlocked);
  const a = getAnalysisSnapshot(state);
  dom.analysisData.innerHTML = `
    <div>Hydration: <strong>${a.hydration}%</strong></div>
    <div>Nutrition: <strong>${a.nutrition}%</strong></div>
    <div>Resilience: <strong>${a.resilience}%</strong></div>
    <div>Risk: <strong>${a.risk}%</strong></div>
    <div>Diagnosis: <strong>${a.diagnosis}</strong></div>
    <ul>${a.recommendations.map((r) => `<li>${r}</li>`).join('')}</ul>
  `;

  dom.historyList.innerHTML = state.history
    .slice(0, 8)
    .map((h) => `<li>${formatTime(h.t)} — ${h.label}</li>`)
    .join('');
}
