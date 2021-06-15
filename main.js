/* 
Rule of thumb: if you only ever need ONE of something (gameBoard, displayController), use a module. If you need multiples of something (players!), create them with factories.
*/

const Player = (name, symbol, type) => {
  const update = (propToUpdate, newValue) => {
    if (propToUpdate == "name") {
      name = newValue;
    } else if (propToUpdate == "symbol") {
      symbol = newValue;
    } else if (propToUpdate == "type") {
      type = newValue;
    }
  };
  const getName = () => name;
  const getSymbol = () => symbol;
  const getType = () => type;

  function cpuTurn(gameboard, otherPlayer) {
    let grid = gameboard.getBoard();

    // Find first cell that would result in win for other player
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        let thisBoard = JSON.parse(JSON.stringify(grid));

        thisBoard[i][j] = thisBoard[i][j] == null ? otherPlayer.getSymbol() : thisBoard[i][j];
        console.log(thisBoard[i][j]);

        if (gameboard.hasWinner(thisBoard)) {
          console.log("Winning next move is...");
          console.log(i, j);
          return [i, j];
        }
      }
    }

    // Else randomly pick an empty cell
    let emptyCells = [];
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        if (!grid[i][j]) {
          emptyCells.push([i, j]);
        }
      }
    }

    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  return { getName, getSymbol, getType, update, cpuTurn };
};

const gameboard = (() => {
  let board = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  function getBoard() {
    return board;
  }

  function reset() {
    let arr = [];
    for (let i = 0; i < 3; i++) {
      let row = [];
      for (let j = 0; j < 3; j++) {
        row.push(null);
      }
      arr.push(row);
    }
    board = arr;
  }

  function changeCell(row, col, newVal) {
    board[row][col] = newVal;
  }

  function hasWinner(board) {
    let winningConditions = [
      // horizonals
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [2, 0],
        [2, 1],
        [2, 2],
      ],
      // verticals
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
      ],
      // diagonals
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      [
        [0, 2],
        [1, 1],
        [2, 0],
      ],
    ];

    for (let condition of winningConditions) {
      let cell1 = board[condition[0][0]][condition[0][1]];
      let cell2 = board[condition[1][0]][condition[1][1]];
      let cell3 = board[condition[2][0]][condition[2][1]];

      // check they all match and aren't null
      if (cell1 == cell2 && cell2 == cell3 && cell1) {
        return true;
      }
    }

    return false;
  }

  function isFull() {
    return !board.flat().includes(null);
  }

  function isDraw() {
    return !hasWinner(board) && isFull();
  }

  return { getBoard, reset, changeCell, hasWinner, isDraw };
})();

const displayController = (() => {
  const boardDiv = document.querySelector("#gameboard");
  const startBtn = document.querySelector("#start");
  const quitBtn = document.querySelector("#quit-btn");
  const playerInfoInputs = {
    pNameInput1: document.querySelector("#p1name"),
    pNameInput2: document.querySelector("#p2name"),
    pSymInput1: document.querySelector("#p1symbol"),
    pSymInput2: document.querySelector("#p2symbol"),
    pTypeSelect1: document.querySelector("#p1type"),
    pTypeSelect2: document.querySelector("#p2type"),
  };
  const activeTurnSpan = document.querySelector(".current-turn span:nth-child(2)");
  const playAgainBtn = document.querySelector("#play-again-btn");
  const homeBtn = document.querySelector("#home-screen-btn");

  function renderBoard(board) {
    boardDiv.innerHTML = "";
    for (let i = 0; i < board.length; i++) {
      // create rows
      const row = document.createElement("div");
      row.classList.add("row");
      for (let j = 0; j < board.length; j++) {
        // create cells
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.textContent = board[i][j] ? board[i][j] : "";
        row.append(cell);
      }
      boardDiv.append(row);
    }
  }

  function applyEventListeners() {
    // Handle any clicks on the board
    function handleBoardClick(e) {
      if (e.target.classList.contains("cell")) {
        console.log("clicked cell");
        if (game.getActivePlayer()) {
          let cellRow = e.target.dataset.row;
          let cellCol = e.target.dataset.col;

          game.processTurn(cellRow, cellCol);
        }
      }
    }
    boardDiv.addEventListener("click", handleBoardClick);

    // Handle click on start game btn
    function handleStartClick(e) {
      console.log("Start Playing");
      // some ui alert that game is starting
      game.startGame();
    }
    startBtn.addEventListener("click", handleStartClick);

    // Handle click on quit game btn
    function handleQuitClick(e) {
      quitGame();
    }
    quitBtn.addEventListener("click", handleQuitClick);

    // Handle Input Changes
    function handlePlayerInfoInputChange(e) {
      let player = game.getPlayers()[e.target.dataset.player - 1];
      player.update(e.target.getAttribute("name"), e.target.value);
    }
    for (let inp in playerInfoInputs) {
      playerInfoInputs[inp].addEventListener("change", handlePlayerInfoInputChange);
    }

    // Handle click on play again btn
    playAgainBtn.addEventListener("click", () => {
      gameboard.reset();
      game.resetTurn();
      renderBoard(gameboard.getBoard());
      switchScreens("game");
    });

    // Handle click on home screen btn
    homeBtn.addEventListener("click", () => {
      gameboard.reset();
      game.resetTurn();
      renderBoard(gameboard.getBoard());
      switchScreens("home");
    });
  }

  function updateActiveTurnDisplay() {
    activeTurnSpan.textContent = game.getActivePlayer().getName();
  }

  function updateResetMessage(msg) {
    document.querySelector("#reset-msg").textContent = msg;
  }

  function showMessage(msg, pauseTime = 1000) {
    const div = document.querySelector(".msg-box");
    const innerDiv = document.querySelector(".msg");
    innerDiv.textContent = msg;
    div.classList.add("show");
    innerDiv.classList.add("pause");
    setTimeout(() => {
      innerDiv.classList.remove("pause");
      innerDiv.classList.add("animate");
    }, pauseTime);
    setTimeout(() => {
      div.classList.remove("show");
      innerDiv.classList.remove("animate");
    }, pauseTime + 500);
  }

  function switchScreens(screenToShow) {
    // home, game, reset
    const homeScreen = document.querySelector("#home-container");
    const gameScreen = document.querySelector("#game-container");
    const resetScreen = document.querySelector("#reset-container");

    let screens = {
      home: homeScreen,
      game: gameScreen,
      reset: resetScreen,
    };

    for (let screen in screens) {
      screens[screen].style.display = "none";
    }

    screens[screenToShow].style.display = "flex";
  }

  function quitGame() {
    // confirm
    let conf = confirm("Are you sure you want to quit the game?");
    if (conf) {
      console.log("reset board");
      gameboard.reset();
      renderBoard(gameboard.getBoard());
      console.log(gameboard.getBoard());
      showMessage("Bok bok bgok!!");
      switchScreens("home");
    }
  }

  return {
    renderBoard,
    applyEventListeners,
    showMessage,
    switchScreens,
    updateActiveTurnDisplay,
    updateResetMessage,
  };
})();

const game = (() => {
  // Start values
  let player1 = Player("Player1", "X", "human");
  let player2 = Player("Player2", "O", "cpu");
  let activePlayer = false;

  function initialize() {
    // render board
    displayController.renderBoard(gameboard.getBoard());
    displayController.applyEventListeners(gameboard);
  }

  function startGame() {
    activePlayer = player1;
    displayController.updateActiveTurnDisplay();

    // ! some kind of alert displayed
    displayController.showMessage("The game is afoot!");

    // change screens
    displayController.switchScreens("game");
  }

  function getActivePlayer() {
    return activePlayer;
  }

  function processTurn(cellRow, cellCol) {
    // if cell already chosen, do nothing
    if (gameboard.getBoard()[cellRow][cellCol]) {
      console.log("cell already chosen");
      return;
    }

    // update cell to activePlayer symbol
    gameboard.changeCell(cellRow, cellCol, getActivePlayer().getSymbol());

    // re-render board with updated values
    displayController.renderBoard(gameboard.getBoard());

    // check if winner
    if (gameboard.hasWinner(gameboard.getBoard())) {
      displayController.showMessage(`${activePlayer.getName()} wins! Woohoo!`, 2000);
      displayController.updateResetMessage(`Good job, ${activePlayer.getName()}!`);
      setTimeout(() => {
        displayController.switchScreens("reset");
      }, 2000);

      return;
    }

    // check if draw
    if (gameboard.isDraw()) {
      displayController.showMessage(`It's a tie. Lame.`, 1400);
      displayController.updateResetMessage(`Next time, maybe someone will win.`);
      displayController.switchScreens("reset");
      return;
    }

    // switch players
    setNextPlayer();

    // message that it's next player's turn (unless cpu player)
    if (activePlayer.getType() != "cpu") {
      displayController.showMessage(`${activePlayer.getName()}'s turn.`, 1200);
    }

    // if (now) current player is cpu, auto-generate turn
    if (activePlayer.getType() == "cpu") {
      setTimeout(() => {
        let otherPlayer = player1 == activePlayer ? player2 : player1;
        let pick = activePlayer.cpuTurn(gameboard, otherPlayer);
        processTurn(pick[0], pick[1]);
      }, 200);
    }
  }

  function setNextPlayer() {
    if (activePlayer == player1) {
      activePlayer = player2;
    } else {
      activePlayer = player1;
    }
    displayController.updateActiveTurnDisplay();
  }

  function getPlayers() {
    return [player1, player2];
  }

  function resetTurn() {
    activePlayer = player1;
  }

  initialize();

  return { startGame, getActivePlayer, setNextPlayer, getPlayers, processTurn, resetTurn };
})();

// !! Don't let player symbols be the same
