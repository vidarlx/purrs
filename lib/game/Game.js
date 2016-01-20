var events = require('events');
var eventEmitter = new events.EventEmitter();
var User = require('./User');

var Game = function () {
    this.server = null;
    this.onlinePlayers = {};

};

Game.prototype.setServer = function (server) {
    this.server = server;
    this.eventBus = server.eventBus;
};

Game.prototype.initialize = function () {
    var that = this;

    this.eventBus.on('player_connected', function (user) {
        console.log('Game/initialize | *Internal* User connection handling');
        that.handleUserConnection(user);
    });
    
    this.eventBus.on('player_disconnected', function (id) {
        console.log('Game/initialize | *Internal* User disconnection handling');
        that.handleUserDisconnection(id);
    });
};

Game.prototype.handleUserConnection = function (userNetworkData) {
    var id = userNetworkData.id;
    var user = new User();

    this.onlinePlayers[id] = user;
    
    // emit to the server
    console.log('Game/handleUser | Emmiting updated list of players to the server');
    this.eventBus.emit('s_playersListUpdated', this.onlinePlayers);
};

Game.prototype.handleUserDisconnection = function (id) {
    delete this.onlinePlayers[id];
    
    // emit to the server
    console.log('Game/handleUser | Emmiting updated list of players to the server');
    this.eventBus.emit('s_playersListUpdated', this.onlinePlayers);
};

module.exports = Game;