import { loadState, saveState } from './core/storage.js';
import { setSeed } from './core/rng.js';
import { updateEngine } from './core/engine.js';
import { loadEvents, resolveEventAction } from './systems/eventSystem.js';
import { dom } from './ui/dom.js';
import { renderDashboard } from './ui/renderDashboard.js';
import { renderEventModal } from './ui/renderModals.js';
import { wireControls } from './ui/controls.js';

setSeed(424242);

const stateRef = { current: loadState() };
const events = await loadEvents();

function commit(logLabel) {
  if (logLabel) {
    stateRef.current.history.unshift({ t: Date.now(), type: 'action', label: logLabel });
    stateRef.current.history = stateRef.current.history.slice(0, 20);
  }
  stateRef.current = updateEngine(stateRef.current, events);
  renderDashboard(stateRef.current, dom);
  renderEventModal(stateRef.current, dom, (id) => {
    resolveEventAction(stateRef.current, id);
    commit('Event aufgelöst');
  });
  saveState(stateRef.current);
}

wireControls(stateRef, dom, commit);
commit();
setInterval(() => commit(), 1000);
