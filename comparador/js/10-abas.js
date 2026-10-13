/* =========================================================================
   Colador de Links — 10-abas.js
   Barra de abas do topo. A 1ª é sempre "🔗 Links". As outras são apps
   fixados: cada um abre num quadro que NÃO é apagado ao trocar de aba —
   por isso o login, o token e as conversas continuam vivos.
   ========================================================================= */
(function (CL) {
  'use strict';
  const $ = CL.$;
  let atual = 'links';
  const vivos = new Map(); // id da aba → <iframe>

  function pintar() {
    const lista = $('#abas-lista');
    lista.innerHTML = '<button class="aba' + (atual === 'links' ? ' ativa' : '') + '" data-aba="links">🔗 Links</button>' +
      CL.abas.map((a) => '<button class="aba' + (atual === a.id ? ' ativa' : '') + (vivos.has(a.id) ? ' viva' : '') + '" data-aba="' + a.id + '" title="' + CL.esc(a.url) + '">' + CL.esc(a.nome) + '</button>').join('');
    const ativa = lista.querySelector('.ativa'); if (ativa) ativa.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }

  function ir(id) {
    atual = id;
    const ehLinks = id === 'links';
    $('#tela-links').hidden = !ehLinks || CL.visor.aberto;
    $('#visor').hidden = !(ehLinks && CL.visor.aberto);
    $('#rodape').hidden = !(ehLinks && CL.visor.aberto);
    $('#quadros-abas').hidden = ehLinks;
    vivos.forEach((f, k) => (f.hidden = k !== id));
    if (!ehLinks) {
      const a = CL.abas.find((x) => x.id === id);
      if (a && !vivos.has(id)) {
        const f = document.createElement('iframe');
        f.className = 'quadro';
        f.src = a.url;
        f.setAttribute('allow', 'clipboard-read; clipboard-write; microphone; camera; fullscreen; autoplay');
        f.setAttribute('allowfullscreen', '');
        f.title = a.nome;
        $('#quadros-abas').appendChild(f);
        vivos.set(id, f);
      }
    }
    pintar();
  }

  function fixar(nome, url) {
    url = CL.arrumarUrl(url);
    if (!url) { CL.aviso('Endereço inválido.'); return null; }
    if (CL.abas.some((a) => a.url === url)) { CL.aviso('Esse já é uma aba.'); return null; }
    const a = { id: CL.uid(), nome: (nome || new URL(url).hostname.split('.')[0]).slice(0, 18), url };
    CL.abas.push(a); CL.salvar(); pintar(); pintarJanela();
    CL.aviso('📌 Fixado como aba: ' + a.nome);
    return a;
  }
  function tirar(id) {
    CL.abas = CL.abas.filter((a) => a.id !== id);
    const f = vivos.get(id); if (f) { f.remove(); vivos.delete(id); }
    CL.salvar(); if (atual === id) ir('links'); else pintar(); pintarJanela();
  }
  function mover(id, d) {
    const i = CL.abas.findIndex((a) => a.id === id), j = i + d;
    if (i < 0 || j < 0 || j >= CL.abas.length) return;
    [CL.abas[i], CL.abas[j]] = [CL.abas[j], CL.abas[i]]; CL.salvar(); pintar(); pintarJanela();
  }
  function recarregar(id) { const f = vivos.get(id); if (f) { const u = f.src; f.src = 'about:blank'; setTimeout(() => (f.src = u), 50); } }

  function pintarJanela() {
    const el = $('#janela-lista');
    el.innerHTML = CL.abas.length ? CL.abas.map((a, i) =>
      '<div class="linha-aba"><div class="la-info"><b>' + CL.esc(a.nome) + '</b><small>' + CL.esc(a.url) + '</small></div>' +
      '<div class="la-bts"><button class="mini" data-sobe="' + a.id + '"' + (i ? '' : ' disabled') + '>↑</button><button class="mini" data-desce="' + a.id + '"' + (i < CL.abas.length - 1 ? '' : ' disabled') + '>↓</button>' +
      '<button class="mini" data-recarregar="' + a.id + '" title="Recarregar">⟳</button><button class="mini perigo" data-tirar="' + a.id + '" title="Tirar">✕</button></div></div>').join('') : '<p class="mut">Nenhuma aba fixada ainda. Na lista de links, toque em 📌 num link, ou escreva abaixo.</p>';
  }

  function iniciar() {
    $('#abas-lista').addEventListener('click', (e) => { const b = e.target.closest('[data-aba]'); if (b) ir(b.dataset.aba); });
    $('#btn-abas').onclick = () => { pintarJanela(); $('#janela').hidden = false; };
    $('#janela-fechar').onclick = () => ($('#janela').hidden = true);
    $('#janela').addEventListener('click', (e) => {
      if (e.target.id === 'janela') { $('#janela').hidden = true; return; }
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.sobe) mover(b.dataset.sobe, -1);
      if (b.dataset.desce) mover(b.dataset.desce, 1);
      if (b.dataset.tirar) tirar(b.dataset.tirar);
      if (b.dataset.recarregar) { recarregar(b.dataset.recarregar); CL.aviso('Recarregado.'); }
    });
    $('#nova-aba-ok').onclick = () => { if (fixar($('#nova-aba-nome').value.trim(), $('#nova-aba-url').value)) { $('#nova-aba-nome').value = ''; $('#nova-aba-url').value = ''; } };
    pintar();
  }

  CL.abasUI = { iniciar, ir, fixar, pintar, get atual() { return atual; } };
})(window.CL);
