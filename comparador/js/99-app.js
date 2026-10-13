/* Colador de Links — 99-app.js: liga tudo (por último). */
(function (CL) {
  'use strict';
  CL.linksUI.montar();
  CL.visor.iniciar();
  CL.abasUI.iniciar();
  CL.abasUI.ir('links');
  // pedir ao navegador para não apagar os dados deste app
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
})(window.CL);
