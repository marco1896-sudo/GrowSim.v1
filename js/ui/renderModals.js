export function renderEventModal(state, dom, onResolve) {
  const open = Boolean(state.currentEvent);
  dom.eventWrap.dataset.open = String(open);
  if (!open) return;

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
