const Server = require('./lib/network/Server');
const Game = require('./lib/game/Game.js');

(function () {   
    const s = new Server();
    
    const g = new Game();
    g.setServer(s);
    g.initialize();
})();
