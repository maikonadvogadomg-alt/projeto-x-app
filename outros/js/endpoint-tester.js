/**
 * js/endpoint-tester.js
 * Módulo Independente de Detecção e Teste de Endpoints/APIs
 */

window.EndpointTester = {
  // 1. Varre o texto dos arquivos em busca de rotas e URLs de API
  extrairEndpoints: function (conteudoTexto) {
    // Regex para capturar chamadas fetch, axios e URLs com /api/ ou http(s)
    const regex = /(?:fetch|axios\.(?:get|post|put|delete))\s*\(\s*["'`]([^"'`]+)["'`]|https?:\/\/[^\s"'`<>]+/g;
    const encontrados = new Set();
    let match;

    while ((match = regex.exec(conteudoTexto)) !== null) {
      const url = match[1] || match[0];
      // Ignora arquivos estáticos de imagem/css comum
      if (!url.match(/\.(png|jpg|jpeg|gif|css|svg)$/i)) {
        encontrados.add(url);
      }
    }

    return Array.from(encontrados);
  },

  // 2. Executa o teste de conexão real no endpoint encontrado
  testarEndpoint: async function (url, token = null) {
    const inicio = Date.now();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['Content-Type'] = 'application/json';
    }

    try {
      // Faz uma requisição de sondagem (HEAD ou GET)
      const resposta = await fetch(url, {
        method: 'GET',
        headers: headers,
        signal: AbortSignal.timeout(5000) // Cancela se demorar mais de 5s
      });

      const tempoMs = Date.now() - inicio;

      return {
        url: url,
        status: resposta.status,
        statusText: resposta.statusText,
        ok: resposta.ok,
        tempo: tempoMs + 'ms',
        diagnostico: this.gerarDiagnostico(resposta.status)
      };
    } catch (erro) {
      return {
        url: url,
        status: 0,
        statusText: 'Falha de Conexão / CORS',
        ok: false,
        tempo: 'N/A',
        diagnostico: 'Endereço inacessível, bloqueado por CORS ou servidor backend local desligado (404/Offline).'
      };
    }
  },

  // 3. Traduz o número do erro para linguagem clara
  gerarDiagnostico: function (status) {
    switch (status) {
      case 200:
      case 201:
        return '🟢 Conexão Perfeita! A API está viva e respondendo.';
      case 401:
      case 403:
        return '🟠 API Encontrada, mas a Chave/Token de Acesso está faltando ou inválida.';
      case 404:
        return '🔴 Rota Inexistente (404). Este código tenta chamar um backend local que não existe na web.';
      case 500:
        return '🟣 Erro Interno do Servidor (500). O servidor recebeu o pedido mas falhou no processamento.';
      case 505:
        return '🟣 Versão HTTP Não Suportada (505). O formato de conexão é incompatível.';
      default:
        return `⚠️ Resposta inesperada do servidor (Código HTTP ${status}).`;
    }
  }
};
