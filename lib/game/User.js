var User = function () {
    this.name = randomName;
};

User.prototype.setName = function (name) {
    this.name = name;
};

User.prototype.getName = function () {
    return this.name;
};

User.prototype.assignRandomName = function () {
    this.setName()
};

var randomName = function () {
    return 'Player-' + getRandomInt(1, 1000);
};

var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = User;