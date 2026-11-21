// Risca Palito's own texts, in Brazilian Portuguese, added over the shared
// ones from arcade-hub-ui (registerMessages in main.js).

export default {
  meta: {
    description: "Risca Palito: Nim misère para dois no navegador. Risquem palitos em turnos; quem riscar o último perde. Jogue com um amigo ou contra o computador, sem cadastro.",
  },

  stickSlash: {
    name: "Risca Palito",
    leave: "Sair",
    leaveAria: "Sair da sala e voltar para o início",
    // "How to play" on the landing page, read with tList().
    steps: [
      { title: "Palitos em fileiras", text: "O tabuleiro começa com fileiras de 7, 5, 3 e 1 palitos. Dois jogadores se revezam." },
      { title: "Risque de uma vez", text: "Na sua vez, arraste sobre uma fileira e risque quantos palitos vizinhos quiser: um, alguns ou a fileira inteira." },
      { title: "Não fique com o último", text: "Quem riscar o último palito do tabuleiro perde. Deixe ele para o outro jogador." },
      { title: "Um amigo ou o computador", text: "Crie a sala e mande o link para um amigo, ou jogue contra o computador na hora." },
    ],
    eyebrow: "Nim misère · 2 jogadores",
    lede: "Risquem palitos em turnos. Numa jogada, você risca quantos palitos vizinhos quiser de uma mesma fileira. Quem riscar o último palito perde.",
    playVsComputer: "Jogar contra o Computador",
    leaveGame: "Sair do Jogo?",
    leaveGameAria: "Sair do jogo: toque de novo para confirmar",
    yourRoom: "Sua sala",
    cancelRoom: "Cancelar Sala",
    hostingHelp: "O adversário entra pelo link ou pelo código. Deixe esta tela aberta: ela fica acesa enquanto você espera.",
    waitingForOpponent: "Esperando um adversário…",
    connectionLost: "A conexão caiu. Crie uma sala nova.",
    roomExpired: "A sala expirou. Crie uma nova.",
    opponentLeft: "{name} saiu do jogo.",
    wantsRematch: "{name} quer jogar de novo.",
    waitingAccept: "Esperando {name} aceitar…",
    declined: "{name} recusou.",
    theyCrossedLast: "{name} riscou o último palito.",
    youCrossedLast: "Você riscou o último palito.",
    yourTurn: "Sua vez. Arraste por uma fileira.",
    theirTurn: "Vez de {name}…",
    computer: "Computador",
    opponent: "Adversário",
    won: "Venceu",
    vs: "vs",
    players: "Jogadores",
    accept: "Aceitar",
    waiting: "Esperando…",
    decline: "Recusar",
    mainMenu: "Menu Principal",
    wellPlayed: "Boa jogada",
    gameOver: "Fim de jogo",
    youWin: "Você Venceu",
    youLose: "Você Perdeu",
    boardLabel: "Tabuleiro de palitos, palitos restantes por fileira: {rows}",
  },
};

