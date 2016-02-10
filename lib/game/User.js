var User = function () {
    this.name = randomName();
    this.points = 0;
};

User.prototype.setName = function (name) {
    this.name = name;
};

User.prototype.getName = function () {
    return this.name;
};

User.prototype.increasePoints = function (points) {
    this.points += points;
};

User.prototype.decreasePoints = function (points) {
    this.points -= points;
};

User.prototype.getPoints = function (points) {
    return this.points;
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