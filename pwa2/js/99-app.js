/* =========================================================================
   Caça-Bug — 99-app.js
   Liga tudo: abas de baixo, tela de Projetos e tela de Diagnóstico.
   ========================================================================= */
(function (SK) {
  'use strict';
  const $ = (s) => SK.$(s);
  let aba = 'projetos', anterior = 'ferramentas';

  function irPara(nome) {
    if (nome !== 'ferramenta' && aba !== 'ferramenta') anterior = aba;
    if (nome === 'ferramenta' && aba !== 'ferramenta') anterior = aba;
    aba = nome;
    SK.$$('.tela').forEach((t) => (t.hidden = t.dataset.tela !== nome));
    SK.$$('#abas [data-aba]').forEach((b) => b.classList.toggle('ativa', b.dataset.aba === nome || (nome === 'ferramenta' && b.dataset.aba === 'ferramentas')));
    document.body.classList.toggle('modo-ferramenta', nome === 'ferramenta');
    if (nome === 'projetos') telaProjetos();
    if (nome === 'diagnostico') telaDiagnostico();
    if (nome === 'organizar') SK.organizar.montar($('#tela-organizar'));
    if (nome === 'ferramentas') SK.ferramentas.montarLista($('#tela-ferramentas'));
    if (nome === 'comparar') SK.comparar.montar($('#tela-comparar'));
    if (nome === 'relatorios') SK.relatorios.montar($('#tela-relatorios'));
  }

  // ── Projetos ────────────────────────────────────────────────────────────────
  async function telaProjetos() {
    const box = $('#tela-projetos');
    const L = await SK.projeto.listar();
    const P = SK.projeto.ativo;
    box.innerHTML =
      '<div class="card"><h3>Importar um projeto</h3>' +
      '<p class="muted small">Um .zip, arquivos soltos (ex.: um HTML) ou uma pasta inteira. Fica guardado neste aparelho. Cada versão que você importar vira um projeto separado (bom para comparar).</p>' +
      '<div class="row wrap"><button class="btn primary" id="imp-zip">📦 .zip</button><button class="btn" id="imp-arq">📄 Arquivos</button><button class="btn" id="imp-pasta">📁 Pasta</button></div></div>' +
      (L.length ? '<h3 class="sub">Guardados (' + L.length + ')</h3><div class="stack">' + L.map((p) =>
        '<div class="card proj' + (P && P.id === p.id ? ' ativo' : '') + '" data-id="' + p.id + '"><div class="row"><b class="grow">' + SK.esc(p.nome) + '</b>' + (P && P.id === p.id ? '<span class="tag">em uso</span>' : '') + '</div>' +
        '<div class="muted small">' + SK.fmt(p.nArquivos) + ' arquivos · ' + SK.bytes(p.tamanho) + ' · ' + new Date(p.data).toLocaleString('pt-BR') + (p.origem === 'conserto' ? ' · cópia consertada' : '') + '</div>' +
        '<div class="row wrap"><button class="btn small primary" data-a="usar">Usar este</button><button class="btn small" data-a="diag">🩺 Diagnóstico</button><button class="btn small" data-a="baixar">⤓ .zip</button><button class="btn small" data-a="mandar">📤 Drive…</button><button class="btn small" data-a="renomear">Renomear</button><button class="btn small danger" data-a="apagar">Apagar</button></div></div>').join('') + '</div>'
        : '<div class="vazio">Nenhum projeto guardado ainda.</div>');
    $('#imp-zip').onclick = () => escolherArquivos('.zip', false, false);
    $('#imp-arq').onclick = () => escolherArquivos('', true, false);
    $('#imp-pasta').onclick = () => escolherArquivos('', true, true);
    box.querySelectorAll('.proj').forEach((el) => el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const id = el.dataset.id, reg = L.find((x) => x.id === id);
      try {
        if (b.dataset.a === 'usar') { await SK.projeto.escolher(id); telaProjetos(); SK.toast('Em uso: ' + reg.nome); }
        if (b.dataset.a === 'diag') { await SK.projeto.escolher(id); irPara('diagnostico'); }
        if (b.dataset.a === 'baixar') SK.download(reg.nome + '.zip', await SK.projeto.arquivoZip(id));
        if (b.dataset.a === 'mandar') SK.compartilhar(reg.nome + '.zip', await SK.projeto.arquivoZip(id), 'application/zip');
        if (b.dataset.a === 'renomear') { const n = await SK.prompt('Novo nome:', reg.nome); if (n && n.trim()) { const p = await SK.projeto.pegar(id); p.nome = n.trim(); await SK.db.put('projetos', p); if (SK.projeto.ativo && SK.projeto.ativo.id === id) await SK.projeto.escolher(id); telaProjetos(); } }
        if (b.dataset.a === 'apagar') { if (await SK.confirm('Apagar "' + reg.nome + '" deste aparelho? (Os relatórios dele continuam guardados.)', { okText: 'Apagar', danger: true })) { await SK.projeto.apagar(id); telaProjetos(); } }
      } catch (er) { SK.toast(er.message, 'error'); }
    }));
  }
  function escolherArquivos(accept, multiplo, pasta) {
    const inp = document.createElement('input');
    inp.type = 'file'; if (accept) inp.accept = accept; inp.multiple = multiplo;
    if (pasta) inp.setAttribute('webkitdirectory', '');
    inp.onchange = async () => {
      try { const r = await SK.projeto.importarArquivos(inp.files, pasta); if (r) { SK.toast('Guardado: ' + r.nome + ' (' + SK.fmt(r.nArquivos) + ' arquivos)', 'ok'); irPara('diagnostico'); } }
      catch (e) { SK.toast(e.message, 'error'); }
    };
    inp.click();
  }

  // ── Diagnóstico ─────────────────────────────────────────────────────────────
  let ultimoDiag = null;
  // ── ☁️ Consertar para o EAS (usa js/lib/expo-core.js) ──────────────────────
  const TEXTO_EAS = /\.(json|m?[jt]sx?|cjs|md|ya?ml|txt|gitignore|easignore|npmrc|env[\w.-]*)$|(^|\/)\.(replit|gitignore|npmrc|env[\w.-]*)$/i;
  async function prepararEas(P, D) {
    const ent = await SK.projeto.entradasDe(P.id);
    const dec = new TextDecoder('utf-8');
    const A = {};
    for (const e of ent) A[e.name] = TEXTO_EAS.test(e.name) && e.data.length < 3e6 ? dec.decode(e.data) : '';
    const atual = ExpoConserto.ler(A);
    const v = (id, x) => { $(id).value = x || ''; };
    v('#eas-nome', atual.nome); v('#eas-owner', atual.owner); v('#eas-slug', atual.slug); v('#eas-pid', atual.projectId); v('#eas-pac', atual.pacote); v('#eas-ver', atual.versao);
    $('#eas-antes').textContent = 'Hoje o projeto está na conta "' + (atual.owner || '?') + '"' + (atual.sdk ? ' · Expo ' + atual.sdk : '') + '. Se você vai usar OUTRA conta, troque a conta, o projectId (e o slug, se o projeto novo tiver outro nome).';
    $('#eas-ir').onclick = async () => {
      const cfg = { nome: $('#eas-nome').value.trim(), owner: $('#eas-owner').value.trim(), slug: $('#eas-slug').value.trim(), projectId: $('#eas-pid').value.trim(), pacote: $('#eas-pac').value.trim(), versao: $('#eas-ver').value.trim() };
      if (cfg.pacote && !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(cfg.pacote)) return SK.toast('Pacote inválido. Exemplo: com.maikon.meuapp', 'error');
      if (/token|expo_|^[A-Za-z0-9_-]{30,}$/i.test(cfg.owner + ' ' + cfg.slug)) return SK.toast('Isso parece um TOKEN. Ele não vai aqui — só no cofre do GitHub.', 'error');
      const r = ExpoConserto.consertar(A, cfg);
      const enc = new TextEncoder();
      const apagar = new Set(r.apagados);
      const novas = ent.filter((e) => !apagar.has(e.name)).map((e) => (r.arquivos[e.name] != null ? { name: e.name, data: enc.encode(r.arquivos[e.name]) } : e));
      for (const [k, t] of Object.entries(r.arquivos)) if (!ent.some((e) => e.name === k)) novas.push({ name: k, data: enc.encode(t) });
      const zip = await SK.zip.write(novas);
      const nomeZip = SK.nomeSeguro(r.slug || P.nome) + '-eas.zip';
      const texto = '☁️ Conserto para o EAS — ' + P.nome + '\n\nO QUE FIZ:\n' + r.relato.map((x) => '- ' + x).join('\n') + (r.avisos.length ? '\n\nATENÇÃO:\n' + r.avisos.map((x) => '- ' + x).join('\n') : '') +
        '\n\nPRÓXIMOS PASSOS:\n1. Mande este zip para um repositório do GitHub (Mini SK → 🐙 GitHub).\n2. No repositório: Settings → Secrets and variables → Actions → New repository secret → nome EXPO_TOKEN, valor = seu token do expo.dev (ou use o painel ☁️ EAS do Mini SK, que faz isso sozinho).\n3. Actions → "☁️ APK pelo EAS" → Run workflow.\n4. Em uns 15 minutos o APK aparece em https://expo.dev/accounts/' + (r.owner || 'SUA-CONTA') + '/projects/' + r.slug + '/builds';
      $('#eas-out').innerHTML = '<div class="eas-rel">' + r.relato.map((x) => '<div class="linha bom">' + SK.esc(x) + '</div>').join('') + r.avisos.map((x) => '<div class="linha ' + (/^❗/.test(x) ? 'ruim' : 'meio') + '">' + SK.esc(x) + '</div>').join('') + '</div>' +
        '<div class="row wrap"><button class="btn primary" id="eas-baixar">⬇ Baixar o zip consertado</button><button class="btn" id="eas-copia">📁 Guardar como cópia aqui</button><button class="btn" id="eas-rel">📌 Guardar relatório</button></div>' +
        '<pre class="plano-pre">' + SK.esc(texto) + '</pre>';
      $('#eas-baixar').onclick = () => SK.download(nomeZip, zip);
      $('#eas-copia').onclick = async () => { await SK.projeto.guardarCopia(P.nome + ' (EAS consertado)', zip, 'conserto', { de: P.id }); SK.toast('Cópia guardada. O original ficou intacto.', 'ok'); };
      $('#eas-rel').onclick = () => SK.relatorios.guardar({ ferramenta: '☁️ Conserto EAS', projeto: P.id, projetoNome: P.nome, texto });
      $('#eas-out').scrollIntoView({ behavior: 'smooth' });
    };
  }

  async function telaDiagnostico() {
    const box = $('#tela-diagnostico');
    const P = SK.projeto.ativo;
    if (!P) { box.innerHTML = '<div class="vazio">Escolha ou importe um projeto na aba 📁 Projetos.</div>'; return; }
    box.innerHTML = '<p class="muted">⏳ Examinando ' + SK.esc(P.nome) + '…</p>';
    let D;
    try { D = await SK.projeto.diagnostico(P.id); } catch (e) { box.innerHTML = '<p class="erro">❌ ' + SK.esc(e.message) + '</p>'; return; }
    ultimoDiag = { P, D };
    const tipos = Object.entries(D.tipos).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => k + ' ' + v).join(' · ');
    const temAbs = D.indexes.some((x) => x.problemas.some((p) => /barra no começo/.test(p)));
    let s = '<div class="card"><h3>' + SK.esc(P.nome) + '</h3><p class="muted small">' + SK.fmt(D.nArquivos) + ' arquivos · ' + SK.bytes(D.total) + (D.raiz ? ' · pasta de dentro: ' + SK.esc(D.raiz) : '') + '</p>' +
      '<p class="small">' + SK.esc(tipos) + '</p>' + (D.sinais.length ? '<p>' + D.sinais.map((x) => '<span class="tag">' + SK.esc(x) + '</span>').join(' ') + '</p>' : '') + '</div>';
    if (D.apps.length) s += '<div class="card"><h3>Apps dentro do projeto (' + D.apps.length + ')</h3><div class="tabela-rolar"><table class="tab"><tr><th>Pasta</th><th>Tipo</th><th>Site pronto?</th></tr>' +
      D.apps.map((a) => '<tr><td>' + SK.esc(a.pasta) + (a.catalogo ? ' <span class="tag laranja" title="package.json com catalog: — só funciona no Replit">catalog:</span>' : '') + '</td><td>' + SK.esc(a.tipo) + '</td><td>' + (a.pronto ? '✅ ' + SK.esc(a.pronto.replace(a.pasta === '(raiz)' ? '' : a.pasta + '/', '')) : '—') + '</td></tr>').join('') + '</table></div>' +
      '<p class="muted small">"Site pronto" = tem a pasta dist/ (ou build/) com index.html: é essa que abre pelo index e vira APK. Sem ela, o projeto é só código-fonte.</p></div>';
    s += '<div class="card"><h3>Abre pelo index?</h3>' + (D.indexes.length ? D.indexes.map((x) =>
      '<div class="idx"><code>' + SK.esc(x.caminho) + '</code>' +
      x.problemas.map((p) => '<div class="linha ruim">❌ ' + SK.esc(p) + '</div>').join('') +
      x.avisos.map((p) => '<div class="linha meio">⚠️ ' + SK.esc(p) + '</div>').join('') +
      x.ok.map((p) => '<div class="linha bom">✅ ' + SK.esc(p) + '</div>').join('') + '</div>').join('') : (D.expo ? '<p class="linha meio">ℹ️ É um app Expo (React Native): não abre pelo index. Ele vira APK pela EAS (npm run apk / eas build), não pelo 📦 APK do Mini SK.</p>' : '<p class="linha ruim">❌ Não tem nenhum index.html. Sem ele não abre como página nem vira APK pelo Mini SK.</p>')) +
      (temAbs ? '<button class="btn primary" id="diag-consertar">🔧 Consertar caminhos (numa cópia)</button>' : '') + '</div>';
    if (D.lacre.length) s += '<div class="card"><h3>🔒 Lacre do terminal real (COOP/COEP)</h3><p class="small">Aparece em: ' + D.lacre.map((c) => '<code>' + SK.esc(c) + '</code>').join(', ') + '</p><p class="muted small">É o que faz o terminal de verdade (Node) funcionar. Só funciona aberto como site (https ou localhost). Não tire se você usa o terminal.</p></div>';
    if (D.servidor.length) s += '<div class="card"><h3>🖥️ Precisa de servidor</h3><p class="small">' + D.servidor.slice(0, 8).map((c) => '<code>' + SK.esc(c) + '</code>').join(', ') + (D.servidor.length > 8 ? '…' : '') + '</p><p class="muted small">Essas partes só funcionam com o servidor rodando (no computador). No celular/APK, só a parte de tela.</p></div>';
    s += '<div class="card"><h3>🔑 Chaves e senhas no código</h3>' + (D.chaves.length ? '<p class="linha ruim">❌ ' + D.chaves.length + ' encontrada(s). Tire antes de mandar para o GitHub ou para alguém:</p><ul class="lista">' + D.chaves.map((k) => '<li><code>' + SK.esc(k.caminho) + '</code> linha ' + k.linha + ' — ' + SK.esc(k.valor) + '</li>').join('') + '</ul>' : '<p class="linha bom">✅ Nenhuma chave encontrada.</p>') + '</div>';
    if (D.expo && window.ExpoConserto) s += '<div class="card" id="eas-card"><h3>☁️ Consertar para o EAS (app Expo → APK)</h3>' +
      '<p class="small">Tira a Replit, coloca os dados da <b>sua</b> conta Expo, acerta app.json, eas.json, package.json e as autorizações do Android, põe a receita do GitHub e devolve <b>um zip só</b>, pronto. O <b>token não vai aqui</b>: ele fica só no cofre do GitHub (EXPO_TOKEN).</p>' +
      '<div class="form-eas">' +
      '<label>Nome do app<input class="input" id="eas-nome"></label>' +
      '<label>Conta do Expo (owner) <small class="muted">— seu nome de usuário no expo.dev</small><input class="input" id="eas-owner" autocapitalize="off"></label>' +
      '<label>Slug <small class="muted">— nome curto, sem espaço; tem que ser IGUAL ao do projeto no expo.dev</small><input class="input" id="eas-slug" autocapitalize="off"></label>' +
      '<label>projectId <small class="muted">— expo.dev → Projects → Create project (com o slug acima) → copie o ID</small><input class="input" id="eas-pid" autocapitalize="off" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"></label>' +
      '<label>Pacote Android <small class="muted">— ex.: com.maikon.meuapp (invente; só letras minúsculas e pontos)</small><input class="input" id="eas-pac" autocapitalize="off"></label>' +
      '<label>Versão<input class="input" id="eas-ver"></label>' +
      '</div><p class="muted small" id="eas-antes"></p>' +
      '<div class="row wrap"><button class="btn primary" id="eas-ir">🔧 Consertar</button></div><div id="eas-out"></div></div>';
    s += '<div class="row wrap"><button class="btn primary" id="diag-guardar">📌 Guardar relatório</button><button class="btn" id="diag-ferr">🧰 Abrir as ferramentas</button><button class="btn" id="diag-plano">📋 Gerar o plano completo</button></div><div id="diag-plano-out"></div>';
    box.innerHTML = s;
    const bc = $('#diag-consertar'); if (bc) bc.onclick = async () => { try { await SK.projeto.consertarCaminhos(P.id); telaDiagnostico(); } catch (e) { SK.toast(e.message, 'error'); } };
    $('#diag-guardar').onclick = () => SK.relatorios.guardar({ ferramenta: '🩺 Diagnóstico rápido', projeto: P.id, projetoNome: P.nome, texto: textoDiag(P, D) });
    $('#diag-ferr').onclick = () => irPara('ferramentas');
    if ($('#eas-card')) prepararEas(P, D);
    $('#diag-plano').onclick = async () => {
      const out = $('#diag-plano-out'); out.innerHTML = '<p class="muted">⏳ Lendo todos os arquivos…</p>';
      try {
        const ent = await SK.projeto.entradasDe(P.id);
        const raiz = D.raiz || '';
        const dec = new TextDecoder('utf-8');
        const BIN = /\.(png|jpe?g|gif|webp|ico|bmp|avif|mp3|wav|ogg|m4a|mp4|webm|mov|pdf|zip|gz|rar|7z|apk|aab|exe|dll|so|woff2?|ttf|otf|eot|wasm|db|sqlite|docx|xlsx|pptx|jar|keystore|jks)$/i;
        const arqs = ent.map((e) => ({ path: e.name.slice(raiz.length), text: BIN.test(e.name) || e.data.length > 3e6 ? null : dec.decode(e.data) }));
        const d = PlanoProjeto.gerar(arqs, P.nome);
        out.innerHTML = '<div class="card"><h3>📋 Plano</h3><p class="small">' + d.telas.length + ' tela(s) · ' + d.rotas.length + ' rota(s) do backend · ' + d.chamadas.length + ' chamada(s) do app · <b>' + d.faltam.length + ' endereço(s) que faltam no backend</b> · ' + d.tabelas.length + ' tabela(s) · ' + d.env.length + ' variável(is)</p>' +
          '<div class="row wrap"><button class="btn primary" id="pl-baixar">⬇ Baixar PLANO.md</button><button class="btn" id="pl-guardar">📌 Guardar relatório</button><button class="btn" id="pl-copiar">📋 Copiar (para a IA)</button></div>' +
          '<pre class="plano-pre">' + SK.esc(d.md) + '</pre></div>';
        $('#pl-baixar').onclick = () => SK.download('PLANO-' + SK.nomeSeguro(P.nome) + '.md', new Blob([d.md], { type: 'text/markdown' }));
        $('#pl-guardar').onclick = () => SK.relatorios.guardar({ ferramenta: '📋 Plano do projeto', projeto: P.id, projetoNome: P.nome, texto: d.md });
        $('#pl-copiar').onclick = () => SK.copy(d.md);
        out.scrollIntoView({ behavior: 'smooth' });
      } catch (e) { out.innerHTML = '<p class="erro">❌ ' + SK.esc(e.message) + '</p>'; }
    };
  }
  function textoDiag(P, D) {
    const L = ['DIAGNÓSTICO RÁPIDO — ' + P.nome, SK.fmt(D.nArquivos) + ' arquivos, ' + SK.bytes(D.total), 'Sinais: ' + (D.sinais.join(', ') || '—'), ''];
    if (D.apps.length) { L.push('APPS DENTRO DO PROJETO'); for (const a of D.apps) L.push('  - ' + a.pasta + ': ' + a.tipo + ' · site pronto: ' + (a.pronto || 'não') + (a.catalogo ? ' · catalog: (só Replit)' : '')); L.push(''); }
    L.push('ABRE PELO INDEX?');
    if (!D.indexes.length) L.push(D.expo ? '  ℹ️ App Expo: vira APK pela EAS, não pelo index' : '  ❌ Não tem index.html');
    for (const x of D.indexes) { L.push('  ' + x.caminho); x.problemas.forEach((p) => L.push('    ❌ ' + p)); x.avisos.forEach((p) => L.push('    ⚠️ ' + p)); x.ok.forEach((p) => L.push('    ✅ ' + p)); }
    if (D.lacre.length) L.push('', 'LACRE (COOP/COEP — terminal real): ' + D.lacre.join(', '));
    if (D.servidor.length) L.push('', 'PRECISA DE SERVIDOR: ' + D.servidor.join(', '));
    L.push('', 'CHAVES NO CÓDIGO: ' + (D.chaves.length ? '' : 'nenhuma'));
    for (const k of D.chaves) L.push('  - ' + k.caminho + ' linha ' + k.linha + ' — ' + k.valor);
    return L.join('\n');
  }

  // ── Topo: projeto em uso ────────────────────────────────────────────────────
  SK.on('projeto', (P) => { $('#topo-proj').textContent = P ? P.nome : 'nenhum projeto'; if (aba === 'diagnostico') telaDiagnostico(); });

  function iniciar() {
    SK.$$('#abas [data-aba]').forEach((b) => b.onclick = () => irPara(b.dataset.aba));
    $('#topo-proj').onclick = () => irPara('projetos');
    $('#ferr-voltar').onclick = () => irPara(anterior === 'ferramenta' ? 'ferramentas' : anterior);
    $('#ferr-guardar').onclick = () => SK.ferramentas.guardarRelatorio();
    $('#ferr-mandar').onclick = () => SK.ferramentas.alimentar();
    SK.projeto.iniciar().then(() => irPara(SK.projeto.ativo ? 'diagnostico' : 'projetos'));
  }
  SK.app = { irPara };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})(window.SK);
