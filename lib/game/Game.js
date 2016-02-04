/* global module, Math */

var events = require('events');
var eventEmitter = new events.EventEmitter();
var User = require('./User');

var Game = function () {
    this.server = null;
    this.onlinePlayers = {};
    this.drawQueue = [];

    this.inProgress = false;
    this.word = null;
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

    this.eventBus.on('add_to_queue', function (id) {
        console.log('Game/initialize | *Internal* Adding user to the drawing queue: ', id);
        // do not queue, just start a game
        if (that.inProgress) {
            that.addToDrawingQueue(id);
        } else {
            that.startGame(id);
        }
    });

    this.eventBus.on('new_answer', function (data) {
        console.log('Game/initialize | *Internal* Checking answer');
        if (that.isCorrectAnswer(data.answer)) {

        }
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

    // remove the game if it is host
    if (this.inProgress === id) {
        console.log('Game/handleUserDisconnection | Game host left.')
        this.inProgress = false;

        this.nextPlayerTurn();
    }

    // emit to the server
    console.log('Game/handleUser | Emmiting updated list of players to the server');
    this.eventBus.emit('s_playersListUpdated', this.onlinePlayers);
};

Game.prototype.addToDrawingQueue = function (id) {
    if (this.drawQueue.indexOf(id) === -1) {
        this.drawQueue.push(id);
    } else {
        console.log('Player %s is already queued', id);
    }
};

Game.prototype.startGame = function (drawingPlayerId) {
    console.log('Game/startGame | Starting new game. The host is: ', drawingPlayerId);
    this.inProgress = '/#' + drawingPlayerId;
    this.word = this.randomWord();
    
    console.log('Word to gues is: %s', this.word);
    this.eventBus.emit('s_startNewGame', drawingPlayerId);
};

Game.prototype.nextPlayerTurn = function () {
    console.log('Game/nextPlayerTurn | Starting new game if queued');
    var currentPlayer = null;
    if (this.drawQueue.length > 0) {
        currentPlayer = this.drawQueue.pop();
    }

    this.startGame(currentPlayer);
};

Game.prototype.randomWord = function () {
    var phrases = [
        'woda mineralna',
        'zasoby ludzkie',
        'statek kosmiczny',
        'książka telefoniczna'
    ];

    return phrases[Math.floor(Math.random() * phrases.length)];
};

Game.prototype.isCorrectAnswer = function (answer) {
    if (this.word === answer) {
        console.log('Correct answer sent');
        return true;
    }
    console.log('Incorrect answer');
    return false;
};

module.exports = Game;
