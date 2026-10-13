/**
 * js/bug-patcher.js
 * Módulo para Isolar Correções de Bugs Entre Versões do Projeto Jurídico
 */

window.BugPatcher = {
  // 1. Isola as linhas exatas que corrigiram o bug na versão boa
  extrairCorrecao: function (codigoComBug, codigoCorrigido) {
    const linhasRuins = codigoComBug.split('\n');
    const linhasBoas = codigoCorrigido.split('\n');

    const solucao = {
      linhasRemovidasDoBug: [],
      linhasInjetadasQueSalvaram: [],
      resumoEmTexto: ""
    };

    // Identifica o que foi alterado na versão corrigida
    const conjuntoRuim = new Set(linhasRuins.map(l => l.trim()));
    const conjuntoBom = new Set(linhasBoas.map(l => l.trim()));

    linhasRuins.forEach((linha, idx) => {
      if (linha.trim() !== '' && !conjuntoBom.has(linha.trim())) {
        solucao.linhasRemovidasDoBug.push({ linha: idx + 1, conteudo: linha });
      }
    });

    linhasBoas.forEach((linha, idx) => {
      if (linha.trim() !== '' && !conjuntoRuim.has(linha.trim())) {
        solucao.linhasInjetadasQueSalvaram.push({ linha: idx + 1, conteudo: linha });
      }
    });

    solucao.resumoEmTexto = `
=== DIAGNÓSTICO DA CORREÇÃO DO BUG ===
🔴 Linhas que causavam o bug (Removidas): ${solucao.linhasRemovidasDoBug.length}
🟢 Linhas que resolveram o bug (Injetadas): ${solucao.linhasInjetadasQueSalvaram.length}
`;

    return solucao;
  },

  // 2. Aplica a correção encontrada na versão com bug
  aplicarRemedio: function (codigoComBug, solucaoExtraida) {
    let codigoNovo = codigoComBug;

    // Substitui a lógica antiga pela lógica que funciona
    solucaoExtraida.linhasRemovidasDoBug.forEach(item => {
      codigoNovo = codigoNovo.replace(item.conteudo, '');
    });

    // Injeta as linhas corretas
    const blocoSolucao = solucaoExtraida.linhasInjetadasQueSalvaram
      .map(i => i.conteudo)
      .join('\n');

    return {
      codigoFinal: codigoNovo + '\n\n/* CÓDIGO DE CORREÇÃO INJETADO AUTOMATICAMENTE */\n' + blocoSolucao,
      sucesso: true
    };
  }
};
