/// <reference path="jquery.d.ts" />
/// <reference path="lodash.d.ts" />

class TetraTetrisGame {

  private _gameCanvas: HTMLCanvasElement;
  private BG_IMG: HTMLImageElement;
  private ctx: CanvasRenderingContext2D;
  private WIDTH: number;
  private HEIGHT: number;
  private BLOCK_SIZE: number = 25;
  private FPS: number = 30;
  private renderTimerID: number = null;
  private TPS: number = 8;
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
    ctx.textBaseline = "top";
    ctx.fillText("Score", 610, 460);
    ctx.fillStyle = "white";
    ctx.fillText(
        "Next Tetromino",
        this.nextBlockOffset.x + 10,
        this.nextBlockOffset.y + 10);
    ctx.fillText(
        "Hold Queue",
        this.holdQueueOffset.x + 10,
        this.holdQueueOffset.y + 10);
    ctx.restore();
  }

  private renderGameState(): void {
    this.renderNext();
    this.renderHold();
    this.renderBBox();
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

  private renderBBox(): void {
    let bBox: Box = this.state.bBox;
    if (bBox.tl.x >= 0 && bBox.tl.y >= 0) {
      let ctx: CanvasRenderingContext2D = this.ctx;
      ctx.save();
      ctx.strokeStyle = "lime";
      ctx.translate(this.mainViewOffset.x, this.mainViewOffset.y);
      ctx.scale(this.BLOCK_SIZE, this.BLOCK_SIZE);
      ctx.lineWidth = 1 / this.BLOCK_SIZE;
      ctx.strokeRect(bBox.tl.x, bBox.tl.y, bBox.width, bBox.height);
      ctx.restore();
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
    ctx.textBaseline = "bottom";
    ctx.textAlign = "right";
    ctx.fillText(this.state.score + "", 740, 590);
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
      ctx.font = "40px Trebuchet MS";
      ctx.fillText("Game Over!", textX, textY);
      ctx.restore();
    }
  }

  private initHandlers(): void {
    $(document).ready(() => {
      $(document).keydown((e: KeyboardEvent) => {
        let keyCode: number = e.which || e.keyCode;
        if ([32, 37, 38, 39, 40].indexOf(keyCode) > -1) {
          e.preventDefault();
        }
        let key: string = Util.toKey(keyCode);
        if (key != null && $.inArray(key, this._keysPressed) === -1) {
          this._keysPressed.push(key);
          console.log(`Key(s) pressed: ${this._keysPressed}`);
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
  private static ROTATE_DELAY: number = 200;
  private _landed: number[][];
  private _nextDir: Dir = Dir.NW;
  private _currTetromino: Tetromino;
  private _nextTetromino: Tetromino;
  private _holdTetromino: Tetromino = null;
  private _lastRotateTime: number = Date.now();
  private _switched: boolean = false;
  private _score: number = 0;
  private _bBox: Box;
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

  private swapWithHold(): boolean {
    if (!this._switched) {
      if (this._holdTetromino == null) {
        this._holdTetromino = this._nextTetromino;
        this.genNextTetromino();
      }
      [this._currTetromino, this._holdTetromino] = [this._holdTetromino, this._currTetromino];
      this._currTetromino.setStartPos(Util.nextDir(this._nextDir, Rot.CCW));
      this._switched = true;
    }
    return true;
  }

  private spawnTetromino(): void {
    this._currTetromino = this._nextTetromino;
    this._currTetromino.setStartPos(this._nextDir);
    this.fitBBox();
    this._switched = false;
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
      case "shift":
        return this.swapWithHold();
      default:
        throw new Error("Input key not implemeneted");
    }
  }

  public advanceBlock(dir: Dir): boolean {
    let curr: Tetromino = this._currTetromino;
    let nextPos: Pos = curr.pos.translate(dir);
    if (this.inBBox(curr, nextPos)) {
      if (this.isValidPos(curr, nextPos)) {
        console.log("Moving block ahead.");
        curr.pos = nextPos;
        this.fitBBox();
        return true;
      } else {
        let success: boolean = this.landTetromino(curr);
        if (success) {
          console.log("Tetromino landed.");
          this._score += 10;
          this.clearSquares();
          this.spawnTetromino();
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

  private inBBox(curr: Tetromino, pos: Pos): boolean {
    let pieceBox = curr.bBox.translate(pos);
    return pieceBox.containedIn(this._bBox);
  }

  private isValidPos(curr: Tetromino, pos: Pos) {
    return curr.shape.every((row, j) => {
      return row.every((e, i) => {
        if (e === 0) {
          return true;
        }
        let testPos: Pos = new Pos(i + pos.x, j + pos.y);
        return !this.inGameArea(testPos) || this.isClear(testPos);
      });
    });
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
    let CLEAR_BASE_POINTS = 100;
    let getSquare = (dist: number): {[key: string]: Pos[]} => {
      let square: {[key: string]: Pos[]} = {};
      let getRow = (start: Pos, end: Pos, dir: Dir): Pos[] => {
        let row: Pos[] = [];
        for (let pos = start.translate(dir); !_.isEqual(pos, end); pos = pos.translate(dir)) {
          row.push(pos);
        }
        return row;
      };
      square["NW"] = [new Pos(dist, dist)];
      square["NE"] = [new Pos(19 - dist, dist)];
      square["SW"] = [new Pos(dist, 19 - dist)];
      square["SE"] = [new Pos(19 - dist, 19 - dist)];
      square["N"] = getRow(square["NW"][0], square["NE"][0], Dir.E);
      square["W"] = getRow(square["NW"][0], square["SW"][0], Dir.S);
      square["E"] = getRow(square["NE"][0], square["SE"][0], Dir.S);
      square["S"] = getRow(square["SW"][0], square["SE"][0], Dir.E);
      return square;
    };
    let counter: number = 0;
    for (let distFromEdge: number = 1; distFromEdge <= 8; distFromEdge++) {
      let square: {[key: string]: Pos[]} = getSquare(distFromEdge);
      console.log(square);
      let complete: boolean = _.flatten(_.valuesIn(square)).every((e: Pos) => {
        return !this.isClear(e);
      });
      if (complete) {
        let recMove = (dst: Pos, moveDir: Dir): void => {
          let src: Pos = dst.translate(Util.reverseDir(moveDir));
          if (this.inGameArea(src)) {
            this._landed[dst.y][dst.x] = this._landed[src.y][src.x];
            recMove(src, moveDir);
          } else {
            this._landed[dst.y][dst.x] = 0;
          }
        };
        let moveCorner = (dst: Pos, moveDir: Dir): void => {
          let dirs: [Dir, Dir] = [
            Util.reverseDir((moveDir + 45).mod(360)),
            Util.reverseDir((moveDir - 45).mod(360))
          ];
          for (let dir of dirs) {
            for (let pos: Pos = dst.translate(dir);
                 pos.x.between(1, 18, true) && pos.y.between(1, 18, true);
                 pos = pos.translate(dir)) {
              recMove(pos, moveDir);
            }
          }
          recMove(dst, Util.reverseDir(moveDir));
        };
        square["N"].forEach((p: Pos) => recMove(p, Dir.S));
        square["W"].forEach((p: Pos) => recMove(p, Dir.E));
        square["E"].forEach((p: Pos) => recMove(p, Dir.W));
        square["S"].forEach((p: Pos) => recMove(p, Dir.N));
        moveCorner(square["NW"][0], Dir.SE);
        moveCorner(square["NE"][0], Dir.SW);
        moveCorner(square["SW"][0], Dir.NE);
        moveCorner(square["SE"][0], Dir.NW);
        counter++;
        distFromEdge = 1;
      }
    }
    if (counter > 0) {
      this._score += CLEAR_BASE_POINTS << counter;
    }
    console.log("Done checking for cleared squares");
  }

  private rotateBlock(rot: Rot): boolean {
    if (Date.now() - this._lastRotateTime > GameState.ROTATE_DELAY) {
      let curr: Tetromino = this._currTetromino;
      curr.rotate(rot);
      if (this.isValidPos(curr, curr.pos)) {
        console.log(`Rotating block ${Rot[rot]}`);
        this.fitBBox();
      } else {
        curr.undoRotate(rot);
      }
      this._lastRotateTime = Date.now();
    }
    return true;
  }

  private fitBBox(): Box {
    let curr: Tetromino = this._currTetromino;
    let box: Box = new Box(new Pos(-3, -3), new Pos(23, 23));
    while (curr.containedIn(box)) {
      this._bBox = box;
      box = box.shrink();
    }
    return this._bBox;
  }

  public get score(): number {
    return this._score;
  }

  public get landed(): number[][] {
    return this._landed;
  }

  public get bBox(): Box {
    return this._bBox;
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
  private _minX: number = Number.POSITIVE_INFINITY;
  private _maxX: number = Number.NEGATIVE_INFINITY;
  private _minY: number = Number.POSITIVE_INFINITY;
  private _maxY: number = Number.NEGATIVE_INFINITY;
  private _bBox;

  constructor(private _rotations: number[][][]) {
    this._shape = this._rotations[0];
    this._rotations.forEach((rot) => {
      rot.forEach((row, j) => {
        row.forEach((e, i) => {
          if (e !== 0) {
            this._minX = Math.min(this._minX, i);
            this._maxX = Math.max(this._maxX, i);
            this._minY = Math.min(this._minY, j);
            this._maxY = Math.max(this._maxY, j);
          }
        })
      });
    });
    let tl: Pos = new Pos(this._minX, this._minY);
    let br: Pos = new Pos(this._maxX + 1, this._maxY + 1);
    this._bBox = new Box(tl, br);
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
      case Dir.NW:
        this._pos = new Pos(0 - this._maxX, 0 - this._maxY);
        break;
      case Dir.NE:
        this._pos = new Pos(19 - this._minX, 0 - this._maxY);
        break;
      case Dir.SE:
        this._pos = new Pos(19 - this._minX, 19 - this._minY);
        break;
      case Dir.SW:
        this._pos = new Pos(0 - this._maxX, 19 - this._minY);
        break;
      default:
        throw new Error("Direction not recognized.");
    }
    return this._pos;
  }

  public containedIn(box: Box): boolean {
    return this.bBoxWithOffset.containedIn(box);
  }

  public get bBox(): Box {
    return this._bBox;
  }

  private get bBoxWithOffset(): Box {
    return this.bBox.translate(this._pos);
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

  public static COLOURS: string[] = [null, "violet", "red", "orange", "gold", "green", "cyan", "purple", "white"];

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
    return (dir + rot).mod(360);
  }

  public static reverseDir(dir: Dir): Dir {
    return (dir + 180) % 360;
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
  N = 0, NE = 45, E = 90, SE = 135, S = 180, SW = 225, W = 270, NW = 315
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

  public translate(dir: Dir): Pos {
    switch (dir) {
      case Dir.N:
        return new Pos(this.x, this.y - 1);
      case Dir.NW:
        return new Pos(this.x - 1, this.y - 1);
      case Dir.W:
        return new Pos(this.x - 1, this.y);
      case Dir.NE:
        return new Pos(this.x + 1, this.y - 1);
      case Dir.E:
        return new Pos(this.x + 1, this.y);
      case Dir.SE:
        return new Pos(this.x + 1, this.y + 1);
      case Dir.SW:
        return new Pos(this.x - 1, this.y + 1);
      case Dir.S:
        return new Pos(this.x, this.y + 1);
    }
  }
}

class Box {
  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;

  constructor(private _tl: Pos, private _br: Pos) {
    this._width = _br.x - _tl.x;
    this._height = _br.y - _tl.y;
  }

  public translate(pos: Pos): Box {
    let newTl = new Pos(this._tl.x + pos.x, this._tl.y + pos.y);
    let newBr = new Pos(this._br.x + pos.x, this._br.y + pos.y);
    return new Box(newTl, newBr);
  }

  public containedIn(box: Box): boolean {
    return this.tl.x >= box.tl.x
        && this.tl.y >= box.tl.y
        && this.br.x <= box.br.x
        && this.br.y <= box.br.y;
  }

  public contains(box: Box): boolean {
    return box.containedIn(this);
  }

  public touches(box: Box): boolean {
    let a: Box = this;
    let b: Box = box;
    return b.br.x >= a.tl.x
        && b.br.y >= a.tl.y
        && b.tl.x <= a.br.x
        && b.tl.y <= a.br.y;
  }

  public intersects(box: Box): boolean {
    let a: Box = this;
    let b: Box = box;
    return b.br.x > a.tl.x
        && b.br.y > a.tl.y
        && b.tl.x < a.br.x
        && b.tl.y < a.br.y;
  }

  public shrink(): Box {
    if (_.isEqual(this._tl, this._br)) {
      throw new Error("Unable to shrink box");
    }
    return new Box(this._tl.translate(Dir.SE), this._br.translate(Dir.NW));
  }

  public get tl(): Pos {
    return this._tl;
  }

  public get br(): Pos {
    return this._br;
  }

  public get x(): number {
    return this._x;
  }

  public get y(): number {
    return this._y;
  }

  public get width(): number {
    return this._width;
  }

  public get height(): number {
    return this._height;
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
