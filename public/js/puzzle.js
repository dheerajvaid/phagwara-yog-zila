/* ======================================
   Yog Logo Puzzle – 4x4 Sliding Puzzle JS
   ====================================== */

const boardSize = 4; // 4x4
const totalTiles = boardSize * boardSize;
const puzzleBoard = document.getElementById('puzzleBoard');
const moveCountEl = document.getElementById('moveCount');
const timeCountEl = document.getElementById('timeCount');
const successMessage = document.getElementById('successMessage');

let tiles = [];
let emptyIndex = totalTiles - 1;
let moves = 0;
let timer = null;
let secondsElapsed = 0;

/* -----------------------------
   Initialization
----------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initPuzzle();
  shufflePuzzle(); // auto shuffle on load
});


function initPuzzle() {
  resetStats();
  tiles = [];
  puzzleBoard.classList.remove('completed');
  successMessage.classList.add('d-none');

  for (let i = 0; i < totalTiles; i++) {
    tiles.push(i);
  }

  emptyIndex = totalTiles - 1;
  renderBoard();
}

/* -----------------------------
   Render Puzzle Board
----------------------------- */
function renderBoard() {
  puzzleBoard.innerHTML = '';

  tiles.forEach((tileIndex, position) => {
    const tile = document.createElement('div');
    tile.classList.add('puzzle-tile');

    if (tileIndex === totalTiles - 1) {
      tile.classList.add('empty');
      emptyIndex = position;
    } else {
      const row = Math.floor(tileIndex / boardSize);
      const col = tileIndex % boardSize;

      tile.style.backgroundPosition = `${(col * 100) / (boardSize - 1)}% ${(row * 100) / (boardSize - 1)}%`;
      tile.addEventListener('click', () => moveTile(position));
    }

    puzzleBoard.appendChild(tile);
  });
}

/* -----------------------------
   Tile Movement Logic
----------------------------- */
function moveTile(position) {
  if (!isAdjacent(position, emptyIndex)) return;

  if (!timer) startTimer();

  [tiles[position], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[position]];
  emptyIndex = position;

  moves++;
  moveCountEl.textContent = moves;

  renderBoard();
  checkWin();
}

function isAdjacent(pos1, pos2) {
  const r1 = Math.floor(pos1 / boardSize);
  const c1 = pos1 % boardSize;
  const r2 = Math.floor(pos2 / boardSize);
  const c2 = pos2 % boardSize;

  return (
    (r1 === r2 && Math.abs(c1 - c2) === 1) ||
    (c1 === c2 && Math.abs(r1 - r2) === 1)
  );
}

/* -----------------------------
   Shuffle (Always Solvable)
----------------------------- */
function shufflePuzzle() {
  resetStats();
  puzzleBoard.classList.remove('completed');
  successMessage.classList.add('d-none');

  do {
    tiles = shuffleArray([...Array(totalTiles).keys()]);
  } while (!isSolvable(tiles) || isSolved());

  renderBoard();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isSolvable(arr) {
  let inversions = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] !== totalTiles - 1 && arr[j] !== totalTiles - 1 && arr[i] > arr[j]) {
        inversions++;
      }
    }
  }

  const emptyRowFromBottom = boardSize - Math.floor(arr.indexOf(totalTiles - 1) / boardSize);

  if (boardSize % 2 === 1) {
    return inversions % 2 === 0;
  } else {
    return (emptyRowFromBottom % 2 === 0) !== (inversions % 2 === 0);
  }
}

/* -----------------------------
   Win Detection
----------------------------- */
function isSolved() {
  for (let i = 0; i < totalTiles; i++) {
    if (tiles[i] !== i) return false;
  }
  return true;
}

function checkWin() {
  if (isSolved()) {
    clearInterval(timer);
    timer = null;
    puzzleBoard.classList.add('completed');
    successMessage.classList.remove('d-none');
  }
}

/* -----------------------------
   Timer
----------------------------- */
function startTimer() {
  timer = setInterval(() => {
    secondsElapsed++;
    const min = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const sec = String(secondsElapsed % 60).padStart(2, '0');
    timeCountEl.textContent = `${min}:${sec}`;
  }, 1000);
}

/* -----------------------------
   Reset
----------------------------- */
// function resetPuzzle() {
//   initPuzzle();
// }

function resetStats() {
  clearInterval(timer);
  timer = null;
  secondsElapsed = 0;
  moves = 0;
  moveCountEl.textContent = '0';
  timeCountEl.textContent = '00:00';
}