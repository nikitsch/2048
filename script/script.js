import { Grid } from "./Grid.js"
import { Tile } from "./Tile.js"

const gameBoard = document.getElementById("game_board");

const grid = new Grid(gameBoard);

(function initialStateGrid() {
  const store = JSON.parse(localStorage.getItem('filledCells'));
  if (store) {
    for (const filledCell of store) {
      const { x, y, value } = filledCell;
      grid.getCell(x, y).linkTile(new Tile(gameBoard));
      grid.getCell(x, y).linkedTile.setValue(value);
    }
  } else {
    grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
    grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
  }

  // const popup = document.createElement('div');
  // popup.textContent = 'New Item';
  // popup.className = 'popup';
  // gameBoard.insertAdjacentElement('afterend', popup);
})();

setupInputOnce();
function setupInputOnce() {
  window.addEventListener("keydown", handleInput, { once: true });
  saveFilledCells();
}

function saveFilledCells() {
  const value = Object.values(grid.getFilledCells()).map(({ linkedTile }) => {
    const { tileElement, ...rest } = linkedTile;
    return rest;
  });
  localStorage.setItem('filledCells', JSON.stringify(value))
}

async function handleInput(event) {
  switch (event.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInputOnce();
        return;
      }
      await moveUp();
      break;

    case "ArrowDown":
      if (!canMoveDown()) {
        setupInputOnce();
        return;
      }
      await moveDown();
      break;

    case "ArrowRight":
      if (!canMoveRight()) {
        setupInputOnce();
        return;
      }
      await moveRight();
      break;

    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInputOnce();
        return;
      }
      await moveLeft();
      break;

    default:
      setupInputOnce();
      return;
  }

  const newTile = new Tile(gameBoard);
  grid.getRandomEmptyCell().linkTile(newTile)

  if (!canMoveUp() && !canMoveDown() && !canMoveRight() && !canMoveLeft()) {
    await newTile.waitForAnimationEnd();
    alert("YOU LOSE");
    return;
  }

  setupInputOnce();
}

async function moveUp() {
  await slideTiles(grid.cellsGroupedByColumn);
}

async function moveDown() {
  await slideTiles(grid.cellsGroupedByReversedColumn);
}

async function moveRight() {
  await slideTiles(grid.cellsGroupedByReversedRow);
}

async function moveLeft() {
  await slideTiles(grid.cellsGroupedByRow);
}

async function slideTiles(groupedCells) {
  const promises = [];

  groupedCells.forEach(group => slideTilesInGroup(group, promises));

  await Promise.all(promises);

  grid.cells.forEach(cell => {
    cell.hasTileForMerge() && cell.mergeTiles();
  })
}

function slideTilesInGroup(group, promises) {
  for (let i = 1; i < group.length; i++) {
    if (group[i].isEmpty()) {
      continue;
    }

    const cellWithTile = group[i];

    let targetCell;
    let j = i - 1;
    while (j >= 0 && group[j].canAccept(cellWithTile.linkedTile)) {
      targetCell = group[j];
      j--;
    }

    if (!targetCell) {
      continue;
    }

    promises.push(cellWithTile.linkedTile.waitForTransitionEnd());

    if (targetCell.isEmpty()) {
      targetCell.linkTile(cellWithTile.linkedTile);
    } else {
      targetCell.linkTileForMerge(cellWithTile.linkedTile);
    }

    cellWithTile.unlinkTile();
  }
}

function canMoveUp() {
  return canMove(grid.cellsGroupedByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsGroupedByReversedColumn);
}

function canMoveRight() {
  return canMove(grid.cellsGroupedByReversedRow);
}

function canMoveLeft() {
  return canMove(grid.cellsGroupedByRow);
}

function canMove(groupedCells) {
  return groupedCells.some(group => canMoveInGroup(group));
}

function canMoveInGroup(group) {
  return group.some((cell, i) => {
    if (i === 0) {
      return false;
    }

    if (cell.isEmpty()) {
      return false
    }

    const targetCell = group[i - 1];
    return targetCell.canAccept(cell.linkedTile);
  });
}
