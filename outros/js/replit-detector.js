const ReplitDetector = {

  detectarReplit: function (arquivos) {
    let relatorio = "=== DETECTOR REPLIT BÁSICO ===\n\n";

    const replitFile = this.encontrarArquivo(arquivos, '.replit');
    const pnpmWorkspace = this.encontrarArquivo(arquivos, 'pnpm-workspace.yaml');
    const monorepoIndicadores = this.detectarMonorepo(arquivos);

    if (replitFile) {
      relatorio += "🔴 ARQUIVO .REPLIT ENCONTRADO!\n";
      relatorio += "Conteúdo:\n";
      relatorio += "```\n" + replitFile.substring(0, 500) + "\n```\n\n";
    }

    if (pnpmWorkspace) {
      relatorio += "🟡 PNPM WORKSPACE DETECTADO!\n";
      relatorio += "Este é um monorepo com múltiplos pacotes.\n\n";
    }

    if (monorepoIndicadores.length > 0) {
      relatorio += "🟠 INDICADORES DE MONOREPO:\n";
      monorepoIndicadores.forEach(ind => {
        relatorio += `  ✓ ${ind}\n`;
      });
      relatorio += "\n";
    }

    return relatorio;
  },

  detectarReplitAvancado: function (arquivos) {
    let relatorio = "=== DETECTOR REPLIT AVANÇADO ===\n\n";

    const replitFile = this.encontrarArquivo(arquivos, '.replit');
    const pnpmWorkspace = this.encontrarArquivo(arquivos, 'pnpm-workspace.yaml');
    const packageJson = this.encontrarArquivo(arquivos, 'package.json');
    const packageLockJson = this.encontrarArquivo(arquivos, 'package-lock.json');
    const pnpmLock = this.encontrarArquivo(arquivos, 'pnpm-lock.yaml');

    relatorio += "📋 ANÁLISE DETALHADA:\n\n";

    // 1. Verificar .replit
    if (replitFile) {
      relatorio += "🔴 [CRÍTICO] Arquivo .replit encontrado\n";
      relatorio += "  └─ Este arquivo é específico do Replit\n";
      relatorio += "  └─ Deve ser removido para usar em outro ambiente\n\n";
    }

    // 2. Verificar pnpm-workspace
    if (pnpmWorkspace) {
      relatorio += "🟡 [IMPORTANTE] pnpm-workspace.yaml detectado\n";
      relatorio += "  └─ Estrutura monorepo com pnpm\n";
      relatorio += "  └─ Pode funcionar em outro ambiente se tiver pnpm\n\n";
    }

    // 3. Verificar gerenciadores de pacotes
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        relatorio += "📦 GERENCIADOR DE PACOTES:\n";

        if (pnpmLock) {
          relatorio += "  ✓ pnpm (pnpm-lock.yaml encontrado)\n";
        } else if (packageLockJson) {
          relatorio += "  ✓ npm (package-lock.json encontrado)\n";
        } else {
          relatorio += "  ⚠️ Gerenciador indefinido (use npm ou pnpm)\n";
        }
        relatorio += "\n";

        // Verificar scripts Replit
        if (pkg.scripts) {
          const scriptsReplit = Object.keys(pkg.scripts).filter(s =>
            pkg.scripts[s].includes('replit') ||
            pkg.scripts[s].includes('Replit')
          );

          if (scriptsReplit.length > 0) {
            relatorio += "⚠️ SCRIPTS ESPECÍFICOS DO REPLIT:\n";
            scriptsReplit.forEach(script => {
              relatorio += `  • ${script}: ${pkg.scripts[script]}\n`;
            });
            relatorio += "\n";
          }
        }
      } catch (e) {
        relatorio += "❌ Erro ao parsear package.json\n\n";
      }
    }

    // 4. Verificar estrutura de pastas
    relatorio += "📁 ESTRUTURA DE PASTAS:\n";
    const estrutura = this.analisarEstrutura(arquivos);
    relatorio += estrutura + "\n";

    return relatorio;
  },

  gerarPlanoRemocao: function (arquivos) {
    let plano = "=== PLANO DE REMOÇÃO DE DEPENDÊNCIAS REPLIT ===\n\n";

    plano += "📋 PASSO A PASSO:\n\n";

    plano += "1️⃣ REMOVER ARQUIVOS REPLIT:\n";
    plano += "   ✓ Deletar .replit\n";
    plano += "   ✓ Deletar pnpm-workspace.yaml\n";
    plano += "   ✓ Deletar .replit.nix (se existir)\n\n";

    plano += "2️⃣ LIMPAR CONFIGURAÇÕES:\n";
    plano += "   ✓ Remover scripts Replit de package.json\n";
    plano += "   ✓ Atualizar scripts para ambiente local\n\n";

    plano += "3️⃣ ESCOLHER GERENCIADOR:\n";
    plano += "   ✓ npm: npm install\n";
    plano += "   ✓ pnpm: pnpm install\n";
    plano += "   ✓ yarn: yarn install\n\n";

    plano += "4️⃣ TESTAR LOCALMENTE:\n";
    plano += "   ✓ npm start (ou script definido)\n";
    plano += "   ✓ Verificar se tudo funciona\n\n";

    plano += "5️⃣ CRIAR .gitignore:\n";
    plano += "   ✓ node_modules/\n";
    plano += "   ✓ .env\n";
    plano += "   ✓ .DS_Store\n";
    plano += "   ✓ dist/\n";
    plano += "   ✓ build/\n\n";

    return plano;
  },

  validarEstrutura: function (arquivos) {
    let validacao = "=== VALIDAÇÃO DE ESTRUTURA ===\n\n";

    const temPackageJson = !!this.encontrarArquivo(arquivos, 'package.json');
    const temGitignore = !!this.encontrarArquivo(arquivos, '.gitignore');
    const temReadme = !!this.encontrarArquivo(arquivos, 'README.md');
    const temSrcOuIndex = Object.keys(arquivos).some(k => k.includes('src/') || k.endsWith('index.js'));
    const temReplit = !!this.encontrarArquivo(arquivos, '.replit');

    validacao += "✅ VERIFICAÇÕES:\n\n";

    validacao += temPackageJson ? "✓ package.json encontrado\n" : "✗ package.json NÃO encontrado\n";
    validacao += temGitignore ? "✓ .gitignore encontrado\n" : "✗ .gitignore NÃO encontrado\n";
    validacao += temReadme ? "✓ README.md encontrado\n" : "✗ README.md NÃO encontrado\n";
    validacao += temSrcOuIndex ? "✓ Arquivos fonte encontrados\n" : "✗ Arquivos fonte NÃO encontrados\n";
    validacao += !temReplit ? "✓ Sem dependências Replit\n" : "✗ Ainda tem arquivos Replit\n";

    validacao += "\n📊 RESULTADO:\n";
    const pontos = [temPackageJson, temGitignore, temReadme, temSrcOuIndex, !temReplit].filter(Boolean).length;
    validacao += `${pontos}/5 verificações passaram\n`;

    if (pontos === 5) {
      validacao += "🎉 Estrutura válida para migração!\n";
    } else if (pontos >= 3) {
      validacao += "⚠️ Estrutura parcialmente válida. Revise os itens faltantes.\n";
    } else {
      validacao += "❌ Estrutura incompleta. Adicione os arquivos necessários.\n";
    }

    return validacao;
  },

  detectarMonorepo: function (arquivos) {
    const indicadores = [];

    if (Object.keys(arquivos).some(k => k.includes('/packages/'))) {
      indicadores.push('Pasta /packages/ encontrada');
    }

    if (Object.keys(arquivos).some(k => k.includes('/apps/'))) {
      indicadores.push('Pasta /apps/ encontrada');
    }

    if (Object.keys(arquivos).some(k => k.includes('/modules/'))) {
      indicadores.push('Pasta /modules/ encontrada');
    }

    if (Object.keys(arquivos).some(k => k.includes('/workspaces/'))) {
      indicadores.push('Pasta /workspaces/ encontrada');
    }

    return indicadores;
  },

  analisarEstrutura: function (arquivos) {
    const pastas = new Set();

    for (const caminho of Object.keys(arquivos)) {
      const partes = caminho.split('/');
      if (partes.length > 1) {
        pastas.add(partes[0]);
      }
    }

    let estrutura = "";
    Array.from(pastas).sort().forEach(pasta => {
      estrutura += `  📁 ${pasta}/\n`;
    });

    return estrutura || "  (Raiz do projeto)";
  },

  encontrarArquivo: function (arquivos, nome) {
    for (const [caminho, conteudo] of Object.entries(arquivos)) {
      if (caminho.endsWith(nome)) {
        return conteudo;
      }
    }
    return null;
  }
};
