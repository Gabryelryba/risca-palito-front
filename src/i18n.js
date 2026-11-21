// Risca Palito's own texts, added over the shared ones from arcade-hub-ui
// (registerMessages in main.js). Keys must match in both languages: see
// i18n.test.js.

const en = {
  meta: {
    description: "Stick Slash: misère Nim for two in the browser. Take turns crossing sticks; whoever crosses the last one loses. Play a friend or the computer, no account needed.",
  },

  stickSlash: {
    name: "Stick Slash",
    leave: "Leave",
    leaveAria: "Leave the room and go back to the start",
    // "How to play" on the landing page, read with tList().
    steps: [
      { title: "Sticks in rows", text: "The board starts with rows of 7, 5, 3 and 1 sticks. Two players take turns." },
      { title: "Slash in one stroke", text: "On your turn, drag across one row and cross as many neighbouring sticks as you like: one, a few, or the whole row." },
      { title: "Don't take the last one", text: "Whoever crosses the last stick on the board loses. Leave it to the other player." },
      { title: "A friend or the computer", text: "Create a room and send the link to a friend, or play against the computer right away." },
    ],
    eyebrow: "Misère Nim · 2 players",
    lede: "Take turns crossing sticks. In one move, slash as many neighbouring sticks of a single row as you like. Whoever crosses the last stick loses.",
    playVsComputer: "Play vs Computer",
    leaveGame: "Leave Game?",
    leaveGameAria: "Leave the game: tap again to confirm",
    yourRoom: "Your room",
    cancelRoom: "Cancel Room",
    hostingHelp: "Your opponent joins with the link or with the code. Keep this screen open: it stays awake while you wait.",
    waitingForOpponent: "Waiting for an opponent…",
    connectionLost: "Connection lost. Create a new room.",
    roomExpired: "The room expired. Create a new one.",
    opponentLeft: "{name} left the game.",
    wantsRematch: "{name} wants to play again.",
    waitingAccept: "Waiting for {name} to accept…",
    declined: "{name} declined.",
    theyCrossedLast: "{name} crossed the last stick.",
    youCrossedLast: "You crossed the last stick.",
    yourTurn: "Your turn. Drag across one row.",
    theirTurn: "{name}’s turn…",
    computer: "Computer",
    opponent: "Opponent",
    won: "Won",
    vs: "vs",
    players: "Players",
    accept: "Accept",
    waiting: "Waiting…",
    decline: "Decline",
    mainMenu: "Main Menu",
    wellPlayed: "Well played",
    gameOver: "Game over",
    youWin: "You Win",
    youLose: "You Lose",
    boardLabel: "Stick board, sticks left per row: {rows}",
  },
};

const ptBR = {
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

export default { en, "pt-BR": ptBR };
