import { getAnalysisSnapshot } from '../systems/analysisSystem.js';
import { isEmergencyAvailable, DAILY_AD_LIMIT } from '../systems/adSystem.js';

const LARGE_C = 263.89;
const MINI_C = 251.33;
const ringKeys = {
  health: 'health',
  stress: 'stress',
  water: 'water',
  nutrition: 'nutrition',
  growth: 'growth',
  risk: 'risk'
};

function setRing(node, value, circumference) {
  if (!node) return;
  const safe = Math.max(0, Math.min(100, value || 0));
  const offset = circumference - (safe / 100) * circumference;
  const ring = node.querySelector('.c-ring__value');
  const text = node.querySelector('[data-role="value"]');
  if (!ring || !text) return;
  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${offset}`;
  text.textContent = `${Math.round(safe)}%`;
}

function formatClock(dateMs) {
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

  dom.largeRings.forEach((ring) => setRing(ring, s[ringKeys[ring.dataset.ring]], LARGE_C));
  dom.miniRings.forEach((ring) => setRing(ring, s[ringKeys[ring.dataset.ring]], MINI_C));

  if (dom.statusChip) {
    dom.statusChip.dataset.state = state.uiState;
    dom.statusChip.textContent = `Status: ${state.uiState}`;
  }

  dom.root.dataset.uiState = state.uiState;
  if (dom.plant) {
    dom.plant.dataset.stage = state.plantPhase;
    dom.plant.dataset.uiState = state.uiState;
    dom.plant.dataset.subStage = state.plantSubStage;
  }

  dom.largeRings[0]?.classList.toggle('k-critical-pulse', state.uiState === 'critical');

  if (dom.adCount) dom.adCount.textContent = `${state.adViewsToday}/${DAILY_AD_LIMIT}`;
  if (dom.boostMeta) dom.boostMeta.textContent = `Ad supported · ${state.adViewsToday}/${DAILY_AD_LIMIT} today`;
  if (dom.simTime) dom.simTime.textContent = formatClock(Date.now());
  if (dom.nextEvent) dom.nextEvent.textContent = `in ${formatCountdown((state.nextEventAt || Date.now()) - Date.now())}`;
  if (dom.nextEventMeta) dom.nextEventMeta.textContent = state.currentEvent ? 'Wachstum pausiert durch Event' : 'Bei stabilem Zustand';

  if (dom.dangerButton) {
    const danger = isEmergencyAvailable(state);
    dom.dangerButton.disabled = !danger;
    dom.dangerButton.dataset.prominent = String(danger);
  }

  if (dom.boostButton) dom.boostButton.disabled = state.adViewsToday >= DAILY_AD_LIMIT;

  if (dom.diagnosisWrap) dom.diagnosisWrap.querySelector('.sheet')?.setAttribute('data-locked', String(!state.analysisUnlocked));
  if (dom.analysisData) {
    const a = getAnalysisSnapshot(state);
    dom.analysisData.innerHTML = `
      <div>Hydration: <strong>${a.hydration}%</strong></div>
      <div>Nutrition: <strong>${a.nutrition}%</strong></div>
      <div>Resilience: <strong>${a.resilience}%</strong></div>
      <div>Diagnosis: <strong>${a.diagnosis}</strong></div>
      <div>${a.recommendations.join(' · ')}</div>
    `;
  }

  if (dom.historyList) {
    dom.historyList.innerHTML = '';
    state.history.slice(0, 8).forEach((entry) => {
      const li = document.createElement('li');
      li.textContent = `[${formatClock(entry.t)}] ${entry.label}`;
      dom.historyList.appendChild(li);
    });
  }
}
