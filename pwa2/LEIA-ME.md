# 🐞 Caça-Bug — versão 1.2

**Mudou na 1.2:** entraram as suas ferramentas que funcionam — **Projeto Lab** (o "raio-x" bom, com Comparar A × B), **Analisador Universal**, **Gerador EAS**, **Limpador de Processos** e **AI Code Studio** (chat com Gemini).
**Mudou na 1.1:** saiu o Raio-X que não funcionava no celular e saiu a leitura em voz alta do Caça-Bug. O Comparar ganhou a diferença linha por linha.

App separado, só para **achar e entender erros**: projetos do Replit, versões antigas, e também a perícia de documentos.
Funciona sozinho (não depende do Mini SK). Abre pelo **index.html**, funciona **sem internet** e pode virar **APK** pelo botão 📦 APK do Mini SK.

## As 5 abas (embaixo)

| Aba | O que faz |
|---|---|
| 📁 **Projetos** | Importa um **.zip**, arquivos soltos ou uma **pasta**. Fica guardado no aparelho. Cada versão que você importar vira um projeto separado. Dá para renomear, baixar o .zip e mandar para o Drive. |
| 🩺 **Diagnóstico** | Em segundos diz: que tipo de projeto é, **quais apps tem dentro** (a pasta `artifacts/` do Replit), se tem **site pronto** (dist), se **abre pelo index** e por quê, o **lacre** do terminal real, se **precisa de servidor** e se tem **chave/senha esquecida** no código. |
| 🧰 **Ferramentas** | 8 ferramentas **inteiras** dentro do app: 🩻 Cirurgião · 🔬 Projeto Lab · 🔧 Analisador Universal · 🧩 Triagem · 📱 Gerador EAS · 🧹 Limpador de Processos · 💬 AI Code Studio · 🕵️ Perito. As 5 primeiras **recebem o projeto sozinhas**. |
| ⚖️ **Comparar** | Marque 2 ou mais versões. Mostra a **tabela de recursos** (IA, voz, PDF, Word, DJEN, BCB…) com ✓ por versão, e o que **uma tem e a outra não**: funções, telas, rotas e arquivos. **Toque num arquivo que mudou** para ver a diferença **linha por linha** (verde = linha nova, vermelho = linha que saiu). O botão **🔬 Abrir as 2 no Projeto Lab** leva as duas versões para o Comparar A × B dele. |
| 📋 **Relatórios** | Tudo que você guardar com **📌 Guardar relatório** fica aqui, com data. Abrir, copiar, baixar, mandar para o Drive. "Baixar todos" junta num .zip. |

## Consertos automáticos
- **🔧 Consertar caminhos** (no Diagnóstico): troca `/assets/...` por `./assets/...`, que é o motivo mais comum de um site "rodar no Netlify mas não abrir pelo index". Faz numa **cópia** — o original fica intacto.

## O que foi conferido
Testado num navegador Chromium, abrindo pelo index (como arquivo):
- importar .zip, diagnóstico, conserto de caminhos (o conteúdo do zip consertado foi conferido);
- Cirurgião, Projeto Lab, Analisador Universal, Triagem e Gerador EAS recebendo o projeto sozinhos (o Gerador EAS leu nome, versão, conta Expo e App ID);
- Projeto Lab comparando duas versões (A × B);
- detecção "🚨 Replit" do Cirurgião e o relatório dele guardado;
- comparação de duas versões, a diferença linha por linha e o relatório guardado e baixado.

**Ainda não foi testado num celular de verdade.**

## Bônus (defeitos das ferramentas antigas que foram corrigidos AQUI dentro)
- Triagem **não baixava nada** fora do site onde foi feita. Aqui baixa.
- Triagem: o aviso "conversa de exemplo" **nunca sumia**. Aqui some.
- Leitor de .zip e comparador de texto vão **junto** (pasta `lib/`): não precisam de internet.

## O que ficou de fora (e por quê)
- **Analisador de Projeto APK** (analisador_apk): é de mentira — sorteia o resultado (`Math.random`), não lê o arquivo.
- **Juntador, Organizador de Documentos, Comunicações DJEN, Calculadora**: são ferramentas de trabalho jurídico, não de caçar erro — ficam para o Jurídico novo.
- **Playground (Teste.html)** e **Configuração do APK (21.html)**: o primeiro depende do Supabase; o segundo só gera um manifesto simples (o Gerador EAS já faz mais).
- O Limpador e o AI Code Studio continuam com o botão de voz deles **desligado de fábrica** (só fala se você ligar).

## Próximas partes (uma de cada vez)
1. **⚙️ Configurar para APK (EAS)**: importar o projeto → nome, conta (owner), slug, projectId → baixar `app.json` e `eas.json` certos (junta os geradores que você tem).
2. **🐙 Mandar para o GitHub** (projeto ou relatórios).
3. **Mandar para o Mini SK** um projeto consertado.

## Para quem for mexer no código
- `js/00-core.js` e `js/20-zip.js` são a mesma base do Mini SK.
- Cada ferramenta está em `ferramentas/*.js`, gerada a partir do HTML original por `ferramentas/montar.py`. Para atualizar uma ferramenta: troque o HTML original e rode o montar de novo.
- Para acrescentar ferramenta nova: um arquivo em `ferramentas/` que faça `CB_FERRAMENTAS.push({ id, nome, icone, desc, alimenta, html })` e, dentro do HTML, `window.__hub = { abrir(arquivoZip), relatorio() }`.
- Licenças das bibliotecas em `lib/` (JSZip: MIT/GPLv3; jsdiff: BSD).

## 📲 Instalar como app (09/10/2026)
Agora vem pronto: `manifest.json`, `sw.js` e ícones. Suba a pasta no Netlify/GitHub Pages, abra no Chrome → menu → **Instalar app**. Não precisa configurar nada.

## 📋 Plano completo (09/10/2026)
No 🩺 Diagnóstico, botão **📋 Gerar o plano completo**: telas, rotas do backend, o que o app pede ao servidor, **o que falta no backend**, banco, variáveis de ambiente (só nomes), roteiro para sair da Replit. Baixar como PLANO.md, guardar como relatório ou copiar para a IA. Sem IA, sem internet.

## ☁️ Consertar para o EAS (09/10/2026)
No 🩺 Diagnóstico de um projeto **Expo**, aparece o cartão **☁️ Consertar para o EAS**. Você preenche os dados da SUA conta (nome, conta do Expo, slug, projectId, pacote, versão — já vêm preenchidos com o que o projeto tem) e toca em **🔧 Consertar**. Ele:
- tira a Replit (.replit, .replit-artifact, scripts com pnpm/$PORT, pacotes @replit) e os arquivos SECRETOS (.env, credentials.json, keystore);
- acerta app.json (conta, projectId, pacote, versão, imagens que faltam), eas.json (perfil preview = APK) e package.json;
- descobre as **autorizações do Android** que o app usa (microfone, câmera, localização…);
- põe a receita do GitHub `.github/workflows/eas-build.yml`;
- avisa o que ainda depende da Replit (ex.: EXPO_PUBLIC_DOMAIN …replit.app);
- devolve **um zip só** (⬇ Baixar) ou guarda como cópia. O original fica intacto.
O **token NÃO entra** em nenhum arquivo: vai só no cofre do GitHub (Settings → Secrets → Actions → EXPO_TOKEN) ou pelo painel ☁️ EAS do Mini SK.
Peça compartilhada com o Mini SK: `js/lib/expo-core.js`. Conferido com o DevMobile.

## 🗂️ Organizar (09/10/2026)
Nova aba **🗂️ Organizar**, para pasta embolada (cópias, versões, .md com vários códigos colados):
- corta os .md/.txt em peças (cada página HTML, cada código "===== NOME =====", cada SQL);
- joga fora cópias iguais; agrupa versões e escolhe a **melhor** (sem erro, mais completa);
- confere erro de escrita de cada .js e **conserta sozinho** os simples (barra faltando no comentário, aspas com barra dobrada, **texto de conversa colado no meio** — "ADICIONAR NO…", "Copiar"). Só aceita o conserto se o arquivo passar a funcionar; o original fica em 3-VERSOES-ANTIGAS;
- lê cada index.html: o que ele chama, o que **não existe**, o que está em outra pasta e os **módulos soltos** que ninguém chama;
- monta **1-MONTADO/** (index + melhor versão de tudo + soltos ligados), **2-MELHORES/<assunto>/**, **3-VERSOES-ANTIGAS/**, **4-INCOMPLETOS/**, **5-TEXTO-DE-CONVERSA/** e **ORGANIZACAO.md**.
Peça: `js/lib/organizar-core.js`. Conferido com a pasta "1.zip" (Hub Jurídico): a pasta MONTADO abre e os 9 módulos carregam (só falta o editor.js, que não existe em lugar nenhum).
