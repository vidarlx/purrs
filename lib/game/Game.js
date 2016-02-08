/* global module, Math */
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var User = require('./User');

var idleTimer = null;
var h_gameTimer = null;

var Game = function () {
    this.server = null;
    this.onlinePlayers = {};
    this.drawQueue = [];

    this.inProgress = false;
    this.word = null;
    this.timer = null;
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

    this.eventBus.on('change_name', function (data) {
        console.log('Game/initialize | *Internal* Changing user\'s name: ', data.id);
        if (that.onlinePlayers.hasOwnProperty('/#' + data.id)) {
            var oldName = that.onlinePlayers['/#' + data.id].getName();
            that.onlinePlayers['/#' + data.id].setName(data.name);
            that.eventBus.emit('s_playersListUpdated', that.onlinePlayers);

            that.eventBus.emit('s_newMessage', {
                player: {name: Game.MASTER_NAME},
                message: {answer: oldName + ' changed name to ' + data.name}
            });
        }
    });

    this.eventBus.on('new_answer', function (data) {
        console.log('Game/initialize | *Internal* Checking answer');

        that.eventBus.emit('s_newMessage', {
            player: that.onlinePlayers['/#' + data.playerId],
            message: data
        });

        if (that.isCorrectAnswer(data.answer)) {
            that.onlinePlayers['/#' + data.playerId].increasePoints(1);
            that.eventBus.emit('s_playersListUpdated', that.onlinePlayers);
            that.eventBus.emit('correct_answer', data.playerId);

            that.eventBus.emit('s_newMessage', {
                player: {name: Game.MASTER_NAME},
                message: {answer: 'Correct answer!'}
            });

            setTimeout(function () {
                that.inProgress = false;
                that.nextPlayerTurn();
            }, 1000);

        }
    });

    that.checkIfGameRuns();
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

        this.eventBus.emit('s_newMessage', {
            player: {name: Game.MASTER_NAME},
            message: {answer: this.onlinePlayers['/#' + id].getName() + ' were added to the drawing queue'}
        });
    } else {
        console.log('Player %s is already queued', id);
    }
};

Game.prototype.startGame = function (drawingPlayerId) {
    console.log('Game/startGame | Starting new game. The host is: ', drawingPlayerId);
    this.inProgress = '/#' + drawingPlayerId;
    this.startTimer();

    this.word = this.randomWord();
    console.log('Word to guess is: %s', this.word);
    this.eventBus.emit('s_startNewGame', {host: drawingPlayerId, word: this.word, timer: Game.TIME_FOR_GUESS });
};

Game.prototype.nextPlayerTurn = function () {
    console.log('Game/nextPlayerTurn | Starting new game if queued');
    var currentPlayer = null;
    if (this.drawQueue.length > 0) {
        currentPlayer = this.drawQueue.pop();
        this.startGame(currentPlayer);
    }
};

Game.prototype.checkIfGameRuns = function () {
    //console.log('Healthchecking game');

    var that = this;
    clearTimeout(idleTimer);

    idleTimer = setTimeout(function () {
        if (!that.inProgress && that.drawQueue.length > 0) {
            console.log('Game is not running. Forcing next turn.');
            that.nextPlayerTurn();
        }

        that.checkIfGameRuns();
    }, 5000)

};

Game.prototype.randomWord = function () {
    var phrasesFile = './lib/resources/phrases.js';
    // parse string to transform it to js array
    var phrases = fs.readFileSync(phrasesFile).toString();
    phrases = eval(phrases);

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

Game.prototype.startTimer = function () {
    console.info('Starting timer');
    this.timer = Game.TIME_FOR_GUESS;

    this._decreaseTimer(this._timeElapsed.bind(this));
};

Game.prototype._decreaseTimer = function (callback) {
    var that = this;
    
    if (this.timer <= 0) {
        return callback();
    }
    
    this.timer--;
    
    if (this.timer % 10 === 0) {
        console.info('The game ends in: %s', this.timer);
    }
    
    h_gameTimer = setTimeout(function () {
        clearTimeout(h_gameTimer);

        that._decreaseTimer(callback);
    }, 1000);
};

Game.prototype._timeElapsed = function () {
    var that = this;
    
    this.eventBus.emit('s_newMessage', {
        player: { name: Game.MASTER_NAME },
        message: { answer: 'Time elapsed' }
    });
};

Game.MASTER_NAME = 'Game Master';
Game.TIME_FOR_GUESS = 120;

module.exports = Game;
