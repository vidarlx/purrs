/* global NetworkingController, DrawingController, socket */

var currentImage = null;
var timer = null;

var GameClient = function () {
    var showPlayers = function (players) {
        var list = document.querySelector('#playersList > ul');
        // clear all childs before redraw
        list.innerHTML = '';

        var playersIDs = Object.keys(players);

        var player = null;
        for (var i = 0; i < playersIDs.length; i++) {
            player = players[playersIDs[i]];

            var li = document.createElement('li');
            li.innerHTML = player.name + ' (' + player.points + ')';
            li.addEventListener('click', function () {
                newGame(player.name);
            }, false);

            list.appendChild(li);
        }
    };

    var newGame = function (player) {
        NetworkingController.newGame(player);
    };

    // send current canvas state via NetworkingController to the server
    var sendCurrentImage = function () {
        if (DrawingController.drawingModeEnabled()) {
            // console.log('Client | Sending image to the server');
            NetworkingController.sendImage(JSON.stringify(DrawingController.getCurrentImage()));
        }
        clearTimeout(timer);

        timer = setTimeout(function () {
            sendCurrentImage();
        }, 500);
    };

    var redrawImage = function (image) {
        var currentImage = DrawingController.getCurrentImage();

        if (currentImage) {
            //console.log('Client | Redrawing image');
            currentImage.clear();
            currentImage.loadFromJSON(image, currentImage.renderAll.bind(currentImage));
        }
    };

    var enableDrawingMode = function () {
        console.log('Drawing mode enabled');

        DrawingController.enableDrawingMode();

        timer = setTimeout(function () {
            sendCurrentImage();
        }, 2000);
    };

    var disableDrawingMode = function () {
        console.log('Drawing mode disabled');

        DrawingController.disableDrawingMode();
    };

    var addToDrawQueue = function () {
        // add to queue
        NetworkingController.addToDrawingQueue();
    };

    /** gui methods */
    var sendAnswer = function () {
        var answer = document.querySelector('#answer').value;
        NetworkingController.sendAnswer(socket.id, answer);
    };
    
    var showAnswerBox = function () {
        document.querySelector('#messagingBox').style.display = 'block';
    };
    
    var hideAnswerBox = function () {
        document.querySelector('#messagingBox').style.display = 'none';
    };

    var showWordToGuess = function (word) {
        var wordBox = document.querySelector('#wordBox');
        wordBox.innerHTML = word;
        wordBox.style.display = 'block';
    };
    
    var hideWordBox = function (word) {
        document.querySelector('#wordBox').style.display = 'none';
    };
    
    var appendMessages = function (data) {
        console.log(data)
        var messagesList = document.querySelector('ul#messagesList');
        var li = document.createElement('li');
        var user = document.createElement('span');
        user.classList.add('user');
        user.innerHTML = data.player.name;
        var txt = document.createTextNode(': ' + data.message.answer);
        
        li.appendChild(user);
        li.appendChild(txt);

        messagesList.appendChild(li);
    };

    var startNewGame = function (data) {
        DrawingController.clearCanvas();

        if (socket.id === data.host) {
            enableDrawingMode();
            hideAnswerBox();
            showWordToGuess(data.word);
        } else {
            hideWordBox();
            showAnswerBox();
            disableDrawingMode();
        }
    };
    
    /** end of gui methods */

    return {
        showPlayers: showPlayers,
        redrawImage: redrawImage,
        enableDrawingMode: enableDrawingMode,
        addToDrawQueue: addToDrawQueue,
        startNewGame: startNewGame,
        sendAnswer: sendAnswer,
        appendMessages: appendMessages
    };
}();

setTimeout(function () {
    DrawingController.initDrawingContext();
}, 1000);



