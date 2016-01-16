/* global module */

var express = require('express');
var io = require('socket.io');

var Server = function () {
    this.app = express();
    this.app.io = io();

    this.server = this.app.listen(3400, this.run.bind(this));
};

Server.prototype.run = function () {
    var host = this.server.address().address;
    var port = this.server.address().port;

    this.app.io.attach(this.server);

    console.log('Wordf server is running at http://%s:%s', host, port);

    this.app.use(express.static('static'));
    this.route();
};

Server.prototype.route = function () {
    var that = this;

    this.app.io.on('connection', function (socket) {
        console.log('connected');

        socket.on('disconnect', function () {
            that.game.removePlayer(socket);
        });

        socket.on('chatMessage', function (msg) {
            console.log('disconnected');

            that.app.io.emit('messagesUpdated', 'test');
        });
    });
};

module.exports = Server;
