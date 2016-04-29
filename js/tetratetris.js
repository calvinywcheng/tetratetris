/// <reference path="jquery.d.ts" />
var TetraTetrisGame = (function () {
    function TetraTetrisGame() {
        this.FPS = 30;
        this.INPUT_RATE = 5;
        this.BLOCK_RATE = 1;
        this.gameLoopTimerID = null;
        this.state = new GameState();
        this.gameCanvas = document.getElementById("game-canvas");
        this.BG_IMG = new Image();
        this.BG_IMG.src = "images/tetris-bg.jpg";
        this.WIDTH = this.gameCanvas.width;
        this.HEIGHT = this.gameCanvas.height;
        this.ctx = this.gameCanvas.getContext("2d");
        UserInput.getInstance().initHandlers(this);
        this.render();
    }
    TetraTetrisGame.prototype.startGameLoop = function () {
        var _this = this;
        console.log("Starting game loop at " + this.FPS + " FPS...");
        this.gameLoopTimerID = this.gameLoopTimerID || setInterval(function () {
            _this.update();
            _this.render();
        }, 1000 / this.FPS);
    };
    TetraTetrisGame.prototype.togglePause = function () {
        if (this.gameLoopTimerID == null) {
            console.log("Resuming game.");
            this.startGameLoop();
        }
        else {
            console.log("Game paused.");
            clearInterval(this.gameLoopTimerID);
            this.gameLoopTimerID = null;
        }
    };
    TetraTetrisGame.prototype.reset = function () {
        console.log("Resetting game...");
        clearInterval(this.gameLoopTimerID);
    };
    TetraTetrisGame.prototype.update = function () {
        console.log("updating");
    };
    TetraTetrisGame.prototype.render = function () {
        this.renderHUD();
        this.renderGameState();
    };
    TetraTetrisGame.prototype.renderHUD = function () {
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
    };
    TetraTetrisGame.prototype.renderGameState = function () {
        this.renderNext();
        this.renderHold();
        this.renderScore();
    };
    TetraTetrisGame.prototype.renderNext = function () {
        // TODO
    };
    TetraTetrisGame.prototype.renderHold = function () {
        // TODO
    };
    TetraTetrisGame.prototype.renderScore = function () {
        this.ctx.save();
        this.ctx.font = "50px Trebuchet MS";
        var score = this.state.getScore();
        this.ctx.fillText(score + "", 630, 525);
        this.ctx.restore();
    };
    return TetraTetrisGame;
})();
var UserInput = (function () {
    function UserInput() {
        this.keysPressed = new Array();
    }
    UserInput.getInstance = function () {
        if (this.instance == null) {
            this.instance = new UserInput();
        }
        return this.instance;
    };
    UserInput.prototype.initHandlers = function (game) {
        var _this = this;
        $(document).ready(function () {
            $(document).keydown(function (e) {
                var keyCode = e.which || e.keyCode;
                if ($.inArray(keyCode, _this.keysPressed) == -1) {
                    _this.keysPressed.push(keyCode);
                    console.log("Key(s) pressed: " + _this.keysPressed.map(Util.toKey));
                }
            });
            $(document).keyup(function (e) {
                var keyCode = e.which || e.keyCode;
                var index = _this.keysPressed.indexOf(keyCode);
                if (index != -1) {
                    _this.keysPressed.splice(index, 1);
                }
                console.log("Key released: " + Util.toKey(keyCode));
            });
            $("#start-game").click(function () {
                $("#start-game").prop("disabled", true);
                $("#pause-game").prop("disabled", false);
                game.startGameLoop();
            });
            $("#pause-game").click(function () {
                game.togglePause();
            });
            $("#reset-game").click(function () {
                game.reset();
            });
        });
    };
    return UserInput;
})();
var Dir;
(function (Dir) {
    Dir[Dir["N"] = 0] = "N";
    Dir[Dir["W"] = 1] = "W";
    Dir[Dir["E"] = 2] = "E";
    Dir[Dir["S"] = 3] = "S";
})(Dir || (Dir = {}));
var GameState = (function () {
    function GameState() {
        this.nextDir = Dir.N;
        this.currTetromino = null;
        this.holdTetromino = null;
        this.score = 0;
        this.initLandedArr();
        this.genNextTetromino();
    }
    GameState.prototype.initLandedArr = function () {
        var AREA_LEN = 20;
        this.landed = new Array(AREA_LEN);
        for (var i = 0; i < this.landed.length; i++) {
            this.landed[i] = new Array(AREA_LEN);
            for (var j = 0; j < this.landed[i].length; j++) {
                this.landed[i][j] = 0;
            }
        }
        this.landed[9][9] = -1;
        this.landed[9][10] = -1;
        this.landed[10][9] = -1;
        this.landed[10][10] = -1;
    };
    GameState.prototype.genNextTetromino = function () {
        var rand = Math.floor(Math.random() * 7);
        // TODO
    };
    GameState.prototype.getScore = function () {
        return this.score;
    };
    return GameState;
})();
var Tetromino = (function () {
    function Tetromino() {
    }
    Tetromino.prototype.render = function (ctx) {
        throw new Error("Tetromino is an abstract class.");
    };
    return Tetromino;
})();
var Util;
(function (Util) {
    function toKey(keyCode) {
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
    Util.toKey = toKey;
})(Util || (Util = {}));
var game = new TetraTetrisGame();
//# sourceMappingURL=tetratetris.js.map