const Server = require('./src/network/Server');
const Game = require('./src/game/Game.js');

(function () {   
    const s = new Server();
    
    const g = new Game();
    g.setServer(s);
    g.initialize();
})();
