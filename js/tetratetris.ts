/// <reference path="jquery.d.ts" />

class TetraTetrisGame {

  private _gameCanvas: HTMLCanvasElement;
  private BG_IMG: HTMLImageElement;
  private ctx: CanvasRenderingContext2D;
  private WIDTH: number;
  private HEIGHT: number;
  private BLOCK_SIZE: number = 25;
  private FPS: number = 30;
  private renderTimerID: number = null;
  private TPS: number = 10;
  private updateTimerID: number = null;
  private state: GameState = new GameState();
  private mainViewOffset: Pos = new Pos(50, 50);
  private nextBlockOffset: Pos = new Pos(600, 50);
  private holdQueueOffset: Pos = new Pos(600, 250);
  private _keysPressed: string[] = [];

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
    this.updateTimerID = this.updateTimerID ||
        setInterval(this.update.bind(this), 1000 / this.TPS);
    this.renderTimerID = this.renderTimerID ||
        setInterval(this.render.bind(this), 1000 / this.FPS);
  }

  public haltGameLoop(): void {
    clearInterval(this.updateTimerID);
    this.updateTimerID = null;
    clearInterval(this.renderTimerID);
    this.renderTimerID = null;
  }

  public togglePause(): void {
    if (this.renderTimerID == null) {
      console.log("Resuming game.");
      this.startGameLoop();
    } else {
      console.log("Game paused.");
      this.haltGameLoop();
    }
  }

  public reset(): void {
    console.log("Resetting game...");
    clearInterval(this.renderTimerID);
    this.renderTimerID = null;
    this.state = new GameState();
    this.render();
  }

  private update(): void {
    let stillAlive: boolean = this._keysPressed
        .every((key: string) => this.state.processInput(key));
    if (!stillAlive) {
      console.log("Game over!");
      $("#pause-game").prop("disabled", true);
      this.haltGameLoop();
      this.render();
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
    this.renderGameOver();
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
    ctx.fillText(this.state.score + "", 630, 525);
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
    this.renderTetromino(new Tetromino([withoutOffScreen]), new Pos(xOffset, yOffset));
  }

  private renderGameOver(): void {
    if (this.state.gameOver) {
      let ctx: CanvasRenderingContext2D = this.ctx;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "black";
      let x: number = this.mainViewOffset.x;
      let y: number = this.mainViewOffset.y;
      let len: number = 500;
      ctx.fillRect(x, y, len, len);
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let textX: number = x + len / 2;
      let textY: number = y + len / 2;
      ctx.font = "30px Trebuchet MS";
      ctx.fillText("Game Over!", textX, textY);
      ctx.restore();
    }
  }

  private initHandlers(): void {
    $(document).ready(() => {
      $(document).keydown((e: KeyboardEvent) => {
        let keyCode: number = e.which || e.keyCode;
        let key: string = Util.toKey(keyCode);
        if (key != null && $.inArray(key, this._keysPressed) === -1) {
          game.haltGameLoop();
          this._keysPressed.push(key);
          console.log(`Key(s) pressed: ${this._keysPressed}`);
          game.startGameLoop();
        }
      });
      $(document).keyup((e: KeyboardEvent) => {
        let keyCode: number = e.which || e.keyCode;
        let key: string = Util.toKey(keyCode);
        let index = this._keysPressed.indexOf(key);
        if (index !== -1) {
          this._keysPressed.splice(index, 1);
          console.log(`Key released: ${key}`);
        }
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

class GameState {
  public static AREA_LEN: number = 20;
  private _landed: number[][];
  private _nextDir: Dir = Dir.N;
  private _currTetromino: Tetromino;
  private _nextTetromino: Tetromino;
  private _holdTetromino: Tetromino = null;
  private _switched: boolean = false;
  private _score: number = 0;
  private _gameOver: boolean = false;

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
    this._currTetromino.setStartPos(this._nextDir);
    this._nextDir = Util.nextDir(this._nextDir, Rot.CW);
    this.genNextTetromino();
  }

  public processInput(key: string): boolean {
    switch (key) {
      case "up":
      case "left":
      case "right":
      case "down":
        let dir: Dir = Util.toDir(key);
        return this.advanceBlock(dir);
      case "z":
      case "x":
        let rot: Rot = Util.toRot(key);
        return this.rotateBlock(rot);
      default:
        throw new Error("Input key not implemeneted");
    }
  }

  public advanceBlock(dir: Dir): boolean {
    let curr: Tetromino = this._currTetromino;
    let nextPos: Pos = GameState.translatePos(curr.pos, dir);
    if (this.stillInBounds(curr, nextPos)) {
      if (this.isValidPos(curr, nextPos)) {
        console.log("Moving block ahead.");
        curr.pos = nextPos;
        return true;
      } else {
        let success: boolean = this.landTetromino(curr);
        if (success) {
          console.log("Tetromino landed.");
          this._score += 10;
          this.spawnTetromino();
          this.clearSquares();
          return true;
        } else {
          console.log("Tetromino landed out of screen.");
          this._gameOver = true;
          return false;
        }
      }
    } else {
      return true;
    }
  }

  private stillInBounds(curr: Tetromino, nextPos: Pos) {
    return curr.shape.some((row, j) => {
      return row.some((e, i) => {
        if (e === 0) {
          return false;
        }
        let testPos: Pos = new Pos(i + nextPos.x, j + nextPos.y);
        return this.inGameArea(testPos);
      });
    });
  }

  private isValidPos(curr: Tetromino, nextPos: Pos) {
    return curr.shape.every((row, j) => {
      return row.every((e, i) => {
        if (e === 0) {
          return true;
        }
        let testPos: Pos = new Pos(i + nextPos.x, j + nextPos.y);
        return !this.inGameArea(testPos) || this.isClear(testPos);
      });
    });
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

  private rotateBlock(rot: Rot): boolean {
    let curr: Tetromino = this._currTetromino;
    curr.rotate(rot);
    if (this.stillInBounds(curr, curr.pos) && this.isValidPos(curr, curr.pos)) {
      console.log(`Rotating block ${Rot[rot]}`);
    } else {
      curr.undoRotate(rot);
    }
    return true;
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

  public get gameOver(): boolean {
    return this._gameOver;
  }
}

class Tetromino {

  private _pos: Pos;
  private _shape: number[][];
  private _rotation: number = 0;
  private _minX: number = Number.MAX_VALUE;
  private _maxX: number = Number.MIN_VALUE;
  private _minY: number = Number.MAX_VALUE;
  private _maxY: number = Number.MIN_VALUE;

  constructor(private _rotations: number[][][]) {
    this._shape = this._rotations[0];
    this._shape.forEach((row, j) => {
      row.forEach((e, i) => {
        if (e !== 0) {
          this._minX = Math.min(this._minX, i);
          this._maxX = Math.max(this._maxX, i);
          this._minY = Math.min(this._minY, j);
          this._maxY = Math.max(this._maxY, j);
        }
      })
    })
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

  public rotate(rot: Rot): void {
    switch (rot) {
      case Rot.CW:
        this._rotation = (this._rotation + 1).mod(4);
        break;
      case Rot.CCW:
        this._rotation = (this._rotation - 1).mod(4);
        break;
      default:
        throw new Error("Rotation not defined");
    }
    this._shape = this._rotations[this._rotation];
  }

  public undoRotate(rot: Rot): void {
    switch (rot) {
      case Rot.CW:
        return this.rotate(Rot.CCW);
      case Rot.CCW:
        return this.rotate(Rot.CW);
      default:
        throw new Error("Rotation not defined");
    }
  }

  public setStartPos(dir: Dir): Pos {
    switch (dir) {
      case Dir.N:
        this._pos = new Pos(8, 0 - this._maxY);
        break;
      case Dir.W:
        this._pos = new Pos(0 - this._maxX, 8);
        break;
      case Dir.E:
        this._pos = new Pos(19 - this._minX, 8);
        break;
      case Dir.S:
        this._pos = new Pos(8, 19 - this._minY);
        break;
      default:
        throw new Error("Direction not recognized.");
    }
    return this._pos;
  }

  public getMidPos(): Pos {
    return new Pos(this._pos.x + 2, this.pos.y + 2);
  }
}

class ITetromino extends Tetromino {
  constructor() {
    let x = 1;
    super([[
      [0, 0, 0, 0],
      [x, x, x, x],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ], [
      [0, 0, x, 0],
      [0, 0, x, 0],
      [0, 0, x, 0],
      [0, 0, x, 0]
    ], [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [x, x, x, x],
      [0, 0, 0, 0]
    ], [
      [0, x, 0, 0],
      [0, x, 0, 0],
      [0, x, 0, 0],
      [0, x, 0, 0]
    ]]);
  }
}

class JTetromino extends Tetromino {
  constructor() {
    let x = 2;
    super([[
      [0, 0, x, 0],
      [0, 0, x, 0],
      [0, x, x, 0],
      [0, 0, 0, 0]
    ], [
      [0, x, 0, 0],
      [0, x, x, x],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ], [
      [0, 0, x, x],
      [0, 0, x, 0],
      [0, 0, x, 0],
      [0, 0, 0, 0]
    ], [
      [0, 0, 0, 0],
      [0, x, x, x],
      [0, 0, 0, x],
      [0, 0, 0, 0]
    ]]);
  }
}

class LTetromino extends Tetromino {
  constructor() {
    let x = 3;
    super([[
      [0, x, 0, 0],
      [0, x, 0, 0],
      [0, x, x, 0],
      [0, 0, 0, 0]
    ], [
      [0, 0, 0, 0],
      [x, x, x, 0],
      [x, 0, 0, 0],
      [0, 0, 0, 0]
    ], [
      [x, x, 0, 0],
      [0, x, 0, 0],
      [0, x, 0, 0],
      [0, 0, 0, 0]
    ], [
      [0, 0, x, 0],
      [x, x, x, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]]);
  }
}

class ZTetromino extends Tetromino {
  constructor() {
    let x = 4;
    super([[
      [0, 0, 0, 0],
      [x, x, 0, 0],
      [0, x, x, 0],
      [0, 0, 0, 0]
    ], [
      [0, x, 0, 0],
      [x, x, 0, 0],
      [x, 0, 0, 0],
      [0, 0, 0, 0]
    ], [
      [x, x, 0, 0],
      [0, x, x, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ], [
      [0, 0, x, 0],
      [0, x, x, 0],
      [0, x, 0, 0],
      [0, 0, 0, 0]
    ]]);
  }
}

class STetromino extends Tetromino {
  constructor() {
    let x = 5;
    super([[
      [0, 0, 0, 0],
      [0, 0, x, x],
      [0, x, x, 0],
      [0, 0, 0, 0]
    ], [
      [0, 0, 0, 0],
      [0, 0, x, 0],
      [0, 0, x, x],
      [0, 0, 0, x]
    ], [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, x, x],
      [0, x, x, 0]
    ], [
      [0, 0, 0, 0],
      [0, x, 0, 0],
      [0, x, x, 0],
      [0, 0, x, 0]
    ]]);
  }
}

class OTetromino extends Tetromino {
  constructor() {
    let x = 6;
    let square = [[0, 0, 0, 0], [0, x, x, 0], [0, x, x, 0], [0, 0, 0, 0]];
    super([square, square, square, square]);
  }
}

class TTetromino extends Tetromino {
  constructor() {
    let x = 7;
    super([[
      [0, 0, 0, 0],
      [0, x, 0, 0],
      [x, x, x, 0],
      [0, 0, 0, 0]
    ], [
      [0, 0, 0, 0],
      [0, x, 0, 0],
      [0, x, x, 0],
      [0, x, 0, 0]
    ], [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [x, x, x, 0],
      [0, x, 0, 0]
    ], [
      [0, 0, 0, 0],
      [0, x, 0, 0],
      [x, x, 0, 0],
      [0, x, 0, 0]
    ]]);
  }
}

class Util {

  constructor() {
    throw new Error("Cannot instantiate Util class");
  }

  public static COLOURS: string[] = [null, "violet", "red", "orange", "yellow", "green", "cyan", "purple", "lightgrey"];

  public static toDir(dir: string): Dir {
    switch (dir) {
      case "up":
        return Dir.N;
      case "left":
        return Dir.W;
      case "right":
        return Dir.E;
      case "down":
        return Dir.S;
      default:
        throw new Error("Direction invalid.");
    }
  }

  public static toRot(rot: string): Rot {
    switch (rot) {
      case "x":
        return Rot.CW;
      case "z":
        return Rot.CCW;
      default:
        throw new Error("Rotation invalid.");
    }
  }

  public static nextDir(dir: Dir, rot: Rot): Dir {
    switch (dir) {
      case Dir.N:
        return (rot === Rot.CW) ? Dir.E : Dir.W;
      case Dir.E:
        return (rot === Rot.CW) ? Dir.S : Dir.N;
      case Dir.S:
        return (rot === Rot.CW) ? Dir.W : Dir.E;
      case Dir.W:
        return (rot === Rot.CW) ? Dir.N : Dir.S;
      default:
        throw new Error("Direction invalid.");
    }
  }

  public static prevDir(dir: Dir, rot: Rot): Dir {
    switch (dir) {
      case Dir.N:
        return (rot === Rot.CW) ? Dir.E : Dir.W;
      case Dir.E:
        return (rot === Rot.CW) ? Dir.S : Dir.N;
      case Dir.S:
        return (rot === Rot.CW) ? Dir.W : Dir.E;
      case Dir.W:
        return (rot === Rot.CW) ? Dir.N : Dir.S;
      default:
        throw new Error("Direction invalid.");
    }
  }

  public static toKey(keyCode: number): string {
    switch (keyCode) {
      case 37:
        return "left";
      case 38:
        return "up";
      case 39:
        return "right";
      case 40:
        return "down";
      case 88:
        return "x";
      case 90:
        return "z";
      case 16:
        return "shift";
      default:
        return null;
    }
  }
}

enum Dir {
  N = 0, W = 270, E = 90, S = 180
}

enum Rot {
  CW = 90, CCW = -90
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
  mod(n: number): number;
}

Number.prototype.between = function (a: number, b: number, inc: boolean): boolean {
  let min: number = Math.min(a, b);
  let max: number = Math.max(a, b);
  return inc ? min <= this && this <= max : min < this && this < max;
};

Number.prototype.mod = function (n: number): number {
  return ((this % n) + n) % n;
};

let game = new TetraTetrisGame();
