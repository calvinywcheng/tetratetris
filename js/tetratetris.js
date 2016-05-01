/// <reference path="jquery.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TetraTetrisGame = (function () {
    function TetraTetrisGame() {
        this.BLOCK_SIZE = 25;
        this.FPS = 30;
        this.INPUT_RATE = 5;
        this.prevInputTime = Date.now();
        this.BLOCK_RATE = 10;
        this.prevBlockTime = Date.now();
        this.gameLoopTimerID = null;
        this.state = new GameState();
        this.mainViewOffset = new Pos(50, 50);
        this.nextBlockOffset = new Pos(600, 50);
        this.holdQueueOffset = new Pos(600, 250);
        this._keysPressed = [];
        this._gameCanvas = document.getElementById("game-canvas");
        this.BG_IMG = new Image();
        this.BG_IMG.src = "images/tetris-bg.jpg";
        this.WIDTH = this._gameCanvas.width;
        this.HEIGHT = this._gameCanvas.height;
        this.ctx = this._gameCanvas.getContext("2d");
        this.initHandlers();
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
        this.gameLoopTimerID = null;
        this.state = new GameState();
        this.render();
    };
    TetraTetrisGame.prototype.update = function () {
        var _this = this;
        if (Date.now() - this.prevInputTime > 1000 / this.INPUT_RATE) {
            this._keysPressed
                .map(function (k) { return Util.toKey(k); })
                .forEach(function (key) { return _this.state.processInput(key); });
            this.prevInputTime = Date.now();
        }
        if (Date.now() - this.prevBlockTime > 1000 / this.BLOCK_RATE) {
            console.log("move block");
            var stillAlive = this.state.advanceBlock();
            if (stillAlive) {
                this.prevBlockTime = Date.now();
            }
            else {
                $("#pause-game").prop("disabled", true);
                clearInterval(this.gameLoopTimerID);
            }
        }
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
    };
    TetraTetrisGame.prototype.renderGameState = function () {
        this.renderNext();
        this.renderHold();
        this.renderBlocks();
        this.renderCurrent();
        this.renderScore();
    };
    TetraTetrisGame.prototype.renderNext = function () {
        var tetromino = this.state.nextTetromino;
        if (tetromino != null) {
            var x = this.nextBlockOffset.x + 25;
            var y = this.nextBlockOffset.y + 45;
            this.renderTetromino(tetromino, new Pos(x, y));
        }
    };
    TetraTetrisGame.prototype.renderHold = function () {
        var tetromino = this.state.holdTetromino;
        if (tetromino != null) {
            var x = this.holdQueueOffset.x + 25;
            var y = this.holdQueueOffset.y + 45;
            this.renderTetromino(tetromino, new Pos(x, y));
        }
    };
    TetraTetrisGame.prototype.renderTetromino = function (tetromino, offset) {
        var _this = this;
        var ctx = this.ctx;
        ctx.save();
        tetromino.shape.forEach(function (row, j) {
            row.forEach(function (e, i) {
                if (e !== 0) {
                    var x = i * _this.BLOCK_SIZE + offset.x;
                    var y = j * _this.BLOCK_SIZE + offset.y;
                    ctx.fillStyle = Util.COLOURS[e];
                    ctx.fillRect(x, y, _this.BLOCK_SIZE, _this.BLOCK_SIZE);
                    ctx.strokeRect(x, y, _this.BLOCK_SIZE, _this.BLOCK_SIZE);
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
        landed.forEach(function (row, j) {
            row.forEach(function (e, i) {
                if (e !== 0) {
                    var x = i * BLOCK_SIZE + offset.x;
                    var y = j * BLOCK_SIZE + offset.y;
                    ctx.fillStyle = Util.COLOURS[e];
                    ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
        ctx.restore();
    };
    TetraTetrisGame.prototype.renderCurrent = function () {
        var curr = this.state.currTetromino;
        var xOffset = curr.pos.x * this.BLOCK_SIZE + this.mainViewOffset.x;
        var yOffset = curr.pos.y * this.BLOCK_SIZE + this.mainViewOffset.y;
        var withoutOffScreen = curr.shape.map(function (row, j) {
            return row.map(function (e, i) {
                var x = i + curr.pos.x;
                var y = j + curr.pos.y;
                return (x.between(0, 19, true) && y.between(0, 19, true)) ? e : 0;
            });
        });
        this.renderTetromino(new Tetromino(withoutOffScreen), new Pos(xOffset, yOffset));
    };
    TetraTetrisGame.prototype.initHandlers = function () {
        var _this = this;
        $(document).ready(function () {
            $(document).keydown(function (e) {
                var keyCode = e.which || e.keyCode;
                if ($.inArray(keyCode, _this._keysPressed) === -1) {
                    _this._keysPressed.push(keyCode);
                    console.log("Key(s) pressed: " + _this._keysPressed.map(Util.toKey));
                }
            });
            $(document).keyup(function (e) {
                var keyCode = e.which || e.keyCode;
                var index = _this._keysPressed.indexOf(keyCode);
                if (index !== -1) {
                    _this._keysPressed.splice(index, 1);
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
                $("#start-game").prop("disabled", false);
                game.reset();
            });
        });
    };
    return TetraTetrisGame;
}());
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
    };
    GameState.prototype.processInput = function (key) {
        // TODO
    };
    GameState.prototype.advanceBlock = function () {
        var _this = this;
        var curr = this._currTetromino;
        var dir = GameState.getDir(curr.pos);
        var nextPos = GameState.translatePos(curr.pos, dir);
        var canAdvance = curr.shape.every(function (row, j) {
            return row.every(function (e, i) {
                if (e === 0) {
                    return true;
                }
                var testPos = new Pos(i + nextPos.x, j + nextPos.y);
                console.log("Checking pos and clear of " + testPos.x + " " + testPos.y);
                return !_this.inGameArea(testPos) || _this.isClear(testPos);
            });
        });
        if (canAdvance) {
            console.log("Moving block ahead.");
            curr.pos = nextPos;
            return true;
        }
        else {
            console.log("Tetromino cannot go further; landing.");
            var success = this.landTetromino(curr);
            if (success) {
                console.log("Tetromino landed.");
                this.spawnTetromino();
                this.clearSquares();
                return true;
            }
            else {
                console.log("Tetromino landed out of screen.");
                return false;
            }
        }
    };
    GameState.getDir = function (pos) {
        var x = pos.x - 8;
        var y = 8 - pos.y;
        if (y > Math.abs(x)) {
            return Dir.S;
        }
        else if (y < -Math.abs(x)) {
            return Dir.N;
        }
        else if (y >= x && y <= -x) {
            return Dir.E;
        }
        else if (y >= -x && y <= x) {
            return Dir.W;
        }
        else {
            throw new Error("Direction unable to be calculated.");
        }
    };
    GameState.translatePos = function (pos, dir) {
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
    };
    GameState.prototype.inGameArea = function (pos) {
        var len = this._landed.length;
        console.log("0" + " <= " + pos.x + ", " + pos.y + " " + len);
        var checkX = pos.x.between(0, len - 1, true);
        return checkX && pos.y.between(0, len - 1, true);
    };
    GameState.prototype.isClear = function (pos) {
        return this.landed[pos.y][pos.x] === 0;
    };
    GameState.prototype.landTetromino = function (tetromino) {
        var _this = this;
        var pos = tetromino.pos;
        return tetromino.shape.every(function (row, j) {
            return row.every(function (e, i) {
                if (e === 0) {
                    return true;
                }
                else {
                    var blockPos = new Pos(i + pos.x, j + pos.y);
                    if (_this.inGameArea(blockPos) && _this.isClear(blockPos)) {
                        _this.landed[blockPos.y][blockPos.x] = e;
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            });
        });
    };
    GameState.prototype.clearSquares = function () {
        // TODO
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
}());
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
}());
var ITetromino = (function (_super) {
    __extends(ITetromino, _super);
    function ITetromino() {
        var x = 1;
        _super.call(this, [[0, 0, 0, 0], [x, x, x, x], [0, 0, 0, 0], [0, 0, 0, 0]]);
    }
    return ITetromino;
}(Tetromino));
var JTetromino = (function (_super) {
    __extends(JTetromino, _super);
    function JTetromino() {
        var x = 2;
        _super.call(this, [[0, 0, x, 0], [0, 0, x, 0], [0, x, x, 0], [0, 0, 0, 0]]);
    }
    return JTetromino;
}(Tetromino));
var LTetromino = (function (_super) {
    __extends(LTetromino, _super);
    function LTetromino() {
        var x = 3;
        _super.call(this, [[0, x, 0, 0], [0, x, 0, 0], [0, x, x, 0], [0, 0, 0, 0]]);
    }
    return LTetromino;
}(Tetromino));
var ZTetromino = (function (_super) {
    __extends(ZTetromino, _super);
    function ZTetromino() {
        var x = 4;
        _super.call(this, [[0, 0, 0, 0], [x, x, 0, 0], [0, x, x, 0], [0, 0, 0, 0]]);
    }
    return ZTetromino;
}(Tetromino));
var STetromino = (function (_super) {
    __extends(STetromino, _super);
    function STetromino() {
        var x = 5;
        _super.call(this, [[0, 0, 0, 0], [0, 0, x, x], [0, x, x, 0], [0, 0, 0, 0]]);
    }
    return STetromino;
}(Tetromino));
var OTetromino = (function (_super) {
    __extends(OTetromino, _super);
    function OTetromino() {
        var x = 6;
        _super.call(this, [[0, 0, 0, 0], [0, x, x, 0], [0, x, x, 0], [0, 0, 0, 0]]);
    }
    return OTetromino;
}(Tetromino));
var TTetromino = (function (_super) {
    __extends(TTetromino, _super);
    function TTetromino() {
        var x = 7;
        _super.call(this, [[0, 0, 0, 0], [0, x, 0, 0], [x, x, x, 0], [0, 0, 0, 0]]);
    }
    return TTetromino;
}(Tetromino));
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
    Util.COLOURS = [null, "violet", "red", "orange", "yellow", "green", "cyan", "purple", "lightgrey"];
    return Util;
}());
var Pos = (function () {
    function Pos(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    Object.defineProperty(Pos.prototype, "x", {
        get: function () {
            return this._x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Pos.prototype, "y", {
        get: function () {
            return this._y;
        },
        enumerable: true,
        configurable: true
    });
    Pos.prototype.toTuple = function () {
        return [this._x, this._y];
    };
    return Pos;
}());
Number.prototype.between = function (a, b, inc) {
    var min = Math.min(a, b);
    var max = Math.max(a, b);
    return inc ? min <= this && this <= max : min < this && this < max;
};
var game = new TetraTetrisGame();
//# sourceMappingURL=tetratetris.js.map