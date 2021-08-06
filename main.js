let game,
  playerData,
  currentCards, // Player's cards
  playerCards,
  selectedCards = [], // Player's selected cards
  me = {}, //
  inviteData = {},
  socket,
  playerIndex,
  playerCardGroup,
  currentCardGroup,
  rootCardCount,
  specialCardType;
const responseTime = 15;
FBInstant.initializeAsync().then(function () {
  me = {
    uuid: FBInstant.player.getID().toString(),
    name: FBInstant.player.getName(),
    photo: FBInstant.player.getPhoto(),
    ready: false,
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
      this.load.bitmapFont(
        'atari',
        './assets/gothic.png',
        './assets/gothic.xml'
      );
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
      this.load.image('background', './assets/background.png');
      this.load.image('logo', './assets/logo.png');
      this.load.image('graphic', './assets/graphic.png');
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
      const background = this.add.image(0, 0, 'background').setOrigin(0, 0);
      const monster = this.add.image(
        (game.config.width / 4) * 3,
        game.config.height / 2,
        'graphic'
      );
      const logo = this.add
        .image(game.config.width / 12, game.config.height / 8, 'logo')
        .setScale(0.2);

      var postFxPlugin = this.plugins.get('rexoutlinepipelineplugin');

      socket.on('roomId', function (room) {
        inviteData.roomId = room._id;
      });
      socket.on('playerChange', (room) => {
        playerData = room.room_players;

        for (let i = 0; i < playerData.length; i++) {
          this.load.image(playerData[i].uuid, playerData[i].photo);
        }
        this.load.start();
        this.load.once('complete', renderPlayers, this);
        console.log(
          'Room',
          room._id + '\n' + JSON.stringify(room.room_players)
        );
        monster.setVisible(false);
        this.add.image(0, 0, 'table').setOrigin(0, 0);
      });
      socket.on('startGame', (room) => {
        const isMe = (element) => element.uuid == me.uuid;
        playerIndex = room.room_players.findIndex(isMe);
        console.log(room.room_players);
        this.add
          .image(
            game.config.width / 2 - 30,
            game.config.height / 3.125,
            room.room_specialCard
          )
          .setScale(0.25);
        rootCardCount = this.add
          .bitmapText(
            game.config.width / 2 + 30,
            game.config.height / 3.125 - 20,
            'atari',
            room.room_deck.length,
            40
          )
          .setTint(0xffffff);
        specialCardType =
          room.room_specialCard[room.room_specialCard.length - 1];
        playerCardGroup = this.add.group();
        currentCardGroup = this.add.group();
        playerScoreGroup = this.add.group();
        room.room_players[playerIndex].cards.forEach((element, i, cards) => {
          let cardObject = this.add
            .image(
              game.config.width / 2 - cards.length * 40 + i * 100,
              game.config.height / 1.25,
              element
            )
            .setScale(0.25)
            .setInteractive()
            .on('pointerover', () => {
              if (selectedCards.indexOf(element) == -1) cardObject.y -= 20;
            })
            .on('pointerout', () => {
              if (selectedCards.indexOf(element) == -1) cardObject.y += 20;
            });
          playerCardGroup.add(cardObject);
        });
        let j = 0;
        for (let i = playerIndex + 1; i < room.room_players.length; i++) {
          let scoreObject = this.add.bitmapText(
            playerPicturePos[j].x - 10,
            playerPicturePos[j].y + 60,
            'atari',
            room.room_players[i].score,
            20
          );
          playerScoreGroup.add(scoreObject);
          j++;
        }
        for (let i = 0; i < playerIndex; i++) {
          let scoreObject = this.add.bitmapText(
            playerPicturePos[j].x - 10,
            playerPicturePos[j].y + 60,
            'atari',
            room.room_players[i].score,
            20
          );
          playerScoreGroup.add(scoreObject);
          j++;
        }
        if (room.room_turn == me.uuid && room.room_stage == 'ready') {
          dropButton.setVisible(true);
          inButton.setVisible(true);
        }
      });
      socket.on('changeReady', (room) => {
        if (room.room_turn == me.uuid && room.room_stage == 'ready') {
          dropButton.setVisible(true);
          inButton.setVisible(true);
        } else if (room.room_turn == me.uuid && room.room_stage == 'change') {
          changeButton.setVisible(true);
        }
        // room.room_players.forEach((players, i) => {
        // });
      });
      socket.on('changeCards', (room) => {
        console.log(room.room_players);
        if (room.room_turn == me.uuid && room.room_stage == 'change') {
          changeButton.setVisible(true);
        } else if (room.room_turn == me.uuid && room.room_stage == 'put') {
          putButton.setVisible(true);
        } else if (
          room.room_turn == me.uuid &&
          room.room_stage == 'changeDealerCard'
        ) {
          dealerChangeButton.setVisible(true);
        }
        playerCards = room.room_players[playerIndex].cards;
        rootCardCount.setText(room.room_deck.length);
        playerCardGroup.clear(true);
        room.room_players[playerIndex].cards.forEach((element, i, cards) => {
          let cardObject = this.add
            .image(
              game.config.width / 2 - cards.length * 40 + i * 100,
              game.config.height / 1.25,
              element
            )
            .setScale(0.25)
            .setInteractive()
            .on('pointerover', () => {
              if (selectedCards.indexOf(element) == -1) cardObject.y -= 20;
            })
            .on('pointerout', () => {
              if (selectedCards.indexOf(element) == -1) cardObject.y += 20;
            });
          playerCardGroup.add(cardObject);
        });
      });
      socket.on('putCards', (room) => {
        console.log(room);
        if (room.room_turn == me.uuid && room.room_stage == 'put') {
          putButton.setVisible(true);
        }
        playerCards = room.room_players[playerIndex].cards;
        currentCards = room.room_currentCards;
        playerCardGroup.clear(true);
        room.room_players[playerIndex].cards.forEach((element, i, cards) => {
          let cardObject = this.add
            .image(
              game.config.width / 2 - cards.length * 40 + i * 100,
              game.config.height / 1.25,
              element
            )
            .setScale(0.25)
            .setInteractive()
            .on('pointerover', () => {
              if (selectedCards.indexOf(element) == -1) cardObject.y -= 20;
            })
            .on('pointerout', () => {
              if (selectedCards.indexOf(element) == -1) cardObject.y += 20;
            });
          playerCardGroup.add(cardObject);
        });
        currentCardGroup.clear(true);
        room.room_currentCards.forEach((element, i) => {
          currentCardGroup.add(
            this.add
              .image(
                game.config.width / 2 -
                  (room.room_currentCards.length - 1) * 10 +
                  i * 20,
                game.config.height / 2,
                element
              )
              .setScale(0.25)
          );
        });

        playerScoreGroup.clear(true);
        let j = 0;
        for (let i = playerIndex + 1; i < room.room_players.length; i++) {
          let scoreObject = this.add.bitmapText(
            playerPicturePos[j].x - 10,
            playerPicturePos[j].y + 60,
            'atari',
            room.room_players[i].score,
            20
          );
          playerScoreGroup.add(scoreObject);
          j++;
        }
        for (let i = 0; i < playerIndex; i++) {
          let scoreObject = this.add.bitmapText(
            playerPicturePos[j].x - 10,
            playerPicturePos[j].y + 60,
            'atari',
            room.room_players[i].score,
            20
          );
          playerScoreGroup.add(scoreObject);
          j++;
        }
      });
      socket.on('roundOver', (room) => {
        console.log(room);
        if (room.room_turn == me.uuid && room.room_stage == 'put') {
          putButton.setVisible(true);
        }
        playerCards = room.room_players[playerIndex].cards;
        currentCards = room.room_currentCards;
        selectedCards = [];
        playerCardGroup.clear(true);
        room.room_players[playerIndex].cards.forEach((element, i, cards) => {
          let cardObject = this.add
            .image(
              game.config.width / 2 - cards.length * 40 + i * 100,
              game.config.height / 1.25,
              element
            )
            .setScale(0.25)
            .setInteractive()
            .on('pointerover', () => {
              if (selectedCards.indexOf(element) == -1) cardObject.y -= 20;
            })
            .on('pointerout', () => {
              if (selectedCards.indexOf(element) == -1) cardObject.y += 20;
            });
          playerCardGroup.add(cardObject);
        });
        currentCardGroup.clear(true);
        room.room_prevCards.forEach((element, i, cards) => {
          currentCardGroup.add(
            this.add
              .image(
                game.config.width / 2 - (cards - 1) * 10 + i * 20,
                game.config.height / 2,
                element
              )
              .setScale(0.25)
          );
        });
        setTimeout(() => {
          currentCardGroup.clear(true);
        }, 1500);

        playerScoreGroup.clear(true);
        let j = 0;
        for (let i = playerIndex + 1; i < room.room_players.length; i++) {
          let scoreObject = this.add.bitmapText(
            playerPicturePos[j].x - 10,
            playerPicturePos[j].y + 60,
            'atari',
            room.room_players[i].score,
            20
          );
          playerScoreGroup.add(scoreObject);
          j++;
        }
        for (let i = 0; i < playerIndex; i++) {
          let scoreObject = this.add.bitmapText(
            playerPicturePos[j].x - 10,
            playerPicturePos[j].y + 60,
            'atari',
            room.room_players[i].score,
            20
          );
          playerScoreGroup.add(scoreObject);
          j++;
        }
      });
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
        .image(game.config.width / 1.3, game.config.height / 1.125, 'in')
        .setScale(0.5)
        .setInteractive()
        .setVisible(false);
      const dropButton = this.add
        .image(game.config.width / 1.1, game.config.height / 1.125, 'drop')
        .setScale(0.5)
        .setInteractive()
        .setVisible(false);
      const changeButton = this.add
        .image(game.config.width / 1.1, game.config.height / 1.125, 'change')
        .setScale(0.5)
        .setInteractive()
        .setVisible(false);
      const dealerChangeButton = this.add
        .image(
          game.config.width / 1.1,
          game.config.height / 1.125,
          'dealerchange'
        )
        .setScale(0.7)
        .setInteractive()
        .setVisible(false);
      const putButton = this.add
        .image(game.config.width / 1.09, game.config.height / 1.125, 'put')
        .setScale(0.7)
        .setInteractive()
        .setVisible(false);
      this.input.on('gameobjectdown', onObjectClicked);

      function onObjectClicked(pointer, gameObject) {
        let key = gameObject.texture.key;
        if (!key) return;

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
          socket.emit('changeReady', true);
        } else if (key === 'drop') {
          //send to server that player is in and increment skipCount to 0
          playerCardGroup.clear(true);
          dropButton.setVisible(false);
          inButton.setVisible(false);
          if (me.skipCount <= 3) socket.emit('changeReady', false);
        } else if (key === 'change') {
          if (selectedCards.length <= Number(rootCardCount.text)) {
            changeButton.setVisible(false);
            socket.emit('changeCards', selectedCards);
            playerCardGroup.children.entries.forEach((element1) => {
              selectedCards.forEach((element2) => {
                if (element1.texture.key == element2) {
                  element1.destroy();
                }
              });
            });
            selectedCards = [];
          }
        } else if (key === 'dealerchange') {
          if (selectedCards.length == 1) {
            dealerChangeButton.setVisible(false);
            socket.emit('changeDealerCard', selectedCards);
            playerCardGroup.children.entries.forEach((element) => {
              if (element.texture.key == selectedCards[0]) {
                element.destroy();
              }
            });
            selectedCards = [];
          }
        } else if (key === 'put') {
          if (selectedCards.length == 1) {
            putButton.setVisible(false);
            let cardIndex = findCardIndex(
              playerCards,
              currentCards,
              selectedCards[0]
            );

            socket.emit('putCards', {
              card: selectedCards[0],
              index: cardIndex,
            });
            selectedCards = [];
          }
        } else if (
          key[key.length - 1] === 'C' ||
          key[key.length - 1] === 'D' ||
          key[key.length - 1] === 'H' ||
          key[key.length - 1] === 'S'
        ) {
          selectedCards.push(key);
          console.log(selectedCards);
          postFxPlugin.add(gameObject, {
            thickness: 3,
            outlineColor: 0xffa500,
          });
        }
      }

      function findCardIndex(playerCards, currentPlayCards, selectedCard) {
        let card = selectedCard;
        let putCardType = selectedCard[selectedCard.length - 1];
        let putCardRank = parseInt(
          selectedCard.slice(0, selectedCard.length - 1)
        );
        let firstCardType = findFirstTypeIndex(
          currentPlayCards,
          specialCardType
        );
        let firstCard = currentPlayCards[firstCardIndex];
        playerCards.forEach((card, i, cards) => {
          let elementCard = card;
          let currentCardType = elementCard[elementCard.length - 1];
          // let currentCardRank = parseInt(
          //   elementCard.slice(0, elementCard.length - 1)
          // );
          // let firstCardRank = parseInt(
          //   firstCard.slice(0, firstCard.length - 1)
          // );
          if (firstCardType == currentCardType) {
            return true;
          }
        });
        return false;
      }

      function findFirstCard(cards, specialCardType) {
        for (i = cards.length - 1; i >= 0; i--) {
          let currentCardType = cards[i][cards[i].length - 1];
          if (currentCardType != specialCardType) {
            return currentCardType;
          }
        }
        return false;
      }
      const renderPlayers = () => {
        const isMe = (element) => element.uuid == me.uuid;
        playerIndex = playerData.findIndex(isMe);
        let j = 0;
        console.log(playerIndex);
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
