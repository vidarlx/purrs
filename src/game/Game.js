const fs = require('fs');
const logger = require('../utils/logger').getLogger('Game');

const Timer = require('./Timer')
const User = require('./User');
const config = require('../config');

const MASTER_NAME = config.game.master_name;
const TIME_FOR_GUESS = config.game_time_for_guess;
const PENALTY_POINTS = config.game.penalty_points;
const POINTS_FOR_DRAWING =  config.game.reward_points;;

class Game {
    constructor() {
        this.server = null;
        this.onlinePlayers = {};
        this.drawQueue = [];

        this.inProgress = false;
        this.word = null;
        this.timer = null;
    }

    setServer(server) {
        this.server = server;
        this.eventBus = server.eventBus;
    };

    initialize() {
        this.eventBus.on('player_connected', (user) => {
            logger.info('initialize() *Internal* User connection handling');
            this.handleUserConnection(user);
        });

        this.eventBus.on('player_disconnected', (id) => {
            logger.info('initialize() *Internal* User disconnection handling');
            this.handleUserDisconnection(id);
        });

        this.eventBus.on('add_to_queue', (id) => {
            logger.debug(`initialize() *Internal* Adding user to the drawing queue: ${id}`);
            // do not queue, just start a game
            if (this.inProgress) {
                this.addToDrawingQueue(id);
            } else {
                this.startGame(id);
            }
        });

        this.eventBus.on('change_name', (data) => {
            logger.debug(`initialize() *Internal* Changing user\'s name: ${data.id}`);
            if (this.onlinePlayers.hasOwnProperty(data.id)) {
                let oldName = this.onlinePlayers[data.id].getName();
                this.onlinePlayers[data.id].setName(data.name);
                this.eventBus.emit('s_playersListUpdated', this.onlinePlayers);

                this.eventBus.emit('s_newMessage', {
                    player: { name: MASTER_NAME },
                    message: { answer: `${oldName} changed name to ${data.name}` }
                });
            }
        });

        this.eventBus.on('new_answer', (data) => {
            logger.debug('initialize() | *Internal* Checking answer');

            this.eventBus.emit('s_newMessage', {
                player: this.onlinePlayers[data.playerId],
                message: data
            });

            if (this.isCorrectAnswer(data.answer)) {
                let timeElapsed = TIME_FOR_GUESS - this.timer.getCurrentTime();
                let pointsForGuess = TIME_FOR_GUESS - timeElapsed;
                this.timer.kill();

                this.onlinePlayers[this.inProgress].increasePoints(POINTS_FOR_DRAWING);
                this.onlinePlayers[data.playerId].increasePoints(pointsForGuess);

                this.eventBus.emit('s_playersListUpdated', this.onlinePlayers);
                this.eventBus.emit('correct_answer', data.playerId);

                this.eventBus.emit('s_newMessage', {
                    player: { name: MASTER_NAME },
                    message: { answer: this.onlinePlayers[data.playerId].getName() + ' sent correct answer! (+' + pointsForGuess + ' points)' }
                });

                setTimeout(() => {
                    this.inProgress = false;
                    this.nextPlayerTurn();
                }, 1000);

            }
        });

    };

    handleUserConnection(userNetworkData) {
        let id = userNetworkData.id;
        let user = new User();

        this.onlinePlayers[id] = user;

        // emit to the server
        logger.info('handleUserConnection() Emmiting updated list of players to the server');
        this.eventBus.emit('s_newMessage', {
            player: { name: MASTER_NAME },
            message: { answer:`${this.onlinePlayers[id].getName()} connected to the game.` }
        });
        this.eventBus.emit('s_playersListUpdated', this.onlinePlayers);
        this.eventBus.emit('s_gameState', this.getState());
    };

    handleUserDisconnection(id) {
        // remove the game if it is host
        if (this.inProgress === id) {
            logger.info('handleUserDisconnection() Game host left.');
            this.inProgress = false;

            this.nextPlayerTurn();
        }

        this.eventBus.emit('s_newMessage', {
            player: { name: MASTER_NAME },
            message: { answer: this.onlinePlayers[id].getName() + ' disconnected.' }
        });

        delete this.onlinePlayers[id];

        // emit to the server
        logger.info('handleUserDisconnection() Emmiting updated list of players to the server');
        this.eventBus.emit('s_playersListUpdated', this.onlinePlayers);
    };

    addToDrawingQueue(id) {
        if (this.drawQueue.indexOf(id) === -1) {
            this.drawQueue.push(id);

            this.eventBus.emit('s_newMessage', {
                player: { name: MASTER_NAME },
                message: { answer: this.onlinePlayers[id].getName() + ' were added to the drawing queue' }
            });
        } else {
            logger.debug(`addToDrawingQueue() Player ${id} is already queued`);
        }
    };

    startGame(drawingPlayerId) {
        logger.log(`startGame() Starting new game. The host is: ${drawingPlayerId}`);
        this.initGame(drawingPlayerId)

        // emit to server
        this.eventBus.emit('s_startNewGame', {
            host: drawingPlayerId,
            word: this.word,
            timer: TIME_FOR_GUESS
        });
    };

    stopGame() {
        logger.log('stopGame() Stopping game');

        this.inProgress = false;
        this.timer = null;
        this.word = null;

        // emit to server
        this.eventBus.emit('s_stopGame', {});
    };

    initGame(drawingPlayerId) {
        // it is broadcasted to another users
        this.inProgress = drawingPlayerId;

        let timer = new Timer();
        timer.setTime(TIME_FOR_GUESS);
        timer.callWhenElapsed(this._timeElapsed.bind(this));
        timer.run();

        this.timer = timer;
        this.word = this.randomWord();
        logger.log(`initGame() Word to guess is: ${this.word}`);
    };

    nextPlayerTurn() {
        logger.info('nextPlayerTurn() Starting new game if queued');
        let currentPlayer = null;
        if (this.drawQueue.length > 0) {
            currentPlayer = this.drawQueue.pop();
            this.startGame(currentPlayer);

            this.eventBus.emit('s_newMessage', {
                player: { name: MASTER_NAME },
                message: { answer: `User ${this.onlinePlayers[currentPlayer].getName()} is drawing now.` }
            });
        } else {
            this.stopGame();
        }
    };

    randomWord() {
        let phrasesFile = './src/resources/phrases.js';
        // parse string to transform it to js array
        let phrases = fs.readFileSync(phrasesFile).toString();
        phrases = eval(phrases);

        return phrases[Math.floor(Math.random() * phrases.length)];
    };

    isCorrectAnswer(answer) {
        if (this.word === answer) {
            logger.info('isCorrectAnswer() Correct answer sent');
            return true;
        }
        logger.info('isCorrectAnswer() Incorrect answer');
        return false;
    };

    _timeElapsed() {
        let currentPlayer = this.onlinePlayers[this.inProgress];
        currentPlayer.decreasePoints(10);

        logger.info(`_timeElapsed() Time elapsed. Added penalty points to the account of user: ${currentPlayer.getName()}`);

        this.eventBus.emit('s_newMessage', {
            player: { name: MASTER_NAME },
            message: { answer: `Time elapsed. - ${PENALTY_POINTS} added to drawing player account.` }
        });

        this.eventBus.emit('s_playersListUpdated', this.onlinePlayers);

        this.nextPlayerTurn();
    };

    getState() {
        return {
            inProgress: this.inProgress,
            time: this.timer ? this.timer.getCurrentTime() : 0
        };
    };
}
module.exports = Game;
