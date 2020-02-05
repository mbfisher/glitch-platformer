import Phaser from "phaser";

interface TileProps {
  color?: string;
}

const buttonColorFrames = {
  blue: 80,
  yellow: 82,
  green: 94,
  red: 96
};

const boxColorFrames = {
  blue: 6,
  yellow: 7,
  green: 20,
  red: 21
};

const keyColorFrames = {
  blue: 63,
  yellow: 64,
  green: 65,
  red: 66
};

const doorColorFrames = {
  blue: 90,
  yellow: 91,
  green: 92,
  red: 93
};

class GameScene extends Phaser.Scene {
  player: Phaser.Physics.Arcade.Sprite;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  spikes: Phaser.Physics.Arcade.StaticGroup;
  buttons: Phaser.Physics.Arcade.StaticGroup;
  blocks: Phaser.Physics.Arcade.StaticGroup;
  keys: Phaser.Physics.Arcade.StaticGroup;
  doors: Phaser.Physics.Arcade.StaticGroup;

  collectedKeys: string[] = [];

  respawning = false;
  complete = false;

  preload() {
    this.load.image("background", require("../assets/images/background.png"));
    this.load.image("spike", require("../assets/images/spike.png"));
    this.load.spritesheet("buttons", require("../assets/images/buttons.png"), {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.atlas(
      "player",
      require("../assets/images/kenney_player.png"),
      require("../assets/images/kenney_player_atlas.json")
    );
    this.load.image(
      "tiles",
      require("../assets/tilesets/platformPack_tilesheet.png")
    );
    this.load.spritesheet(
      "objects",
      require("../assets/tilesets/platformPack_tilesheet.png"),
      {
        frameWidth: 64,
        frameHeight: 64
      }
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
    console.log({ tileset });

    const platforms = map.createStaticLayer("Platforms", tileset, 0, 0);
    platforms.setCollisionByExclusion([-1]);

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

    const getTileProps: (
      object: Phaser.Types.Tilemaps.TiledObject
    ) => TileProps = object =>
      (tileset.getTileProperties(object.gid) || {}) as TileProps;

    this.buttons = this.physics.add.staticGroup();
    const buttonObjects = map.getObjectLayer("Buttons").objects;
    buttonObjects.forEach(buttonObject => {
      const props = getTileProps(buttonObject);

      const button: Phaser.Physics.Arcade.Sprite = this.buttons.create(
        buttonObject.x,
        buttonObject.y,
        "objects",
        buttonColorFrames[props.color]
      );
      button.setOrigin(0, 1);
      button.refreshBody();
      button.body.setSize(button.width, button.height / 2, false);
      button.body.setOffset(0, button.height / 2);

      button.setData(props);
    });

    this.blocks = this.physics.add.staticGroup();
    const blockObjects = map.getObjectLayer("Blocks").objects;
    blockObjects.forEach(blockObject => {
      const props = getTileProps(blockObject);

      const block: Phaser.Physics.Arcade.Sprite = this.blocks.create(
        blockObject.x,
        blockObject.y,
        "objects",
        boxColorFrames[props.color]
      );

      block.setOrigin(0, 1);
      block.refreshBody();
      block.setData(props);
    });

    this.keys = this.physics.add.staticGroup();
    const keyObjects = map.getObjectLayer("Keys").objects;
    keyObjects.forEach(keyObject => {
      const props = getTileProps(keyObject);

      const key = this.keys.create(
        keyObject.x,
        keyObject.y,
        "objects",
        keyColorFrames[props.color]
      );

      key.setOrigin(0, 1);
      key.refreshBody();
      key.body.setSize(keyObject.width / 2, keyObject.height / 2);
      key.setData(props);
    });

    this.doors = this.physics.add.staticGroup();
    const doorObjects = map.getObjectLayer("Doors").objects;
    doorObjects.forEach(doorObject => {
      const props = getTileProps(doorObject);

      const door: Phaser.Physics.Arcade.Sprite = this.doors.create(
        doorObject.x,
        doorObject.y,
        "objects",
        doorColorFrames[props.color]
      );
      door.setOrigin(0, 1);
      door.refreshBody();
      door.setData(props);
    });

    this.player = this.physics.add.sprite(448, 300, "player");
    this.player.body.setSize(64, 64).setOffset(16, 32);
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, platforms);

    this.physics.add.collider(
      this.player,
      this.spikes,
      this.spikeCollision,
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.buttons,
      this.buttonCollision,
      null,
      this
    );

    this.physics.add.collider(this.player, this.blocks);

    this.physics.add.overlap(
      this.player,
      this.keys,
      this.keyOverlap,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.doors,
      this.doorOverlap,
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

  buttonCollision(
    player: Phaser.Physics.Arcade.Sprite,
    button: Phaser.Physics.Arcade.Sprite
  ) {
    const currentFrame = parseInt(button.frame.name, 10);
    if (currentFrame % 2 === 1) {
      return;
    }
    if (player.body.touching.down && button.body.touching.up) {
      console.log({ button });
      button.setFrame(currentFrame + 1);
      // button.refreshBody();
      button.body.setSize(button.width, (button.height / 8) * 3, false);
      button.body.setOffset(0, (button.height / 8) * 5);

      const color = button.getData("color");
      this.blocks
        .getChildren()
        .filter(block => block.getData("color") === color)
        .forEach(object => object.destroy());
    }
  }

  keyOverlap(
    player: Phaser.Physics.Arcade.Sprite,
    key: Phaser.Physics.Arcade.Sprite
  ) {
    const color = key.getData("color");
    console.log(`Got the ${color} key`);
    this.collectedKeys.push(color);
    key.destroy();

    const door: any = this.doors
      .getChildren()
      .find(door => door.getData("color") === color);
    door.setFrame(89);
  }

  doorOverlap(
    player: Phaser.Physics.Arcade.Sprite,
    door: Phaser.Physics.Arcade.Sprite
  ) {
    const color = door.getData("color");
    if (
      !this.complete &&
      this.collectedKeys.includes(color) &&
      player.getCenter().x === door.getCenter().x
    ) {
      this.complete = true;
      alert("Complete!");
    }
  }
}

export default GameScene;
