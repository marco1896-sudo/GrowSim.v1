import { syncSheetBackdrop } from './controls.js';

export function renderEventModal(state, dom, onResolve) {
  const open = Boolean(state.currentEvent);
  dom.eventWrap.dataset.open = String(open);
  dom.eventWrap.hidden = !open;

  if (open && dom.careWrap) {
    dom.careWrap.dataset.open = 'false';
    dom.careWrap.hidden = true;
  }

  syncSheetBackdrop(dom);
  if (!open) return;

  dom.eventTitle.textContent = `⚡ ${state.currentEvent.title}`;
  dom.eventBody.textContent = state.currentEvent.description;
  dom.eventActions.innerHTML = '';

  state.currentEvent.actions.forEach((choice) => {
  dom.eventBody.textContent = state.currentEvent.text;
  dom.eventActions.innerHTML = '';

  dom.eventTitle.textContent = state.currentEvent.title;
  dom.eventBody.textContent = state.currentEvent.text;
  dom.eventActions.innerHTML = '';
  state.currentEvent.choices.forEach((choice) => {
    const button = document.createElement('button');
    button.className = 'c-btn';
    button.type = 'button';
    button.textContent = choice.label;
    button.addEventListener('click', () => onResolve(choice.id), { once: true });
    dom.eventActions.appendChild(button);
  });
}
