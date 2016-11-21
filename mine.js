var mineRatio = 0.1;
var BlockStatus;
(function (BlockStatus) {
    BlockStatus[BlockStatus["closed"] = 0] = "closed";
    BlockStatus[BlockStatus["opened"] = 1] = "opened";
    BlockStatus[BlockStatus["checked"] = 2] = "checked";
})(BlockStatus || (BlockStatus = {}));
var GameStatus;
(function (GameStatus) {
    GameStatus[GameStatus["Running"] = 0] = "Running";
    GameStatus[GameStatus["Finish"] = 1] = "Finish";
    GameStatus[GameStatus["Fail"] = 2] = "Fail";
})(GameStatus || (GameStatus = {}));
var Point = (function () {
    function Point(x, y) {
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
    }
    return Point;
}());
var Util = (function () {
    function Util() {
    }
    Util.randomInt = function (max) {
        return (Math.random() * max) | 0;
    };
    return Util;
}());
var Block = (function () {
    function Block() {
        this.findMines = 0;
        this.status = BlockStatus.closed;
        this.isMine = false;
        this.print = function () {
            console.log(this.status);
        };
        this.open = function () {
            this.status = BlockStatus.opened;
            this.OnStatausChange(this);
            if (this.isMine) {
                return true;
            }
        };
        this.check = function () {
            this.status = BlockStatus.checked;
            this.OnStatausChange(this);
        };
    }
    return Block;
}());
var Table = (function () {
    function Table(size) {
        var _this = this;
        this.traceElements = function (callbackFunc) {
            for (var y = 0; y < this.size.y; y++) {
                for (var x = 0; x < this.size.x; x++) {
                    callbackFunc(this.table[x][y], x, y);
                }
            }
        };
        this.getConvolution = function (x, y) {
            var results = [];
            var xpos = [x - 1, x, x + 1];
            var ypos = [y - 1, y, y + 1];
            for (var i = 0; i < xpos.length; i++) {
                for (var j = 0; j < ypos.length; j++) {
                    if (!(i == 1 && j == 1)) {
                        var x = xpos[i];
                        var y = ypos[j];
                        if (this.invalidArray(x, y))
                            results.push({ x: x, y: y });
                    }
                }
            }
            return results;
        };
        this.findBlankBlock = function (x, y) {
            var _this = this;
            var block = this.table[x][y];
            if (block.status == BlockStatus.opened) {
                return;
            }
            if (!block.isMine) {
                block.open();
            }
            if (block.findMines == 0) {
                var positions = this.getConvolution(x, y);
                positions.forEach(function (element) {
                    _this.findBlankBlock(element.x, element.y);
                });
            }
        };
        this.checkFinished = function () {
            var mineList = [];
            this.traceElements(function (block, x, y) {
                if (block.isMine)
                    mineList.push(block);
            });
            var checkedList = [];
            this.traceElements(function (block, x, y) {
                if (block.status == BlockStatus.checked || block.status == BlockStatus.closed)
                    checkedList.push(block);
            });
            if (checkedList.length == mineList.length) {
                return true;
            }
            return false;
        };
        this.checkMineCount = function (x, y) {
            var _this = this;
            var xpos = [x - 1, x, x + 1];
            var ypos = [y - 1, y, y + 1];
            if (!this.table[x][y].isMine) {
                return;
            }
            var positions = this.getConvolution(x, y);
            positions.forEach(function (element) {
                _this.table[element.x][element.y].findMines++;
            });
        };
        this.invalidArray = function (x, y) {
            if (x < 0 || x > this.size.x - 1 || y < 0 || y > this.size.y - 1)
                return false;
            else
                return true;
        };
        this.print = function () {
            for (var i = 0; i < this.size.x; i++) {
                for (var j = 0; j < this.size.y; j++) {
                    console.log(this.table[i][j].findMines);
                }
            }
        };
        this.size = size;
        this.table = [];
        for (var i = 0; i < size.x; i++) {
            this.table[i] = [];
            for (var j = 0; j < size.y; j++) {
                this.table[i][j] = new Block();
            }
        }
        var points = [];
        var mineMaxCount = (size.x * size.y * mineRatio) | 0;
        var mine = 0;
        while (mineMaxCount > mine) {
            var pos = new Point(Util.randomInt(size.x), Util.randomInt(size.y));
            var duplicated = false;
            points.forEach(function (obj, int) {
                if (pos.x == obj.x && pos.y == obj.y)
                    duplicated = true;
            });
            if (!duplicated) {
                points[mine] = pos;
                mine++;
            }
        }
        points.forEach(function (element) {
            _this.table[element.x][element.y].isMine = true;
        });
        for (var i = 0; i < size.x; i++) {
            for (var j = 0; j < size.y; j++) {
                this.checkMineCount(i, j);
            }
        }
    }
    return Table;
}());
var World = (function () {
    function World() {
        this.status = GameStatus.Running;
        this.elementMap = [];
        this.attachElement = function (element, x, y) {
            var block = this.map.table[x][y];
            block.position = new Point(x, y);
            block.OnStatausChange = this.statusChange.bind(this);
            element.setAttribute("class", "block");
            element.addEventListener("click", function (evt) {
                this.onClick(block, evt);
            }.bind(this));
        };
    }
    World.prototype.init = function (element) {
        var tableSize = new Point(8, 8);
        this.map = new Table(tableSize);
        for (var i = 0; i < tableSize.y; i++) {
            this.elementMap[i] = [];
        }
        var tableEl = document.createElement("table");
        tableEl.setAttribute("class", "minefinder");
        for (var j = 0; j < tableSize.y; j++) {
            var th = document.createElement("tr");
            for (var i = 0; i < tableSize.x; i++) {
                var td = document.createElement("td");
                this.attachElement(td, j, i);
                th.appendChild(td);
                this.elementMap[j][i] = td;
            }
            tableEl.appendChild(th);
        }
        var el = document.body.appendChild(tableEl);
        element.appendChild(tableEl);
    };
    World.prototype.statusChange = function (block) {
        var element = this.elementMap[block.position.x][block.position.y];
        switch (block.status) {
            case BlockStatus.opened:
                if (block.isMine) {
                    var statusclass = "mine";
                }
                else if (block.findMines == 0) {
                    var statusclass = BlockStatus[block.status];
                }
                else {
                    var statusclass = BlockStatus[block.status];
                    var text = document.createTextNode(block.findMines + '');
                    element.appendChild(text);
                }
                element.setAttribute("class", "block " + statusclass);
                break;
            case BlockStatus.checked: {
                var statusclass = BlockStatus[block.status];
                element.setAttribute("class", "block " + statusclass);
                break;
            }
        }
    };
    World.prototype.onClick = function (element, evt) {
        switch (evt.button) {
            case 0:
                if (element.findMines == 0 && !element.isMine) {
                    this.map.findBlankBlock(element.position.x, element.position.y);
                }
                else {
                    var result = element.open();
                    if (result) {
                        this.Failed(element);
                    }
                }
                break;
            case 1:
                element.check();
                break;
        }
        if (this.map.checkFinished()) {
            this.Finished();
        }
    };
    World.prototype.Failed = function (block) {
        this.status == GameStatus.Fail;
    };
    World.prototype.Finished = function () {
        this.status == GameStatus.Finish;
        console.log("Finish");
    };
    return World;
}());
function run() {
    var world = new World();
    world.init(document.getElementById("container"));
}
