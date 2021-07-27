class Preloader extends Phaser.scene {
  constructor() {
    super('Preloader');
  }
  preload() {
    this.facebook.showLoadProgress(this);
    this.facebook.once('startgame', this.startGame, this);

    this.load.setBaseUrl('resource/');
    for (let i = 1; i <= 13; i++) {
      this.load.image(`${i}C`, `${i}C.png`);
      this.load.image(`${i}D`, `${i}D.png`);
      this.load.image(`${i}H`, `${i}H.png`);
      this.load.image(`${i}S`, `${i}S.png`);
    }
  }
  startGame() {
    let playerCards = [];
    while (playerCards.length < 32) {
      let cardRank = Math.floor(Math.random() * 14) + 7;
      if (playerCards.indexOf(r) === -1) {
        let cardType = Math.floor(Math.random() * 4) + 1;
        switch (cardType) {
          case 1:
            playerCards.push(`${cardRank}C`);
            break;
          case 2:
            playerCards.push(`${cardRank}D`);
            break;
          case 3:
            playerCards.push(`${cardRank}H`);
            break;
          case 4:
            playerCards.push(`${cardRank}S`);
            break;
        }
      }
    }
    console.log(playerCards);
    this.scene.start('GameShare');
  }
}
