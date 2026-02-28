import { clamp100 } from '../core/state.js';

const STAGE_CONFIG = [
  { phase: 'seedling', sub: 'sprout', min: 0, max: 10 },
  { phase: 'seedling', sub: 'cotyledon', min: 10, max: 22 },
  { phase: 'seedling', sub: 'early-seedling', min: 22, max: 35 },
  { phase: 'vegetative', sub: 'veg-early', min: 35, max: 48 },
  { phase: 'vegetative', sub: 'veg-mid', min: 48, max: 58 },
  { phase: 'vegetative', sub: 'veg-late', min: 58, max: 66 },
  { phase: 'vegetative', sub: 'stretch', min: 66, max: 70 },
  { phase: 'flower', sub: 'flower-init', min: 70, max: 78 },
  { phase: 'flower', sub: 'bud-set', min: 78, max: 88 },
  { phase: 'flower', sub: 'bud-stack', min: 88, max: 96 },
  { phase: 'flower', sub: 'ripen', min: 96, max: 100 }
];

function getStageForGrowth(growth) {
  return STAGE_CONFIG.find((item) => growth >= item.min && growth < item.max) || STAGE_CONFIG[STAGE_CONFIG.length - 1];
}

function phaseSpan(phase) {
  if (phase === 'seedling') return { min: 0, max: 35 };
  if (phase === 'vegetative') return { min: 35, max: 70 };
  return { min: 70, max: 100 };
}

function updateStageState(state) {
  const now = Date.now();
  const growth = clamp100(state.stats.growth);
  const stage = getStageForGrowth(growth);
  const prevSub = state.plantSubStage;

  state.plantPhase = stage.phase;
  state.plantSubStage = stage.sub;
  state.plantStage = stage.phase === 'vegetative' ? 'veg' : stage.phase;
  state.overallProgress = growth;

  const span = phaseSpan(stage.phase);
  state.phaseProgress = clamp100(((growth - span.min) / (span.max - span.min || 1)) * 100);

  if (prevSub && prevSub !== stage.sub) {
    state.stageEnteredAt = now;
    state.stageHistory.unshift({ t: now, from: prevSub, to: stage.sub });
    state.stageHistory = state.stageHistory.slice(0, 20);
    state.history.unshift({ t: now, type: 'stage', label: `Stufe: ${prevSub} → ${stage.sub}` });
    state.history = state.history.slice(0, 20);
    state.telemetry.push(JSON.stringify({ t: now, type: 'stage_transition', from: prevSub, to: stage.sub }));
  }
}

export function tickPlant(state, minutes = 1) {
  const s = state.stats;
  state.growthAgeMin += minutes;

  s.water = clamp100(s.water - 0.18 * minutes);
  s.nutrition = clamp100(s.nutrition - 0.12 * minutes);

  let stressDelta = 0;
  if (s.water < 30 || s.nutrition < 30) stressDelta += 0.10 * minutes;
  if (s.water < 15 || s.nutrition < 15) stressDelta += 0.06 * minutes;
  if (s.water > 55 && s.nutrition > 55) stressDelta -= 0.08 * minutes;
  s.stress = clamp100(s.stress + stressDelta);

  let healthDelta = 0;
  if (s.stress > 70) healthDelta -= 0.10 * minutes;
  if (s.stress > 90) healthDelta -= 0.18 * minutes;
  if (s.water > 45 && s.nutrition > 45 && s.stress < 40) healthDelta += 0.06 * minutes;
  s.health = clamp100(s.health + healthDelta);

  let growthDelta = 0;
  if (s.water > 45 && s.nutrition > 45 && s.stress < 55) growthDelta += 0.10 * minutes;
  if (s.water > 35 && s.nutrition > 35 && s.stress < 70) growthDelta += 0.04 * minutes;
  if (s.water < 20 || s.nutrition < 20) growthDelta -= 0.06 * minutes;
  if (state.plantPhase === 'flower' && growthDelta > 0) growthDelta *= 0.5;
  s.growth = clamp100(s.growth + growthDelta);

  updateStageState(state);
}

export function applyAction(state, action) {
  const s = state.stats;
  if (action === 'water') s.water = clamp100(s.water + 16);
  if (action === 'feed') s.nutrition = clamp100(s.nutrition + 14);
  if (action === 'prune') {
    s.stress = clamp100(s.stress - 8);
    s.growth = clamp100(s.growth + 2);
    updateStageState(state);
  }
}
