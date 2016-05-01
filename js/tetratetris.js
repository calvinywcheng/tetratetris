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
        this.renderTimerID = null;
        this.TPS = 10;
        this.updateTimerID = null;
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
        this.updateTimerID = this.updateTimerID ||
            setInterval(this.update.bind(this), 1000 / this.TPS);
        this.renderTimerID = this.renderTimerID ||
            setInterval(this.render.bind(this), 1000 / this.FPS);
    };
    TetraTetrisGame.prototype.haltGameLoop = function () {
        clearInterval(this.updateTimerID);
        this.updateTimerID = null;
        clearInterval(this.renderTimerID);
        this.renderTimerID = null;
    };
    TetraTetrisGame.prototype.togglePause = function () {
        if (this.renderTimerID == null) {
            console.log("Resuming game.");
            this.startGameLoop();
        }
        else {
            console.log("Game paused.");
            this.haltGameLoop();
        }
    };
    TetraTetrisGame.prototype.reset = function () {
        console.log("Resetting game...");
        clearInterval(this.renderTimerID);
        this.renderTimerID = null;
        this.state = new GameState();
        this.render();
    };
    TetraTetrisGame.prototype.update = function () {
        var _this = this;
        var stillAlive = this._keysPressed
            .every(function (key) { return _this.state.processInput(key); });
        if (!stillAlive) {
            console.log("Game over!");
            $("#pause-game").prop("disabled", true);
            this.haltGameLoop();
            this.render();
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
        this.renderGameOver();
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
        ctx.fillText(this.state.score + "", 630, 525);
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
        this.renderTetromino(new Tetromino([withoutOffScreen]), new Pos(xOffset, yOffset));
    };
    TetraTetrisGame.prototype.renderGameOver = function () {
        if (this.state.gameOver) {
            var ctx = this.ctx;
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "black";
            var x = this.mainViewOffset.x;
            var y = this.mainViewOffset.y;
            var len = 500;
            ctx.fillRect(x, y, len, len);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            var textX = x + len / 2;
            var textY = y + len / 2;
            ctx.font = "40px Trebuchet MS";
            ctx.fillText("Game Over!", textX, textY);
            ctx.restore();
        }
    };
    TetraTetrisGame.prototype.initHandlers = function () {
        var _this = this;
        $(document).ready(function () {
            $(document).keydown(function (e) {
                var keyCode = e.which || e.keyCode;
                var key = Util.toKey(keyCode);
                if (key != null && $.inArray(key, _this._keysPressed) === -1) {
                    _this._keysPressed.push(key);
                    console.log("Key(s) pressed: " + _this._keysPressed);
                }
            });
            $(document).keyup(function (e) {
                var keyCode = e.which || e.keyCode;
                var key = Util.toKey(keyCode);
                var index = _this._keysPressed.indexOf(key);
                if (index !== -1) {
                    _this._keysPressed.splice(index, 1);
                    console.log("Key released: " + key);
                }
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
var GameState = (function () {
    function GameState() {
        this._nextDir = Dir.N;
        this._holdTetromino = null;
        this._lastRotateTime = Date.now();
        this._switched = false;
        this._score = 0;
        this._gameOver = false;
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
    GameState.prototype.swapWithHold = function () {
        if (!this._switched) {
            if (this._holdTetromino == null) {
                this._holdTetromino = this._nextTetromino;
                this.genNextTetromino();
            }
            var tmp = this._currTetromino;
            this._currTetromino = this._holdTetromino;
            this._currTetromino.setStartPos(Util.nextDir(this._nextDir, Rot.CCW));
            this._holdTetromino = tmp;
            this._switched = true;
        }
        return true;
    };
    GameState.prototype.spawnTetromino = function () {
        this._currTetromino = this._nextTetromino;
        this._currTetromino.setStartPos(this._nextDir);
        this._switched = false;
        this._nextDir = Util.nextDir(this._nextDir, Rot.CW);
        this.genNextTetromino();
    };
    GameState.prototype.processInput = function (key) {
        switch (key) {
            case "up":
            case "left":
            case "right":
            case "down":
                var dir = Util.toDir(key);
                return this.advanceBlock(dir);
            case "z":
            case "x":
                var rot = Util.toRot(key);
                return this.rotateBlock(rot);
            case "shift":
                return this.swapWithHold();
            default:
                throw new Error("Input key not implemeneted");
        }
    };
    GameState.prototype.advanceBlock = function (dir) {
        var curr = this._currTetromino;
        var nextPos = GameState.translatePos(curr.pos, dir);
        if (this.stillInBounds(curr, nextPos)) {
            if (this.isValidPos(curr, nextPos)) {
                console.log("Moving block ahead.");
                curr.pos = nextPos;
                return true;
            }
            else {
                var success = this.landTetromino(curr);
                if (success) {
                    console.log("Tetromino landed.");
                    this._score += 10;
                    this.spawnTetromino();
                    this.clearSquares();
                    return true;
                }
                else {
                    console.log("Tetromino landed out of screen.");
                    this._gameOver = true;
                    return false;
                }
            }
        }
        else {
            return true;
        }
    };
    GameState.prototype.stillInBounds = function (curr, nextPos) {
        var _this = this;
        return curr.shape.some(function (row, j) {
            return row.some(function (e, i) {
                if (e === 0) {
                    return false;
                }
                var testPos = new Pos(i + nextPos.x, j + nextPos.y);
                return _this.inGameArea(testPos);
            });
        });
    };
    GameState.prototype.isValidPos = function (curr, nextPos) {
        var _this = this;
        return curr.shape.every(function (row, j) {
            return row.every(function (e, i) {
                if (e === 0) {
                    return true;
                }
                var testPos = new Pos(i + nextPos.x, j + nextPos.y);
                return !_this.inGameArea(testPos) || _this.isClear(testPos);
            });
        });
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
    GameState.prototype.rotateBlock = function (rot) {
        if (Date.now() - this._lastRotateTime > GameState.ROTATE_DELAY) {
            var curr = this._currTetromino;
            curr.rotate(rot);
            if (this.stillInBounds(curr, curr.pos) && this.isValidPos(curr, curr.pos)) {
                console.log("Rotating block " + Rot[rot]);
            }
            else {
                curr.undoRotate(rot);
            }
            this._lastRotateTime = Date.now();
        }
        return true;
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
    Object.defineProperty(GameState.prototype, "gameOver", {
        get: function () {
            return this._gameOver;
        },
        enumerable: true,
        configurable: true
    });
    GameState.AREA_LEN = 20;
    GameState.ROTATE_DELAY = 100;
    return GameState;
}());
var Tetromino = (function () {
    function Tetromino(_rotations) {
        var _this = this;
        this._rotations = _rotations;
        this._rotation = 0;
        this._minX = Number.MAX_VALUE;
        this._maxX = Number.MIN_VALUE;
        this._minY = Number.MAX_VALUE;
        this._maxY = Number.MIN_VALUE;
        this._shape = this._rotations[0];
        this._shape.forEach(function (row, j) {
            row.forEach(function (e, i) {
                if (e !== 0) {
                    _this._minX = Math.min(_this._minX, i);
                    _this._maxX = Math.max(_this._maxX, i);
                    _this._minY = Math.min(_this._minY, j);
                    _this._maxY = Math.max(_this._maxY, j);
                }
            });
        });
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
    Tetromino.prototype.rotate = function (rot) {
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
    };
    Tetromino.prototype.undoRotate = function (rot) {
        switch (rot) {
            case Rot.CW:
                return this.rotate(Rot.CCW);
            case Rot.CCW:
                return this.rotate(Rot.CW);
            default:
                throw new Error("Rotation not defined");
        }
    };
    Tetromino.prototype.setStartPos = function (dir) {
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
    };
    Tetromino.prototype.getMidPos = function () {
        return new Pos(this._pos.x + 2, this.pos.y + 2);
    };
    return Tetromino;
}());
var ITetromino = (function (_super) {
    __extends(ITetromino, _super);
    function ITetromino() {
        var x = 1;
        _super.call(this, [[
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
    return ITetromino;
}(Tetromino));
var JTetromino = (function (_super) {
    __extends(JTetromino, _super);
    function JTetromino() {
        var x = 2;
        _super.call(this, [[
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
    return JTetromino;
}(Tetromino));
var LTetromino = (function (_super) {
    __extends(LTetromino, _super);
    function LTetromino() {
        var x = 3;
        _super.call(this, [[
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
    return LTetromino;
}(Tetromino));
var ZTetromino = (function (_super) {
    __extends(ZTetromino, _super);
    function ZTetromino() {
        var x = 4;
        _super.call(this, [[
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
    return ZTetromino;
}(Tetromino));
var STetromino = (function (_super) {
    __extends(STetromino, _super);
    function STetromino() {
        var x = 5;
        _super.call(this, [[
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
    return STetromino;
}(Tetromino));
var OTetromino = (function (_super) {
    __extends(OTetromino, _super);
    function OTetromino() {
        var x = 6;
        var square = [[0, 0, 0, 0], [0, x, x, 0], [0, x, x, 0], [0, 0, 0, 0]];
        _super.call(this, [square, square, square, square]);
    }
    return OTetromino;
}(Tetromino));
var TTetromino = (function (_super) {
    __extends(TTetromino, _super);
    function TTetromino() {
        var x = 7;
        _super.call(this, [[
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
    return TTetromino;
}(Tetromino));
var Util = (function () {
    function Util() {
        throw new Error("Cannot instantiate Util class");
    }
    Util.toDir = function (dir) {
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
    };
    Util.toRot = function (rot) {
        switch (rot) {
            case "x":
                return Rot.CW;
            case "z":
                return Rot.CCW;
            default:
                throw new Error("Rotation invalid.");
        }
    };
    Util.nextDir = function (dir, rot) {
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
    };
    Util.toKey = function (keyCode) {
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
    };
    Util.COLOURS = [null, "violet", "red", "orange", "yellow", "green", "cyan", "purple", "lightgrey"];
    return Util;
}());
var Dir;
(function (Dir) {
    Dir[Dir["N"] = 0] = "N";
    Dir[Dir["W"] = 270] = "W";
    Dir[Dir["E"] = 90] = "E";
    Dir[Dir["S"] = 180] = "S";
})(Dir || (Dir = {}));
var Rot;
(function (Rot) {
    Rot[Rot["CW"] = 90] = "CW";
    Rot[Rot["CCW"] = -90] = "CCW";
})(Rot || (Rot = {}));
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
Number.prototype.mod = function (n) {
    return ((this % n) + n) % n;
};
var game = new TetraTetrisGame();
//# sourceMappingURL=tetratetris.js.map