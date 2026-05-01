class BossEnemy extends EnemyBase {
    constructor(ctx, x, y, id, world) {
        const sequences = {
            idleLeft:   { x: 0,    y: 279,   width: 208, height: 93, count: 8, timing: 150, loop: true },
            idleRight:  { x: 1872, y: 837,   width: -208, height: 93, count: 8, timing: 150, loop: true },
            walkLeft:   { x: 0,    y: 465,  width: 208, height: 93, count: 8, timing: 100, loop: true },
            walkRight:  { x: 1872, y: 1023,  width: -208, height: 93, count: 8, timing: 100, loop: true },
            attackLeft: { x: 0,    y: 0, width: 208, height: 93, count: 10, timing: 120, loop: false },
            attackRight:{ x: 1872, y: 558, width: -208, height: 93, count: 10, timing: 120, loop: false },
            castLeft:   { x: 0,    y: 93, width: 208, height: 93, count: 9,  timing: 100, loop: false },
            castRight:  { x: 1872, y: 651, width: -208, height: 93, count: 9,  timing: 100, loop: false },
            hitLeft:    { x: 0,    y: 372, width: 208, height: 93, count: 3,  timing: 100, loop: false },
            hitRight:   { x: 1872, y: 930, width: -208, height: 93, count: 3,  timing: 100, loop: false },
            deathLeft:  { x: 0,    y: 186, width: 208, height: 93, count: 10, timing: 150, loop: false },
            deathRight: { x: 1872, y: 744, width: -208, height: 93, count: 10, timing: 150, loop: false }
        };

        super(ctx, x, y, id, world, {
            sheet: "images/boss_spritesheet.png",
            scale: 4,
            shadowScale: { x: 0, y: 0 },
            initialSequence: sequences.idleRight,
            sounds: {
                attack: new Audio("sounds/Attack.mp3"),
                damage: new Audio("sounds/bossDamage.mp3"),
                death:  new Audio("sounds/bossDie.mp3")
            },
            speed: 100,
            maxHealth: 800,
            maxPoise: 200,
            range: 200,
            attackDuration: 72,
            attackCooldown: 216,
            damageFrame: 36,
            damageAmount: 25,
            size: { hHalfSize: 100, vUpperSize: 34, vLowerSize: 186 },
            patrol: { xl: 400, xr: 1600 }
        });

        this.sequences = sequences;
        this.animationState = "idleRight";

        this.castCooldown = 0;
        this.castMaxCooldown = 600;
        this.isCasting = false;
        this.castDuration = 60;
        this.castDamageFrame = 50;
        this.castSound = new Audio("sounds/bossCast.mp3");

        this.lastAnimDir = this.animationDirection;
        this.dirShiftAmount = -100;
    }

    getAnimationState() {
        const dir = this.animationDirection == -1 ? "Left" : "Right";
        if (!this.alive) return `death${dir}`;
        if (this.recoverTimer > 0) return `hit${dir}`;
        if (this.isCasting) return `cast${dir}`;
        if (this.attackStanceTimer > 0) return `attack${dir}`;
        if (this.direction != 0) return `walk${dir}`;
        return `idle${dir}`;
    }

    cast() {
        if (this.recoverTimer > 0 || this.attackStanceTimer > 0 ||
            this.castCooldown > 0 || !this.alive) return;
        if (this.world.players.length === 0) return;

        this.isCasting = true;
        this.attackStanceTimer = this.castDuration;
        this.castCooldown = this.castMaxCooldown;
        this.animationDirection = this.animationDirection || 1;
        this.castSound.currentTime = 0;
        this.castSound.play().catch(() => {});
    }

    update(time) {
        if (!this.alive) {
            this.sprite.update(time);
            return;
        }

        if (!this.isCasting && this.attackStanceTimer == 0) {
            const { x, y } = this.sprite.getXY();
            if (this.recoverTimer == 0) {
                if (this.detectPlayer(this.direction, this.range)) {
                    this.attack();
                } else {
                    const forward  = this.direction == 1 ? this.patrolXR - x : x - this.patrolXL;
                    const backward = this.direction == 1 ? x - this.patrolXL : this.patrolXR - x;
                    if (!this.detectPlayer(this.direction, forward) && this.detectPlayer(-this.direction, backward)) {
                        this.move(-this.direction);
                    } else {
                        const newX = x + this.speed / 60 * this.direction;
                        if (newX > this.patrolXL && newX < this.patrolXR)
                            this.sprite.setXY(newX, y);
                        else
                            this.move(-this.direction);
                    }
                }
            }
        }

        if (this.cooldownTimer > 0) this.cooldownTimer--;
        if (this.attackStanceTimer > 0) {
            if (!this.isCasting && this.attackStanceTimer == this.damageFrame) {
                this.detectPlayer(this.direction, this.range, true);
            }
            if (this.isCasting && this.attackStanceTimer == this.castDamageFrame) {
                const alivePlayers = this.world.players.filter(p => p.alive);
                if (alivePlayers.length > 0) {
                    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                    this.world.cloudStrikes.push(
                        CloudStrike(this.ctx, target, this.world)
                    );
                }
            }
            this.attackStanceTimer--;
            if (this.isCasting && this.attackStanceTimer <= 0) {
                this.isCasting = false;
            }
        }
        if (this.recoverTimer > 0) this.recoverTimer--;
        if (this.castCooldown > 0) this.castCooldown--;

        if (this.recoverTimer == 0 && this.attackStanceTimer == 0 && !this.isCasting && this.alive) {
            if (!this.detectPlayer(this.direction, this.range) && this.castCooldown <= 0) {
                this.cast();
            }
        }

        this.updateAnimation();
        this.sprite.update(time);
    }
}

const Boss = function(ctx, x, y, id, world) {
    return new BossEnemy(ctx, x, y, id, world);
};