/**
 * js/git-diff-analyzer.js
 * Módulo Independente para Comparar Versões do Projeto Jurídico
 * Identifica o que mudou entre o código com cores e o código com lógica
 */

window.GitDiffAnalyzer = {
  // 1. Compara dois textos de código e identifica linhas adicionadas/removidas
  compararArquivos: function (codigoAntigo, codigoNovo) {
    const linhasAntigas = codigoAntigo.split('\n');
    const linhasNovas = codigoNovo.split('\n');

    const diferencas = {
      removidas: [],  // Linhas que existiam na versão antiga e foram apagadas (ex: CSS/Cores)
      adicionadas: [], // Linhas novas que foram colocadas
      mantenhas: 0
    };

    // Mapeamento simples de linhas
    const conjuntoNovo = new Set(linhasNovas);
    const conjuntoAntigo = new Set(linhasAntigas);

    linhasAntigas.forEach((linha, index) => {
      if (!conjuntoNovo.has(linha) && linha.trim() !== '') {
        diferencas.removidas.push({ linha: index + 1, conteudo: linha });
      }
    });

    linhasNovas.forEach((linha, index) => {
      if (!conjuntoAntigo.has(linha) && linha.trim() !== '') {
        diferencas.adicionadas.push({ linha: index + 1, conteudo: linha });
      }
    });

    return diferencas;
  },

  // 2. Mescla o CSS/Estilo do código antigo com a Lógica do código novo
  fundirVersaoJuridica: function (codigoComCores, codigoComLogica) {
    // Procura por tags de estilo <style> ou classes CSS na versão com cores
    const regexStyle = /<style[\s\S]*?>[\s\S]*?<\/style>/gi;
    const estilosEncontrados = codigoComCores.match(regexStyle);

    let codigoFinal = codigoComLogica;

    if (estilosEncontrados && estilosEncontrados.length > 0) {
      // Injeta o bloco de cores de volta no código funcional
      const blocoEstilo = estilosEncontrados.join('\n');
      if (codigoFinal.includes('</head>')) {
        codigoFinal = codigoFinal.replace('</head>', `${blocoEstilo}\n</head>`);
      } else {
        codigoFinal = blocoEstilo + '\n' + codigoFinal;
      }
    }

    return {
      sucesso: true,
      codigoRecuperado: codigoFinal,
      mensagem: "Estilos e cores da Versão Antiga foram injetados com sucesso na Versão Funcional!"
    };
  }
};
