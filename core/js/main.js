/* main.js: boot, called by the generated tail of each sport bundle */
async function boot() {
  finalizeSport();
  /* optional: a sport can pick a better default season (e.g. fall back to the last complete one when the new season has barely started) */
  if (SPORT.pickDefault) { try { const s = await SPORT.pickDefault(); if (s) App.defSeason = App.season = s; } catch (e) { } }
  buildShell();
  addEventListener('hashchange', () => render());
  render();
}
