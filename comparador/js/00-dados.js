/* =========================================================================
   Colador de Links — 00-dados.js
   Onde tudo fica guardado (neste aparelho) + backup em arquivo.
   CL.links  = [{ id, nome, url, marcado }]
   CL.abas   = [{ id, nome, url }]        (as abas fixadas no topo)
   ========================================================================= */
(function (g) {
  'use strict';
  const CL = (g.CL = g.CL || {});
  CL.versao = 'v09/10-a';
  const K_LINKS = 'colador_links_v1', K_ABAS = 'colador_abas_v1';

  // Links que apareciam nos seus prints (já entram na primeira vez)
  const INICIAIS = [
    ['1.play', 'https://bucolic-babka-4c12ea.netlify.app/'],
    ['2.SkTools', 'https://hilarious-profiterole-c0c785.netlify.app/'],
    ['3.chat', 'https://iridescent-speculoos-1db22c.netlify.app/'],
    ['4.sk', 'https://phenomenal-caramel-18cdfe.netlify.app/'],
    ['5', 'https://bejewelled-bienenstitch-3f78dd.netlify.app/'],
    ['Conversa (Claude)', 'https://claude.ai/share/0f4958a1-a87a-4180-a09a-dd15341a65cd'],
    ['proj22-pwa', 'https://maikonadvogadomg-alt.github.io/proj22-pwa/index.html'],
    ['mini6-pwa', 'https://jorgecaldeira62-gif.github.io/mini6-pwa/'],
    ['Monica 1', 'https://monica.im/share/chat?shareId=nfi0FGbnUIDxyh7O'],
    ['Monica 2', 'https://monica.im/share/chat?shareId=rjMdNehXJOdwRxoQ'],
    ['Mini SK', 'https://maikonadvogadomg-alt.github.io/mini-sk/'],
    ['Caça-Bug 2', 'https://maikonadvogadomg-alt.github.io/caca-bug-2/'],
    ['Caca1', 'https://maikonadvogadomg-alt.github.io/caca-tudo/'],
  ];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function ler(k, padrao) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch { return padrao; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { CL.aviso('⚠️ Não consegui guardar (memória cheia?). Faça um backup.'); return false; } }

  CL.links = ler(K_LINKS, null);
  if (!CL.links) { CL.links = INICIAIS.map(([nome, url]) => ({ id: uid(), nome, url, marcado: true })); gravar(K_LINKS, CL.links); }
  CL.abas = ler(K_ABAS, []);

  CL.salvar = () => { gravar(K_LINKS, CL.links); gravar(K_ABAS, CL.abas); };
  CL.uid = uid;
  CL.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  CL.$ = (s, el) => (el || document).querySelector(s);

  // aceita "site.com" sem https
  CL.arrumarUrl = (u) => { u = String(u || '').trim(); if (!u) return ''; if (!/^[a-z][\w+.-]*:/i.test(u)) u = 'https://' + u; try { return new URL(u).href; } catch { return ''; } };

  // ── aviso rápido ────────────────────────────────────────────────────────────
  let t;
  CL.aviso = (msg) => { const a = document.getElementById('aviso'); if (!a) return; a.textContent = msg; a.hidden = false; clearTimeout(t); t = setTimeout(() => (a.hidden = true), 2600); };

  // ── backup ─────────────────────────────────────────────────────────────────
  CL.backup = () => {
    const dados = JSON.stringify({ app: 'colador-de-links', versao: 1, data: new Date().toISOString(), links: CL.links, abas: CL.abas }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([dados], { type: 'application/json' }));
    a.download = 'colador-links-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  CL.restaurar = async (arquivo) => {
    const j = JSON.parse(await arquivo.text());
    if (!Array.isArray(j.links)) throw new Error('Este arquivo não é um backup do Colador.');
    const ja = new Set(CL.links.map((l) => l.url));
    let n = 0;
    for (const l of j.links) if (l.url && !ja.has(l.url)) { CL.links.push({ id: uid(), nome: l.nome || l.url, url: l.url, marcado: !!l.marcado }); n++; }
    const jaAba = new Set(CL.abas.map((a) => a.url));
    for (const a of j.abas || []) if (a.url && !jaAba.has(a.url)) CL.abas.push({ id: uid(), nome: a.nome, url: a.url });
    CL.salvar();
    return n;
  };
  // cola um texto qualquer com vários endereços dentro → vira links
  CL.colarVarios = (texto) => {
    const urls = String(texto || '').match(/https?:\/\/[^\s"'<>)]+/g) || [];
    const ja = new Set(CL.links.map((l) => l.url));
    let n = 0;
    for (const u of urls) { const url = CL.arrumarUrl(u); if (url && !ja.has(url)) { ja.add(url); CL.links.push({ id: uid(), nome: new URL(url).hostname.split('.')[0], url, marcado: true }); n++; } }
    CL.salvar();
    return n;
  };
})(window);
