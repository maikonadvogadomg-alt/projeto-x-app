/* =========================================================================
   Colador de Links — 20-links.js
   A lista: guardar (nome + endereço), marcar, remover, fixar como aba,
   colar vários de uma vez, backup. "🚀 Abrir Selecionados" abre o visor.
   ========================================================================= */
(function (CL) {
  'use strict';
  const $ = CL.$;
  let filtro = '';

  function montar() {
    const el = $('#tela-links');
    el.innerHTML =
      '<div class="cartao">' +
      '  <div class="cab"><h1>🔗 Colador de Links</h1><p>Guarde os endereços dos seus apps e abra aqui dentro</p></div>' +
      '  <div class="numeros"><div class="num"><b id="n-total">0</b><span>Total de links</span></div><div class="num"><b id="n-marc">0</b><span>Marcados</span></div></div>' +
      '  <h2>➕ Adicionar link</h2>' +
      '  <div class="campo"><label for="l-nome">Nome do link</label><input id="l-nome" placeholder="Ex.: Playground, Chat IA…"></div>' +
      '  <div class="campo"><label for="l-url">Endereço (URL)</label><input id="l-url" inputmode="url" autocapitalize="off" placeholder="https://…"></div>' +
      '  <button class="btn forte" id="l-salvar">💾 Salvar link</button>' +
      '  <details class="mais"><summary>📋 Colar vários de uma vez</summary><textarea id="l-varios" placeholder="Cole aqui um texto com vários endereços (um por linha ou misturados) — eu acho todos."></textarea><button class="btn" id="l-varios-ok">Adicionar todos</button></details>' +
      '  <h2>📋 Seus links</h2>' +
      '  <input id="l-busca" class="busca" placeholder="🔍 Procurar…" autocapitalize="off">' +
      '  <div id="l-lista" class="lista"></div>' +
      '  <div class="acoes">' +
      '    <button class="btn forte grande" id="l-abrir">🚀 Abrir selecionados</button>' +
      '    <button class="btn" id="l-todos">✅ Marcar todos</button>' +
      '    <button class="btn" id="l-nenhum">⬜ Desmarcar</button>' +
      '    <button class="btn" id="l-backup">💾 Backup (baixar)</button>' +
      '    <button class="btn" id="l-restaurar">📥 Restaurar backup</button><input type="file" id="l-arq" accept=".json,application/json" hidden>' +
      '    <button class="btn perigo" id="l-limpar">🗑️ Limpar tudo</button>' +
      '  </div>' +
      '  <p class="mut pequeno">Fica guardado neste aparelho. Faça um 💾 Backup de vez em quando: se o celular apagar os dados do navegador, você restaura. · ' + CL.versao + '</p>' +
      '</div>';
    $('#l-salvar').onclick = salvar;
    $('#l-url').addEventListener('keydown', (e) => { if (e.key === 'Enter') salvar(); });
    $('#l-varios-ok').onclick = () => { const n = CL.colarVarios($('#l-varios').value); $('#l-varios').value = ''; pintar(); CL.aviso(n ? n + ' link(s) adicionado(s).' : 'Não achei endereço novo nesse texto.'); };
    $('#l-busca').addEventListener('input', (e) => { filtro = e.target.value.trim().toLowerCase(); pintar(); });
    $('#l-todos').onclick = () => { CL.links.forEach((l) => (l.marcado = true)); CL.salvar(); pintar(); };
    $('#l-nenhum').onclick = () => { CL.links.forEach((l) => (l.marcado = false)); CL.salvar(); pintar(); };
    $('#l-abrir').onclick = () => { const sel = CL.links.filter((l) => l.marcado); if (!sel.length) return CL.aviso('Marque pelo menos um link.'); CL.visor.abrir(sel, 0); };
    $('#l-backup').onclick = CL.backup;
    $('#l-restaurar').onclick = () => $('#l-arq').click();
    $('#l-arq').onchange = async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { const n = await CL.restaurar(f); pintar(); CL.abasUI.pintar(); CL.aviso('Backup restaurado: ' + n + ' link(s) novo(s).'); } catch (er) { CL.aviso('❌ ' + er.message); } };
    $('#l-limpar').onclick = () => {
      const b = $('#l-limpar');
      if (b.dataset.certeza) { CL.links = []; CL.salvar(); pintar(); delete b.dataset.certeza; b.textContent = '🗑️ Limpar tudo'; CL.aviso('Lista apagada.'); return; }
      b.dataset.certeza = '1'; b.textContent = '⚠️ Toque de novo para APAGAR TODOS';
      setTimeout(() => { delete b.dataset.certeza; b.textContent = '🗑️ Limpar tudo'; }, 4000);
    };
    $('#l-lista').addEventListener('click', (e) => {
      const b = e.target.closest('[data-acao]'); if (!b) return;
      const l = CL.links.find((x) => x.id === b.dataset.id); if (!l) return;
      const acao = b.dataset.acao;
      if (acao === 'abrir') CL.visor.abrir([l], 0);
      if (acao === 'fixar') CL.abasUI.fixar(l.nome, l.url);
      if (acao === 'remover') {
        if (b.dataset.certeza) { CL.links = CL.links.filter((x) => x !== l); CL.salvar(); pintar(); return; }
        b.dataset.certeza = '1'; b.textContent = 'Certeza?'; setTimeout(() => { if (b.isConnected) { delete b.dataset.certeza; b.textContent = 'Remover'; } }, 3000);
      }
      if (acao === 'editar') {
        const card = b.closest('.item');
        card.innerHTML = '<div class="editar"><input value="' + CL.esc(l.nome) + '" class="e-nome" aria-label="Nome"><input value="' + CL.esc(l.url) + '" class="e-url" aria-label="Endereço" autocapitalize="off"><div class="e-bts"><button class="btn forte" data-acao="gravar" data-id="' + l.id + '">Salvar</button><button class="btn" data-acao="cancelar" data-id="' + l.id + '">Cancelar</button></div></div>';
      }
      if (acao === 'gravar') { const card = b.closest('.item'); const url = CL.arrumarUrl(card.querySelector('.e-url').value); if (!url) return CL.aviso('Endereço inválido.'); l.nome = card.querySelector('.e-nome').value.trim() || url; l.url = url; CL.salvar(); pintar(); }
      if (acao === 'cancelar') pintar();
    });
    $('#l-lista').addEventListener('change', (e) => { const c = e.target.closest('[data-marca]'); if (!c) return; const l = CL.links.find((x) => x.id === c.dataset.marca); if (l) { l.marcado = c.checked; CL.salvar(); contar(); } });
    pintar();
  }

  function salvar() {
    const url = CL.arrumarUrl($('#l-url').value);
    if (!url) return CL.aviso('Cole um endereço válido.');
    if (CL.links.some((l) => l.url === url)) return CL.aviso('Esse link já está na lista.');
    const nome = $('#l-nome').value.trim() || new URL(url).hostname.split('.')[0];
    CL.links.unshift({ id: CL.uid(), nome, url, marcado: true });
    CL.salvar(); $('#l-nome').value = ''; $('#l-url').value = ''; pintar(); CL.aviso('💾 Salvo: ' + nome);
  }

  function contar() { $('#n-total').textContent = CL.links.length; $('#n-marc').textContent = CL.links.filter((l) => l.marcado).length; }

  function pintar() {
    const lista = CL.links.filter((l) => !filtro || (l.nome + ' ' + l.url).toLowerCase().includes(filtro));
    $('#l-lista').innerHTML = lista.length ? lista.map((l) =>
      '<div class="item"><label class="marca"><input type="checkbox" data-marca="' + l.id + '"' + (l.marcado ? ' checked' : '') + ' aria-label="Marcar ' + CL.esc(l.nome) + '"></label>' +
      '<div class="info"><button class="nome" data-acao="abrir" data-id="' + l.id + '">' + CL.esc(l.nome) + '</button><small>' + CL.esc(l.url) + '</small></div>' +
      '<div class="bts"><button class="mini" data-acao="fixar" data-id="' + l.id + '" title="Fixar como aba">📌</button><button class="mini" data-acao="editar" data-id="' + l.id + '" title="Editar">✏️</button><button class="remover" data-acao="remover" data-id="' + l.id + '">Remover</button></div></div>').join('')
      : '<p class="mut">' + (filtro ? 'Nada com "' + CL.esc(filtro) + '".' : 'Nenhum link ainda. Cole o primeiro lá em cima.') + '</p>';
    contar();
  }

  CL.linksUI = { montar, pintar };
})(window.CL);
