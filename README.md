# risca-palito-front

Risca Palito (Stick Slash em inglês) é um site independente: Nim misère para dois. Os jogadores riscam palitos de uma fileira em turnos; quem riscar o último perde. Dá para jogar com um amigo, por código de sala, ou contra o computador.

Este repositório é só o site do jogo. O servidor é o [arcade-hub-back](https://github.com/Gabryelryba/arcade-hub-back) (id do jogo: `stick-slash`), compartilhado com os outros jogos. O código comum (componentes, socket, i18n, estilos) vem do pacote [arcade-hub-ui](https://github.com/Gabryelryba/arcade-hub-ui).

## Stack

- [Svelte 5](https://svelte.dev/) + [Vite](https://vitejs.dev/)
- [socket.io-client](https://socket.io/) para a sincronização com o backend
- `arcade-hub-ui` como dependência git com tag fixa
- [Vitest](https://vitest.dev/) para os testes

## Rodar localmente

```bash
npm install
npm run dev
```

O `npm install` baixa o `arcade-hub-ui` do GitHub. O repositório é público, então não precisa de login nem de token.

Precisa do [arcade-hub-back](https://github.com/Gabryelryba/arcade-hub-back) rodando (padrão `http://localhost:3001`; troque com `VITE_SERVER_URL`, veja `.env.example`).

## Estrutura

- `src/main.js`: registra os textos do jogo e monta a página (`GameApp` do `arcade-hub-ui`) com o jogo
- `src/stick-slash/`: o jogo
- `src/i18n.js`: textos próprios do jogo, em português e inglês

## Outros comandos

```bash
npm test         # testes (Vitest)
npm run build    # build de produção em dist/
npm run preview  # serve o build
```

## Landing page

A primeira tela do site é a landing page do jogo (`GameLanding` do `arcade-hub-ui`): o nome, a chamada e o tabuleiro animado (`Preview.svelte`), **Criar Sala**, **Entrar com Código**, **Jogar contra o Computador** e a seção "Como jogar". Os passos de "Como jogar" ficam em `stickSlash.steps` no `src/i18n.js`, nos dois idiomas.

Não existe mais o hub Recreio: o site não leva a outros jogos, e sair de uma sala ou partida volta para a landing page. Um código de sala de outro jogo é recusado pelo servidor como sala inexistente.

## Endereço

Produção: https://risca-palito.onrender.com. Convites são `https://risca-palito.onrender.com/?code=ABCDE`.

## Deploy (Render)

Static site no plano gratuito, descrito no `render.yaml` (Blueprint). O serviço se chama `risca-palito`, sem o sufixo `-front` do repositório, porque o nome do serviço define o endereço.

1. No Render: New → Blueprint e escolha este repositório. O app do Render no GitHub precisa ter acesso a ele.
2. Confira o endereço gerado. Tem que ser exatamente `https://risca-palito.onrender.com`. Se o Render acrescentar um sufixo (`risca-palito-xxxx`), apague o serviço e crie de novo com o nome `risca-palito-jogo`. Nesse caso, atualize o `CORS_ORIGIN` do `arcade-hub-back`.
3. A origem do site precisa estar no `CORS_ORIGIN` do `arcade-hub-back`.

O build roda `npm ci && npm run build` com `VITE_SERVER_URL=https://arcade-hub-back.onrender.com` e publica `dist/`. Cada push no `main` gera um novo deploy.
