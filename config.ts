import Phaser from "phaser";
import GameScene from "./scenes/game";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 896,
  heigth: 448,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: GameScene,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 500 },
      debug: true
    }
  }
};

export default config;
