# risca-palito-front

Risca Palito (Stick Slash em inglês), jogo do Recreio: Nim misère para dois. Os jogadores riscam palitos de uma fileira em turnos; quem riscar o último perde. Dá para jogar com um amigo, por código de sala, ou contra o computador.

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

O `npm install` baixa o `arcade-hub-ui`, que é privado: o git da máquina precisa ter acesso ao GitHub (por exemplo, `gh auth login`).

Precisa do [arcade-hub-back](https://github.com/Gabryelryba/arcade-hub-back) rodando (padrão `http://localhost:3001`; troque com `VITE_SERVER_URL`, veja `.env.example`). Para "Voltar ao Recreio" e os convites de outros jogos apontarem para servidores locais, use `VITE_GAME_URLS`.

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

## Endereço

Produção: https://risca-palito.onrender.com. Convites são `https://risca-palito.onrender.com/?code=ABCDE`.
