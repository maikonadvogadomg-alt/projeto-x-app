/* =========================================================================
   organizar-core.js — 🗂️ Organizar a bagunça (sem IA, sem internet)
   Recebe uma pilha de arquivos (pastas repetidas, versões, .md com vários
   códigos colados) e devolve tudo separado e explicado:
   - corta .md/.txt com várias páginas/códigos colados em PEÇAS separadas;
   - acha CÓPIAS iguais (mesmo conteúdo, nome ou pasta diferente);
   - agrupa VERSÕES do mesmo arquivo e escolhe a MELHOR (completa, maior);
   - avisa o que está INCOMPLETO ("continua na parte 2", chave sem fechar…);
   - diz o ASSUNTO de cada peça (APK, EAS, Electron, PWA, IA, banco…);
   - lê cada index.html: o que ele chama, o que FALTA, e os módulos SOLTOS
     que existem mas ninguém chama;
   - MONTA uma pasta a partir do index escolhido, com a melhor versão de
     cada arquivo e os módulos soltos já ligados.
   OrganizarCore.analisar(arquivos) → resultado
     arquivos = [{ path, text|null, bytes }]
   OrganizarCore.saida(resultado, { montarIndex, incluirSoltos }) → [{ name, text|bytes }]
   ========================================================================= */
(function (g) {
  'use strict';
  const TEXTO = /\.(html?|m?js|cjs|jsx|tsx?|css|json|md|markdown|txt|sql|ya?ml|bat|cmd|sh|ps1|py|xml|svg|toml|ini|env\.example)$/i;
  const base = (p) => p.split('/').pop();
  const dir = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
  const ext = (p) => { const b = base(p); const i = b.lastIndexOf('.'); return i > 0 ? b.slice(i + 1).toLowerCase() : ''; };
  const norm = (p) => p.split('/').reduce((a, s) => { if (!s || s === '.') return a; if (s === '..') a.pop(); else a.push(s); return a; }, []).join('/');
  const slug = (s) => String(s || 'peca').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'peca';
  const chaveConteudo = (t) => String(t).replace(/\s+/g, '');
  function hash(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16) + ':' + s.length; }

  // ── assuntos (pastas) ───────────────────────────────────────────────────────
  const ASSUNTOS = [
    ['eas-expo', /\beas\b|eas\.json|expo\.dev|EXPO_TOKEN|eas-cli|expo-/i],
    ['apk-capacitor', /capacitor|@capacitor|gradlew|AndroidManifest/i],
    ['desktop-electron', /electron/i],
    ['windows-bat', /@echo off|\.bat\b|REM |chcp 65001/i],
    ['pwa-icones', /manifest\.json|serviceWorker|service-worker|icone|ícone|favicon|\bPWA\b/i],
    ['github-repositorio', /api\.github\.com|repositor|github/i],
    ['ia-chat', /openai|anthropic|gemini|groq|ollama|\bIA\b|chat/i],
    ['banco-supabase', /supabase|CREATE TABLE|neon|postgres/i],
    ['playground-editor', /playground|editor|textarea|codemirror|monaco/i],
    ['configuracao', /configura|settings|config\b/i],
    ['guia-manual', /guia|manual|tutorial|passo a passo/i],
  ];
  function assuntoDe(nome, t) {
    const amostra = nome + '\n' + String(t || '').slice(0, 20000);
    let melhor = 'outros', pontos = 0;
    for (const [k, re] of ASSUNTOS) {
      const n = (amostra.match(new RegExp(re.source, 'gi')) || []).length + (re.test(nome) ? 25 : 0);
      if (n > pontos) { pontos = n; melhor = k; }
    }
    if (/^(config|base|app|encoding|core|utils?)\.js$/i.test(nome)) melhor = 'base-nucleo';
    return melhor;
  }

  // ── incompleto? ─────────────────────────────────────────────────────────────
  function incompleto(t, e) {
    const m = [];
    if (/continua(do)? na parte|ser[áa] continuado|\[descri[çc][ãa]o\]|parte \d+ de \d+|cole aqui o resto|\/\/\s*\.\.\.\s*(resto|restante|mais)/i.test(t)) m.push('tem aviso de "continua" ou pedaço faltando');
    if (/^(m?js|cjs|jsx|ts|tsx|css)$/.test(e)) {
      const sem = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/`(?:\\[\s\S]|[^`\\])*`/g, '``').replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, '""');
      const a = (sem.match(/\{/g) || []).length, f = (sem.match(/\}/g) || []).length;
      if (Math.abs(a - f) > 1) m.push('chaves { } não fecham (' + a + ' abertas, ' + f + ' fechadas)');
    }
    if (/^html?$/.test(e) && /<html/i.test(t) && !/<\/html>/i.test(t)) m.push('a página não termina (falta </html>)');
    if (/^html?$/.test(e) && /<script[^>]*>\s*\/\/[^\n]*\s*<\/script>/i.test(t)) m.push('tem <script> vazio (só comentário)');
    return m;
  }

  // ── erro de escrita (JS) e conserto automático SEGURO ──────────────────────
  // Só confere JS "comum" (sem import/export). O conserto só é aceito se, depois
  // dele, o arquivo passar a ser lido sem erro. O original vai para as versões antigas.
  const ehModuloES = (t) => /^\s*(import\s[\s\S]*?from\s|import\s*["']|export\s)/m.test(t);
  function sintaxe(t) {
    if (typeof Function === 'undefined' || ehModuloES(t)) return null;
    try { new Function(t); return null; } catch (e) { return e.message; }
  }
  const MARCA_CONVERSA = /^(ADICIONAR|ADICIONE|SUBSTITUA|SUBSTITUIR|COLE|COLOQUE|MODIFIQUE|ALTERE|ATUALIZE)\b[^\n]*$|^(Adicione|Substitua|Cole|Coloque|Modifique|Altere|Atualize)\s[^\n]*:\s*$|^Copiar\s*$|^Copy code\s*$/;
  function conversaColada(t) {
    const L = t.split('\n'), blocos = [];
    for (let i = 0; i < L.length; i++) {
      if (!MARCA_CONVERSA.test(L[i].trim()) || /^\s/.test(L[i])) continue;
      let fim = -1;
      for (let j = i + 1; j < Math.min(L.length, i + 400); j++) if (/^\}\s*;?\s*$/.test(L[j])) { fim = j; break; }
      if (fim < 0) continue;
      blocos.push([i, fim]); i = fim;
    }
    return blocos;
  }
  function tentarConsertar(t) {
    if (!sintaxe(t)) return null;
    const tentativas = [];
    // 1) comentário com uma barra só: "/ ═══"  →  "// ═══"
    tentativas.push(['coloquei a 2ª barra no comentário da linha 1', (x) => x.replace(/^\/ ?(?=[═─=*#])/gm, '// ')]);
    // 2) aspas com barra dobrada dentro de texto entre aspas:  \\"  →  \"
    tentativas.push(['acertei aspas com barra dobrada (\\\\")', (x) => x.split('\n').map((l) => (/^\s*"[^"]*":\s*".*\\\\"/.test(l) ? l.replace(/\\\\"/g, '\\"') : l)).join('\n')]);
    // 3) texto de conversa colado no meio ("ADICIONAR NO…", "Copiar", trecho para outro arquivo)
    tentativas.push(['tirei texto de conversa colado no meio (guardado à parte)', (x) => { const b = conversaColada(x); if (!b.length) return x; const L = x.split('\n'); for (const [i, f] of b.reverse()) L.splice(i, f - i + 1); return L.join('\n'); }]);
    let atual = t; const feitos = [];
    for (const [nome, fn] of tentativas) {
      const novo = fn(atual);
      if (novo !== atual) { atual = novo; feitos.push(nome); if (!sintaxe(atual)) return { texto: atual, feitos, tirado: conversaColada(t).map(([i, f]) => t.split('\n').slice(i, f + 1).join('\n')) }; }
    }
    // combinações não resolveram
    return null;
  }

  // ── o que a peça faz (resumo legível) ──────────────────────────────────────
  function resumo(nome, t, e) {
    const r = { titulo: '', funcoes: [], globais: [], botoes: [], usa: [], tabelas: [] };
    const tt = /<title>([^<]*)<\/title>/i.exec(t); if (tt) r.titulo = tt[1].trim();
    let m;
    const reG = /^(?:const|let|var|class)\s+([A-Z][\w$]*)\s*(?:=|\{|extends)/gm; while ((m = reG.exec(t))) r.globais.push(m[1]);
    const reF = /^\s{0,4}(?:async\s+)?(?:function\s+([\w$]+)|([a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{)/gm; while ((m = reF.exec(t))) { const n = m[1] || m[2]; if (!/^(if|for|while|switch|catch|function|return)$/.test(n)) r.funcoes.push(n); }
    const reB = /<button[^>]*>([^<]{1,40})<\/button>/gi; while ((m = reB.exec(t))) r.botoes.push(m[1].trim());
    const reT = /CREATE TABLE(?: IF NOT EXISTS)?\s+([\w.]+)/gi; while ((m = reT.exec(t))) r.tabelas.push(m[1]);
    const libs = [[/supabase/i, 'Supabase'], [/jszip/i, 'JSZip (zip)'], [/api\.openai\.com/i, 'OpenAI'], [/anthropic\.com/i, 'Claude'], [/generativelanguage/i, 'Gemini'], [/groq\.com/i, 'Groq'], [/api\.github\.com/i, 'GitHub'], [/localStorage/, 'guarda no aparelho (localStorage)'], [/indexedDB/i, 'banco do aparelho (IndexedDB)'], [/speechSynthesis/, 'voz do navegador'], [/SpeechRecognition/, 'microfone (ditado)'], [/fetch\(/, 'internet (fetch)']];
    for (const [re, n] of libs) if (re.test(t)) r.usa.push(n);
    r.funcoes = [...new Set(r.funcoes)].slice(0, 25); r.globais = [...new Set(r.globais)].slice(0, 10); r.botoes = [...new Set(r.botoes)].slice(0, 20);
    return r;
  }

  // ── cortar .md/.txt com várias coisas coladas ───────────────────────────────
  function cortar(origem, t) {
    const pecas = [];
    const add = (nome, texto, tipo) => { texto = texto.replace(/^\s+|\s+$/g, ''); if (texto.length > 40) pecas.push({ nome, texto, tipo, origem }); };
    // 1) blocos ``` com nome de arquivo
    const blocos = [...t.matchAll(/(?:^|\n)(?:[#*`\s-]*(?:arquivo|file|filepath)?[:\s]*`?([\w./-]+\.(?:html?|m?js|css|json|sql|ya?ml|bat|md|tsx?|jsx))`?[*\s]*\n)?```(\w*)[^\n]*\n([\s\S]*?)\n```/gi)];
    if (blocos.length >= 2) {
      blocos.forEach((b, i) => { const lang = (b[2] || '').toLowerCase(); const e = b[1] ? ext(b[1]) : ({ javascript: 'js', js: 'js', html: 'html', css: 'css', sql: 'sql', json: 'json', yaml: 'yml', yml: 'yml', bash: 'sh', batch: 'bat', bat: 'bat', typescript: 'ts', tsx: 'tsx' }[lang] || 'txt'); add(b[1] ? base(b[1]) : 'bloco-' + (i + 1) + '.' + e, b[3], e); });
      return pecas;
    }
    // 2) páginas HTML inteiras coladas + o que fica entre elas.
    //    Só conta o <!DOCTYPE html> que começa a LINHA (o que aparece no meio de um
    //    código, tipo return `<!DOCTYPE html>, é um modelo dentro da página, não outra página).
    const inicios = [...t.matchAll(/^[ \t]*<!DOCTYPE html>/gim)].map((m) => m.index);
    const resto = [];
    let n = 0;
    if (inicios.length) resto.push(t.slice(0, inicios[0]));
    inicios.forEach((ini, k) => {
      const seg = t.slice(ini, k + 1 < inicios.length ? inicios[k + 1] : t.length);
      const fim = seg.toLowerCase().lastIndexOf('</html>');
      const pagina = fim >= 0 ? seg.slice(0, fim + 7) : seg;
      const tt = /<title>([^<]*)<\/title>/i.exec(pagina);
      n++; add(slug(tt ? tt[1] : 'pagina') + '.html', pagina, 'html');
      if (fim >= 0) resto.push(seg.slice(fim + 7));
    });
    if (!inicios.length) resto.push(t);
    if (!n && resto.join('').trim() === t.trim()) return [];  // nada para cortar
    // 3) o que sobrou: JS com títulos "// ===== NOME =====" e SQL "-- ====="
    for (const pedaco of resto) {
      if (!pedaco.trim()) continue;
      const partes = pedaco.split(/\n(?=(?:\/\/|--)\s*=====\s*[^=\n]+=====)/);
      let sqlJunto = '';
      for (const p of partes) {
        const cab = /^(?:\/\/|--)\s*=====\s*([^=\n]+?)\s*=====/.exec(p.trim());
        const ehSql = /^\s*--/.test(p.trim()) || /\b(CREATE|DROP|ALTER) TABLE\b/i.test(p);
        if (ehSql) { sqlJunto += p + '\n'; continue; }
        if (/<!DOCTYPE|<html/i.test(p) && !/<\/html>/i.test(p)) { add(slug(cab ? cab[1] : 'pagina-incompleta') + '.html', p, 'html'); continue; }
        add(slug(cab ? cab[1] : 'codigo') + '.js', p, 'js');
      }
      if (sqlJunto.trim()) {
        // várias versões de SQL coladas: separa a cada bloco que recomeça com DROP/"TABELAS"
        const versoes = sqlJunto.split(/\n(?=--\s*=====\s*(?:TABELAS|DELETAR ANTIGAS)\s*=====)|\n\n(?=DROP TABLE IF EXISTS [\w.]+ CASCADE;\s*\nDROP TABLE)/i).filter((x) => x.trim());
        versoes.forEach((v) => add('banco.sql', v, 'sql'));
      }
    }
    return pecas;
  }

  // ── análise geral ───────────────────────────────────────────────────────────
  function analisar(arquivos) {
    const pecas = [];
    for (const a of arquivos) {
      const e = ext(a.path);
      const t = a.text;
      if (t != null && /^(md|markdown|txt)$/.test(e)) {
        const cortes = cortar(a.path, t);
        if (cortes.length >= 2) { cortes.forEach((c) => pecas.push({ path: 'pedacos-de-' + slug(base(a.path)) + '/' + c.nome, nome: c.nome, text: c.texto, origem: a.path, cortado: true })); continue; }
      }
      pecas.push({ path: a.path, nome: base(a.path), text: t, bytes: a.bytes, origem: a.path });
    }
    // cópias exatas
    const porHash = new Map();
    for (const p of pecas) {
      p.ext = ext(p.nome);
      p.tam = p.text != null ? p.text.length : (p.bytes ? p.bytes.length : 0);
      p.h = p.text != null ? hash(chaveConteudo(p.text)) : 'bin:' + p.tam + ':' + p.nome;
      if (!porHash.has(p.h)) porHash.set(p.h, []);
      porHash.get(p.h).push(p);
    }
    const unicas = [];
    for (const lista of porHash.values()) {
      const [primeira, ...copias] = lista.sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path));
      primeira.copias = copias.map((c) => c.path);
      unicas.push(primeira);
    }
    // versões (mesmo nome, conteúdo diferente)
    const grupos = new Map();
    for (const p of unicas) {
      const k = p.nome.toLowerCase();
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(p);
    }
    for (const p of unicas) {
      if (p.text != null) {
        p.incompleto = incompleto(p.text, p.ext);
        p.resumo = resumo(p.nome, p.text, p.ext);
        if (/^(m?js|cjs)$/.test(p.ext)) {
          p.erro = sintaxe(p.text);
          const conv = conversaColada(p.text);
          if (conv.length) p.incompleto.push('tem texto de CONVERSA colado no meio (linhas ' + conv.map(([i, f]) => (i + 1) + '–' + (f + 1)).join(', ') + ')');
          if (!p.erro && typeof Function !== 'undefined' && !ehModuloES(p.text)) p.incompleto = p.incompleto.filter((x) => !/^chaves/.test(x));
          if (p.erro) {
            p.conserto = tentarConsertar(p.text);
            if (p.conserto) { p.original = p.text; p.text = p.conserto.texto; p.erroOriginal = p.erro; p.erro = null; p.incompleto = p.incompleto.filter((x) => !/CONVERSA/.test(x)); p.resumo = resumo(p.nome, p.text, p.ext); }
          }
        }
      } else { p.incompleto = []; p.resumo = { titulo: '', funcoes: [], globais: [], botoes: [], usa: [], tabelas: [] }; }
      p.assunto = /^(png|jpe?g|gif|webp|ico|svg)$/.test(p.ext) ? 'imagens' : p.ext === 'sql' ? 'banco-supabase' : (/^html?$/.test(p.ext) && /<script[^>]+src=["'](?!https?:)[^"']+\.js/i.test(p.text || '') && /^index\.html?$/i.test(p.nome)) ? 'paginas-principais' : assuntoDe(p.nome, p.text);
    }
    const versoes = [];
    for (const [k, lista] of grupos) {
      lista.sort((a, b) => ((a.erro ? 1 : 0) - (b.erro ? 1 : 0)) || (a.incompleto.length - b.incompleto.length) || (b.resumo.funcoes.length - a.resumo.funcoes.length) || (b.tam - a.tam));
      lista.forEach((p, i) => { p.melhor = i === 0; p.versao = i + 1; p.nVersoes = lista.length; });
      if (lista.length > 1) versoes.push({ nome: k, lista });
    }
    // index.html: o que chama, o que falta, quem está solto
    const porNome = new Map(); unicas.forEach((p) => { const k = p.nome.toLowerCase(); if (p.melhor) porNome.set(k, p); });
    const indexes = [];
    const chamados = new Set();
    for (const p of unicas.filter((x) => /^html?$/.test(x.ext) && x.text && /<script|<link/i.test(x.text))) {
      const d = dir(p.path);
      const refs = [];
      const re = /<(?:script[^>]*\bsrc|link[^>]*\bhref)\s*=\s*["']([^"'#?]+)["']/gi; let m;
      while ((m = re.exec(p.text))) {
        const u = m[1];
        if (/^(https?:|\/\/|data:|blob:)/.test(u)) continue;
        if (!/\.(m?js|css|json|webmanifest)$/i.test(u)) continue;
        const alvo = norm((d ? d + '/' : '') + u);
        const aqui = unicas.find((x) => x.path === alvo) || pecas.find((x) => x.path === alvo);
        const outro = porNome.get(base(u).toLowerCase());
        if (refs.some((r) => r.alvo === alvo)) continue;
        refs.push({ ref: u, alvo, existe: !!aqui, emOutroLugar: !aqui && outro ? outro.path : null });
        chamados.add(base(u).toLowerCase());
      }
      if (refs.length) indexes.push({ path: p.path, titulo: p.resumo.titulo, refs, nFalta: refs.filter((r) => !r.existe && !r.emOutroLugar).length, nAchados: refs.filter((r) => r.existe || r.emOutroLugar).length });
    }
    indexes.sort((a, b) => b.nAchados - a.nAchados || a.nFalta - b.nFalta);
    const soltos = unicas.filter((p) => p.melhor && /^(m?js)$/.test(p.ext) && !chamados.has(p.nome.toLowerCase()) && !p.cortado && /^(const|let|var|class|function|window\.|\(function)/m.test(p.text || ''));
    return { pecas, unicas, versoes, indexes, soltos, nCopias: pecas.length - unicas.length, nArquivos: arquivos.length };
  }

  // ── relatório em Markdown ───────────────────────────────────────────────────
  function relatorio(R) {
    const L = [];
    L.push('# 🗂️ Organização da pasta', '', '_Feito pelo Caça-Bug, sem IA, lendo os arquivos._', '');
    L.push('| | |', '|---|---|', '| Arquivos recebidos | ' + R.nArquivos + ' |', '| Peças (depois de cortar os .md) | ' + R.pecas.length + ' |', '| Cópias iguais jogadas fora | ' + R.nCopias + ' |', '| Peças diferentes | ' + R.unicas.length + ' |', '| Arquivos com várias versões | ' + R.versoes.length + ' |', '| Incompletos | ' + R.unicas.filter((p) => p.incompleto.length).length + ' |', '| Módulos soltos (ninguém chama) | ' + R.soltos.length + ' |', '');
    if (R.indexes.length) {
      L.push('## 🏠 Páginas principais (index) e o que elas chamam');
      for (const ix of R.indexes) {
        L.push('', '### ' + ix.path + (ix.titulo ? ' — ' + ix.titulo : ''));
        ix.refs.forEach((r) => L.push('- ' + (r.existe ? '✅' : r.emOutroLugar ? '🔁' : '❌') + ' `' + r.ref + '`' + (r.existe ? '' : r.emOutroLugar ? ' — não está aqui, mas achei em `' + r.emOutroLugar + '`' : ' — **NÃO EXISTE em lugar nenhum**')));
      }
      L.push('');
    }
    if (R.soltos.length) L.push('## 🧩 Módulos soltos (existem, mas nenhum index chama)', 'Por isso "não aparece" na tela. A pasta MONTADO já liga eles no index.', '', R.soltos.map((p) => '- `' + p.path + '` — ' + (p.resumo.globais[0] || '') + ' · ' + p.assunto).join('\n'), '');
    if (R.versoes.length) {
      L.push('## 🔀 Arquivos com várias versões (a ⭐ é a escolhida)');
      for (const v of R.versoes) { L.push('', '**' + v.nome + '**'); v.lista.forEach((p) => L.push('- ' + (p.melhor ? '⭐' : '  ') + ' `' + p.path + '` — ' + p.tam + ' letras, ' + p.resumo.funcoes.length + ' funções' + (p.incompleto.length ? ' ⚠️ ' + p.incompleto.join('; ') : ''))); }
      L.push('');
    }
    const cons = R.unicas.filter((p) => p.conserto);
    if (cons.length) L.push('## 🔧 Consertados sozinhos (agora funcionam)', cons.map((p) => '- `' + p.path + '` — erro era: "' + p.erroOriginal + '" → ' + p.conserto.feitos.join('; ') + (p.conserto.tirado.length ? ' (o texto tirado está em 5-TEXTO-DE-CONVERSA/)' : '')).join('\n'), '');
    const err = R.unicas.filter((p) => p.erro);
    if (err.length) L.push('## ❌ Com erro de escrita (não consegui consertar sozinho)', err.map((p) => '- `' + p.path + '` — ' + p.erro).join('\n'), 'Mande esse arquivo para a IA (ou para mim) com o erro escrito acima.', '');
    const inc = R.unicas.filter((p) => p.incompleto.length);
    if (inc.length) L.push('## ⚠️ Incompletos', inc.map((p) => '- `' + p.path + '` — ' + p.incompleto.join('; ')).join('\n'), '');
    L.push('## 📦 O que cada peça faz');
    const porAssunto = {};
    R.unicas.filter((p) => p.melhor).forEach((p) => (porAssunto[p.assunto] = porAssunto[p.assunto] || []).push(p));
    for (const [a, lista] of Object.entries(porAssunto).sort()) {
      L.push('', '### ' + a);
      for (const p of lista) {
        const r = p.resumo, info = [];
        if (r.titulo) info.push('página "' + r.titulo + '"');
        if (r.globais.length) info.push('cria ' + r.globais.join(', '));
        if (r.botoes.length) info.push('botões: ' + r.botoes.slice(0, 8).join(' · '));
        if (r.tabelas.length) info.push('tabelas: ' + r.tabelas.join(', '));
        if (r.usa.length) info.push('usa: ' + r.usa.join(', '));
        if (r.funcoes.length) info.push(r.funcoes.length + ' funções (' + r.funcoes.slice(0, 6).join(', ') + (r.funcoes.length > 6 ? '…' : '') + ')');
        L.push('- `' + p.path + '`' + (p.copias && p.copias.length ? ' (+' + p.copias.length + ' cópia' + (p.copias.length > 1 ? 's' : '') + ')' : '') + (p.cortado ? ' ✂️ tirado de ' + p.origem : '') + (info.length ? ' — ' + info.join(' · ') : ''));
      }
    }
    if (R.unicas.some((p) => p.ext === 'sql' && /DROP TABLE/i.test(p.text || ''))) L.push('', '## 🛑 Cuidado com o SQL', 'Algum .sql começa com **DROP TABLE** — isso APAGA as tabelas e tudo que tem nelas. Só rode num banco novo/vazio.');
    L.push('', '## 📁 Como ficou o zip', '- **1-MONTADO/** — o index escolhido + a melhor versão de tudo que ele chama + os módulos soltos ligados. É por aqui que você testa.', '- **2-MELHORES/<assunto>/** — a melhor versão de cada peça, separada por assunto.', '- **3-VERSOES-ANTIGAS/** — as outras versões (para comparar no ⚖️ Comparar).', '- **4-INCOMPLETOS/** — peças que estão pela metade.', '- **5-TEXTO-DE-CONVERSA/** — instruções da IA que estavam coladas dentro do código (ex.: "ADICIONAR NO GERADOR.JS"). Leia: às vezes dizem o que mudar em outro arquivo.', '- **ORGANIZACAO.md** — este relatório.');
    return L.join('\n');
  }

  // ── montar a saída (lista de arquivos para o zip) ──────────────────────────
  function saida(R, op) {
    op = op || {};
    const out = [];
    const put = (name, p) => out.push(p.text != null ? { name, text: p.text } : { name, bytes: p.bytes });
    const usados = new Set();
    // 1-MONTADO
    const ix = op.montarIndex ? R.indexes.find((x) => x.path === op.montarIndex) : R.indexes[0];
    if (ix) {
      const pIx = R.unicas.find((p) => p.path === ix.path);
      let html = pIx.text;
      const d = dir(ix.path);
      const pega = (alvo, nome) => R.unicas.find((p) => p.path === alvo && p.melhor) || R.unicas.find((p) => p.nome.toLowerCase() === nome.toLowerCase() && p.melhor) || R.unicas.find((p) => p.path === alvo);
      for (const r of ix.refs) {
        const p = pega(r.alvo, base(r.ref));
        if (p) { put('1-MONTADO/' + norm(r.ref), p); usados.add(p); }
        else html = html.replace(new RegExp('\\s*<script[^>]*src=["\']' + r.ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\'][^>]*>\\s*</script>', 'i'), '\n  <!-- 🗂️ Caça-Bug: ' + r.ref + ' não existe em lugar nenhum — tirei para não dar erro -->');
      }
      if (op.incluirSoltos !== false && R.soltos.length) {
        const pastaMod = (ix.refs.find((r) => /modules\//.test(r.ref)) || {}).ref;
        const prefixo = pastaMod ? dir(pastaMod) + '/' : 'js/modules/';
        const tags = R.soltos.filter((s) => !usados.has(s)).map((s) => { put('1-MONTADO/' + prefixo + s.nome, s); usados.add(s); return '  <script src="' + prefixo + s.nome + '"></script>'; });
        if (tags.length) {
          const bloco = '  <!-- 🗂️ Caça-Bug: módulos que existiam mas ninguém chamava -->\n' + tags.join('\n') + '\n';
          const app = /(\s*<script[^>]*src=["'][^"']*\bapp\.js["'][^>]*>\s*<\/script>)/i;
          html = app.test(html) ? html.replace(app, '\n' + bloco + '$1') : html.replace(/<\/body>/i, bloco + '</body>');
        }
      }
      // outros arquivos da mesma pasta do index (imagens, manifest, sw)
      R.unicas.filter((p) => p.melhor && dir(p.path) === d && p !== pIx && /^(png|jpe?g|svg|ico|webp|json|webmanifest|js)$/.test(p.ext) && !usados.has(p)).forEach((p) => { put('1-MONTADO/' + p.nome, p); usados.add(p); });
      out.push({ name: '1-MONTADO/index.html', text: html });
    }
    // 2, 3, 4
    for (const p of R.unicas) {
      if (p.incompleto.length && !p.melhor) { put('4-INCOMPLETOS/' + p.path, p); continue; }
      if (p.melhor) put('2-MELHORES/' + p.assunto + '/' + (p.nVersoes > 1 || R.unicas.some((q) => q !== p && q.melhor && q.nome === p.nome) ? slug(dir(p.path) || 'raiz') + '__' : '') + p.nome, p);
      else put('3-VERSOES-ANTIGAS/' + p.nome.replace(/\.(\w+)$/, '') + '/v' + p.versao + '__' + slug(dir(p.path) || 'raiz') + '.' + p.ext, p);
      if (p.melhor && p.incompleto.length) put('4-INCOMPLETOS/' + p.path, p);
    }
    for (const p of R.unicas.filter((x) => x.conserto)) {
      out.push({ name: '3-VERSOES-ANTIGAS/' + p.nome.replace(/\.(\w+)$/, '') + '/original-com-erro__' + slug(dir(p.path) || 'raiz') + '.' + p.ext, text: p.original });
      p.conserto.tirado.forEach((t, i) => out.push({ name: '5-TEXTO-DE-CONVERSA/' + p.nome + '__trecho-' + (i + 1) + '.txt', text: t }));
    }
    out.push({ name: 'ORGANIZACAO.md', text: relatorio(R) });
    return out;
  }

  g.OrganizarCore = { analisar, saida, relatorio, cortar, sintaxe, tentarConsertar, TEXTO };
})(typeof window !== 'undefined' ? window : globalThis);
