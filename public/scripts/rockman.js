class RockmanPlayer extends PlayerBase {
    constructor(ctx, x, y, gameArea, world) {
        const sequences = {
            idleLeft:       { x: 1024, y: 1536, width: 256,  height: 256, count: 1, timing: 2000, loop: false },
            idleRight:      { x: 0,    y: 0,    width: 256,  height: 256, count: 1, timing: 2000, loop: false },

            idleShootLeft:  { x: 0,    y: 1792, width: 256,  height: 256, count: 1, timing: 2000, loop: false },
            idleShootRight: { x: 1024, y: 256,  width: 256,  height: 256, count: 1, timing: 2000, loop: false },

            moveLeft:       { x: 1024, y: 1792, width: -256, height: 256, count: 4, timing: 150,  loop: true },
            moveRight:      { x: 0,    y: 256,  width: 256,  height: 256, count: 4, timing: 150,  loop: true },

            moveShootLeft:  { x: 768,  y: 2048, width: -256, height: 256, count: 4, timing: 150,  loop: true },
            moveShootRight: { x: 256,  y: 512,  width: 256,  height: 256, count: 4, timing: 150,  loop: true },

            jumpLeft:       { x: 0,    y: 1536, width: 256,  height: 256, count: 1, timing: 2000, loop: false },
            jumpRight:      { x: 1024, y: 0,    width: 256,  height: 256, count: 1, timing: 2000, loop: false },

            jumpShootLeft:  { x: 1024, y: 2048, width: 256,  height: 256, count: 1, timing: 2000, loop: false },
            jumpShootRight: { x: 0,    y: 512,  width: 256,  height: 256, count: 1, timing: 2000, loop: false },

            recoverLeft:    { x: 768,  y: 2304, width: -256, height: 256, count: 2, timing: 100,  loop: true },
            recoverRight:   { x: 256,  y: 768,  width: 256,  height: 256, count: 2, timing: 100,  loop: true }
        };

        super(ctx, x, y, gameArea, world, {
            initialSequence: sequences.idleRight,
            sheet: "images/rockman_spritesheet.png",
            scale: 0.5,
            shadowScale: { x: 0, y: 0 },
            sounds: {
                buster: new Audio("sounds/MegaBuster.wav"),
                parry: new Audio("sounds/hero_parry.wav"),
                land: new Audio("sounds/MegamanLand.wav"),
                damage: new Audio("sounds/MegamanDamage.wav"),
                death: new Audio("sounds/MegamanDefeat.wav")
            },
            size: {
                hHalfSize: 25,
                vUpperSize: 30,
                vLowerSize: 55
            }
        });

        this.sequences = sequences;
        this.animationState = "idleRight";
    }

    canMove() {
        return this.recoverTimer == 0;
    }

    canJump() {
        return this.standing() && this.recoverTimer == 0 && this.enableJump && this.alive;
    }

    attack() {
        if (this.canAttack()) {
            this.enableAttack = false;
            this.attackStanceTimer = 20;
            this.cooldownTimer = 10;
            this.sounds.buster.currentTime = 0;
            this.sounds.buster.play().catch(() => {});
            const { x, y } = this.sprite.getXY();
            if (this.animationDirection == 1)
                this.world.bullets.push(Bullet(this.ctx, x + this.hHalfSize, y, this.animationDirection, this.isLocalPlayer, this.world));
            else
                this.world.bullets.push(Bullet(this.ctx, x - this.hHalfSize, y, this.animationDirection, this.isLocalPlayer, this.world));
        }
    }

    update(time) {
        if (!this.alive) {
            this.updateAnimation();
            this.sprite.update(time);
            return;
        }
        super.update(time);
    }

    updateAnimation() {
        if (!this.alive) {
            const seqName = this.animationDirection == -1 ? "recoverLeft" : "recoverRight";
            if (this.animationState !== seqName) {
                this.sprite.setSequence(this.sequences[seqName]);
                this.animationState = seqName;
            }
            return;
        }
        super.updateAnimation();
    }

    getAnimationState() {
        const dir = this.animationDirection == -1 ? "Left" : "Right";
        if (this.recoverTimer > 0)        return `recover${dir}`;
        if (!this.standing())             return this.attackStanceTimer > 0 ? `jumpShoot${dir}` : `jump${dir}`;
        if (this.direction != 0)          return this.attackStanceTimer > 0 ? `moveShoot${dir}` : `move${dir}`;
        return this.attackStanceTimer > 0 ? `idleShoot${dir}` : `idle${dir}`;
    }
}

const Rockman = function(ctx, x, y, gameArea, world) {
    return new RockmanPlayer(ctx, x, y, gameArea, world);
};
