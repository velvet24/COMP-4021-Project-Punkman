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
            deathRight: { x: 1872, y: 744, width: -208, height: 93, count: 10, timing: 150, loop: false },
            spawn:      { x: 0,    y: 744, width: 208, height: 93, count: 10, timing: 150, loop: false }
        };

        super(ctx, x, y, id, world, {
            sheet: "images/boss_spritesheet.png",
            scale: 4,
            shadowScale: { x: 0, y: 0 },
            initialSequence: sequences.spawn,
            sounds: {
                cast: new Audio("sounds/bossCast.mp3"),
                damage: new Audio("sounds/bossDamage.mp3"),
                death:  new Audio("sounds/bossDie.mp3")
            },
            speed: 100,
            maxHealth: 800,
            maxPoise: 200,
            range: 300,
            attackDuration: 72,
            attackCooldown: 216,
            damageFrame: 36,
            damageAmount: 25,
            hasRangeAttack: true,
            rangeAttackDuration: 54,
            rangeAttackCooldown: 300,
            castingFrame: 30,
            size: { hHalfSize: 100, vUpperSize: 34, vLowerSize: 186 },
            patrol: { xl: 200, xr: 1400 }
        });

        this.sequences = sequences;
        this.animationState = "idleRight";
        this.spawnTimer = 90;

    }

    getAnimationState() {
        const dir = this.animationDirection == -1 ? "Left" : "Right";
        if (!this.alive) return `death${dir}`;
        if (this.recoverTimer > 0) return `hit${dir}`;
        if (this.usingRangeAttack) return `cast${dir}`;
        if (this.attackStanceTimer > 0) return `attack${dir}`;
        if (this.isMoving) return `walk${dir}`;
        return `idle${dir}`;
    }

    rangeAttack() {
        if (this.rangeAttackCooldown > 0)
            this.rangeAttackCooldownTimer = this.rangeAttackCooldown;

        this.usingRangeAttack = true;
        this.attackStanceTimer = this.rangeAttackDuration;
        this.sounds.cast.currentTime = 0;
        this.sounds.cast.play().catch(() => {});
    }

    applyRangeAttack() {
        const alivePlayers = this.world.players.filter(p => p.alive);
        if (alivePlayers.length == 0) return;

        const target = alivePlayers[0];
        this.world.bullets.push(
            CloudStrike(this.ctx, target, this.world)
        );
    }

    update(time) {
        if (this.spawnTimer == 0) {
            super.update(time);
        } else {
            this.spawnTimer--;
            this.sprite.update(time);
        }
    }
}

const Boss = function(ctx, x, y, id, world) {
    return new BossEnemy(ctx, x, y, id, world);
};