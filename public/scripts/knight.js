// knight.js
class KnightPlayer extends PlayerBase {
    constructor(ctx, x, y, gameArea, world) {
        const sequences = {
            idleRight:   { x: 0,    y: 0,     width: 96, height: 84, count: 7,  timing: 200, loop: true },
            idleLeft:    { x: 1056, y: 504,   width: -96, height: 84, count: 7,  timing: 200, loop: true },
            runRight:    { x: 0,    y: 84,    width: 96, height: 84, count: 8,  timing: 100, loop: true },
            runLeft:     { x: 1056, y: 588,   width: -96, height: 84, count: 8,  timing: 100, loop: true },
            jumpRight:   { x: 0,    y: 168,   width: 96, height: 84, count: 5,  timing: 200, loop: false },
            jumpLeft:    { x: 1056, y: 672,   width: -96, height: 84, count: 5,  timing: 200, loop: false },
            attackRight: { x: 0,    y: 252,   width: 96, height: 84, count: 6,  timing: 100, loop: true },
            attackLeft:  { x: 1056, y: 756,   width: -96, height: 84, count: 6,  timing: 100, loop: true },
            hurtRight:   { x: 0,    y: 336,   width: 96, height: 84, count: 4,  timing: 100, loop: false },
            hurtLeft:    { x: 1056, y: 840,   width: -96, height: 84, count: 4,  timing: 100, loop: false },
            deathRight:  { x: 0,    y: 420,   width: 96, height: 84, count: 12, timing: 200, loop: false },
            deathLeft:   { x: 1056, y: 924,   width: -96, height: 84, count: 12, timing: 200, loop: false },
            guardRight:  { x: 0,    y: 1008,  width: 96, height: 84, count: 6,  timing: 100, loop: false },
            guardLeft:   { x: 1056, y: 1090,  width: -96, height: 84, count: 6,  timing: 100, loop: false }
        };

        super(ctx, x, y, gameArea, world, {
            initialSequence: sequences.idleRight,
            sheet: "images/knight.png",
            scale: 3,
            shadowScale: { x: 0, y: 0 },
            sounds: {
                attack: new Audio("sounds/KnightAttack.wav"),
                parry:  new Audio("sounds/hero_parry.wav"),
                land:   new Audio("sounds/hero_land_soft.wav"),
                damage: new Audio("sounds/hero_damage.wav"),
                death:  new Audio("sounds/KnightDie.wav")
            },
            size: {
                hHalfSize: 25,
                vUpperSize: 30,
                vLowerSize: 55
            }
        });

        this.sequences = sequences;
        this.attackRange = 150;

        this.ATTACK_FRAMES = 36;
        this.meleeDamageFrame = 6;

        this.enableAttack = true;
        this.damageApplied = false;

        this.isGuarding = false;
        this.enableGuard = true;

        this.animationState = "";
        this.deathPlayed = false;
    }

    canMove() {
        return this.recoverTimer == 0 && !this.isGuarding && this.attackStanceTimer == 0;
    }

    canJump() {
        return this.standing() && this.recoverTimer == 0 &&
               this.attackStanceTimer == 0 && !this.isGuarding &&
               this.enableJump && this.alive;
    }

    attack() {
        if (this.canAttack()) {
            this.attackStanceTimer = this.ATTACK_FRAMES;
            this.cooldownTimer = this.ATTACK_FRAMES;
            this.damageApplied = false;
        }
    }
    
    takeDamage(damage) {
        if (this.isGuarding) {
            this.sounds.parry.currentTime = 0;
            this.sounds.parry.play();
            return;
        }
        super.takeDamage(damage);
    }

    guard() {
        if (this.recoverTimer == 0 && this.attackStanceTimer == 0 && this.alive && this.enableGuard) {
            this.enableGuard = false;
            this.isGuarding = true;
            this.velocityY = 0;
            this.direction = 0;
        }
    }

    stopGuard() {
        this.isGuarding = false;
        this.enableGuard = true;
    }

    applyMeleeDamage() {
        let { x, y } = this.sprite.getXY();
        let detector;
        if (this.animationDirection == 1) {
            detector = BoundingBox(this.ctx, y - 30, x, y + 30, x + this.attackRange);
        } else {
            detector = BoundingBox(this.ctx, y - 30, x - this.attackRange, y + 30, x);
        }
        for (const enemy of this.world.enemies) {
            if (enemy.isAlive && enemy.isAlive() && enemy.getBoundingBox &&
                enemy.getBoundingBox().intersect(detector)) {
                enemy.takeDamage(50, 50, this.isLocalPlayer);
                break;
            }
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
            if (!this.deathPlayed) {
                const seqName = (this.animationDirection == -1) ? "deathLeft" : "deathRight";
                this.sprite.setSequence(this.sequences[seqName]);
                this.deathPlayed = true;
                this.animationState = seqName;
            }
            return;
        }

        const wasAttacking = this.attackStanceTimer > 0;
        if (wasAttacking) {
            if (this.attackStanceTimer == this.meleeDamageFrame) {
                this.sounds.attack.currentTime = 0;
                this.sounds.attack.play();
                this.applyMeleeDamage();
            }
            this.attackStanceTimer--;
        }

        if (this.isGuarding) {
            const seqName = (this.animationDirection == -1) ? "guardLeft" : "guardRight";
            if (this.animationState !== seqName) {
                this.sprite.setSequence(this.sequences[seqName]);
                this.animationState = seqName;
            }
            return;
        }

        let targetState;
        if (this.recoverTimer > 0) {
            targetState = (this.animationDirection == -1) ? "hurtLeft" : "hurtRight";
        } else if (wasAttacking) {
            targetState = (this.animationDirection == -1) ? "attackLeft" : "attackRight";
        } else if (!this.standing()) {
            targetState = (this.animationDirection == -1) ? "jumpLeft" : "jumpRight";
        } else if (this.direction != 0) {
            targetState = (this.animationDirection == -1) ? "runLeft" : "runRight";
        } else {
            targetState = (this.animationDirection == -1) ? "idleLeft" : "idleRight";
        }

        if (this.animationState !== targetState) {
            this.animationState = targetState;
            this.sprite.setSequence(this.sequences[targetState]);
        }
    }
}

const Knight = function(ctx, x, y, gameArea, world) {
    return new KnightPlayer(ctx, x, y, gameArea, world);
};