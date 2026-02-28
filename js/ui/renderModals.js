import { syncSheetBackdrop } from './controls.js';

export function renderEventModal(state, dom, onResolve) {
  const open = Boolean(state.currentEvent);
  if (!dom.eventWrap) return;

  dom.eventWrap.dataset.open = String(open);
  dom.eventWrap.hidden = !open;
  syncSheetBackdrop(dom);

  if (!open) return;

  dom.eventTitle.textContent = `⚡ ${state.currentEvent.title}`;
  dom.eventBody.textContent = state.currentEvent.description;
  dom.eventActions.innerHTML = '';

  state.currentEvent.actions.slice(0, 3).forEach((choice) => {
    const button = document.createElement('button');
    button.className = 'c-btn';
    button.type = 'button';
    button.textContent = choice.label;
    button.addEventListener('click', () => onResolve(choice.id), { once: true });
    dom.eventActions.appendChild(button);
  });
}
