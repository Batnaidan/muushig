let game,
  playerCards = [], // Shuffled all cards
  currentCards = [], // Player's cards
  selectedCards = [], // Player's selected cards
  me = {}, //
  shuffledCards = null,
  stage = 'ready',
  inviteData = {},
  socket;

const responseTime = 15;
FBInstant.initializeAsync().then(function () {
  me = {
    uuid: FBInstant.player.getID(),
    name: FBInstant.player.getName(),
    photo: FBInstant.player.getPhoto(),
    ready: false,
    isTurn: false,
    cards: [],
    skipCount: 0,
    score: 15,
  };
  socket = io('http://localhost:3000', {
    query: {
      uuid: FBInstant.player.getID(),
      name: FBInstant.player.getName(),
      photo: FBInstant.player.getPhoto(),
    },
  });
  socket.on('connect', function () {
    console.log('Connected!');
  });
  socket.on('roomId', function (data) {
    inviteData.roomId = data._id;
    console.log('Room', data._id + '\n' + JSON.stringify(data.room_players));
  });
  socket.on('playerChange', (room) => {
    console.log(room);
  });
  let entryData = FBInstant.getEntryPointData();
  if (entryData) {
    console.log(entryData);
    socket.emit('joinRoom', entryData);
  }
  socket.on('deck', (deck) => {
    console.log(deck);
  });
  socket.on('startGame', (room) => {
    // room.room_players[]
  });

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
    startGame();
    function preload() {
      this.load.plugin(
        'rexoutlinepipelineplugin',
        'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexoutlinepipelineplugin.min.js',
        true
      );

      for (let i = 7; i <= 14; i++) {
        this.load.image(`${i}C`, `./assets/${i}C.png`);
        this.load.image(`${i}D`, `./assets/${i}D.png`);
        this.load.image(`${i}H`, `./assets/${i}H.png`);
        this.load.image(`${i}S`, `./assets/${i}S.png`);
      }
      this.load.image('backside', './assets/backside.jpg');
      this.load.image('table', './assets/table.jpg');
      this.load.image('drop', './assets/drop.png');
      this.load.image('dealerchange', './assets/dealerchange.png');
      this.load.image('in', './assets/in.png');
      this.load.image('change', './assets/change.png');
      this.load.image('put', './assets/put.png');
      this.load.image('playerPhoto', FBInstant.player.getPhoto());
    }

    function create() {
      this.add.image(0, 0, 'table').setOrigin(0, 0).setScale(0.4);
      var postFxPlugin = this.plugins.get('rexoutlinepipelineplugin');

      this.add.image(300, 300, 'playerPhoto').setScale(0.25);
      const readyButton = this.add
        .text(200, 300, 'READY', { fill: '#fff' })
        .setInteractive();
      readyButton.on('pointerdown', () => {
        socket.emit('playerStateChange', true);
      });
      const createLobbyButton = this.add
        .text(200, 200, 'CREATE LOBBY', { fill: '#fff' })
        .setInteractive();
      createLobbyButton.on('pointerdown', () => {
        me.count = 2;
        socket.emit('findRoom', me);

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
      });
      const inviteFriends = this.add
        .text(200, 400, 'INVITE FRIENDS', { fill: '#fff' })
        .setInteractive();
      inviteFriends.on('pointerdown', () => {
        FBInstant.context
          .chooseAsync({
            filters: ['NEW_PLAYERS_ONLY'],
            minSize: 3,
          })
          .then(function () {
            FBInstant.updateAsync({
              action: 'CUSTOM',
              template: 'join_game',
              cta: 'Join',
              text: `${FBInstant.player.getName()} user has invited you to Muushig. Come join in game!`,
              text: {
                default: `${FBInstant.player.getName()} user has invited you to Muushig. Come join in game!`,
                localizations: {
                  mn_MN: `${FBInstant.player.getName()} хэрэглэгч таныг тоглоомонд урилаа. Орж тоглоомонд нэгдээрэй!`,
                  en_US: `${FBInstant.player.getName()} user has invited you to Muushig. Come join in game!`,
                },
              },
              image: contextBase64InviteImage,
              data: {
                inviteData: inviteData,
                invite: true,
              },
            })
              .then(function () {
                console.log('Message was sent successfully');
              })
              .catch((err) => {
                console.error(err);
              });
          });
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
          changeButton.setVisible(true);
          stage = 'change';
        } else if (key === 'drop') {
          //send to server that player is in and increment skipCount to 0
          dropButton.setVisible(false);
          inButton.setVisible(false);
          stage = 'change';
          changeButton.setVisible(true);
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
