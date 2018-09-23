const express = require('express');
const io = require('socket.io');
const events = require('events');

const logger = require('../utils/logger').getLogger('Game');

class Server {
    constructor() {
        this.app = express();
        this.app.io = io();

        this.server = this.app.listen(3400, this.run.bind(this));
        this.eventBus = new events.EventEmitter();
    }


    run() {
        const host = this.server.address().address;
        const port = this.server.address().port;

        this.app.io.attach(this.server);

        logger.log(`run() Server is running at http://${host}:${port}`);

        this.app.use(express.static('static'));
        this.handleClientEvents();
        this.handleGameEvents();
    };

    // handle events emitted by the client
    handleClientEvents() {
        this.app.io.on('connection', (socket) => {
            logger.log(`handleClientEvents() New client connected: ${socket.id}`);

            // send an event to the Game object
            logger.debug('handleClientEvents() Emmiting internal event about new connection');
            this.eventBus.emit('player_connected', socket);

            socket.on('disconnect', () => {
                logger.log(`handleClientEvents() Client disconnected: ${socket.id}`);
                this.eventBus.emit('player_disconnected', socket.id);
            });

            socket.on('new_answer', (data) => {
                logger.debug('handleClientEvents() New answer');
                this.eventBus.emit('new_answer', data);
            });

            socket.on('correct_answer', (playerId) => {
                logger.debug(`handleClientEvents() Correct answer got by server from ${playerId}`);
                this.app.io.emit('correct_answer', playerId);
            });

            socket.on('send_image', (image) => {
                //logger.debug('handleClientEvents() New image received by the server');
                this.app.io.emit('image_updated', image);
            });

            socket.on('add_to_queue', (player) => {
                logger.debug('handleClientEvents() User wants to draw');
                this.eventBus.emit('add_to_queue', player);
            });

            socket.on('change_name', (name, playerId) => {
                logger.debug(`handleClientEvents() User requested to change the name: ${playerId}->${name}`);
                this.eventBus.emit('change_name', {
                    name: name,
                    id: playerId
                });
            });


        });
    };

    // handle events emitted by the Game
    handleGameEvents() {
        this.eventBus.on('s_playersListUpdated', (players) => {
            logger.debug('handleGameEvents() Redraw request handled from an internal class');
            this.emitPlayersListRedraw(players);
        });

        this.eventBus.on('s_startNewGame', (data) => {
            logger.info(`handleGameEvents() Game instance started a new game (host: ${data.host}).`);
            this.emitNewGame(data);
        });

        this.eventBus.on('s_stopGame', () => {
            logger.info('handleGameEvents() Stopping game.');
            this.emitStopGame();
        });

        this.eventBus.on('s_newMessage', (data) => {
            this.app.io.emit('new_message', data);
        });

        this.eventBus.on('s_gameState', (state) => {
            this.app.io.emit('game_state', state);
        });
    };

    emitPlayersListRedraw(players) {
        logger.debug(`emitPlayersListRedraw() Sending request for redraw to all clients: ${players}`);
        this.app.io.emit('playersListUpdated', players);
    };

    emitNewGame(data) {
        logger.debug(`emitPlayersListRedraw() Sending request for start the game to all clients: ${data.host}`);
        this.app.io.emit('newGame', data);
    };

    emitStopGame() {
        logger.debug('emitPlayersListRedraw() Sending request for stop the game to all clients');
        this.app.io.emit('stopGame', {});
    };

}

module.exports = Server;
