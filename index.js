var Server = require('./lib/network/Server');
var Game = require('./lib/game/Game.js');

(function () {   
    var s = new Server();
    
    var g = new Game();
    g.setServer(s);
    g.initialize();
})();
