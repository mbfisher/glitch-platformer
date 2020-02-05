import Phaser from "phaser";

class GameScene extends Phaser.Scene {
  player: Phaser.Physics.Arcade.Sprite;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  spikes: Phaser.Physics.Arcade.StaticGroup;

  respawning = false;

  preload() {
    this.load.image("background", require("../assets/images/background.png"));
    this.load.image("spike", require("../assets/images/spike.png"));
    this.load.atlas(
      "player",
      require("../assets/images/kenney_player.png"),
      require("../assets/images/kenney_player_atlas.json")
    );
    this.load.image(
      "tiles",
      require("../assets/tilesets/platformPack_tilesheet.png")
    );
    this.load.tilemapTiledJSON(
      "map",
      require("../assets/tilemaps/level1.json")
    );
  }

  create() {
    const backgroundImage = this.add.image(0, 0, "background").setOrigin(0, 0);
    backgroundImage.setScale(2, 0.8);

    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("kenny_simple_platformer", "tiles");

    const platforms = map.createStaticLayer("Platforms", tileset, 0, 0);
    platforms.setCollisionByExclusion([-1]);

    this.player = this.physics.add.sprite(448, 300, "player");
    this.player.body.setSize(64, 64).setOffset(16, 32);
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, platforms);

    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNames("player", {
        prefix: "robo_player_",
        start: 2,
        end: 3
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "idle",
      frames: [{ key: "player", frame: "robo_player_0" }],
      frameRate: 10
    });

    this.anims.create({
      key: "jump",
      frames: [{ key: "player", frame: "robo_player_1" }],
      frameRate: 10
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.spikes = this.physics.add.staticGroup();
    const spikeObjects = map.getObjectLayer("Spikes").objects;
    spikeObjects.forEach(spikeObject => {
      const spike: Phaser.Physics.Arcade.Sprite = this.spikes.create(
        spikeObject.x,
        spikeObject.y,
        "spike"
      );
      spike.setOrigin(0, 1);
      spike.body.setOffset(spikeObject.width / 2, 0);
    });

    this.physics.add.collider(
      this.player,
      this.spikes,
      this.spikeCollision,
      null,
      this
    );
  }

  update() {
    if (this.respawning) {
      return;
    }

    const onFloor = (this.player.body as Phaser.Physics.Arcade.Body).onFloor();

    // Control the player with left or right keys
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
      if (onFloor) {
        this.player.play("walk", true);
      }
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
      if (onFloor) {
        this.player.play("walk", true);
      }
    } else {
      // If no keys are pressed, the player keeps still
      this.player.setVelocityX(0);
      // Only show the idle animation if the player is footed
      // If this is not included, the player would look idle while jumping
      if (onFloor) {
        this.player.play("idle", true);
      }
    }

    // Player can jump while walking any direction by pressing the space bar
    // or the 'UP' arrow
    if ((this.cursors.space.isDown || this.cursors.up.isDown) && onFloor) {
      this.player.setVelocityY(-400);
      this.player.play("jump", true);
    }

    if (this.player.body.velocity.x > 0) {
      this.player.setFlipX(false);
    } else if (this.player.body.velocity.x < 0) {
      // otherwise, make them face the other side
      this.player.setFlipX(true);
    }
  }

  spikeCollision(
    player: Phaser.Physics.Arcade.Sprite,
    spike: Phaser.Physics.Arcade.Sprite
  ) {
    player.setVelocity(0, 0);
    player.setX(448);
    player.setY(300);
    player.play("idle", true);
    player.setTint(0xff0000);

    this.respawning = true;
    setTimeout(() => {
      player.clearTint();
      this.respawning = false;
    }, 1000);
  }
}

export default GameScene;
