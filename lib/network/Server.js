/* global module */

var express = require('express');
var io = require('socket.io');

var events = require('events');

var Server = function () {  
    this.app = express();
    this.app.io = io();

    this.server = this.app.listen(3400, this.run.bind(this));
    this.eventBus = new events.EventEmitter();
};

Server.prototype.run = function () {
    var host = this.server.address().address;
    var port = this.server.address().port;

    this.app.io.attach(this.server);

    console.log('Wordf server is running at http://%s:%s', host, port);

    this.app.use(express.static('static'));
    this.handleClientEvents();
    this.handleGameEvents();
};

// handle events emitted by the client
Server.prototype.handleClientEvents = function () {
    var that = this;

    this.app.io.on('connection', function (socket) {
        console.log('New client connected');
        
        // send an event to the Game object
        that.eventBus.emit('player_connected', socket);

        socket.on('disconnect', function () {
            that.eventBus.emit('player_disconnected', socket);
        });

        socket.on('any_event', function (msg) {
            console.log('disconnected');

            that.app.io.emit('another_event', 'test');
        });
    });
};

// handle events emitted by the Game
Server.prototype.handleGameEvents = function () {
    var that = this;
    
    this.eventBus.on('playersListUpdated', function (players) {
        that.emitPlayersListRedraw(players);
    });
};

Server.prototype.emitPlayersListRedraw = function (players) {
    var that = this;
    
    console.log('Sending request for redraw to all players');
    that.app.io.emit('playersListUpdated', { players: players });
};

module.exports = Server;
