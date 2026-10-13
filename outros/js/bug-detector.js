const BugDetector = {

  analisarBugs: function (arquivos) {
    let relatorio = "=== DETECTOR DE BUGS AVANÇADO ===\n\n";

    let totalBugs = 0;
    let consoleLogs = [];
    let variaveisNaoUsadas = [];
    let funcoesSemRetorno = [];
    let errosSintaxe = [];
    let pastasOcultas = [];

    for (const [caminho, conteudo] of Object.entries(arquivos)) {
      if (typeof conteudo !== 'string') continue;

      // 1. DETECTAR CONSOLE.LOG
      const regexConsole = /console\.(log|error|warn|info|debug)\s*\(/gi;
      const matchesConsole = conteudo.match(regexConsole);
      if (matchesConsole) {
        consoleLogs.push({
          arquivo: caminho,
          quantidade: matchesConsole.length,
          linhas: this.encontrarLinhas(conteudo, regexConsole)
        });
        totalBugs += matchesConsole.length;
      }

      // 2. DETECTAR VARIÁVEIS NÃO USADAS
      const regexVar = /(?:let|const|var)\s+(\w+)\s*=/g;
      let match;
      while ((match = regexVar.exec(conteudo)) !== null) {
        const varName = match[1];
        const regexUso = new RegExp(`\\b${varName}\\b`, 'g');
        const usos = conteudo.match(regexUso) || [];

        // Se aparece apenas 1 vez (na declaração), é não usada
        if (usos.length === 1) {
          variaveisNaoUsadas.push({
            arquivo: caminho,
            variavel: varName,
            linha: this.encontrarLinha(conteudo, match[0])
          });
          totalBugs++;
        }
      }

      // 3. DETECTAR FUNÇÕES SEM RETURN
      const regexFunc = /function\s+(\w+)\s*\([^)]*\)\s*\{([^}]*)\}/g;
      while ((match = regexFunc.exec(conteudo)) !== null) {
        const funcName = match[1];
        const funcBody = match[2];

        if (!funcBody.includes('return') && !funcBody.includes('console')) {
          funcoesSemRetorno.push({
            arquivo: caminho,
            funcao: funcName,
            linha: this.encontrarLinha(conteudo, match[0])
          });
          totalBugs++;
        }
      }

      // 4. DETECTAR ERROS DE SINTAXE COMUNS
      if (conteudo.includes('==') && !conteudo.includes('===')) {
        errosSintaxe.push({
          arquivo: caminho,
          erro: "Comparação fraca (==) detectada. Use === em vez disso.",
          quantidade: (conteudo.match(/==/g) || []).length
        });
        totalBugs++;
      }

      if (conteudo.includes('var ') && !conteudo.includes('const') && !conteudo.includes('let')) {
        errosSintaxe.push({
          arquivo: caminho,
          erro: "Uso de 'var' detectado. Prefira 'const' ou 'let'.",
          quantidade: (conteudo.match(/var\s+/g) || []).length
        });
        totalBugs++;
      }
    }

    // DETECTAR PASTAS OCULTAS
    pastasOcultas = this.detectarPastasOcultas(arquivos);

    // MONTAR RELATÓRIO
    relatorio += `⚠️ TOTAL DE BUGS ENCONTRADOS: ${totalBugs}\n\n`;

    if (consoleLogs.length > 0) {
      relatorio += `🔴 CONSOLE.LOG NÃO REMOVIDO (${consoleLogs.length} arquivos):\n`;
      consoleLogs.forEach(item => {
        relatorio += `  📁 ${item.arquivo}: ${item.quantidade} ocorrências\n`;
        relatorio += `     Linhas: ${item.linhas.join(', ')}\n`;
      });
      relatorio += "\n";
    }

    if (variaveisNaoUsadas.length > 0) {
      relatorio += `🟡 VARIÁVEIS NÃO USADAS (${variaveisNaoUsadas.length}):\n`;
      variaveisNaoUsadas.forEach(item => {
        relatorio += `  📁 ${item.arquivo}\n`;
        relatorio += `     Variável: ${item.variavel} (linha ${item.linha})\n`;
      });
      relatorio += "\n";
    }

    if (funcoesSemRetorno.length > 0) {
      relatorio += `🟠 FUNÇÕES SEM RETURN (${funcoesSemRetorno.length}):\n`;
      funcoesSemRetorno.forEach(item => {
        relatorio += `  📁 ${item.arquivo}\n`;
        relatorio += `     Função: ${item.funcao} (linha ${item.linha})\n`;
      });
      relatorio += "\n";
    }

    if (errosSintaxe.length > 0) {
      relatorio += `🔵 ERROS DE SINTAXE (${errosSintaxe.length}):\n`;
      errosSintaxe.forEach(item => {
        relatorio += `  📁 ${item.arquivo}\n`;
        relatorio += `     ${item.erro}\n`;
      });
      relatorio += "\n";
    }

    if (pastasOcultas.length > 0) {
      relatorio += `📁 PASTAS OCULTAS DETECTADAS:\n${pastasOcultas}\n`;
    }

    return relatorio;
  },

  detectarPastasOcultas: function (arquivos) {
    let relatorio = "";
    const pastasOcultas = new Set();

    for (const caminho of Object.keys(arquivos)) {
      if (caminho.includes('/.git/')) pastasOcultas.add('.git');
      if (caminho.includes('/.env')) pastasOcultas.add('.env');
      if (caminho.includes('/.gitignore')) pastasOcultas.add('.gitignore');
      if (caminho.includes('/.replit')) pastasOcultas.add('.replit');
      if (caminho.includes('/.vscode/')) pastasOcultas.add('.vscode');
      if (caminho.includes('/.idea/')) pastasOcultas.add('.idea');
      if (caminho.includes('/node_modules/')) pastasOcultas.add('node_modules');
      if (caminho.includes('/__pycache__/')) pastasOcultas.add('__pycache__');
      if (caminho.includes('/.pytest_cache/')) pastasOcultas.add('.pytest_cache');
    }

    if (pastasOcultas.size > 0) {
      relatorio += "🔍 Pastas ocultas encontradas:\n";
      pastasOcultas.forEach(pasta => {
        relatorio += `  ✓ ${pasta}\n`;
      });
    }

    return relatorio;
  },

  encontrarLinhas: function (conteudo, regex) {
    const linhas = [];
    const linhasArray = conteudo.split('\n');
    let match;
    let posicao = 0;

    while ((match = regex.exec(conteudo)) !== null) {
      const linhaNum = conteudo.substring(0, match.index).split('\n').length;
      if (!linhas.includes(linhaNum)) linhas.push(linhaNum);
    }

    return linhas.sort((a, b) => a - b);
  },

  encontrarLinha: function (conteudo, texto) {
    return conteudo.substring(0, conteudo.indexOf(texto)).split('\n').length;
  }
};
