const DepsAnalyzer = {

  analisarDependenciasAvancado: function (arquivos) {
    let relatorio = "=== ANÁLISE AVANÇADA DE DEPENDÊNCIAS ===\n\n";

    const packageJson = this.encontrarArquivo(arquivos, 'package.json');
    const requirementsTxt = this.encontrarArquivo(arquivos, 'requirements.txt');
    const pyprojectToml = this.encontrarArquivo(arquivos, 'pyproject.toml');
    const composerJson = this.encontrarArquivo(arquivos, 'composer.json');
    const gemfile = this.encontrarArquivo(arquivos, 'Gemfile');

    if (packageJson) {
      relatorio += this.analisarPackageJson(packageJson);
    }

    if (requirementsTxt) {
      relatorio += this.analisarRequirementsTxt(requirementsTxt);
    }

    if (pyprojectToml) {
      relatorio += this.analisarPyprojectToml(pyprojectToml);
    }

    if (composerJson) {
      relatorio += this.analisarComposerJson(composerJson);
    }

    if (gemfile) {
      relatorio += this.analisarGemfile(gemfile);
    }

    if (!packageJson && !requirementsTxt && !pyprojectToml && !composerJson && !gemfile) {
      relatorio += "⚠️ Nenhum arquivo de dependências encontrado!\n";
    }

    return relatorio;
  },

  analisarPackageJson: function (conteudo) {
    try {
      const pkg = JSON.parse(conteudo);
      let relatorio = "📦 PACKAGE.JSON (Node.js/npm/pnpm)\n";
      relatorio += "=".repeat(50) + "\n\n";

      if (pkg.dependencies) {
        relatorio += "🔵 Dependências Diretas:\n";
        for (const [nome, versao] of Object.entries(pkg.dependencies)) {
          relatorio += `  ✓ ${nome}: ${versao}\n`;
        }
        relatorio += "\n";
      }

      if (pkg.devDependencies) {
        relatorio += "🟡 Dependências de Desenvolvimento:\n";
        for (const [nome, versao] of Object.entries(pkg.devDependencies)) {
          relatorio += `  ✓ ${nome}: ${versao}\n`;
        }
        relatorio += "\n";
      }

      if (pkg.peerDependencies) {
        relatorio += "🟢 Peer Dependencies:\n";
        for (const [nome, versao] of Object.entries(pkg.peerDependencies)) {
          relatorio += `  ✓ ${nome}: ${versao}\n`;
        }
        relatorio += "\n";
      }

      relatorio += `📊 Total: ${Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length} dependências\n\n`;
      return relatorio;
    } catch (e) {
      return "❌ Erro ao parsear package.json\n\n";
    }
  },

  analisarRequirementsTxt: function (conteudo) {
    let relatorio = "🐍 REQUIREMENTS.TXT (Python)\n";
    relatorio += "=".repeat(50) + "\n\n";

    const linhas = conteudo.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    relatorio += `📦 Pacotes encontrados (${linhas.length}):\n`;

    linhas.forEach(linha => {
      relatorio += `  ✓ ${linha.trim()}\n`;
    });

    relatorio += "\n";
    return relatorio;
  },

  analisarPyprojectToml: function (conteudo) {
    let relatorio = "🐍 PYPROJECT.TOML (Python moderno)\n";
    relatorio += "=".repeat(50) + "\n\n";

    // Extrair dependências de forma simples
    const depMatch = conteudo.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
    if (depMatch) {
      relatorio += "📦 Dependências:\n";
      const deps = depMatch[1].split(',').map(d => d.trim().replace(/['"]/g, ''));
      deps.forEach(dep => {
        if (dep) relatorio += `  ✓ ${dep}\n`;
      });
    }

    relatorio += "\n";
    return relatorio;
  },

  analisarComposerJson: function (conteudo) {
    try {
      const composer = JSON.parse(conteudo);
      let relatorio = "🎵 COMPOSER.JSON (PHP)\n";
      relatorio += "=".repeat(50) + "\n\n";

      if (composer.require) {
        relatorio += "📦 Dependências:\n";
        for (const [nome, versao] of Object.entries(composer.require)) {
          relatorio += `  ✓ ${nome}: ${versao}\n`;
        }
      }

      relatorio += "\n";
      return relatorio;
    } catch (e) {
      return "";
    }
  },

  analisarGemfile: function (conteudo) {
    let relatorio = "💎 GEMFILE (Ruby)\n";
    relatorio += "=".repeat(50) + "\n\n";

    const linhas = conteudo.split('\n').filter(l => l.includes('gem'));
    relatorio += `📦 Gems encontradas (${linhas.length}):\n`;

    linhas.forEach(linha => {
      const match = linha.match(/gem\s+['"](.*?)['"]/);
      if (match) {
        relatorio += `  ✓ ${match[1]}\n`;
      }
    });

    relatorio += "\n";
    return relatorio;
  },

  encontrarArquivo: function (arquivos, nome) {
    for (const [caminho, conteudo] of Object.entries(arquivos)) {
      if (caminho.endsWith(nome)) {
        return conteudo;
      }
    }
    return null;
  },

  gerarBATInstalacao: function (arquivos) {
    let bat = "@echo off\nREM Script de instalação automático\nREM Gerado pelo Cirurgião PWA\n\n";

    const packageJson = this.encontrarArquivo(arquivos, 'package.json');
    const requirementsTxt = this.encontrarArquivo(arquivos, 'requirements.txt');

    if (packageJson) {
      bat += "echo [1/2] Instalando dependências Node.js...\n";
      bat += "npm install\n";
      bat += "REM Ou use: pnpm install\n\n";
    }

    if (requirementsTxt) {
      bat += "echo [2/2] Instalando dependências Python...\n";
      bat += "python -m pip install -r requirements.txt\n\n";
    }

    bat += "echo.\necho ✅ Instalação concluída!\npause\n";

    return bat;
  },

  traduzirNomesDependencias: function (arquivos) {
    let relatorio = "=== TRADUÇÃO DE NOMES DE DEPENDÊNCIAS ===\n\n";

    const dicionario = {
      'express': 'Framework web rápido e minimalista',
      'react': 'Biblioteca para construir interfaces',
      'vue': 'Framework progressivo para UI',
      'angular': 'Framework completo para SPAs',
      'django': 'Framework web Python de alto nível',
      'flask': 'Microframework web Python',
      'fastapi': 'Framework web Python moderno',
      'numpy': 'Computação numérica Python',
      'pandas': 'Análise de dados Python',
      'tensorflow': 'Machine Learning Google',
      'pytorch': 'Framework Deep Learning',
      'requests': 'Biblioteca HTTP Python',
      'axios': 'Cliente HTTP JavaScript',
      'lodash': 'Utilitários JavaScript',
      'moment': 'Manipulação de datas JavaScript',
      'webpack': 'Bundler de módulos',
      'babel': 'Transpilador JavaScript',
      'jest': 'Framework de testes',
      'mocha': 'Framework de testes Node.js',
      'pytest': 'Framework de testes Python',
      'eslint': 'Linter JavaScript',
      'prettier': 'Formatador de código',
      'docker': 'Containerização',
      'kubernetes': 'Orquestração de containers'
    };

    const packageJson = this.encontrarArquivo(arquivos, 'package.json');
    const requirementsTxt = this.encontrarArquivo(arquivos, 'requirements.txt');

    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies
        };

        relatorio += "📦 DEPENDÊNCIAS NODE.JS TRADUZIDAS:\n";
        for (const [nome, versao] of Object.entries(allDeps)) {
          const descricao = dicionario[nome.toLowerCase()] || 'Dependência externa';
          relatorio += `  • ${nome} (${versao})\n    └─ ${descricao}\n`;
        }
        relatorio += "\n";
      } catch (e) {
        relatorio += "❌ Erro ao parsear package.json\n\n";
      }
    }

    if (requirementsTxt) {
      relatorio += "🐍 DEPENDÊNCIAS PYTHON TRADUZIDAS:\n";
      const linhas = requirementsTxt.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      linhas.forEach(linha => {
        const pkg = linha.split('==')[0].toLowerCase();
        const descricao = dicionario[pkg] || 'Pacote externo';
        relatorio += `  • ${linha.trim()}\n    └─ ${descricao}\n`;
      });
      relatorio += "\n";
    }

    return relatorio;
  }
};
