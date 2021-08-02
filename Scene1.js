class Scene1 extends Phaser.scene {
  constructor() {
    super('bootGame');
  }
  create() {
    const joinRoomButton = this.add
      .text(200, 300, 'READY', { fill: '#fff' })
      .setInteractive();
    joinRoomButton.on('pointerdown', () => {
      socket.emit('playerStateChange', true);
    });
    const createRoomBottom = this.add
      .text(200, 200, 'CREATE LOBBY', { fill: '#fff' })
      .setInteractive();
    createRoomBottom.on('pointerdown', () => {
      me.count = 2;
      socket.emit('findRoom', me);
    });
  }
}
