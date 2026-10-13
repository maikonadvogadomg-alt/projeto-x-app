/* =========================================================================
   Colador de Links — 30-visor.js
   Abre os links marcados um por vez, aqui dentro: "3/37 - nome",
   ← Anterior / Próximo →, Tela cheia, Abrir fora, Fechar.
   Os últimos 8 abertos ficam vivos (voltar não recarrega).
   ========================================================================= */
(function (CL) {
  'use strict';
  const $ = CL.$;
  const MAX_VIVOS = 8;
  let lista = [], pos = 0, aberto = false;
  const vivos = new Map(); // url → iframe (ordem = mais antigo primeiro)

  function quadro(url) {
    if (vivos.has(url)) { const f = vivos.get(url); vivos.delete(url); vivos.set(url, f); return f; }
    const f = document.createElement('iframe');
    f.className = 'quadro';
    f.src = url;
    f.setAttribute('allow', 'clipboard-read; clipboard-write; microphone; camera; fullscreen; autoplay');
    f.setAttribute('allowfullscreen', '');
    $('#visor-quadros').appendChild(f);
    vivos.set(url, f);
    while (vivos.size > MAX_VIVOS) { const [u, velho] = vivos.entries().next().value; velho.remove(); vivos.delete(u); }
    return f;
  }

  function mostrar() {
    const l = lista[pos]; if (!l) return;
    const f = quadro(l.url);
    vivos.forEach((q) => (q.hidden = q !== f));
    $('#visor-titulo').textContent = (pos + 1) + '/' + lista.length + ' - ' + l.nome;
    $('#ant').disabled = pos === 0;
    $('#prox').disabled = pos === lista.length - 1;
  }

  function abrir(sel, i) {
    lista = sel.slice(); pos = i || 0; aberto = true;
    CL.abasUI.ir('links');
    mostrar();
  }
  function fechar() {
    aberto = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    document.body.classList.remove('cheia');
    CL.abasUI.ir('links');
  }

  function iniciar() {
    $('#visor-fechar').onclick = fechar;
    $('#ant').onclick = () => { if (pos > 0) { pos--; mostrar(); } };
    $('#prox').onclick = () => { if (pos < lista.length - 1) { pos++; mostrar(); } };
    $('#visor-fora').onclick = () => { const l = lista[pos]; if (l) window.open(l.url, '_blank', 'noopener'); };
    $('#visor-cheia').onclick = () => {
      const el = document.documentElement;
      if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); document.body.classList.remove('cheia'); return; }
      document.body.classList.add('cheia');
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    };
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('cheia'); });
  }

  CL.visor = { iniciar, abrir, fechar, get aberto() { return aberto; } };
})(window.CL);
