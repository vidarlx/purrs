var Game = function () {
    this.server = null;
};

Game.prototype.setServer = function (server) {
    this.server = server;
};

module.exports = Game;