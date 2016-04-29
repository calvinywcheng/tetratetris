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
  private BLOCK_RATE: number = 1;
  private gameLoopTimerID: number = null;

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
    this.renderScore();
  }

  private renderHUD(): void {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    this.ctx.globalAlpha = 0.8;
    this.ctx.fillStyle = "#f1f1f1";
    this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    this.ctx.globalAlpha = 0.8;
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(50, 50, 500, 500);
    this.ctx.fillRect(600, 50, 150, 150);
    this.ctx.fillRect(600, 250, 150, 150);
    this.ctx.fillStyle = "#f1f1f1";
    this.ctx.fillRect(600, 450, 150, 100);
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(600, 450, 150, 100);
    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "18px Trebuchet MS";
    this.ctx.fillText("Score:", 610, 470);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillText("Next Tetromino", 610, 70);
    this.ctx.fillText("Hold Queue", 610, 270);
    this.ctx.restore();
  }

  private renderScore(): void {

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
  private landed: number[];
  private nextDir: Dir;
  private currTetromino: Tetromino;
  private nextTetromino: Tetromino;
  private holdTetromino: Tetromino;

}

interface Renderable {
  render(ctx: CanvasRenderingContext2D): void;
}

class Tetromino implements Renderable {
  render(ctx: CanvasRenderingContext2D): void {
    throw new Error("Tetromino is an abstract class.");
  }
}

namespace Util {
  export function toKey(keyCode: number): string {
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
