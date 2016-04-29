/// <reference path="jquery.d.ts" />
var TetraTetrisGame = (function () {
    function TetraTetrisGame() {
        this.FPS = 30;
        this.INPUT_RATE = 5;
        this.BLOCK_RATE = 1;
        this.gameLoopTimerID = null;
        this.gameCanvas = document.getElementById("game-canvas");
        this.ctx = this.gameCanvas.getContext("2d");
        UserInput.getInstance().initHandlers(this);
    }
    TetraTetrisGame.prototype.startGameLoop = function () {
        var _this = this;
        console.log("Starting game loop at + " + this.FPS + " FPS...");
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
        console.log("rendering");
    };
    return TetraTetrisGame;
})();
;
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
new TetraTetrisGame();
//# sourceMappingURL=tetratetris.js.map