/* global module */

const express = require('express');
const io = require('socket.io');

const events = require('events');

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

        console.log('Wordf server is running at http://%s:%s', host, port);

        this.app.use(express.static('static'));
        this.handleClientEvents();
        this.handleGameEvents();
    };

    // handle events emitted by the client
    handleClientEvents() {
        this.app.io.on('connection', (socket) => {
            console.log('Server/handleClientEvents | New client connected');

            // send an event to the Game object
            console.log('Server/handleClientEvents | Emmiting internal event about new connection');
            this.eventBus.emit('player_connected', socket);

            socket.on('disconnect', () => {
                console.log('Server/handleClientEvents | Client disconnected');
                this.eventBus.emit('player_disconnected', socket.id);
            });

            socket.on('new_answer', (data) => {
                console.log('Server/handleClientEvents | New answer');
                this.eventBus.emit('new_answer', data);
            });

            socket.on('correct_answer', (playerId) => {
                console.log('Server/handleClientEvents | Correct answer got by server');
                this.app.io.emit('correct_answer', playerId);
            });

            socket.on('send_image', (image) => {
                //console.log('Server/handleClientEvents | New image is available');
                this.app.io.emit('image_updated', image);
            });

            socket.on('add_to_queue', (player) => {
                console.log('Server/handleClientEvents | User wants to draw');
                this.eventBus.emit('add_to_queue', player);
            });

            socket.on('change_name', (name, playerId) => {
                console.log('Server/handleClientEvents | User wants to change the name');
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
            console.log('Server/handleGameEvents | Redraw request handled from an internal class');
            this.emitPlayersListRedraw(players);
        });

        this.eventBus.on('s_startNewGame', (data) => {
            console.log('Server/handleGameEvents | Game instance started a new game (host: %s).', data.host);
            this.emitNewGame(data);
        });

        this.eventBus.on('s_stopGame', () => {
            console.log('Server/handleGameEvents | Stopping game.');
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
        console.log('Sending request for redraw to all clients', players);
        this.app.io.emit('playersListUpdated', players);
    };

    emitNewGame(data) {
        console.log('Sending request for start the game to all clients', data.host);
        this.app.io.emit('newGame', data);
    };

    emitStopGame() {
        console.log('Sending request for stop the game to all clients');
        this.app.io.emit('stopGame', {});
    };

}

module.exports = Server;
