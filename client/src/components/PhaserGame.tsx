import { useEffect, useRef } from "react";
import Phaser from "phaser";

interface PhaserGameProps {
  onGameOver: (score: number) => void;
  onScoreUpdate?: (score: number) => void;
  selectedSkin?: string;
}

// Skin color mappings
const SKIN_COLORS: Record<string, number> = {
  "runner-blue": 0x00ccff,
  "runner-red": 0xff3333,
  "runner-green": 0x00ff00,
  "runner-yellow": 0xffff00,
  "runner-purple": 0xff00ff,
  "runner-orange": 0xff9900,
};

// Helper function for level messages
function getLevelMessage(level: number): string {
  const messages: Record<number, string> = {
    1: "Welcome! Jump over Spikes!",
    2: "Watch Out! Sliding Required!",
    3: "New Challenge: Avoid the Void!",
    4: "Double Trouble Ahead!",
    5: "ULTIMATE: Moving Barriers!"
  };
  return messages[level] || "Keep Going!";
}

export default function PhaserGame({ onGameOver, onScoreUpdate, selectedSkin = "runner-blue" }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // CRITICAL FIX: Store callbacks in a ref so we can access the latest version
  // inside Phaser without restarting the game via useEffect dependencies.
  const callbacksRef = useRef({ onGameOver, onScoreUpdate });

  // Keep the refs updated whenever props change
  useEffect(() => {
    callbacksRef.current = { onGameOver, onScoreUpdate };
  }, [onGameOver, onScoreUpdate]);
  
  // Store selectedSkin in ref to access in Phaser
  const selectedSkinRef = useRef(selectedSkin);
  useEffect(() => {
    selectedSkinRef.current = selectedSkin;
  }, [selectedSkin]);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: typeof window !== "undefined" ? Math.min(window.innerWidth, 1024) : 1024,
      height: 600,
      backgroundColor: '#1a1a2e',
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 1600 },
          debug: false,
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    // Game internal state
    const gameState = {
      score: 0,
      coins: 0,
      isGameOver: false,
      isSliding: false,
      lastSpawnTime: 0,
      spawnDelay: 1200,
      gameSpeed: 420,
      lastCoinSpawnTime: 0,
      coinSpawnDelay: 1700,
      currentLevel: 1,
      levelDistance: 0,
    };

    function preload(this: Phaser.Scene) {
      // 1. Player (Runner with skin color)
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      
      const currentSkin = selectedSkinRef.current;
      const shirtColor = SKIN_COLORS[currentSkin] || SKIN_COLORS["runner-blue"];
      
      const skinColor = 0xffdbac;
      const skinColorDark = 0xe6c89a;
      const hairColor = 0x4a3728;
      const eyeColor = 0x000000;
      
      graphics.fillStyle(shirtColor, 1);
      graphics.fillRect(8, 18, 16, 14);
      
      graphics.fillStyle(skinColor, 1);
      graphics.fillRect(10, 4, 12, 12);
      
      graphics.fillStyle(hairColor, 1);
      graphics.fillRect(10, 4, 12, 6);
      
      graphics.fillStyle(eyeColor, 1);
      graphics.fillRect(12, 8, 2, 2);
      graphics.fillRect(18, 8, 2, 2);
      
      graphics.fillStyle(skinColor, 1);
      graphics.fillRect(4, 18, 4, 10);
      graphics.fillRect(24, 18, 4, 10);
      
      graphics.fillStyle(skinColorDark, 1);
      graphics.fillRect(10, 32, 5, 8);
      graphics.fillRect(17, 32, 5, 8);
      
      graphics.fillStyle(0x000000, 0.2);
      graphics.fillRect(10, 4, 12, 2);
      graphics.fillRect(8, 18, 16, 2);
      
      graphics.generateTexture("player", 32, 40);
      graphics.destroy();

      // 2. Ground
      const groundGraphics = this.make.graphics({ x: 0, y: 0 }, false);
      groundGraphics.fillStyle(0x0f0f1a, 1);
      groundGraphics.fillRect(0, 0, 64, 64);
      groundGraphics.lineStyle(2, 0xbc13fe, 1); 
      groundGraphics.beginPath();
      groundGraphics.moveTo(0, 0);
      groundGraphics.lineTo(64, 0);
      groundGraphics.strokePath();
      groundGraphics.generateTexture("ground", 64, 64);
      groundGraphics.destroy();

      // 3. Obstacle
      const obsGraphics = this.make.graphics({ x: 0, y: 0 }, false);
      obsGraphics.fillStyle(0xff2a6d, 1);
      obsGraphics.fillRect(0, 0, 32, 64);
      obsGraphics.fillStyle(0x000000, 0.3);
      obsGraphics.fillRect(4, 4, 24, 56);
      obsGraphics.generateTexture("obstacle", 32, 64);
      obsGraphics.destroy();

      // 4. Overhang (Must slide under)
      const overhangGraphics = this.make.graphics({ x: 0, y: 0 }, false);
      overhangGraphics.fillStyle(0x3a3d8f, 1);
      overhangGraphics.fillRect(0, 0, 140, 60);
      overhangGraphics.fillStyle(0x5b5ef5, 1);
      overhangGraphics.fillRect(4, 4, 132, 52);
      // Metallic highlight
      overhangGraphics.fillStyle(0x8b8ef9, 1);
      overhangGraphics.fillRect(8, 8, 124, 20);
      // Bottom shadow
      overhangGraphics.fillStyle(0x000000, 0.5);
      overhangGraphics.fillRect(0, 48, 140, 12);
      // Warning stripes on bottom
      overhangGraphics.fillStyle(0xffff00, 1);
      for (let i = 0; i < 140; i += 20) {
        overhangGraphics.fillRect(i, 52, 10, 6);
      }
      overhangGraphics.generateTexture("overhang", 140, 60);
      overhangGraphics.destroy();

      // 5. Ground void (Deadly pit with realistic depth)
      const voidGraphics = this.make.graphics({ x: 0, y: 0 }, false);
      const voidWidth = 180;
      const voidHeight = 80;
      
      // Deep black pit
      voidGraphics.fillStyle(0x000000, 1);
      voidGraphics.fillRect(0, 0, voidWidth, voidHeight);
      
      // Gradient layers for depth
      voidGraphics.fillStyle(0x0a0a0f, 0.8);
      voidGraphics.fillRect(10, 10, voidWidth - 20, voidHeight - 20);
      
      voidGraphics.fillStyle(0x050508, 0.9);
      voidGraphics.fillRect(20, 20, voidWidth - 40, voidHeight - 40);
      
      // Red danger glow from bottom
      voidGraphics.fillStyle(0xff0000, 0.2);
      voidGraphics.fillRect(0, voidHeight - 20, voidWidth, 20);
      
      // Left edge highlight (ground edge)
      voidGraphics.fillStyle(0x4a4a5a, 1);
      voidGraphics.fillRect(0, 0, 6, voidHeight);
      voidGraphics.fillStyle(0x2a2a3a, 1);
      voidGraphics.fillRect(6, 0, 4, voidHeight);
      
      // Right edge highlight
      voidGraphics.fillStyle(0x4a4a5a, 1);
      voidGraphics.fillRect(voidWidth - 6, 0, 6, voidHeight);
      voidGraphics.fillStyle(0x2a2a3a, 1);
      voidGraphics.fillRect(voidWidth - 10, 0, 4, voidHeight);
      
      // Danger border glow
      voidGraphics.lineStyle(3, 0xff0033, 0.8);
      voidGraphics.strokeRect(2, 2, voidWidth - 4, voidHeight - 4);
      
      // Warning animation effect (zigzag pattern)
      voidGraphics.lineStyle(2, 0xffff00, 0.6);
      for (let i = 0; i < voidWidth; i += 20) {
        voidGraphics.beginPath();
        voidGraphics.moveTo(i, 0);
        voidGraphics.lineTo(i + 10, 10);
        voidGraphics.lineTo(i + 20, 0);
        voidGraphics.strokePath();
      }
      
      voidGraphics.generateTexture("void", voidWidth, voidHeight);
      voidGraphics.destroy();

      // 6. Coin
      const coinGraphics = this.make.graphics({ x: 0, y: 0 }, false);
      coinGraphics.fillStyle(0xffd700, 1);
      coinGraphics.fillCircle(16, 16, 14);
      coinGraphics.lineStyle(4, 0xffa500, 1);
      coinGraphics.strokeCircle(16, 16, 14);
      coinGraphics.fillStyle(0xffa500, 1);
      coinGraphics.fillRect(14, 6, 4, 20);
      coinGraphics.generateTexture("coin", 32, 32);
      coinGraphics.destroy();

      // 7. Particle
      const pGraphics = this.make.graphics({ x: 0, y: 0 }, false);
      pGraphics.fillStyle(0xffffff, 1);
      pGraphics.fillCircle(4, 4, 4);
      pGraphics.generateTexture("particle", 8, 8);
      pGraphics.destroy();

      // 8. Double Spike
      const doubleSpikeGraphics = this.make.graphics({ x: 0, y: 0 }, false);
      doubleSpikeGraphics.fillStyle(0x8a0e2e, 1);
      doubleSpikeGraphics.fillRect(0, 0, 28, 64);
      doubleSpikeGraphics.fillStyle(0xff2a6d, 1);
      doubleSpikeGraphics.fillRect(3, 0, 22, 64);
      doubleSpikeGraphics.fillStyle(0x1a1a2e, 1);
      doubleSpikeGraphics.fillRect(28, 0, 16, 64);
      doubleSpikeGraphics.fillStyle(0x8a0e2e, 1);
      doubleSpikeGraphics.fillRect(44, 0, 28, 64);
      doubleSpikeGraphics.fillStyle(0xff2a6d, 1);
      doubleSpikeGraphics.fillRect(47, 0, 22, 64);
      doubleSpikeGraphics.generateTexture("doubleSpike", 72, 64);
      doubleSpikeGraphics.destroy();

      // 9. Moving Barrier
      const barrierGraphics = this.make.graphics({ x: 0, y: 0 }, false);
      barrierGraphics.fillStyle(0xff6600, 1);
      barrierGraphics.fillRect(0, 0, 32, 120);
      barrierGraphics.fillStyle(0xff9933, 1);
      barrierGraphics.fillRect(4, 0, 24, 120);
      for (let i = 0; i < 120; i += 30) {
        barrierGraphics.fillStyle(0x000000, 0.3);
        barrierGraphics.fillRect(0, i, 32, 4);
      }
      barrierGraphics.generateTexture("barrier", 32, 120);
      barrierGraphics.destroy();
    }

    function create(this: Phaser.Scene) {
      const gameWidth = this.scale.width;
      const gameHeight = this.scale.height;

      this.add.rectangle(0, 0, gameWidth, gameHeight, 0x1a1a2e).setOrigin(0, 0);
      
      const floorHeight = 50;
      const floorY = gameHeight - floorHeight;

      const ground = this.add.tileSprite(gameWidth / 2, gameHeight - 25, gameWidth, 50, "ground");
      
      const platforms = this.physics.add.staticGroup();
      const floorBody = platforms.create(gameWidth / 2, gameHeight - 25, "ground");
      floorBody.setScale(20, 1).refreshBody();
      floorBody.setVisible(false);

      const player = this.physics.add.sprite(100, floorY - 100, "player");
      player.setScale(1.5);
      player.setBounce(0);
      player.setCollideWorldBounds(true);
      player.setSize(24, 34);
      player.setOffset(4, 6);
      
      this.physics.add.collider(player, platforms);

      const particles = this.add.particles(0, 0, "particle", {
        speed: { min: -100, max: 0 },
        angle: { min: 180, max: 270 },
        scale: { start: 0.4, end: 0 },
        lifespan: 300,
        gravityY: -500,
      } as any);
      particles.stop();
      particles.startFollow(player, -10, 24);

      let slideTimer: Phaser.Time.TimerEvent | null = null;
      const enterSlide = () => {
        if (gameState.isGameOver || gameState.isSliding || !player.body?.touching.down) return;
        gameState.isSliding = true;
        player.setSize(24, 20);
        player.setOffset(4, 26);
        player.setScale(1.5, 1.05);
        slideTimer?.remove(false);
        slideTimer = this.time.addEvent({
          delay: 600,
          callback: exitSlide,
        });
      };

      const exitSlide = () => {
        if (!gameState.isSliding) return;
        gameState.isSliding = false;
        player.setSize(24, 34);
        player.setOffset(4, 6);
        player.setScale(1.5);
      };

      const downKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      const sKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      downKey?.on("down", enterSlide);
      sKey?.on("down", enterSlide);
      downKey?.on("up", exitSlide);
      sKey?.on("up", exitSlide);

      const obstacles = this.physics.add.group();
      this.physics.add.collider(obstacles, platforms);

      const coins = this.physics.add.group();
      coins.classType = Phaser.Physics.Arcade.Sprite;

      const scoreText = this.add.text(20, 20, "COINS: 0", {
        fontSize: "32px",
        color: "#00f3ff",
        fontFamily: "Courier",
        fontStyle: "bold"
      }).setDepth(10);

      const levelText = this.add.text(20, 60, "LEVEL: 1", {
        fontSize: "28px",
        color: "#ffff00",
        fontFamily: "Courier",
        fontStyle: "bold"
      }).setDepth(10);

      const distanceText = this.add.text(20, 95, "DISTANCE: 0m", {
        fontSize: "22px",
        color: "#ffffff",
        fontFamily: "Courier",
        fontStyle: "bold"
      }).setDepth(10);

      const jump = () => {
        if (gameState.isGameOver) return;
        
        if (player.body?.touching.down) {
            player.setVelocityY(-600);
            particles.stop();
        }
      };

      this.input.on("pointerdown", jump);
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on("down", jump);
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on("down", jump);

      this.physics.add.collider(player, obstacles, () => {
        if (gameState.isGameOver) return;

        gameState.isGameOver = true;
        this.physics.pause();
        player.setTint(0xff0000);
        
        this.cameras.main.shake(500, 0.02);
        
        this.add.text(gameWidth/2, gameHeight/2, "GAME OVER", {
            fontSize: "64px",
            color: "#ff2a6d",
            fontStyle: "bold",
            backgroundColor: "#000000"
        }).setOrigin(0.5).setPadding(20).setDepth(20);

        if (callbacksRef.current.onGameOver) {
            callbacksRef.current.onGameOver(gameState.coins);
        }
      });

      this.physics.add.overlap(player, coins, (_player, coin) => {
        const coinSprite = coin as Phaser.Physics.Arcade.Sprite;
        if (!coinSprite || !coinSprite.body || gameState.isGameOver) return;
        coinSprite.disableBody(true, true);
        gameState.coins += 1;
        scoreText.setText(`COINS: ${gameState.coins}`);
        if (callbacksRef.current.onScoreUpdate) {
          callbacksRef.current.onScoreUpdate(gameState.coins);
        }
      });

      (this as any).gameState = gameState;
      (this as any).ground = ground;
      (this as any).obstacles = obstacles;
      (this as any).coins = coins;
      (this as any).player = player;
      (this as any).scoreText = scoreText;
      (this as any).levelText = levelText;
      (this as any).distanceText = distanceText;
      (this as any).particles = particles;
      (this as any).floorY = floorY;
    }

    function spawnObstacle(scene: Phaser.Scene, state: any, obstacles: any, floorY: number) {
      const level = state.currentLevel;
      let obstacleType: number;
      
      if (level === 1) {
        obstacleType = Phaser.Math.Between(0, 2);
      } else if (level === 2) {
        obstacleType = Phaser.Math.Between(0, 3);
      } else if (level >= 3) {
        obstacleType = Phaser.Math.Between(0, 4);
      } else {
        obstacleType = 0;
      }

      if (obstacleType === 0) {
        const obstacleHeight = 64;
        const spawnY = floorY - obstacleHeight / 2;
        const obstacle = obstacles.create(scene.scale.width + 50, spawnY, "obstacle");
        obstacle.setImmovable(true);
        obstacle.body.setAllowGravity(false);
        obstacle.setVelocityX(-state.gameSpeed);
        obstacle.setSize(20, 60);
        
      } else if (obstacleType === 1) {
        const overhang = obstacles.create(scene.scale.width + 80, floorY - 80, "overhang");
        overhang.setImmovable(true);
        overhang.body.setAllowGravity(false);
        overhang.setVelocityX(-state.gameSpeed);
        overhang.setSize(130, 46);
        
      } else if (obstacleType === 2) {
        const voidZone = obstacles.create(scene.scale.width + 90, floorY + 25, "void");
        voidZone.setImmovable(true);
        voidZone.body.setAllowGravity(false);
        voidZone.setVelocityX(-state.gameSpeed);
        voidZone.setSize(170, 70);
        voidZone.setOffset(5, 5);
        
      } else if (obstacleType === 3 && level >= 2) {
        const doubleSpike = obstacles.create(scene.scale.width + 60, floorY - 32, "doubleSpike");
        doubleSpike.setImmovable(true);
        doubleSpike.body.setAllowGravity(false);
        doubleSpike.setVelocityX(-state.gameSpeed);
        doubleSpike.setSize(66, 60);
        
      } else if (obstacleType === 4 && level >= 3) {
        const barrier = obstacles.create(scene.scale.width + 70, floorY - 60, "barrier");
        barrier.setImmovable(true);
        barrier.body.setAllowGravity(false);
        barrier.setVelocityX(-state.gameSpeed);
        barrier.setSize(28, 110);
        
        scene.tweens.add({
          targets: barrier,
          y: floorY - 160,
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }

    function update(this: Phaser.Scene, time: number, delta: number) {
      const state = (this as any).gameState;
      
      if (state.isGameOver) return;

      const ground = (this as any).ground;
      const obstacles = (this as any).obstacles;
      const player = (this as any).player;
      const scoreText = (this as any).scoreText;
      const levelText = (this as any).levelText;
      const distanceText = (this as any).distanceText;
      const particles = (this as any).particles;
      const floorY = (this as any).floorY;
      const coins = (this as any).coins;

      ground.tilePositionX += (state.gameSpeed * delta) / 1000;

      if (player.body?.touching.down) {
          particles.start();
      } else {
          particles.stop();
      }

      state.score += 1;
      state.levelDistance += 1;
      const displayScore = Math.floor(state.score / 10);
      
      distanceText.setText(`DISTANCE: ${displayScore}m`);

      const LEVEL_THRESHOLD = 500;
      const newLevel = Math.floor(state.levelDistance / LEVEL_THRESHOLD) + 1;
      
      if (newLevel > state.currentLevel && newLevel <= 5) {
        state.currentLevel = newLevel;
        levelText.setText(`LEVEL: ${state.currentLevel}`);
        
        const levelUpText = this.add.text(
          this.scale.width / 2,
          this.scale.height / 2 - 50,
          `LEVEL ${state.currentLevel}!`,
          {
            fontSize: "72px",
            color: "#ffff00",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 8
          }
        ).setOrigin(0.5).setDepth(100);
        
        const levelSubText = this.add.text(
          this.scale.width / 2,
          this.scale.height / 2 + 30,
          getLevelMessage(state.currentLevel),
          {
            fontSize: "24px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
          }
        ).setOrigin(0.5).setDepth(100);
        
        this.cameras.main.flash(300, 255, 255, 0);
        
        this.tweens.add({
          targets: [levelUpText, levelSubText],
          alpha: 0,
          y: "-=50",
          duration: 2000,
          delay: 1000,
          onComplete: () => {
            levelUpText.destroy();
            levelSubText.destroy();
          }
        });
      }

      const difficultyMult = 1 + (displayScore / 700);
      state.gameSpeed = 420 * difficultyMult;

      const currentSpawnDelay = state.spawnDelay / difficultyMult;
      
      if (time - state.lastSpawnTime > currentSpawnDelay) {
        spawnObstacle(this, state, obstacles, floorY);
        state.lastSpawnTime = time;
        state.spawnDelay = Phaser.Math.Between(900, 1700);
      }

      obstacles.children.entries.forEach((obs: any) => {
        if (obs.x < -200) {
            obs.destroy();
        } else {
            obs.setVelocityX(-state.gameSpeed);
        }
      });

      const currentCoinDelay = state.coinSpawnDelay / (1 + displayScore / 1200);
      if (time - state.lastCoinSpawnTime > currentCoinDelay) {
        const coinY = Phaser.Math.Between(floorY - 180, floorY - 80);
        const coin = coins.create(this.scale.width + 50, coinY, "coin") as Phaser.Physics.Arcade.Sprite;
        coin.setVelocityX(-state.gameSpeed);
        if (coin.body) {
          (coin.body as Phaser.Physics.Arcade.Body).allowGravity = false;
        }
        coin.setCircle(14, 2, 2);
        state.lastCoinSpawnTime = time;
        state.coinSpawnDelay = Phaser.Math.Between(800, 1800);
      }

      coins.children.entries.forEach((coin: any) => {
        if (coin.x < -100) {
          coin.destroy();
        } else {
          coin.setVelocityX(-state.gameSpeed);
        }
      });
    }

    gameRef.current = new Phaser.Game(config);

    const handleResize = () => {
      if (gameRef.current) {
        const width = Math.min(window.innerWidth, 1024);
        gameRef.current.scale.resize(width, 600);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center items-center rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800"
      style={{ minHeight: '600px' }}
    />
  );
}