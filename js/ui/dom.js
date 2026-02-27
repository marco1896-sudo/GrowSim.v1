export const dom = {
  root: document.documentElement,
  statusChip: document.querySelector('[data-ui="status-chip"]'),
  alertBanner: document.querySelector('[data-ui="alert-banner"]'),
  plant: document.querySelector('.c-plant'),
  largeRings: [...document.querySelectorAll('[data-ring-size="large"]')],
  miniRings: [...document.querySelectorAll('[data-ring-size="mini"]')],
  adCount: document.querySelector('[data-ui="ad-count"]'),
  analysisScreen: document.querySelector('[data-screen="analysis"]'),
  analysisData: document.querySelector('.analysis-data'),
  historyList: document.querySelector('[data-ui="history"]'),
  eventWrap: document.querySelector('[data-ui="event-wrap"]'),
  eventTitle: document.querySelector('[data-ui="event-title"]'),
  eventBody: document.querySelector('[data-ui="event-body"]'),
  eventActions: document.querySelector('[data-ui="event-actions"]'),
  toast: document.querySelector('[data-ui="toast"]'),
  scanline: document.querySelector('[data-ui="scanline"]'),
  dangerButton: document.querySelector('[data-action="emergency-ad"]')
};
