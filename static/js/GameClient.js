/* global NetworkingController, DrawingController, socket */

var currentImage = null;
var timer = null;
var gTimer = null;
var h_gameTimer = null;

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
            var span = document.createElement('span');
            span.classList.add('points');
            span.innerHTML = player.points;

            li.appendChild(document.createTextNode(player.name));
            li.appendChild(span);
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
    
    var applyGameState = function (state) {
        console.log(state);
        if (state.inProgress && !gTimer) {
            gTimer = state.time || 0;
            startTimer(gTimer);
        }
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
        var wordElement = document.querySelector('#word');
        wordElement.innerHTML = word;

        var wordBox = document.querySelector('#wordBox');
        wordBox.style.display = 'block';
    };

    var hideWordBox = function () {
        document.querySelector('#wordBox').style.display = 'none';
    };

    var appendMessages = function (data) {
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

    var showWarningBox = function () {
        var warningBox = document.querySelector('#waitingBox');
        warningBox.style.display = 'block';
    };

    var hideWarningBox = function () {
        var warningBox = document.querySelector('#waitingBox');
        warningBox.style.display = 'none';
    };

    var startNewGame = function (data) {
        DrawingController.clearCanvas();

        if (socket.id === data.host) {
            enableDrawingMode();
            //showAnswerBox();
            showWordToGuess(data.word);
        } else {
            hideWordBox();
            //showAnswerBox();
            disableDrawingMode();
        }

        hideWarningBox();
        
        startTimer(data.timer)
    };

    var cleanAfterGame = function () {
        showWordBox();
    };

    var changeName = function () {
        var name = prompt('Type new name');
        if (name) {
            NetworkingController.sendNewName(name, socket.id);
        }
    };

    var startTimer = function (timerValue) {
        console.info('Starting timer %s', timerValue);
        gTimer = parseInt(timerValue, 10);

        _decreaseTimer();
    };

    var _decreaseTimer = function (callback) {
        if (gTimer <= 0) {
            return;
        }

        h_gameTimer = setTimeout(function () {
            gTimer--;
            clearTimeout(h_gameTimer);

            _timerGuiUpdate(gTimer);
            _decreaseTimer(callback);
        }, 1000);
    };

    var _timerGuiUpdate = function (time) {
        var timerBox = document.querySelector('#timer > h2');

        var minutes = Math.floor(time / 60);
        var seconds = time - 60 * minutes;
        var formatedDate = pad(minutes, 2) + ':' + pad(seconds, 2);
        timerBox.innerHTML = formatedDate;
    }

    /** end of gui methods */

    function pad(num, size) {
        var s = num + "";
        while (s.length < size)
            s = "0" + s;
        return s;
    }

    return {
        showPlayers: showPlayers,
        redrawImage: redrawImage,
        enableDrawingMode: enableDrawingMode,
        addToDrawQueue: addToDrawQueue,
        startNewGame: startNewGame,
        sendAnswer: sendAnswer,
        appendMessages: appendMessages,
        changeName: changeName,
        startTimer: startTimer,
        applyGameState: applyGameState
    };
}();

setTimeout(function () {
    DrawingController.initDrawingContext();
}, 1000);



