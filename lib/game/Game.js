var events = require('events');
var eventEmitter = new events.EventEmitter();
var User = require('./User');

var Game = function () {
    this.server = null;
    this.onlinePlayers = [];

};

Game.prototype.setServer = function (server) {
    this.server = server;
    this.eventBus = server.eventBus;
};

Game.prototype.initialize = function () {
    var that = this;

    this.eventBus.on('player_connected', function (user) {
        that.handleUser(user);
    });
};

Game.prototype.handleUser = function (userNetworkData) {
    var id = userNetworkData.id;
    var user = new User();
    ;
    this.onlinePlayers[id] = {
        user: user,
        socket: userNetworkData
    };
    
    this.eventBus.emit('playersListUpdated', this.onlinePlayers);
};

module.exports = Game;