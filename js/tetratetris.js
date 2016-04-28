var TetraTetrisGame = (function () {
    function TetraTetrisGame() {
        this.gameCanvas = document.getElementById("game");
        this.gameCanvas.width = 800;
        this.gameCanvas.height = 600;
        this.ctx = this.gameCanvas.getContext("2d");
    }
    TetraTetrisGame.prototype.start = function () {
        console.log(this.gameCanvas.toString() + "\n" + this.ctx.toString());
    };
    return TetraTetrisGame;
})();
;
var game = new TetraTetrisGame();
game.start();
//# sourceMappingURL=tetratetris.js.map