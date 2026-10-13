// ============================================
// SISTEMA DE ABAS
// ============================================

function mudarAba(abaId, botao) {
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(abaId).classList.add('active');
  botao.classList.add('active');

  console.log(`✅ Aba "${abaId}" ativada`);
}

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let arquivosProjetoA = {};
let arquivosProjetoB = {};
let conversaGeminiOficial = [];
let ultimoRelatorio = '';

const MODELOS_DISPONIVEIS = [
  'gemini-1.5-flash',
  'gemini-3.8-flash',
  'gemini-2.0-flash'
];

// ============================================
// CARREGAMENTO DE CHAVES
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('geminiKey').value = localStorage.getItem('GEMINI_API_KEY') || '';
  document.getElementById('apiKeyOficial').value = localStorage.getItem('API_KEY_OFICIAL') || '';
});

function salvarKeyGemini() {
  const key = document.getElementById('geminiKey').value.trim();
  localStorage.setItem('GEMINI_API_KEY', key);
  alert('✅ API Key Gemini salva!');
}

function salvarKeyOficial() {
  const key = document.getElementById('apiKeyOficial').value.trim();
  localStorage.setItem('API_KEY_OFICIAL', key);
  alert('✅ API Key Oficial salva!');
}

// ============================================
// LEITURA DE ARQUIVOS (SUPORTA ZIP, TAR, TGZ, GZ)
// ============================================

document.getElementById('fileA').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('statusA').innerText = "Processando " + file.name + "...";
  arquivosProjetoA = await ExtractorModule.processarArquivo(file);
  document.getElementById('statusA').innerText = `✅ ${Object.keys(arquivosProjetoA).length} arquivos lidos.`;
});

document.getElementById('fileB').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('statusB').innerText = "Processando " + file.name + "...";
  arquivosProjetoB = await ExtractorModule.processarArquivo(file);
  document.getElementById('statusB').innerText = `✅ ${Object.keys(arquivosProjetoB).length} arquivos lidos.`;
});

// ============================================
// FUNÇÕES DE RELATÓRIO
// ============================================

function exibirRelatorio(titulo, texto, areaId = 'reportArea', tituloId = 'reportTitle', outputId = 'reportOutput') {
  document.getElementById(tituloId).innerText = titulo;
  document.getElementById(outputId).textContent = texto;
  document.getElementById(areaId).style.display = 'block';
  ultimoRelatorio = texto;
}

function exportarMD() {
  const titulo = document.getElementById('reportTitle').innerText;
  const conteudo = document.getElementById('reportOutput').textContent;
  const md = `# ${titulo}\n\n\`\`\`\n${conteudo}\n\`\`\``;

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${titulo.replace(/\s+/g, '_')}.md`;
  a.click();
}

function copiarRelatorio() {
  const texto = document.getElementById('reportOutput').textContent;
  navigator.clipboard.writeText(texto).then(() => {
    alert('✅ Copiado para clipboard!');
  });
}

function compartilharIA() {
  enviarRelatorioParaChat();
}

// ============================================
// FERRAMENTAS PRINCIPAIS
// ============================================

function executarComparacao() {
  if (!validarProjetos()) return;
  const relatorio = ComparatorModule.compararProjetos(arquivosProjetoA, arquivosProjetoB);
  exibirRelatorio("Comparação de Versões", relatorio);
}

function executarBugPatcher() {
  if (!validarProjetos()) return;
  const arquivosComuns = Object.keys(arquivosProjetoA).filter(f => Object.keys(arquivosProjetoB).includes(f));
  if (arquivosComuns.length === 0) {
    alert("Não foram encontrados arquivos com o mesmo nome.");
    return;
  }
  const f = arquivosComuns[0];
  const solucao = BugPatcher.extrairCorrecao(arquivosProjetoA[f], arquivosProjetoB[f]);
  exibirRelatorio(`Patch de Bug (${f})`, solucao.resumoEmTexto + "\n\n🟢 LINHAS DA SOLUÇÃO:\n" + JSON.stringify(solucao.linhasInjetadasQueSalvaram, null, 2));
}

async function executarTestadorEndpoints() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue ao menos um projeto!");
    return;
  }
  let log = "=== TESTE DE ENDPOINTS ===\n\n";
  for (const [caminho, texto] of Object.entries(projeto)) {
    if (typeof texto === 'string') {
      const endpoints = EndpointTester.extrairEndpoints(texto);
      if (endpoints.length > 0) {
        log += `📁 ${caminho}\n`;
        for (const ep of endpoints) {
          log += `  - ${ep}\n`;
          const res = await EndpointTester.testarEndpoint(ep);
          log += `    ${res.diagnostico}\n`;
        }
      }
    }
  }
  exibirRelatorio("Diagnóstico de APIs", log);
}

function executarFusaoGit() {
  if (!validarProjetos()) return;
  const arquivosComuns = Object.keys(arquivosProjetoA).filter(f => Object.keys(arquivosProjetoB).includes(f));
  if (arquivosComuns.length === 0) return;
  const f = arquivosComuns[0];
  const res = GitDiffAnalyzer.fundirVersaoJuridica(arquivosProjetoA[f], arquivosProjetoB[f]);
  exibirRelatorio("Fusão de Estilos", res.mensagem);
}

function executarAnalisadorBugs() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const relatorio = BugDetector.analisarBugs(projeto);
  exibirRelatorio("Análise de Bugs", relatorio);
}

function executarAnalisadorDeps() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const relatorio = DepsAnalyzer.analisarDependencias(projeto);
  exibirRelatorio("Análise de Dependências", relatorio);
}

// ============================================
// ABAS ESPECÍFICAS - BUGS
// ============================================

function executarDetectorBugs() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const relatorio = BugDetector.analisarBugs(projeto);
  exibirRelatorio("Detector de Bugs", relatorio, 'reportBugsArea', 'reportBugsTitle', 'reportBugsOutput');
}

function executarDetectorReplit() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const relatorio = ReplitDetector.detectarReplit(projeto);
  exibirRelatorio("Detector Replit", relatorio, 'reportBugsArea', 'reportBugsTitle', 'reportBugsOutput');
}

function executarDetectorPastas() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const relatorio = BugDetector.detectarPastasOcultas(projeto);
  exibirRelatorio("Pastas Ocultas", relatorio, 'reportBugsArea', 'reportBugsTitle', 'reportBugsOutput');
}

function exportarBugsMD() {
  const conteudo = document.getElementById('reportBugsOutput').textContent;
  const md = `# Relatório de Bugs\n\n\`\`\`\n${conteudo}\n\`\`\``;
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bugs_relatorio.md';
  a.click();
}

function copiarBugs() {
  navigator.clipboard.writeText(document.getElementById('reportBugsOutput').textContent);
  alert('✅ Copiado!');
}

function enviarBugsIA() {
  const relatorio = document.getElementById('reportBugsOutput').textContent;
  const prompt = "Analise estes bugs encontrados no meu projeto e me sugira correções:\n\n" + relatorio;
  adicionarMensagemGemini("Enviando bugs para análise...", "user");
  chamarGeminiAPI(prompt);
  mudarAba('chat-gemini', document.querySelectorAll('.tab-button')[4]);
}

// ============================================
// ABAS ESPECÍFICAS - DEPENDÊNCIAS
// ============================================

function executarAnalisadorDepsAvancado() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const relatorio = DepsAnalyzer.analisarDependenciasAvancado(projeto);
  exibirRelatorio("Análise Avançada de Deps", relatorio, 'reportDepsArea', 'reportDepsTitle', 'reportDepsOutput');
}

function gerarBATInstalacao() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const bat = DepsAnalyzer.gerarBATInstalacao(projeto);
  exibirRelatorio("Script BAT/SH de Instalação", bat, 'reportDepsArea', 'reportDepsTitle', 'reportDepsOutput');
}

function traduzirDependencias() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const relatorio = DepsAnalyzer.traduzirNomesDependencias(projeto);
  exibirRelatorio("Tradução de Dependências", relatorio, 'reportDepsArea', 'reportDepsTitle', 'reportDepsOutput');
}

function exportarDepsMD() {
  const conteudo = document.getElementById('reportDepsOutput').textContent;
  const md = `# Análise de Dependências\n\n\`\`\`\n${conteudo}\n\`\`\``;
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dependencias.md';
  a.click();
}

function copiarDeps() {
  navigator.clipboard.writeText(document.getElementById('reportDepsOutput').textContent);
  alert('✅ Copiado!');
}

function enviarDepsIA() {
  const relatorio = document.getElementById('reportDepsOutput').textContent;
  const prompt = "Baseado nesta análise de dependências, crie um plano de instalação e estrutura do projeto:\n\n" + relatorio;
  adicionarMensagemGemini("Enviando análise de deps...", "user");
  chamarGeminiAPI(prompt);
  mudarAba('chat-gemini', document.querySelectorAll('.tab-button')[4]);
}

// ============================================
// ABAS ESPECÍFICAS - REPLIT
// ============================================

function executarDetectorReplitAvancado() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const relatorio = ReplitDetector.detectarReplitAvancado(projeto);
  exibirRelatorio("Detector Replit Avançado", relatorio, 'reportReplitArea', 'reportReplitTitle', 'reportReplitOutput');
}

function gerarPlanoRemocao() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const plano = ReplitDetector.gerarPlanoRemocao(projeto);
  exibirRelatorio("Plano de Remoção Replit", plano, 'reportReplitArea', 'reportReplitTitle', 'reportReplitOutput');
}

function validarEstrutura() {
  const projeto = Object.keys(arquivosProjetoA).length > 0 ? arquivosProjetoA : arquivosProjetoB;
  if (Object.keys(projeto).length === 0) {
    alert("Carregue um projeto!");
    return;
  }
  const validacao = ReplitDetector.validarEstrutura(projeto);
  exibirRelatorio("Validação de Estrutura", validacao, 'reportReplitArea', 'reportReplitTitle', 'reportReplitOutput');
}

function exportarReplitMD() {
  const conteudo = document.getElementById('reportReplitOutput').textContent;
  const md = `# Análise Replit\n\n\`\`\`\n${conteudo}\n\`\`\``;
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'replit_analise.md';
  a.click();
}

function copiarReplit() {
  navigator.clipboard.writeText(document.getElementById('reportReplitOutput').textContent);
  alert('✅ Copiado!');
}

function enviarReplitIA() {
  const relatorio = document.getElementById('reportReplitOutput').textContent;
  const prompt = "Analise esta estrutura Replit e me ajude a remover as dependências sem quebrar o projeto:\n\n" + relatorio;
  adicionarMensagemGemini("Enviando análise Replit...", "user");
  chamarGeminiAPI(prompt);
  mudarAba('chat-gemini', document.querySelectorAll('.tab-button')[4]);
}

// ============================================
// CHAT GEMINI
// ============================================

function adicionarMensagemGemini(texto, tipo) {
  const area = document.getElementById('chatMessagesGemini');
  const div = document.createElement('div');
  div.className = `msg ${tipo}`;
  div.textContent = texto;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function enviarRelatorioParaChat() {
  const relatorio = ultimoRelatorio || document.getElementById('reportOutput').textContent;
  const prompt = "Analise este relatório e me explique como aplicar as correções:\n\n" + relatorio;
  adicionarMensagemGemini("Enviando relatório...", "user");
  chamarGeminiAPI(prompt);
  mudarAba('chat-gemini', document.querySelectorAll('.tab-button')[4]);
}

function enviarMensagemChatGemini() {
  const input = document.getElementById('chatInputGemini');
  const texto = input.value.trim();
  if (!texto) return;
  adicionarMensagemGemini(texto, "user");
  input.value = "";
  chamarGeminiAPI(texto);
}

async function chamarGeminiAPI(promptText) {
  const key = localStorage.getItem('GEMINI_API_KEY');
  if (!key) {
    adicionarMensagemGemini("⚠️ Salve sua chave da API do Gemini!", "ia");
    return;
  }

  adicionarMensagemGemini("⏳ Pensando...", "ia");

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();
    const msgs = document.getElementById('chatMessagesGemini');

    if (msgs.lastChild.textContent === "⏳ Pensando...") {
      msgs.removeChild(msgs.lastChild);
    }

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      adicionarMensagemGemini(data.candidates[0].content.parts[0].text, "ia");
    } else {
      adicionarMensagemGemini("⚠️ Não foi possível obter resposta.", "ia");
    }
  } catch (err) {
    adicionarMensagemGemini("❌ Erro: " + err.message, "ia");
  }
}

// ============================================
// CHAT OFICIAL
// ============================================

function adicionarMensagemOficial(texto, tipo) {
  const area = document.getElementById('chatMessagesOficial');
  const div = document.createElement('div');
  div.className = `msg ${tipo}`;
  div.textContent = texto;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function enviarMensagemChatOficial() {
  const input = document.getElementById('chatInputOficial');
  const texto = input.value.trim();
  if (!texto) return;
  adicionarMensagemOficial(texto, "user");
  input.value = "";

  conversaGeminiOficial.push({
    role: 'user',
    parts: [{ text: texto }]
  });

  chamarAPIOficial();
}

async function chamarAPIOficial() {
  const key = localStorage.getItem('API_KEY_OFICIAL');
  if (!key) {
    adicionarMensagemOficial("⚠️ Salve sua chave da API!", "ia");
    return;
  }

  adicionarMensagemOficial("⏳ Conectando...", "ia");
  atualizarStatusOficial('loading');

  try {
    let resposta = null;
    let modeloUsado = null;

    for (const modelo of MODELOS_DISPONIVEIS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${key}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: conversaGeminiOficial
          })
        });

        if (!response.ok) continue;

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          resposta = data.candidates[0].content.parts[0].text;
          modeloUsado = modelo;
          break;
        }

      } catch (erro) {
        continue;
      }
    }

    const msgs = document.getElementById('chatMessagesOficial');

    if (msgs.lastChild.textContent.includes("Conectando")) {
      msgs.removeChild(msgs.lastChild);
    }

    if (resposta) {
      adicionarMensagemOficial(resposta, "ia");

      conversaGeminiOficial.push({
        role: 'model',
        parts: [{ text: resposta }]
      });

      atualizarStatusOficial('online', modeloUsado);
    } else {
      adicionarMensagemOficial("❌ Nenhum modelo disponível.", "ia");
      atualizarStatusOficial('offline');
    }

  } catch (erro) {
    adicionarMensagemOficial(`❌ Erro: ${erro.message}`, "ia");
    atualizarStatusOficial('offline');
  }
}

function atualizarStatusOficial(status, modelo = null) {
  const statusEl = document.getElementById('statusOficial');

  if (status === 'online') {
    statusEl.innerHTML = `<span class="status-indicator status-online"></span>Online (${modelo})`;
  } else if (status === 'loading') {
    statusEl.innerHTML = `<span class="status-indicator status-loading"></span>Conectando...`;
  } else {
    statusEl.innerHTML = `<span class="status-indicator status-offline"></span>Offline`;
  }
}

// ============================================
// VALIDAÇÃO
// ============================================

function validarProjetos() {
  if (Object.keys(arquivosProjetoA).length === 0 || Object.keys(arquivosProjetoB).length === 0) {
    alert("Carregue os dois projetos!");
    return false;
  }
  return true;
}
