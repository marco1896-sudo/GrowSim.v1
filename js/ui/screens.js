export function toggleScreen(id) {
  document.querySelectorAll('[data-screen]').forEach((el) => {
    el.hidden = el.dataset.screen !== id;
  });
}
