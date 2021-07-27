FBInstant.initializeAsync().then(function () {
  var config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
  };

  new Phaser.Game(config);
});

class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    this.facebook.once('startgame', this.startGame, this);
    this.facebook.showLoadProgress(this);

    this.load.image('zero2', 'assets/zero-two.png');
    this.load.image('stats', 'assets/stats.png');
  }

  startGame() {
    this.scene.start('MainMenu');
  }
}
