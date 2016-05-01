/// <reference path="jquery.d.ts" />

class TetraTetrisGame {

  private _gameCanvas: HTMLCanvasElement;
  private BG_IMG: HTMLImageElement;
  private ctx: CanvasRenderingContext2D;
  private WIDTH: number;
  private HEIGHT: number;
  private BLOCK_SIZE: number = 25;
  private FPS: number = 30;
  private INPUT_RATE: number = 5;
  private prevInputTime: number = Date.now();
  private BLOCK_RATE: number = 10;
  private prevBlockTime: number = Date.now();
  private gameLoopTimerID: number = null;
  private state: GameState = new GameState();
  private mainViewOffset: Pos = new Pos(50, 50);
  private nextBlockOffset: Pos = new Pos(600, 50);
  private holdQueueOffset: Pos = new Pos(600, 250);
  private _keysPressed: number[] = [];

  constructor() {
    this._gameCanvas = <HTMLCanvasElement> document.getElementById("game-canvas");
    this.BG_IMG = new Image();
    this.BG_IMG.src = "images/tetris-bg.jpg";
    this.WIDTH = this._gameCanvas.width;
    this.HEIGHT = this._gameCanvas.height;
    this.ctx = this._gameCanvas.getContext("2d");
    this.initHandlers();
    this.render();
  }

  public startGameLoop(): void {
    console.log("Starting game loop at " + this.FPS + " FPS...");
    this.gameLoopTimerID = this.gameLoopTimerID || setInterval(() => {
        this.update();
        this.render();
      }, 1000 / this.FPS);
  }

  public togglePause(): void {
    if (this.gameLoopTimerID == null) {
      console.log("Resuming game.");
      this.startGameLoop();
    } else {
      console.log("Game paused.");
      clearInterval(this.gameLoopTimerID);
      this.gameLoopTimerID = null;
    }
  }

  public reset(): void {
    console.log("Resetting game...");
    clearInterval(this.gameLoopTimerID);
    this.gameLoopTimerID = null;
    this.state = new GameState();
    this.render();
  }

  private update(): void {
    if (Date.now() - this.prevInputTime > 1000 / this.INPUT_RATE) {
      this._keysPressed
        .map((k: number): string => Util.toKey(k))
        .forEach((key: string): void => this.state.processInput(key));
      this.prevInputTime = Date.now();
    }
    if (Date.now() - this.prevBlockTime > 1000 / this.BLOCK_RATE) {
      console.log("move block");
      let stillAlive: boolean = this.state.advanceBlock();
      if (stillAlive) {
        this.prevBlockTime = Date.now();
      } else {
        $("#pause-game").prop("disabled", true);
        clearInterval(this.gameLoopTimerID);
      }
    }
  }

  private render(): void {
    this.renderHUD();
    this.renderGameState();
  }

  private renderHUD(): void {
    let ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "lightgrey";
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "black";
    ctx.fillRect(this.mainViewOffset.x, this.mainViewOffset.y, 500, 500);
    ctx.fillRect(this.nextBlockOffset.x, this.nextBlockOffset.y, 150, 150);
    ctx.fillRect(this.holdQueueOffset.x, this.holdQueueOffset.y, 150, 150);
    ctx.fillStyle = "lightgrey";
    ctx.fillRect(600, 450, 150, 100);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(600, 450, 150, 100);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "black";
    ctx.font = "18px Trebuchet MS";
    ctx.fillText("Score:", 610, 470);
    ctx.fillStyle = "white";
    ctx.fillText("Next Tetromino", 610, 70);
    ctx.fillText("Hold Queue", 610, 270);
    ctx.restore();
  }

  private renderGameState(): void {
    this.renderNext();
    this.renderHold();
    this.renderBlocks();
    this.renderCurrent();
    this.renderScore();
  }

  private renderNext(): void {
    let tetromino = this.state.nextTetromino;
    if (tetromino != null) {
      let x = this.nextBlockOffset.x + 25;
      let y = this.nextBlockOffset.y + 45;
      this.renderTetromino(tetromino, new Pos(x, y));
    }
  }

  private renderHold(): void {
    let tetromino = this.state.holdTetromino;
    if (tetromino != null) {
      let x = this.holdQueueOffset.x + 25;
      let y = this.holdQueueOffset.y + 45;
      this.renderTetromino(tetromino, new Pos(x, y));
    }
  }

  private renderTetromino(tetromino: Tetromino, offset: Pos): void {
    let ctx: CanvasRenderingContext2D = this.ctx;
    ctx.save();
    tetromino.shape.forEach((row, j) => {
      row.forEach((e, i) => {
        if (e !== 0) {
          let x = i * this.BLOCK_SIZE + offset.x;
          let y = j * this.BLOCK_SIZE + offset.y;
          ctx.fillStyle = Util.COLOURS[e];
          ctx.fillRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);
          ctx.strokeRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);
        }
      })
    });
    ctx.restore();
  }

  private renderScore(): void {
    let ctx = this.ctx;
    ctx.save();
    ctx.font = "50px Trebuchet MS";
    let score = this.state.score;
    ctx.fillText(score + "", 630, 525);
    ctx.restore();
  }

  private renderBlocks(): void {
    let ctx = this.ctx;
    let landed: number[][] = this.state.landed;
    let offset: Pos = this.mainViewOffset;
    let BLOCK_SIZE: number = 25;
    ctx.save();
    landed.forEach((row, j) => {
      row.forEach((e, i) => {
        if (e !== 0) {
          let x: number = i * BLOCK_SIZE + offset.x;
          let y: number = j * BLOCK_SIZE + offset.y;
          ctx.fillStyle = Util.COLOURS[e];
          ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        }
      });
    });
    ctx.restore();
  }

  private renderCurrent(): void {
    let curr: Tetromino = this.state.currTetromino;
    let xOffset = curr.pos.x * this.BLOCK_SIZE + this.mainViewOffset.x;
    let yOffset = curr.pos.y * this.BLOCK_SIZE + this.mainViewOffset.y;
    let withoutOffScreen = curr.shape.map((row: number[], j: number): number[] => {
      return row.map((e: number, i: number): number => {
        let x = i + curr.pos.x;
        let y = j + curr.pos.y;
        return (x.between(0, 19, true) && y.between(0, 19, true)) ? e : 0;
      });
    });
    this.renderTetromino(new Tetromino(withoutOffScreen), new Pos(xOffset, yOffset));
  }

  private initHandlers(): void {
    $(document).ready(() => {
      $(document).keydown((e: KeyboardEvent) => {
        let keyCode: number = e.which || e.keyCode;
        if ($.inArray(keyCode, this._keysPressed) === -1) {
          this._keysPressed.push(keyCode);
          console.log("Key(s) pressed: " + this._keysPressed.map(Util.toKey));
        }
      });
      $(document).keyup((e: KeyboardEvent) => {
        let keyCode: number = e.which || e.keyCode;
        let index = this._keysPressed.indexOf(keyCode);
        if (index !== -1) {
          this._keysPressed.splice(index, 1);
        }
        console.log("Key released: " + Util.toKey(keyCode));
      });
      $("#start-game").click(() => {
        $("#start-game").prop("disabled", true);
        $("#pause-game").prop("disabled", false);
        game.startGameLoop();
      });
      $("#pause-game").click(() => {
        game.togglePause();
      });
      $("#reset-game").click(() => {
        $("#start-game").prop("disabled", false);
        game.reset();
      });
    });
  }
}

enum Dir {
  N, W, E, S
}

class GameState {
  public static AREA_LEN = 20;
  private _landed: number[][];
  private _nextDir: Dir = Dir.N;
  private _currTetromino: Tetromino;
  private _nextTetromino: Tetromino;
  private _holdTetromino: Tetromino = null;
  private _switched: boolean = false;
  private _score: number = 0;

  constructor() {
    this.initLandedArr();
    this.genNextTetromino();
    this.spawnTetromino();
  }

  private initLandedArr(): void {
    let AREA_LEN = GameState.AREA_LEN;
    this._landed = new Array(AREA_LEN);
    for (let i: number = 0; i < this._landed.length; i++) {
      this._landed[i] = new Array(AREA_LEN);
      for (let j: number = 0; j < this._landed[i].length; j++) {
        this._landed[i][j] = 0;
      }
    }
    this._landed[9][9] = 8;
    this._landed[9][10] = 8;
    this._landed[10][9] = 8;
    this._landed[10][10] = 8;
  }

  private genNextTetromino(): void {
    let rand: number = Math.floor(Math.random() * 7) + 1;
    switch (rand) {
      case 1:
        this._nextTetromino = new ITetromino();
        break;
      case 2:
        this._nextTetromino = new JTetromino();
        break;
      case 3:
        this._nextTetromino = new LTetromino();
        break;
      case 4:
        this._nextTetromino = new ZTetromino();
        break;
      case 5:
        this._nextTetromino = new STetromino();
        break;
      case 6:
        this._nextTetromino = new OTetromino();
        break;
      case 7:
        this._nextTetromino = new TTetromino();
        break;
    }
  }

  private spawnTetromino(): void {
    this._currTetromino = this._nextTetromino;
    switch (this._nextDir) {
      case Dir.N:
        this._currTetromino.pos = new Pos(8, -4);
        this._nextDir = Dir.E;
        break;
      case Dir.W:
        this._currTetromino.pos = new Pos(-4, 8);
        this._nextDir = Dir.N;
        break;
      case Dir.E:
        this._currTetromino.pos = new Pos(19, 8);
        this._nextDir = Dir.S;
        break;
      case Dir.S:
        this._currTetromino.pos = new Pos(8, 19);
        this._nextDir = Dir.W;
        break;
    }
    this.genNextTetromino();
  }

  public processInput(key: string) {
    // TODO
  }

  public advanceBlock(): boolean {
    let curr: Tetromino = this._currTetromino;
    let dir: Dir = GameState.getDir(curr.pos);
    let nextPos: Pos = GameState.translatePos(curr.pos, dir);
    let canAdvance: boolean = curr.shape.every((row, j) => {
      return row.every((e, i) => {
        if (e === 0) {
          return true;
        }
        let testPos: Pos = new Pos(i + nextPos.x, j + nextPos.y);
        console.log("Checking pos and clear of " + testPos.x + " " + testPos.y);
        return !this.inGameArea(testPos) || this.isClear(testPos);
      });
    });
    if (canAdvance) {
      console.log("Moving block ahead.");
      curr.pos = nextPos;
      return true;
    } else {
      console.log("Tetromino cannot go further; landing.");
      let success: boolean = this.landTetromino(curr);
      if (success) {
        console.log("Tetromino landed.");
        this.spawnTetromino();
        this.clearSquares();
        return true;
      } else {
        console.log("Tetromino landed out of screen.");
        return false;
      }
    }
  }

  private static getDir(pos: Pos): Dir {
    let x: number = pos.x - 8;
    let y: number = 8 - pos.y;
    if (y > Math.abs(x)) {
      return Dir.S;
    } else if (y < -Math.abs(x)) {
      return Dir.N;
    } else if (y >= x && y <= -x) {
      return Dir.E;
    } else if (y >= -x && y <= x) {
      return Dir.W;
    } else {
      throw new Error("Direction unable to be calculated.");
    }
  }

  private static translatePos(pos: Pos, dir: Dir): Pos {
    switch (dir) {
      case Dir.N:
        return new Pos(pos.x, pos.y - 1);
      case Dir.W:
        return new Pos(pos.x - 1, pos.y);
      case Dir.E:
        return new Pos(pos.x + 1, pos.y);
      case Dir.S:
        return new Pos(pos.x, pos.y + 1);
    }
  }

  private inGameArea(pos: Pos): boolean {
    let len: number = this._landed.length;
    console.log("0" + " <= " + pos.x + ", " + pos.y + " " + len);
    let checkX: boolean = pos.x.between(0, len - 1, true);
    return checkX && pos.y.between(0, len - 1, true);
  }

  private isClear(pos: Pos): boolean {
    return this.landed[pos.y][pos.x] === 0;
  }

  private landTetromino(tetromino: Tetromino): boolean {
    let pos: Pos = tetromino.pos;
    return tetromino.shape.every((row: number[], j: number): boolean => {
      return row.every((e: number, i: number): boolean => {
        if (e === 0) {
          return true;
        } else {
          let blockPos = new Pos(i + pos.x, j + pos.y);
          if (this.inGameArea(blockPos) && this.isClear(blockPos)) {
            this.landed[blockPos.y][blockPos.x] = e;
            return true;
          } else {
            return false;
          }
        }
      });
    });
  }

  private clearSquares(): void {
    // TODO
  }

  public get score(): number {
    return this._score;
  }

  public get landed(): number[][] {
    return this._landed;
  }

  public get currTetromino(): Tetromino {
    return this._currTetromino;
  }

  public get nextTetromino(): Tetromino {
    return this._nextTetromino;
  }

  public get holdTetromino(): Tetromino {
    return this._holdTetromino;
  }
}

class Tetromino {

  private _pos: Pos;

  constructor(private _shape: number[][]) {
  }

  public get shape(): number[][] {
    return this._shape;
  }

  public get pos(): Pos {
    return this._pos;
  }

  public set pos(pos: Pos) {
    this._pos = pos;
  }
}

class ITetromino extends Tetromino {
  constructor() {
    let x = 1;
    super([[0, 0, 0, 0], [x, x, x, x], [0, 0, 0, 0], [0, 0, 0, 0]]);
  }
}

class JTetromino extends Tetromino {
  constructor() {
    let x = 2;
    super([[0, 0, x, 0], [0, 0, x, 0], [0, x, x, 0], [0, 0, 0, 0]]);
  }
}

class LTetromino extends Tetromino {
  constructor() {
    let x = 3;
    super([[0, x, 0, 0], [0, x, 0, 0], [0, x, x, 0], [0, 0, 0, 0]]);
  }
}

class ZTetromino extends Tetromino {
  constructor() {
    let x = 4;
    super([[0, 0, 0, 0], [x, x, 0, 0], [0, x, x, 0], [0, 0, 0, 0]]);
  }
}

class STetromino extends Tetromino {
  constructor() {
    let x = 5;
    super([[0, 0, 0, 0], [0, 0, x, x], [0, x, x, 0], [0, 0, 0, 0]]);
  }
}

class OTetromino extends Tetromino {
  constructor() {
    let x = 6;
    super([[0, 0, 0, 0], [0, x, x, 0], [0, x, x, 0], [0, 0, 0, 0]]);
  }
}

class TTetromino extends Tetromino {
  constructor() {
    let x = 7;
    super([[0, 0, 0, 0], [0, x, 0, 0], [x, x, x, 0], [0, 0, 0, 0]]);
  }
}

class Util {

  constructor() {
    throw new Error("Cannot instantiate Util class");
  }

  public static COLOURS: string[] = [null, "violet", "red", "orange", "yellow", "green", "cyan", "purple", "lightgrey"];

  public static toKey(keyCode: number): string {
    switch (keyCode) {
      case 37:
        return "left arrow";
      case 38:
        return "up arrow";
      case 39:
        return "right arrow";
      case 40:
        return "down arrow";
      case 80:
        return "p";
      case 32:
        return "space";
      case 88:
        return "x";
      case 90:
        return "z";
      case 16:
        return "shift";
      default:
        return "unknown";
    }
  }
}

class Pos {
  constructor(private _x: number, private _y: number) {
  }

  public get x(): number {
    return this._x;
  }

  public get y(): number {
    return this._y;
  }

  public toTuple(): [number, number] {
    return [this._x, this._y];
  }
}

interface Number {
  between(a: number, b: number, inc: boolean): boolean;
}

Number.prototype.between = function (a: number, b: number, inc: boolean): boolean {
  let min: number = Math.min(a, b);
  let max: number = Math.max(a, b);
  return inc ? min <= this && this <= max : min < this && this < max;
};

let game = new TetraTetrisGame();
