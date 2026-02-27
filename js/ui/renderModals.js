export function renderEventModal(state, dom, onResolve) {
  const open = Boolean(state.currentEvent);
  dom.eventWrap.dataset.open = String(open);
  if (!open) return;

  dom.eventTitle.textContent = state.currentEvent.title;
  dom.eventBody.textContent = state.currentEvent.body;
  dom.eventActions.innerHTML = '';
  state.currentEvent.actions.forEach((action) => {
    const button = document.createElement('button');
    button.className = 'c-btn';
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', () => onResolve(action.id), { once: true });
    dom.eventActions.appendChild(button);
  });
}
