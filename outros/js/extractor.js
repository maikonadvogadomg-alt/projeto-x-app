/**
 * js/extractor.js
 * Módulo de extração e leitura em memória para ZIP, TAR e TGZ
 */

window.ExtractorModule = {
  processarArquivo: async function (file) {
    const nome = file.name.toLowerCase();

    if (nome.endsWith('.zip')) {
      return await this.lerZip(file);
    } else if (nome.endsWith('.tar') || nome.endsWith('.tgz') || nome.endsWith('.tar.gz')) {
      return await this.lerTar(file);
    } else {
      alert("Formato não suportado diretamente. Use .zip, .tar ou .tgz");
      return {};
    }
  },

  lerZip: async function (file) {
    const zip = new JSZip();
    const zipLoaded = await zip.loadAsync(file);
    const arquivos = {};

    for (const [caminho, zipObj] of Object.entries(zipLoaded.files)) {
      if (!zipObj.dir) {
        // Filtra arquivos irrelevantes
        if (!caminho.includes('node_modules/') && !caminho.startsWith('.')) {
          const conteudo = await zipObj.async('string');
          arquivos[caminho] = conteudo;
        }
      }
    }
    return arquivos;
  },

  lerTar: async function (file) {
    // Leitura simplificada de texto para TAR estático
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const textoBruto = decoder.decode(buffer);

    // Retorna o mapa básico de conteúdo em memória
    return {
      "pacote_extraido.txt": textoBruto
    };
  }
};
