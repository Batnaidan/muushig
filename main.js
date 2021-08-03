let game,
  shuffledCards,
  playerData,
  playerCards, // Shuffled all cards
  currentCards, // Player's cards
  selectedCards = [], // Player's selected cards
  me = {}, //
  stage = 'ready',
  inviteData = {},
  socket,
  playerIndex,
  playerCardGroup;
const responseTime = 15;
FBInstant.initializeAsync().then(function () {
  me = {
    uuid: FBInstant.player.getID().toString(),
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
      uuid: FBInstant.player.getID().toString(),
      name: FBInstant.player.getName(),
      photo: FBInstant.player.getPhoto(),
    },
  });
  socket.on('connect', function () {
    console.log('Connected!');
  });
  let entryData = FBInstant.getEntryPointData();
  if (entryData) {
    console.log(entryData);
    socket.emit('joinRoom', entryData);
  }
  socket.on('deck', (deck) => {
    console.log(deck);
  });

  FBInstant.setLoadingProgress(100);
  FBInstant.startGameAsync().then(function () {
    var config = {
      type: Phaser.AUTO,
      width: 1366 * window.devicePixelRatio,
      height: 768 * window.devicePixelRatio,
      // pixelArt: true,
      scene: {
        preload: preload,
        create: create,
        // update: update,
      },
    };
    playerPicturePos = [
      { x: 225, y: 375 },
      { x: 510, y: 130 },
      { x: 800, y: 130 },
      { x: 1100, y: 375 },
    ];
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
      this.load.image('table', './assets/shiree.png');
      this.load.image('background', './assets/main_menu.jpg');
      this.load.image('drop', './assets/drop.png');
      this.load.image('dealerchange', './assets/dealerchange.png');
      this.load.image('in', './assets/in.png');
      this.load.image('change', './assets/change.png');
      this.load.image('put', './assets/put.png');
      this.load.image('playerPhoto', FBInstant.player.getPhoto());
      this.load.image('lobby_create', './assets/lobby_create.png');
      this.load.image('lobby_join', './assets/lobby_join.png');
      this.load.image('invite_friends', './assets/invite_friends.png');
    }

    function create() {
      this.add.image(0, 0, 'background').setOrigin(0, 0);
      socket.on('roomId', function (room) {
        inviteData.roomId = room._id;
      });
      socket.on('playerChange', (room) => {
        playerData = room.room_players;
        const isMe = (element) => element.uuid == me.uuid;
        playerIndex = room.room_players.findIndex(isMe);

        for (let i = 0; i < playerData.length; i++) {
          this.load.image(playerData[i].uuid, playerData[i].photo);
        }
        this.load.start();
        this.load.once('complete', renderPlayers, this);
        console.log(
          'Room',
          room._id + '\n' + JSON.stringify(room.room_players)
        );
        this.add.image(0, 0, 'table').setOrigin(0, 0);
      });

      socket.on('startGame', (room) => {
        shuffledCards = room.room_deck;
        console.log(playerIndex);
        console.log(room.room_players);
        playerCards = room.room_players[playerIndex].cards;
        playerCardGroup = this.add.group();
        for (let i = 0; i < playerCards.length; i++) {
          playerCardGroup.add(
            this.add
              .image(
                game.config.width / 2 - 200 + i * 100,
                game.config.height / 1.25,
                playerCards[i]
              )
              .setScale(0.25)
              .setInteractive()
          );
        }
        changeButton.setVisible(true);
      });
      socket.on('dropCards', (room) => {
        room.room_players[playerIndex].cards.forEach((element, i) => {
          playerCardGroup.add(
            this.add
              .image(i * 20, i * 50, element)
              .setScale(0.25)
              .setInteractive()
          );
        });
      });
      var postFxPlugin = this.plugins.get('rexoutlinepipelineplugin');

      const joinLobbyButton = this.add
        .image(game.config.width / 15, game.config.height / 2, 'lobby_join')
        .setInteractive()
        .setOrigin(null, 0);
      joinLobbyButton.on('pointerup', () => {
        joinLobbyButton.clearTint();
        joinLobbyButton.setVisible(false);
        createLobbyButton.setVisible(false);
        inviteFriends.setVisible(true);
        me.count = 5;
        socket.emit('findRoom', me);
      });
      joinLobbyButton.on('pointerdown', () => {
        joinLobbyButton.setTint(0x808080);
      });
      const createLobbyButton = this.add
        .image(game.config.width / 15, game.config.height / 1.5, 'lobby_create')
        .setInteractive()
        .setOrigin(null, 0);

      createLobbyButton.on('pointerup', () => {
        createLobbyButton.clearTint();
        createLobbyButton.setVisible(false);
        joinLobbyButton.setVisible(false);
        inviteFriends.setVisible(true);
        me.count = 1;
        socket.emit('findRoom', me);
      });
      createLobbyButton.on('pointerdown', () => {
        createLobbyButton.setTint(0x808080);
      });
      const inviteFriends = this.add
        .image(game.config.width / 1.1, 50, 'invite_friends')
        .setInteractive()
        .setScale(0.5)
        .setVisible(false);
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
        .setScale(0.7)
        .setInteractive()
        .setVisible(false);
      const dropButton = this.add
        .image(game.config.width / 1.09, game.config.height / 1.125, 'drop')
        .setScale(0.7)
        .setInteractive()
        .setVisible(false);
      const changeButton = this.add
        .image(game.config.width / 1.09, game.config.height / 1.125, 'change')
        .setScale(0.7)
        .setInteractive()
        .setVisible(false);
      const dealerChangeButton = this.add
        .image(
          game.config.width / 1.09,
          game.config.height / 1.125,
          'dealerchange'
        )
        .setScale(0.7)
        .setInteractive()
        .setVisible(false);
      this.input.on('gameobjectdown', onObjectClicked);

      function onObjectClicked(pointer, gameObject) {
        let key = gameObject.texture.key;
        if (!key) return;

        console.log(key);
        let index = selectedCards.indexOf(gameObject.texture.key);
        if (index !== -1) {
          gameObject.y += 20;
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
        } else if (key === 'change') {
          //send to server that player will change
          socket.emit('dropCards', selectedCards);
          console.log(playerCardGroup);
          playerCardGroup.children.entries.forEach((element1) => {
            selectedCards.forEach((element2) => {
              if (element1.texture.key == element2) {
                element1.destroy();
              }
            });
          });
        } else if (key === 'dealerchange') {
          //send to server that player will change
        } else if (
          key[key.length - 1] === 'C' ||
          key[key.length - 1] === 'D' ||
          key[key.length - 1] === 'H' ||
          key[key.length - 1] === 'S'
        ) {
          gameObject.y -= 20;
          selectedCards.push(key);
          console.log(selectedCards);
          postFxPlugin.add(gameObject, {
            thickness: 3,
            outlineColor: 0xffa500,
          });
        }
      }
      const renderPlayers = () => {
        let j = 0;
        for (let i = playerIndex + 1; i < playerData.length; i++) {
          this.add
            .image(
              playerPicturePos[j].x,
              playerPicturePos[j].y,
              playerData[i].uuid
            )
            .setScale(0.3);
          j++;
        }
        for (let i = 0; i < playerIndex; i++) {
          this.add
            .image(
              playerPicturePos[j].x,
              playerPicturePos[j].y,
              playerData[i].uuid
            )
            .setScale(0.3);
          j++;
        }
      };
    }
    function update() {}
  });
});

// http-server --ssl -c-1 -p 8080 -a 127.0.0.1
