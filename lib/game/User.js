class User {
    constructor() {
        this.name = this.randomName();
        this.points = 0;
    }

    setName(name) {
        this.name = name;
    };

    getName() {
        return this.name;
    };

    increasePoints(points) {
        this.points += points;
    };

    decreasePoints(points) {
        this.points -= points;
    };

    getPoints(points) {
        return this.points;
    };

    assignRandomName() {
        this.setName()
    };

    randomName() {
        return 'Player-' + this.getRandomInt(1, 1000);
    };

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
module.exports = User;