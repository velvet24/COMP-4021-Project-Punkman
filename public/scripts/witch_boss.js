class WitchBossEnemy extends EnemyBase {
    constructor(ctx, x, y, id, world) {
        const sequences = {
            idle:   { x: 0, y: 100, width: 300, height: 100, count: 4, timing: 200, loop: true },
            attack: { x: 0, y: 0, width: 300, height: 100, count: 14, timing: 150, loop: false }
        };

        super(ctx, x, y, id, world, {
            sheet: "images/witch.png",
            scale: 15,
            shadowScale: { x: 0, y: 0 },
            initialSequence: sequences.idle,
            sounds: {
                attack: new Audio("sounds/thunder.mp3")
            },
            speed: 0,
            maxHealth: 900,
            maxPoise: 200,
            recoverTime: 40,
            range: 0,
            attackDuration: 130,
            attackCooldown: 400,
            damageFrame: 120,
            damageAmount: 40,
            size: {
                hHalfSize: 300,
                vUpperSize: 300,
                vLowerSize: 400
            },
            patrol: { xl: x, xr: x }
        });

        this.sequences = sequences;
        this.animationState = "idle";
        this.animationDirection = -1;
        this.direction = 0;
    }

    attack() {
        if (this.attackStanceTimer > 0 || this.cooldownTimer > 0 || !this.alive) return;

        this.sprite.setSequence(this.sequences.attack);
        this.attackStanceTimer = this.attackDuration;
        this.cooldownTimer = this.attackCooldown;

        if (this.sounds.attack) {
            this.sounds.attack.currentTime = 0;
            this.sounds.attack.play().catch(() => {});
        }
    }

    applyAttack() {
        for (const player of this.world.players) {
            if (player.alive) {
                player.takeDamage(this.damageAmount);
            }
        }
    }

    update(time) {
        if (!this.alive) return;

        if (this.recoverTimer > 0) this.recoverTimer--;
        if (this.cooldownTimer > 0) this.cooldownTimer--;

        if (this.attackStanceTimer > 0) {
            if (this.attackStanceTimer === this.damageFrame) {
                this.applyAttack();
            }
            this.attackStanceTimer--;
            if (this.attackStanceTimer === 0) {
                this.sprite.setSequence(this.sequences.idle);
                this.animationState = "idle";
            }
        } else if (this.recoverTimer === 0 && this.alive) {
            if (this.cooldownTimer === 0) {
                this.attack();
            }
        }

        this.sprite.update(time);
    }


    getAnimationState() {
        return this.animationState;
    }

    updateAnimation() {
    }
}

const WitchBoss = function(ctx, x, y, id, world) {
    return new WitchBossEnemy(ctx, x, y, id, world);
};