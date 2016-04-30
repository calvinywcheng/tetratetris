/// <reference path="jquery.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TetraTetrisGame = (function () {
    function TetraTetrisGame() {
        this.FPS = 30;
        this.INPUT_RATE = 5;
        this.BLOCK_RATE = 1;
        this.gameLoopTimerID = null;
        this.state = new GameState();
        this.mainViewOffset = [50, 50];
        this.nextBlockOffset = [600, 50];
        this.holdQueueOffset = [600, 250];
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
        if (this.gameLoopTimerID === null) {
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
        var ctx = this.ctx;
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
    };
    TetraTetrisGame.prototype.renderGameState = function () {
        this.renderNext();
        this.renderHold();
        this.renderScore();
        this.renderBlocks();
    };
    TetraTetrisGame.prototype.renderNext = function () {
        var tetromino = this.state.nextTetromino;
        if (tetromino != null) {
            var x = this.nextBlockOffset[0] + 25;
            var y = this.nextBlockOffset[1] + 45;
            this.renderTetromino(tetromino, [x, y]);
        }
    };
    TetraTetrisGame.prototype.renderHold = function () {
        var tetromino = this.state.holdTetromino;
        if (tetromino != null) {
            var x = this.holdQueueOffset[0] + 25;
            var y = this.holdQueueOffset[1] + 45;
            this.renderTetromino(tetromino, [x, y]);
        }
    };
    TetraTetrisGame.prototype.renderTetromino = function (tetromino, offset) {
        var ctx = this.ctx;
        var BLOCK_SIZE = 25;
        ctx.save();
        tetromino.shape.forEach(function (row, i) {
            row.forEach(function (e, j) {
                if (e != 0) {
                    var x = j * BLOCK_SIZE + offset[0];
                    var y = i * BLOCK_SIZE + offset[1];
                    ctx.fillStyle = Util.COLOURS[e];
                    ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
        ctx.restore();
    };
    TetraTetrisGame.prototype.renderScore = function () {
        var ctx = this.ctx;
        ctx.save();
        ctx.font = "50px Trebuchet MS";
        var score = this.state.score;
        ctx.fillText(score + "", 630, 525);
        ctx.restore();
    };
    TetraTetrisGame.prototype.renderBlocks = function () {
        var ctx = this.ctx;
        var landed = this.state.landed;
        var offset = this.mainViewOffset;
        var BLOCK_SIZE = 25;
        ctx.save();
        for (var i = 0; i < GameState.AREA_LEN; i++) {
            for (var j = 0; j < GameState.AREA_LEN; j++) {
                if (landed[i][j] >= 1 && landed[i][j] <= 8) {
                    var x = j * BLOCK_SIZE + offset[0];
                    var y = i * BLOCK_SIZE + offset[1];
                    ctx.fillStyle = Util.COLOURS[landed[i][j]];
                    ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
        ctx.restore();
    };
    return TetraTetrisGame;
})();
var UserInput = (function () {
    function UserInput() {
        this.keysPressed = new Array();
    }
    UserInput.getInstance = function () {
        if (this.instance === null) {
            this.instance = new UserInput();
        }
        return this.instance;
    };
    UserInput.prototype.initHandlers = function (game) {
        var _this = this;
        $(document).ready(function () {
            $(document).keydown(function (e) {
                var keyCode = e.which || e.keyCode;
                if ($.inArray(keyCode, _this.keysPressed) === -1) {
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
        this._nextDir = Dir.N;
        this._holdTetromino = null;
        this._switched = false;
        this._score = 0;
        this.initLandedArr();
        this.genNextTetromino();
        this.spawnTetromino();
    }
    GameState.prototype.initLandedArr = function () {
        var AREA_LEN = GameState.AREA_LEN;
        this._landed = new Array(AREA_LEN);
        for (var i = 0; i < this._landed.length; i++) {
            this._landed[i] = new Array(AREA_LEN);
            for (var j = 0; j < this._landed[i].length; j++) {
                this._landed[i][j] = 0;
            }
        }
        this._landed[9][9] = 8;
        this._landed[9][10] = 8;
        this._landed[10][9] = 8;
        this._landed[10][10] = 8;
    };
    GameState.prototype.genNextTetromino = function () {
        var rand = Math.floor(Math.random() * 7) + 1;
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
    };
    GameState.prototype.spawnTetromino = function () {
        this._currTetromino = this._nextTetromino;
        switch (this._nextDir) {
            case Dir.N:
                this._currTetromino.pos = [8, -4];
                this._nextDir = Dir.E;
                break;
            case Dir.W:
                this._currTetromino.pos = [-4, 8];
                this._nextDir = Dir.N;
                break;
            case Dir.E:
                this._currTetromino.pos = [19, 8];
                this._nextDir = Dir.S;
                break;
            case Dir.S:
                this.currTetromino.pos = [8, 19];
                this._nextDir = Dir.W;
                break;
        }
        this.genNextTetromino();
    };
    GameState.prototype.getInput = function (key) {
        // TODO
    };
    GameState.prototype.advanceBlock = function () {
        var curr = this._currTetromino;
        var dir = this.getDir(curr.pos);
        curr.shape.map(function (row) { return row.filter(function (v) { return v != 0; }); });
        return false;
    };
    GameState.prototype.getDir = function (position) {
        var dx = position[0] - 8;
        var dy = position[1] - 8;
        if (dy >= dx && dy >= -dx) {
            return Dir.S;
        }
        else if (dy) {
        }
    };
    Object.defineProperty(GameState.prototype, "score", {
        get: function () {
            return this._score;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameState.prototype, "landed", {
        get: function () {
            return this._landed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameState.prototype, "currTetromino", {
        get: function () {
            return this._currTetromino;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameState.prototype, "nextTetromino", {
        get: function () {
            return this._nextTetromino;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameState.prototype, "holdTetromino", {
        get: function () {
            return this._holdTetromino;
        },
        enumerable: true,
        configurable: true
    });
    GameState.AREA_LEN = 20;
    return GameState;
})();
var Tetromino = (function () {
    function Tetromino(_shape) {
        this._shape = _shape;
    }
    Object.defineProperty(Tetromino.prototype, "shape", {
        get: function () {
            return this._shape;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Tetromino.prototype, "pos", {
        get: function () {
            return this._pos;
        },
        set: function (pos) {
            this._pos = pos;
        },
        enumerable: true,
        configurable: true
    });
    return Tetromino;
})();
var ITetromino = (function (_super) {
    __extends(ITetromino, _super);
    function ITetromino() {
        var x = 1;
        _super.call(this, [
            [0, 0, 0, 0],
            [x, x, x, x],
            [0, 0, 0, 0],
            [0, 0, 0, 0]]);
    }
    return ITetromino;
})(Tetromino);
var JTetromino = (function (_super) {
    __extends(JTetromino, _super);
    function JTetromino() {
        var x = 2;
        _super.call(this, [
            [0, 0, x, 0],
            [0, 0, x, 0],
            [0, x, x, 0],
            [0, 0, 0, 0]]);
    }
    return JTetromino;
})(Tetromino);
var LTetromino = (function (_super) {
    __extends(LTetromino, _super);
    function LTetromino() {
        var x = 3;
        _super.call(this, [
            [0, x, 0, 0],
            [0, x, 0, 0],
            [0, x, x, 0],
            [0, 0, 0, 0]]);
    }
    return LTetromino;
})(Tetromino);
var ZTetromino = (function (_super) {
    __extends(ZTetromino, _super);
    function ZTetromino() {
        var x = 4;
        _super.call(this, [
            [0, 0, 0, 0],
            [x, x, 0, 0],
            [0, x, x, 0],
            [0, 0, 0, 0]]);
    }
    return ZTetromino;
})(Tetromino);
var STetromino = (function (_super) {
    __extends(STetromino, _super);
    function STetromino() {
        var x = 5;
        _super.call(this, [
            [0, 0, 0, 0],
            [0, 0, x, x],
            [0, x, x, 0],
            [0, 0, 0, 0]]);
    }
    return STetromino;
})(Tetromino);
var OTetromino = (function (_super) {
    __extends(OTetromino, _super);
    function OTetromino() {
        var x = 6;
        _super.call(this, [
            [0, 0, 0, 0],
            [0, x, x, 0],
            [0, x, x, 0],
            [0, 0, 0, 0]]);
    }
    return OTetromino;
})(Tetromino);
var TTetromino = (function (_super) {
    __extends(TTetromino, _super);
    function TTetromino() {
        var x = 7;
        _super.call(this, [
            [0, 0, 0, 0],
            [0, x, 0, 0],
            [x, x, x, 0],
            [0, 0, 0, 0]]);
    }
    return TTetromino;
})(Tetromino);
var Util = (function () {
    function Util() {
        throw new Error("Cannot instantiate Util class");
    }
    Util.toKey = function (keyCode) {
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
    };
    Util.COLOURS = [
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
    return Util;
})();
var game = new TetraTetrisGame();
//# sourceMappingURL=tetratetris.js.map