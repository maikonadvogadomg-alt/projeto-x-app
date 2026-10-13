# Monta ferramentas/*.js do Caça-Bug a partir dos HTML originais (sem mexer neles).
# Uso: python3 montar.py   (os originais ficam em /home/claude/cacabug-fontes e /home/claude)
import json, os
H = '/home/claude/'
FONTES = H + 'cacabug-fontes/'
SAIDA = H + 'cacabug/ferramentas/'

def fim_body(s, extra):
    i = s.lower().rfind('</body>')
    return s[:i] + extra + s[i:] if i >= 0 else s + extra

def inserir_antes(s, alvo, extra):
    assert alvo in s, alvo[:60]
    return s.replace(alvo, extra + alvo, 1)

def libs_locais(s):
    # bibliotecas da internet -> cópia que vai junto no app (funciona offline e no APK)
    for de, para in [
        ('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'lib/jszip.min.js'),
        ('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', 'lib/jszip.min.js'),
        ('https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.2.0/diff.min.js', 'lib/diff.min.js'),
    ]:
        s = s.replace(de, para)
    return s

F = []

# Cirurgião
s = open(H + 'cirurgiao/index.html').read()
s = s.replace('Cirurgião de Código 4.4', 'Cirurgião de Código 4.5').replace('Cirurgião 4.4', 'Cirurgião 4.5')
s = fim_body(s, "<script>window.__hub={abrir:function(f){return carregarFiles([f]);},relatorio:function(){try{return R?relatorio(itensFiltrados()):'';}catch(e){return '';}}};</script>")
F.append(dict(arq='cirurgiao', id='cirurgiao', nome='Cirurgião', icone='🩻', desc='Marcas do Replit, bugs, dependências, chaves, terminal', alimenta=True, html=s))

# Projeto Lab (o "raio-x" que funciona: problemas, dependências, Git, Comparar A × B com diferença)
s = open(FONTES + 'projeto-lab.html').read()
s = fim_body(s, "<script>window.__hub={abrir:function(f,slot){return loadInto(slot==='B'?'B':'A',[f],'archive','');}};</script>")
F.append(dict(arq='projeto-lab', id='projeto-lab', nome='Projeto Lab', icone='🔬', desc='Resumo, problemas, dependências, API, Git e Comparar A × B linha por linha', alimenta=True, html=s))

# Analisador Universal (árvore + editor + limpar Replit + gerar arquivos)
s = open(FONTES + 'analisador-universal.html').read()
s = fim_body(s, "<script>window.__hub={abrir:function(f){return importZip(f);}};</script>")
F.append(dict(arq='analisador-universal', id='analisador-universal', nome='Analisador Universal', icone='🔧', desc='Árvore, editor, limpar Replit, gerar manifest/sw/workflow, exportar .zip', alimenta=True, html=s))

# Triagem
s = open(H + 'triagem.html').read()
s = s.replace('.banner{border:1px solid var(--line)', '[hidden]{display:none!important}\n.banner{border:1px solid var(--line)', 1)  # o aviso de exemplo nunca sumia
s = inserir_antes(s, "async function importFiles(fileList){", "window.__hub={abrir:function(f){return importFiles([f]);}};\n")
F.append(dict(arq='triagem', id='triagem', nome='Triagem', icone='🧩', desc='Separa código de conversas e divide HTML grande em módulos', alimenta=True, html=s))

# Gerador EAS
s = open(FONTES + 'gerador-eas.html').read()
s = fim_body(s, "<script>window.__hub={abrir:function(f){switchTab('importar');return importarProjeto({files:[f],value:''});}};</script>")
F.append(dict(arq='gerador-eas', id='gerador-eas', nome='Gerador EAS', icone='📱', desc='Lê app.json/eas.json do projeto e gera a configuração do APK (Expo)', alimenta=True, html=s))

# Limpador de Processos (com Gemini)
s = open(FONTES + 'limpador-processos.html').read()
F.append(dict(arq='limpador', id='limpador', nome='Limpador de Processos', icone='🧹', desc='PDF de processo grande: limpa, separa e resume com IA (Gemini, Groq, Ollama)', alimenta=False, html=s))

# AI Code Studio (chat com Gemini e outras IAs)
s = open(FONTES + 'ai-code-studio.html').read()
F.append(dict(arq='ai-code-studio', id='ai-code-studio', nome='AI Code Studio', icone='💬', desc='Chat com Gemini e outras IAs, editor e memória', alimenta=False, html=s))

# Perito
s = open(H + 'perito/perito-metadados.html').read()
s = fim_body(s, "<script>window.__hub={relatorio:function(){try{var t=textoRelatorio();return /\\S/.test(t)?t:'';}catch(e){return '';}}};</script>")
F.append(dict(arq='perito', id='perito', nome='Perito de Metadados', icone='🕵️', desc='PDF e fotos de prova: datas, edição, assinatura, GPS', alimenta=False, html=s))

# limpa os antigos e grava
for nome in os.listdir(SAIDA):
    if nome.endswith('.js'): os.remove(SAIDA + nome)
ordem = []
for f in F:
    arq = f.pop('arq')
    f['html'] = libs_locais(f['html'])
    js = '/* Ferramenta do Caça-Bug — gerada a partir do HTML original (não edite aqui; edite o original e rode montar.py). */\n'
    js += '(window.CB_FERRAMENTAS = window.CB_FERRAMENTAS || []).push(' + json.dumps(f, ensure_ascii=False).replace('</script', '<\\/script') + ');\n'
    open(SAIDA + arq + '.js', 'w').write(js)
    ordem.append(arq)
    print(arq, len(js))
open(SAIDA + 'ordem.txt', 'w').write('\n'.join(ordem) + '\n')
