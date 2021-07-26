let game,
  playerCards = [], // Shuffled all cards
  currentCards = [], // Player's cards
  selectedCards = []; // Player's selected cards

FBInstant.initializeAsync().then(function () {
  PixelW = window.innerWidth * window.devicePixelRatio;
  PixelH = window.innerHeight * window.devicePixelRatio;

  var config = {
    type: Phaser.AUTO,
    width: PixelW,
    height: PixelH,
    // pixelArt: true,
    scene: {
      preload: preload,
      create: create,
    },
  };

  game = new Phaser.Game(config);

  const suits = ['C', 'D', 'H', 'S'];
  const values = ['7', '8', '9', '10', '11', '12', '13', '14'];
  let deck = [];
  for (let i = 0; i < suits.length; i++) {
    for (let x = 0; x < values.length; x++) {
      deck.push(`${values[x]}${suits[i]}`);
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * i);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  for (let i = 0; i < 5; i++) {
    playerCards.push({
      uuid: i,
      cards: [
        deck.shift(),
        deck.shift(),
        deck.shift(),
        deck.shift(),
        deck.shift(),
      ],
    });
  }
  console.log(playerCards);
});

function preload() {
  this.load.plugin(
    'rexoutlinepipelineplugin',
    'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexoutlinepipelineplugin.min.js',
    true
  );
  // this.facebook.showLoadProgress(this);
  FBInstant.setLoadingProgress(100);
  FBInstant.startGameAsync().then(function () {
    startGame();
  });
  for (let i = 7; i <= 14; i++) {
    this.load.image(`${i}C`, `/resource/${i}C.png`);
    this.load.image(`${i}D`, `/resource/${i}D.png`);
    this.load.image(`${i}H`, `/resource/${i}H.png`);
    this.load.image(`${i}S`, `/resource/${i}S.png`);
  }
  this.load.image('backside', '/resource/backside.jpg');
  this.load.image('table', '/resource/table.jpg');
}

function create() {
  this.add.image(0, 0, 'table').setOrigin(0, 0).setScale(0.4);
  var postFxPlugin = this.plugins.get('rexoutlinepipelineplugin');
  for (let i = 0; i < 5; i++) {
    this.add
      .image(
        game.config.width / 2 - 100 + i * 55,
        game.config.height / 1.45,
        playerCards[0].cards[i]
      )
      .setScale(0.175)
      .setInteractive();
  }
  this.input.on('gameobjectdown', onObjectClicked);

  function onObjectClicked(pointer, gameObject) {
    let key = selectedCards.indexOf(gameObject.texture.key);
    if (key !== -1) {
      selectedCards.splice(key, 1);
      postFxPlugin.remove(gameObject);
    } else {
      selectedCards.push(gameObject.texture.key);
      postFxPlugin.add(gameObject, {
        thickness: 3,
        outlineColor: 0xffa500,
      });
    }
    console.log(window.innerHeight, window.innerWidth);
    console.log(selectedCards);
  }
}
