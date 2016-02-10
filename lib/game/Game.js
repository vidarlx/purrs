/* global module, Math */
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var Timer = require('./Timer')
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

    //that.checkIfGameRuns();
};

Game.prototype.handleUserConnection = function (userNetworkData) {
    var that = this;
    var id = userNetworkData.id;
    var user = new User();

    this.onlinePlayers[id] = user;

    // emit to the server
    console.log('Game/handleUser | Emmiting updated list of players to the server');
    this.eventBus.emit('s_newMessage', {
        player: {name: Game.MASTER_NAME},
        message: {answer: that.onlinePlayers[id].getName() + ' connected to the game.'}
    });
    this.eventBus.emit('s_playersListUpdated', this.onlinePlayers);
    this.eventBus.emit('s_gameState', this.getState());
};

Game.prototype.handleUserDisconnection = function (id) {
    var that = this;

    // remove the game if it is host
    if (this.inProgress === id) {
        console.log('Game/handleUserDisconnection | Game host left.');
        this.inProgress = false;

        this.nextPlayerTurn();
    }

    this.eventBus.emit('s_newMessage', {
        player: {name: Game.MASTER_NAME},
        message: {answer: that.onlinePlayers[id].getName() + ' disconnected.'}
    });

    delete this.onlinePlayers[id];
    
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
    this.initGame(drawingPlayerId)

    // emit to server
    this.eventBus.emit('s_startNewGame', {
        host: drawingPlayerId,
        word: this.word,
        timer: Game.TIME_FOR_GUESS
    });
};

Game.prototype.stopGame = function () {
    console.log('Game/startGame | Stopping game');

    this.inProgress = false;
    this.timer = null;
    this.word = null;

    // emit to server
    this.eventBus.emit('s_stopGame', {});
};

Game.prototype.initGame = function (drawingPlayerId) {
    // it is broadcasted to another users
    this.inProgress = '/#' + drawingPlayerId;

    var timer = new Timer();
    timer.setTime(Game.TIME_FOR_GUESS);
    timer.callWhenElapsed(this._timeElapsed.bind(this));
    timer.run();

    this.timer = timer;

    this.word = this.randomWord();
    console.info('Word to guess is: %s', this.word);


};

Game.prototype.nextPlayerTurn = function () {
    var that = this;
    console.log('Game/nextPlayerTurn | Starting new game if queued');
    var currentPlayer = null;
    if (this.drawQueue.length > 0) {
        currentPlayer = this.drawQueue.pop();
        this.startGame(currentPlayer);

        this.eventBus.emit('s_newMessage', {
            player: {name: Game.MASTER_NAME},
            message: {answer: 'User' + that.onlinePlayers['/#' + currentPlayer].getName() + ' is drawing now.'}
        });
    } else {
        this.stopGame();
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
    }, 5000);

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

Game.prototype._timeElapsed = function () {
    console.info('Time elapsed. User was punished');
    var currentPlayer = this.onlinePlayers[this.inProgress];
    currentPlayer.decreasePoints(10);

    this.eventBus.emit('s_newMessage', {
        player: {name: Game.MASTER_NAME},
        message: {answer: 'Time elapsed. -' + Game.PENALTY_POINTS + ' for drawing player.'}
    });

    this.eventBus.emit('s_playersListUpdated', this.onlinePlayers);

    this.nextPlayerTurn();
};

Game.prototype.getState = function () {
    return {
        inProgress: this.inProgress,
        time: this.timer ? this.timer.getCurrentTime() : 0
    };
};

Game.MASTER_NAME = 'Game Master';
Game.TIME_FOR_GUESS = 120;
Game.PENALTY_POINTS = 10;

module.exports = Game;
