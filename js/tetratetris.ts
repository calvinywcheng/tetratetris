/// <reference path="jquery.d.ts" />
	
class TetraTetrisGame {

  private gameCanvas: HTMLCanvasElement;
  private BG_IMG: HTMLImageElement;
  private ctx: CanvasRenderingContext2D;
  private DEF_CTX
  private WIDTH: number;
  private HEIGHT: number;
  private FPS: number = 30;
  private INPUT_RATE: number = 5;
  private prevInputTime: number;
  private BLOCK_RATE: number = 1;
  private prevBlockTime: number;
  private gameLoopTimerID: number = null;
  private state: GameState = new GameState();
  private mainViewOffset: [number, number] = [50, 50];
  private nextBlockOffset: [number, number] = [600, 50];
  private holdQueueOffset: [number, number] = [600, 250];

  constructor() {
    this.gameCanvas = <HTMLCanvasElement> document.getElementById("game-canvas");
    this.BG_IMG = new Image();
    this.BG_IMG.src = "images/tetris-bg.jpg";
    this.WIDTH = this.gameCanvas.width;
    this.HEIGHT = this.gameCanvas.height;
    this.ctx = this.gameCanvas.getContext("2d");
    UserInput.getInstance().initHandlers(this);
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
    }
    else {
      console.log("Game paused.");
      clearInterval(this.gameLoopTimerID);
      this.gameLoopTimerID = null;
    }
  }

  public reset(): void {
    console.log("Resetting game...");
    clearInterval(this.gameLoopTimerID);
  }

  private update(): void {
    console.log("updating");
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
    ctx.fillRect(this.mainViewOffset[0], this.mainViewOffset[1], 500, 500);
    ctx.fillRect(this.nextBlockOffset[0], this.nextBlockOffset[1], 150, 150);
    ctx.fillRect(this.holdQueueOffset[0], this.holdQueueOffset[1], 150, 150);
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
    this.renderScore();
    this.renderBlocks();
  }

  private renderNext(): void {
    let tetromino = this.state.nextTetromino;
    if (tetromino != null) {
      let x = this.nextBlockOffset[0] + 25;
      let y = this.nextBlockOffset[1] + 45;
      this.renderTetromino(tetromino, [x, y]);
    }
  }

  private renderHold(): void {
    let tetromino = this.state.holdTetromino;
    if (tetromino != null) {
      let x = this.holdQueueOffset[0] + 25;
      let y = this.holdQueueOffset[1] + 45;
      this.renderTetromino(tetromino, [x, y]);
    }
  }

  private renderTetromino(tetromino: Tetromino, offset: [number, number]): void {
    let ctx: CanvasRenderingContext2D = this.ctx;
    let BLOCK_SIZE: number = 25;
    ctx.save();
    tetromino.shape.forEach((row, i) => {
      row.forEach((e, j) => {
        if (e != 0) {
          let x = j * BLOCK_SIZE + offset[0];
          let y = i * BLOCK_SIZE + offset[1];
          ctx.fillStyle = Util.COLOURS[e];
          ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        }
      })
    })
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
    let offset: [number, number] = this.mainViewOffset;
    let BLOCK_SIZE: number = 25;
    ctx.save();
    for (let i = 0; i < GameState.AREA_LEN; i++) {
      for (let j = 0; j < GameState.AREA_LEN; j++) {
        if (landed[i][j] >= 1 && landed[i][j] <= 8) {
          let x: number = j * BLOCK_SIZE + offset[0];
          let y: number = i * BLOCK_SIZE + offset[1];
          ctx.fillStyle = Util.COLOURS[landed[i][j]];
          ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }
    ctx.restore();
  }
}

class UserInput {

  private static instance: UserInput;
  private keysPressed: number[] = new Array<number>();

  public static getInstance(): UserInput {
    if (this.instance == null) {
      this.instance = new UserInput();
    }
    return this.instance;
  }

  public initHandlers(game: TetraTetrisGame): void {
    $(document).ready(() => {
      $(document).keydown((e: KeyboardEvent) => {
        let keyCode: number = e.which || e.keyCode;
        if ($.inArray(keyCode, this.keysPressed) == -1) {
          this.keysPressed.push(keyCode);
          console.log("Key(s) pressed: " + this.keysPressed.map(Util.toKey));
        }
      });
      $(document).keyup((e: KeyboardEvent) => {
        let keyCode: number = e.which || e.keyCode;
        let index = this.keysPressed.indexOf(keyCode);
        if (index != -1) {
          this.keysPressed.splice(index, 1);
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
  private _currTetromino: Tetromino = null;
  private _nextTetromino: Tetromino;
  private _holdTetromino: Tetromino = null;
  private _switched: boolean = false;
  private _score: number = 0;

  constructor() {
    this.initLandedArr();
    this.genNextTetromino();
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

  public getInput(key: string) {
    // TODO
  }

  public advanceBlock() {
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

  constructor(private _shape: number[][]) {

  }

  render(ctx: CanvasRenderingContext2D): void {
    throw new Error("Tetromino is an abstract class.");
  }

  public get shape(): number[][] {
    return this._shape;
  }
}

class ITetromino extends Tetromino {
  constructor() {
    let x = 1;
    super([
      [0, 0, 0, 0],
      [x, x, x, x],
      [0, 0, 0, 0],
      [0, 0, 0, 0]]);
  }
}

class JTetromino extends Tetromino {
  constructor() {
    let x = 2;
    super([
      [0, 0, x, 0],
      [0, 0, x, 0],
      [0, x, x, 0],
      [0, 0, 0, 0]]);
  }
}

class LTetromino extends Tetromino {
  constructor() {
    let x = 3;
    super([
      [0, x, 0, 0],
      [0, x, 0, 0],
      [0, x, x, 0],
      [0, 0, 0, 0]]);
  }
}

class ZTetromino extends Tetromino {
  constructor() {
    let x = 4;
    super([
      [0, 0, 0, 0],
      [x, x, 0, 0],
      [0, x, x, 0],
      [0, 0, 0, 0]]);
  }
}

class STetromino extends Tetromino {
  constructor() {
    let x = 5;
    super([
      [0, 0, 0, 0],
      [0, 0, x, x],
      [0, x, x, 0],
      [0, 0, 0, 0]]);
  }
}

class OTetromino extends Tetromino {
  constructor() {
    let x = 6;
    super([
      [0, 0, 0, 0],
      [0, x, x, 0],
      [0, x, x, 0],
      [0, 0, 0, 0]]);
  }
}

class TTetromino extends Tetromino {
  constructor() {
    let x = 7;
    super([
      [0, 0, 0, 0],
      [0, x, 0, 0],
      [x, x, x, 0],
      [0, 0, 0, 0]]);
  }
}

class Util {

  constructor() {
    throw new Error("Cannot instantiate Util class");
  }

  public static COLOURS: string[] = [
    null,
    "violet",
    "red",
    "orange",
    "yellow",
    "green",
    "cyan",
    "purple",
    "lightgrey"
  ];

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

let game = new TetraTetrisGame();
