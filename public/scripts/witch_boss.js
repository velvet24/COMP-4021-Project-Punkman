class WitchBossEnemy extends EnemyBase {
    constructor(ctx, x, y, id, world) {
        const sequences = {
            idle:   { x: 0, y: 100, width: 300, height: 100, count: 4, timing: 200, loop: true },
            attack: { x: 0, y: 0, width: 300, height: 100, count: 14, timing: 150, loop: false }
        };

        super(ctx, x, y, id, world, {
            sheet: "images/witch.png",
            scale: 10,
            shadowScale: { x: 0, y: 0 },
            initialSequence: sequences.idle,
            sounds: {
                attack: new Audio("sounds/thunder.mp3"),
                damage: new Audio("sounds/EnemyDamage.wav"),
                death: new Audio("sounds/Explosion.wav")
            },
            speed: 0,
            maxHealth: 2000,
            maxPoise: 10000,
            recoverTime: 0,
            range: 0,
            attackDuration: 126,
            attackCooldown: 504,
            damageFrame: 36,
            damageAmount: 40,
            size: {
                hHalfSize: 25,
                vUpperSize: 410,
                vLowerSize: 380
            },
            patrol: { xl: x, xr: x }
        });

        this.sequences = sequences;
        this.animationState = "idle";
        this.animationDirection = -1;
        this.direction = 0;
        this.cooldownTimer = this.attackCooldown / 3;
    }

    attack() {
        this.attackStanceTimer = this.attackDuration;
        this.cooldownTimer = this.attackCooldown;
    }

    applyAttack() {
        if (this.sounds.attack) {
            this.sounds.attack.currentTime = 0;
            this.sounds.attack.play().catch(() => {});
        }
        for (const player of this.world.players) {
            if (player.alive) {
                player.takeDamage(this.damageAmount);
            }
        }
    }

    getBoundingBox() {
        const { x, y } = this.sprite.getXY();
        return BoundingBox(this.ctx, y - this.vUpperSize, x - this.hHalfSize, y + this.vLowerSize, x + 300);
    }

    getAnimationState() {
        if (this.attackStanceTimer > 0)
            return "attack";
        return "idle";
    };

    update(time) {
        if (!this.alive) return;

        if (this.attackStanceTimer == 0) {
            if (this.cooldownTimer == 0)
                this.attack();
        }

        if (this.cooldownTimer > 0) this.cooldownTimer--;

        if (this.attackStanceTimer == this.damageFrame)
            this.applyAttack();

        if (this.attackStanceTimer > 0)
            this.attackStanceTimer--;

        this.updateAnimation();
        this.sprite.update(time);
    }
}

const WitchBoss = function(ctx, x, y, id, world) {
    return new WitchBossEnemy(ctx, x, y, id, world);
};