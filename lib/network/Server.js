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
        console.log('Server/handleClientEvents | New client connected');

        // send an event to the Game object
        console.log('Server/handleClientEvents | Emmiting internal event about new connection');
        that.eventBus.emit('player_connected', socket);

        socket.on('disconnect', function () {
            console.log('Server/handleClientEvents | Client disconnected');
            that.eventBus.emit('player_disconnected', socket.id);
        });
        
        socket.on('new_answer', function (data) {
            console.log('Server/handleClientEvents | New answer');
            that.eventBus.emit('new_answer', data);
        });
        
        socket.on('correct_answer', function (playerId) {
            console.log('Server/handleClientEvents | Correct answer got by server');
            that.app.io.emit('correct_answer', playerId);
        });
        


        socket.on('new_game', function (players) {

        });

        socket.on('send_image', function (image) {
            //console.log('Server/handleClientEvents | New image is available');
            that.app.io.emit('image_updated', image);
        });
        
        socket.on('add_to_queue', function (player) {
            console.log('Server/handleClientEvents | User wants to draw');
            that.eventBus.emit('add_to_queue', player);
        });
        
        
    });
};

// handle events emitted by the Game
Server.prototype.handleGameEvents = function () {
    var that = this;


    this.eventBus.on('s_playersListUpdated', function (players) {
        console.log('Server/handleGameEvents | Redraw request handled from an internal class');
        that.emitPlayersListRedraw(players);
    });  
  
    this.eventBus.on('s_startNewGame', function (gameHost) {
        console.log('Server/handleGameEvents | Game instance started a new game (host: %s).', gameHost);
        that.emitNewGame(gameHost);
    });  
};

Server.prototype.emitPlayersListRedraw = function (players) {
    var that = this;

    console.log('Sending request for redraw to all clients', players);
    that.app.io.emit('playersListUpdated', players);
};

Server.prototype.emitNewGame = function (gameHost) {
    var that = this;

    console.log('Sending request for start the game to all clients', gameHost);
    that.app.io.emit('newGame', gameHost);
};


module.exports = Server;
