/* =========================================================================
   Caça-Bug — 45-organizar.js
   Aba 🗂️ Organizar: pega o projeto em uso (aquela pasta "embolada") e
   devolve tudo separado — usa js/lib/organizar-core.js.
   ========================================================================= */
(function (SK) {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  let R = null, entradas = null;

  async function montar(box) {
    const P = SK.projeto.ativo;
    if (!P) { box.innerHTML = '<div class="vazio">Escolha ou importe um projeto na aba 📁 Projetos.<br><br>Pode ser a pasta inteira, toda bagunçada, num .zip — inclusive os .md com vários códigos colados.</div>'; return; }
    box.innerHTML =
      '<div class="card"><h3>🗂️ Organizar: ' + SK.esc(P.nome) + '</h3>' +
      '<p class="small">Para pasta embolada: várias cópias, versões, .md com códigos colados. Eu separo as peças, jogo fora as cópias iguais, escolho a <b>melhor versão</b> de cada uma, conserto sozinho os erros simples, explico o que cada peça faz e <b>monto uma pasta</b> a partir do index. O original fica intacto.</p>' +
      '<div class="row wrap"><button class="btn primary" id="org-ir">🗂️ Organizar agora</button></div></div>' +
      '<div id="org-out"></div>';
    $('#org-ir', box).onclick = () => analisar(P, box).catch((e) => { $('#org-out', box).innerHTML = '<p class="erro">❌ ' + SK.esc(e.message) + '</p>'; });
  }

  async function analisar(P, box) {
    const out = $('#org-out', box);
    out.innerHTML = '<p class="muted">⏳ Lendo e comparando tudo…</p>';
    entradas = await SK.projeto.entradasDe(P.id);
    const dec = new TextDecoder('utf-8');
    const arqs = entradas.map((e) => (OrganizarCore.TEXTO.test(e.name) && e.data.length < 5e6 ? { path: e.name, text: dec.decode(e.data) } : { path: e.name, text: null, bytes: e.data }));
    R = OrganizarCore.analisar(arqs);
    const nInc = R.unicas.filter((p) => p.incompleto.length).length;
    const nErr = R.unicas.filter((p) => p.erro).length;
    const nCons = R.unicas.filter((p) => p.conserto).length;
    const num = (n, t, cls) => '<div class="org-num ' + (cls || '') + '"><b>' + n + '</b><span>' + t + '</span></div>';
    out.innerHTML =
      '<div class="org-nums">' + num(R.nArquivos, 'arquivos') + num(R.nCopias, 'cópias iguais') + num(R.unicas.length, 'peças diferentes') + num(R.versoes.length, 'com várias versões') + num(R.soltos.length, 'módulos soltos', R.soltos.length ? 'meio' : '') + num(nCons, 'consertados sozinhos', nCons ? 'bom' : '') + num(nErr, 'com erro', nErr ? 'ruim' : '') + num(nInc, 'incompletos', nInc ? 'meio' : '') + '</div>' +
      (R.indexes.length ? '<div class="card"><h3>🏠 Montar a partir de qual página?</h3><select class="input" id="org-ix">' + R.indexes.map((x) => '<option value="' + SK.esc(x.path) + '">' + SK.esc(x.path) + (x.titulo ? ' — ' + SK.esc(x.titulo) : '') + ' (' + x.nAchados + ' de ' + x.refs.length + ' arquivos achados)</option>').join('') + '</select>' +
        '<label class="small"><input type="checkbox" id="org-soltos" checked> Ligar os ' + R.soltos.length + ' módulo(s) soltos nessa página</label></div>' : '<div class="card"><p class="small">Não achei nenhuma página que chame outros arquivos — a pasta MONTADO não vai ser criada, só a organização.</p></div>') +
      '<div class="row wrap"><button class="btn primary" id="org-baixar">⬇ Baixar o zip organizado</button><button class="btn" id="org-copia">📁 Guardar como projeto aqui</button><button class="btn" id="org-rel">📌 Guardar relatório</button><button class="btn" id="org-copiar">📋 Copiar relatório</button></div>' +
      '<pre class="plano-pre" id="org-md"></pre>';
    $('#org-md', out).textContent = OrganizarCore.relatorio(R);
    const zipar = async () => {
      const ix = $('#org-ix', out), so = $('#org-soltos', out);
      const lista = OrganizarCore.saida(R, { montarIndex: ix ? ix.value : null, incluirSoltos: so ? so.checked : true });
      const enc = new TextEncoder();
      return SK.zip.write(lista.map((f) => ({ name: f.name, data: f.text != null ? enc.encode(f.text) : f.bytes })));
    };
    $('#org-baixar', out).onclick = async () => SK.download(SK.nomeSeguro(P.nome) + '-organizado.zip', await zipar());
    $('#org-copia', out).onclick = async () => { await SK.projeto.guardarCopia(P.nome + ' (organizado)', await zipar(), 'organizado', { de: P.id }); SK.toast('Guardado como projeto novo. O original ficou intacto.', 'ok'); };
    $('#org-rel', out).onclick = () => SK.relatorios.guardar({ ferramenta: '🗂️ Organização', projeto: P.id, projetoNome: P.nome, texto: OrganizarCore.relatorio(R) });
    $('#org-copiar', out).onclick = () => SK.copy(OrganizarCore.relatorio(R));
  }

  SK.organizar = { montar };
})(window.SK);
