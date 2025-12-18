/* ======================================
   Yog Logo Puzzle – NxN Sliding Puzzle
   Fully Fixed & Production Ready
   ====================================== */

/* -----------------------------
   DOM Elements
----------------------------- */
const puzzleBoard = document.getElementById("puzzleBoard");
const moveCountEl = document.getElementById("moveCount");
const timeCountEl = document.getElementById("timeCount");
const successMessage = document.getElementById("successMessage");

/* -----------------------------
   Game State
----------------------------- */
let boardSize = 4;
let totalTiles = 16;
let tiles = [];
let emptyIndex = 0;
let moves = 0;
let timer = null;
let secondsElapsed = 0;

/* -----------------------------
   Init on Load
----------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  setPuzzleSize(4); // default size
});

/* -----------------------------
   Puzzle Setup
----------------------------- */
function setPuzzleSize(size) {
  boardSize = size;
  totalTiles = boardSize * boardSize;

  puzzleBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
  puzzleBoard.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;

  initPuzzle();
  shufflePuzzle();
}

function initPuzzle() {
  resetStats();
  tiles = [];
  puzzleBoard.classList.remove("completed");
  successMessage.classList.add("d-none");

  for (let i = 0; i < totalTiles; i++) {
    tiles.push(i);
  }

  emptyIndex = totalTiles - 1;
  renderBoard();
}

/* -----------------------------
   Render Board (FIXED)
----------------------------- */
function renderBoard() {
  puzzleBoard.innerHTML = "";

  tiles.forEach((tileIndex, position) => {
    const tile = document.createElement("div");
    tile.className = "puzzle-tile";

    /* 🔑 CRITICAL FIX: image scaling belongs to tiles */
    tile.style.backgroundSize = `${boardSize * 100}% ${boardSize * 100}%`;

    if (tileIndex === totalTiles - 1) {
      if (!puzzleBoard.classList.contains("completed")) {
        tile.classList.add("empty");
        emptyIndex = position;
      } else {
        applyBackgroundPosition(tile, tileIndex);
      }
    } else {
      applyBackgroundPosition(tile, tileIndex);
      tile.addEventListener("click", () => moveTile(position));
    }

    puzzleBoard.appendChild(tile);
  });
}

function applyBackgroundPosition(tile, tileIndex) {
  const row = Math.floor(tileIndex / boardSize);
  const col = tileIndex % boardSize;

  tile.style.backgroundPosition =
    `${(col * 100) / (boardSize - 1)}% ${(row * 100) / (boardSize - 1)}%`;
}

/* -----------------------------
   Tile Movement
----------------------------- */
function moveTile(position) {
  if (!isAdjacent(position, emptyIndex)) return;

  if (!timer) startTimer();

  [tiles[position], tiles[emptyIndex]] =
    [tiles[emptyIndex], tiles[position]];

  emptyIndex = position;
  moves++;
  moveCountEl.textContent = moves;

  renderBoard();
  checkWin();
}

function isAdjacent(a, b) {
  const r1 = Math.floor(a / boardSize);
  const c1 = a % boardSize;
  const r2 = Math.floor(b / boardSize);
  const c2 = b % boardSize;

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
  puzzleBoard.classList.remove("completed");
  successMessage.classList.add("d-none");

  do {
    tiles = shuffleArray([...Array(totalTiles).keys()]);
  } while (!isSolvable(tiles) || isSolved());

  renderBoard();
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isSolvable(arr) {
  let inversions = 0;

  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (
        arr[i] !== totalTiles - 1 &&
        arr[j] !== totalTiles - 1 &&
        arr[i] > arr[j]
      ) {
        inversions++;
      }
    }
  }

  if (boardSize % 2 === 1) {
    return inversions % 2 === 0;
  }

  const emptyRowFromBottom =
    boardSize - Math.floor(arr.indexOf(totalTiles - 1) / boardSize);

  return (emptyRowFromBottom % 2 === 0) !== (inversions % 2 === 0);
}

/* -----------------------------
   Win Detection
----------------------------- */
function isSolved() {
  return tiles.every((tile, i) => tile === i);
}

function checkWin() {
  if (!isSolved()) return;

  clearInterval(timer);
  timer = null;

  puzzleBoard.classList.add("completed");
  successMessage.classList.remove("d-none");

  renderBoard();
}

/* -----------------------------
   Timer
----------------------------- */
function startTimer() {
  timer = setInterval(() => {
    secondsElapsed++;
    const min = String(Math.floor(secondsElapsed / 60)).padStart(2, "0");
    const sec = String(secondsElapsed % 60).padStart(2, "0");
    timeCountEl.textContent = `${min}:${sec}`;
  }, 1000);
}

/* -----------------------------
   Reset Helpers
----------------------------- */
function resetStats() {
  clearInterval(timer);
  timer = null;
  secondsElapsed = 0;
  moves = 0;
  moveCountEl.textContent = "0";
  timeCountEl.textContent = "00:00";
}
