// knight.js
class KnightPlayer extends PlayerBase {
    constructor(ctx, x, y, gameArea, world) {
        const sequences = {
            idleRight:   { x: 0,    y: 0,    width: 96,  height: 84, count: 7,  timing: 200, loop: true },
            idleLeft:    { x: 1056, y: 504,  width: -96, height: 84, count: 7,  timing: 200, loop: true },
            runRight:    { x: 0,    y: 84,   width: 96,  height: 84, count: 8,  timing: 100, loop: true },
            runLeft:     { x: 1056, y: 588,  width: -96, height: 84, count: 8,  timing: 100, loop: true },
            jumpRight:   { x: 0,    y: 168,  width: 96,  height: 84, count: 5,  timing: 200, loop: false },
            jumpLeft:    { x: 1056, y: 672,  width: -96, height: 84, count: 5,  timing: 200, loop: false },
            attackRight: { x: 0,    y: 252,  width: 96,  height: 84, count: 6,  timing: 100, loop: true },
            attackLeft:  { x: 1056, y: 756,  width: -96, height: 84, count: 6,  timing: 100, loop: true },
            hurtRight:   { x: 0,    y: 336,  width: 96,  height: 84, count: 4,  timing: 100, loop: false },
            hurtLeft:    { x: 1056, y: 840,  width: -96, height: 84, count: 4,  timing: 100, loop: false },
            deathRight:  { x: 0,    y: 420,  width: 96,  height: 84, count: 12, timing: 200, loop: false },
            deathLeft:   { x: 1056, y: 924,  width: -96, height: 84, count: 12, timing: 200, loop: false },
            guardRight:  { x: 0,    y: 1008, width: 96,  height: 84, count: 6,  timing: 100, loop: false },
            guardLeft:   { x: 1056, y: 1090, width: -96, height: 84, count: 6,  timing: 100, loop: false }
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
                death:  new Audio("sounds/MegamanDefeat.wav")
            },
            size: {
                hHalfSize: 25,
                vUpperSize: 30,
                vLowerSize: 55
            }
        });

        this.sequences = sequences;
        this.attackRange = 100;

        this.ATTACK_FRAMES = 36;
        this.meleeDamageFrame = 6;

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
        }
    }
    
    takeDamage(damage) {
        if (this.isGuarding) {
            this.sounds.parry.currentTime = 0;
            this.sounds.parry.play().catch(() => {});
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
            detector = BoundingBox(this.ctx, y - this.vUpperSize, x, y + this.vLowerSize, x + this.attackRange);
        } else {
            detector = BoundingBox(this.ctx, y - this.vUpperSize, x - this.attackRange, y + this.vLowerSize, x);
        }
        for (const enemy of this.world.enemies) {
            if (enemy.getBoundingBox().intersect(detector)) {
                enemy.takeDamage(50, 50, this.isLocalPlayer);
            }
        }
    }

    update(time) {
        if (!this.alive) {
            this.updateAnimation();
            this.sprite.update(time);
            return;
        }

        if (this.attackStanceTimer == this.meleeDamageFrame) {
            this.sounds.attack.currentTime = 0;
            this.sounds.attack.play().catch(() => {});
            this.applyMeleeDamage();
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
        super.updateAnimation();
    }

    getAnimationState() {
        const dir = this.animationDirection == -1 ? "Left" : "Right";
        if (this.recoverTimer > 0)      return `hurt${dir}`;
        if (this.attackStanceTimer > 0) return `attack${dir}`;
        if (this.isGuarding)            return `guard${dir}`;
        if (!this.standing())           return `jump${dir}`;
        if (this.direction != 0)        return `run${dir}`;
        return `idle${dir}`;
    }

    draw() {
        let { x, y } = this.sprite.getXY();
        BoundingBox(this.ctx, y - this.vUpperSize, x, y + this.vLowerSize, x + this.attackRange).draw();
        super.draw();
    }
}

const Knight = function(ctx, x, y, gameArea, world) {
    return new KnightPlayer(ctx, x, y, gameArea, world);
};