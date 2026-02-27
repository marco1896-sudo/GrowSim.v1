const MAX_SIZE = 220;

const refs = {
  startSize: document.getElementById('startSize'),
  startSizeOut: document.getElementById('startSizeOut'),
  growthRate: document.getElementById('growthRate'),
  growthRateOut: document.getElementById('growthRateOut'),
  tickMs: document.getElementById('tickMs'),
  tickMsOut: document.getElementById('tickMsOut'),
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  status: document.getElementById('status'),
  plant: document.getElementById('plant'),
  metricTick: document.getElementById('metricTick'),
  metricSize: document.getElementById('metricSize'),
  metricMax: document.getElementById('metricMax')
};

const state = {
  size: Number(refs.startSize.value),
  tick: 0,
  timer: null
};

function setStatus(text) {
  refs.status.textContent = text;
}

function syncOutput(slider, output) {
  output.textContent = slider.value;
}

function render() {
  refs.plant.style.height = `${state.size}px`;
  refs.metricTick.textContent = String(state.tick);
  refs.metricSize.textContent = state.size.toFixed(1);
  refs.metricMax.textContent = state.size >= MAX_SIZE ? 'Ja' : 'Nein';
}

function stopSimulation(message = 'Pausiert') {
  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
  refs.startBtn.disabled = false;
  refs.pauseBtn.disabled = true;
  setStatus(message);
}

function step() {
  const growth = Number(refs.growthRate.value) / 100;
  state.size = Math.min(MAX_SIZE, state.size * (1 + growth));
  state.tick += 1;
  render();

  if (state.size >= MAX_SIZE) {
    stopSimulation('Maximale Größe erreicht');
  }
}

function startSimulation() {
  if (state.timer) return;

  const interval = Number(refs.tickMs.value);
  state.timer = window.setInterval(step, interval);
  refs.startBtn.disabled = true;
  refs.pauseBtn.disabled = false;
  setStatus('Simulation läuft');
}

function resetSimulation() {
  stopSimulation('Zurückgesetzt');
  state.size = Number(refs.startSize.value);
  state.tick = 0;
  render();
}

for (const [sliderKey, outputKey] of [
  ['startSize', 'startSizeOut'],
  ['growthRate', 'growthRateOut'],
  ['tickMs', 'tickMsOut']
]) {
  const slider = refs[sliderKey];
  const output = refs[outputKey];
  syncOutput(slider, output);

  slider.addEventListener('input', () => {
    syncOutput(slider, output);

    if (sliderKey === 'startSize' && !state.timer) {
      state.size = Number(slider.value);
      render();
    }

    if (sliderKey === 'tickMs' && state.timer) {
      stopSimulation('Intervall geändert, bitte neu starten');
    }
  });
}

refs.startBtn.addEventListener('click', startSimulation);
refs.pauseBtn.addEventListener('click', () => stopSimulation('Pausiert'));
refs.resetBtn.addEventListener('click', resetSimulation);

render();
setStatus('Bereit');
