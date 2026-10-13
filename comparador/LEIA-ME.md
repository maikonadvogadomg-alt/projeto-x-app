# 🔗 Colador de Links — v09/10-a

Refeito a partir do colador que o Claude 4.6 fez (que se perdeu), do mesmo jeito, modular:
- **Abas no topo**: a 1ª é sempre "🔗 Links". As outras são apps que você **fixa** (📌 num link, ou 📂 → Fixar como aba). Cada aba **fica aberta por trás** quando você troca — o login, o token, as conversas e até prévias continuam vivos.
- **Lista de links**: nome + endereço, caixinha de marcar, ✏️ editar, Remover (pede confirmação), 🔍 procurar, **colar vários de uma vez**.
- **🚀 Abrir selecionados**: abre um por vez aqui dentro, com "3/13 - nome", ← Anterior / Próximo →, ⛶ Tela cheia, ↗ Abrir fora e ✕ Fechar. Os últimos 8 abertos ficam vivos (voltar não recarrega).
- **💾 Backup / 📥 Restaurar**: os links e as abas vão para um arquivo .json. Faça de vez em quando.
- Já vem com os 13 links que apareciam nos seus prints. Os outros você cola em "📋 Colar vários de uma vez".
- Instala como app (PWA) com identidade própria (não briga com os outros apps do mesmo GitHub).

**Limite (vale para qualquer colador):** alguns sites não deixam ser abertos dentro de outro app — a área fica branca. Use ↗ Abrir fora. Os seus apps (Netlify / GitHub Pages) e os links de conversa compartilhada abrem.

## Arquivos
- `js/00-dados.js` — onde tudo fica guardado + backup
- `js/10-abas.js` — barra de abas que ficam vivas
- `js/20-links.js` — a lista
- `js/30-visor.js` — o visor (Anterior/Próximo)
- `js/99-app.js` — liga tudo
