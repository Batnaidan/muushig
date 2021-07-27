let game,
  playerCards = [], // Shuffled all cards
  currentCards = [], // Player's cards
  selectedCards = [], // Player's selected cards
  players = [], //
  shuffledCards = null;
stage = 'ready';
const responseTime = 15;
FBInstant.initializeAsync().then(function () {
  this.socket = io('http://localhost:3000', {
    query: {
      uuid: FBInstant.player.getID(),
      name: FBInstant.player.getName(),
      photo: FBInstant.player.getPhoto(),
      ready: false,
      isTurn: false,
    },
  });
  this.socket.on('connect', function () {
    console.log('Connected!');
  });
  this.socket.on('connectToRoom');
  this.socket.on('deck', (deck) => {
    shuffledCards = deck;
    for (let i = 0; i < 5; i++) {
      playerCards.push({
        uuid: i,
        name: null,
        picture: null,
        skipCount: 0,
        cards: [
          shuffledCards.shift(),
          shuffledCards.shift(),
          shuffledCards.shift(),
          shuffledCards.shift(),
          shuffledCards.shift(),
        ],
      });
    }
  });

  // console.log(playerCards);
  FBInstant.setLoadingProgress(100);

  FBInstant.startGameAsync().then(function () {
    var config = {
      type: Phaser.AUTO,
      width: window.innerWidth * window.devicePixelRatio,
      height: window.innerHeight * window.devicePixelRatio,
      // pixelArt: true,
      scene: {
        preload: preload,
        create: create,
        // update: update,
      },
    };
    game = new Phaser.Game(config);
    function preload() {
      this.load.plugin(
        'rexoutlinepipelineplugin',
        'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexoutlinepipelineplugin.min.js',
        true
      );

      for (let i = 7; i <= 14; i++) {
        this.load.image(`${i}C`, `/resource/${i}C.png`);
        this.load.image(`${i}D`, `/resource/${i}D.png`);
        this.load.image(`${i}H`, `/resource/${i}H.png`);
        this.load.image(`${i}S`, `/resource/${i}S.png`);
      }
      this.load.image('backside', '/resource/backside.jpg');
      this.load.image('table', '/resource/table.jpg');
      this.load.image('drop', '/resource/drop.png');
      this.load.image('dealerchange', '/resource/dealerchange.png');
      this.load.image('in', '/resource/in.png');
      this.load.image('change', '/resource/change.png');
      this.load.image('put', '/resource/put.png');
      // this.load.on('complete', function () {});
    }

    function create() {
      this.add.image(0, 0, 'table').setOrigin(0, 0).setScale(0.4);
      var postFxPlugin = this.plugins.get('rexoutlinepipelineplugin');
      const inviteFriendsButton = this.add
        .text(200, 200, 'invite friends', { fill: '#fff' })
        .setInteractive();

      inviteFriendsButton.on('pointerdown', () => {
        // FBInstant.context.createAsync('123123').then(function () {
        //   console.log(FBInstant.context.getID());
        //   // 5544332211
        // });
        // console.log(FBInstant.context.getID());
        FBInstant.context
          .chooseAsync({
            filters: ['NEW_PLAYERS_ONLY'],
            minSize: 3,
          })
          .then(function () {
            console.log(FBInstant.context.getID());
          });
        // var connectedPlayers = FBInstant.player
        //   .getConnectedPlayersAsync()
        //   .then(function (players) {
        //     console.log(
        //       players.map(function (player) {
        //         return {
        //           id: player.getID(),
        //           name: player.getName(),
        //         };
        //       })
        //     );
        //   });

        // FBInstant.shareAsync({
        //   intent: 'CHALLENGE',
        //   image: `iVBORw0KGgoAAAANSUhEUgAAAAUA
        //     AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO
        //         9TXL0Y4OHwAAAABJRU5ErkJggg==`,
        //   text: 'hello',
        // });
        // FBInstant.checkCanPlayerMatchAsync().then((canMatch) => {
        //   if (canMatch) {
        //     FBInstant.matchPlayerAsync(null, true).then(() => {
        //       console.log(FBInstant.context.getID());
        //     });
        //   }
        // });
      });
      const inButton = this.add
        .image(game.config.width / 1.25, game.config.height / 1.125, 'in')
        .setScale(0.35)
        .setInteractive();
      const dropButton = this.add
        .image(game.config.width / 1.09, game.config.height / 1.125, 'drop')
        .setScale(0.35)
        .setInteractive();
      const changeButton = this.add
        .image(game.config.width / 1.09, game.config.height / 1.125, 'change')
        .setScale(0.35)
        .setInteractive()
        .setVisible(false);
      const dealerChangeButton = this.add
        .image(
          game.config.width / 1.09,
          game.config.height / 1.125,
          'dealerchange'
        )
        .setScale(0.35)
        .setInteractive()
        .setVisible(false);
      this.input.on('gameobjectdown', onObjectClicked);

      function onObjectClicked(pointer, gameObject) {
        let key = gameObject.texture.key;
        if (!key) return;
        console.log(key);
        let index = selectedCards.indexOf(gameObject.texture.key);

        if (index !== -1) {
          selectedCards.splice(index, 1);
          postFxPlugin.remove(gameObject);
          // } else if (key === 'inviteFriends') {
        } else if (key === 'in') {
          //send to server that player is in and set skipCount to 0
          skipCount = 0;
          dropButton.setVisible(false);
          inButton.setVisible(false);
          stage = 'change';
        } else if (key === 'drop') {
          //send to server that player is in and increment skipCount to 0
          dropButton.setVisible(false);
          inButton.setVisible(false);
          stage = 'change';
        } else if (key === 'change') {
          //send to server that player will change
        } else if (key === 'dealerchange') {
          //send to server that player will change
        } else if (
          key[key.length] === 'C' ||
          key[key.length] === 'D' ||
          key[key.length] === 'H' ||
          key[key.length] === 'S'
        ) {
          selectedCards.push(key);
          postFxPlugin.add(gameObject, {
            thickness: 3,
            outlineColor: 0xffa500,
          });
        }
      }
    }
  });
});

// http-server --ssl -c-1 -p 8080 -a 127.0.0.1
