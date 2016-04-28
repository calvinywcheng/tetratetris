class TetraTetrisGame {

  private gameCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.gameCanvas = <HTMLCanvasElement> document.getElementById("game");
    this.gameCanvas.width = 800;
    this.gameCanvas.height = 600;
    this.ctx = this.gameCanvas.getContext("2d");
  }

  start(): void {
    console.log(this.gameCanvas.toString() + "\n" + this.ctx.toString());
  }
};

var game = new TetraTetrisGame();
game.start();