/**
 * js/comparator.js
 * Módulo para comparar projetos, identificar diferenças sutis e gerar relatórios
 */

window.ComparatorModule = {
  compararProjetos: function (projetoA, projetoB) {
    let relatorio = "====================================================\n";
    relatorio += "  RELATÓRIO DIAGNÓSTICO DE COMPARAÇÃO DE VERSÕES  \n";
    relatorio += "====================================================\n\n";

    const chavesA = Object.keys(projetoA);
    const chavesB = Object.keys(projetoB);

    const arquivosExcluidos = chavesA.filter(f => !chavesB.includes(f));
    const arquivosIncluidos = chavesB.filter(f => !chavesA.includes(f));
    const arquivosComuns = chavesA.filter(f => chavesB.includes(f));

    relatorio += `📂 ESTATÍSTICAS GERAIS:\n`;
    relatorio += `- Arquivos em Projeto A: ${chavesA.length}\n`;
    relatorio += `- Arquivos em Projeto B: ${chavesB.length}\n`;
    relatorio += `- Arquivos Removidos/Excluídos: ${arquivosExcluidos.length}\n`;
    relatorio += `- Arquivos Novos/Incluídos: ${arquivosIncluidos.length}\n\n`;

    if (arquivosExcluidos.length > 0) {
      relatorio += `🔴 ARQUIVOS PRESENTES APENAS NO PROJETO A (REMOVIDOS EM B):\n`;
      arquivosExcluidos.forEach(f => relatorio += `  - ${f}\n`);
      relatorio += `\n`;
    }

    if (arquivosIncluidos.length > 0) {
      relatorio += `🟢 ARQUIVOS NOVOS ADICIONADOS NO PROJETO B:\n`;
      arquivosIncluidos.forEach(f => relatorio += `  - ${f}\n`);
      relatorio += `\n`;
    }

    relatorio += `🔍 ALTERAÇÕES DE CÓDIGO LINHA POR LINHA NOS ARQUIVOS COMUNS:\n`;
    relatorio += `----------------------------------------------------\n`;

    let mudancasEncontradas = 0;

    arquivosComuns.forEach(caminho => {
      const conteudoA = projetoA[caminho];
      const conteudoB = projetoB[caminho];

      if (conteudoA !== conteudoB) {
        mudancasEncontradas++;
        relatorio += `\n📄 ARQUIVO COM ALTERAÇÕES: ${caminho}\n`;

        const diff = this.calcularDiffTexto(conteudoA, conteudoB);
        relatorio += diff;
      }
    });

    if (mudancasEncontradas === 0) {
      relatorio += `\n Nenhuma alteração de texto foi encontrada nos arquivos em comum.\n`;
    }

    return relatorio;
  },

  calcularDiffTexto: function (textoA, textoB) {
    const linhasA = textoA.split('\n');
    const linhasB = textoB.split('\n');

    let resultado = "";
    const max = Math.max(linhasA.length, linhasB.length);

    for (let i = 0; i < max; i++) {
      const lA = linhasA[i];
      const lB = linhasB[i];

      if (lA !== lB) {
        if (lA !== undefined && lB === undefined) {
          resultado += `  [Linha ${i + 1}] 🔴 REMOVIDO: ${lA.trim()}\n`;
        } else if (lA === undefined && lB !== undefined) {
          resultado += `  [Linha ${i + 1}] 🟢 INCLUÍDO: ${lB.trim()}\n`;
        } else {
          resultado += `  [Linha ${i + 1}] 🔴 ANTES: ${lA.trim()}\n`;
          resultado += `  [Linha ${i + 1}] 🟢 DEPOIS: ${lB.trim()}\n`;
        }
      }
    }
    return resultado;
  }
};
