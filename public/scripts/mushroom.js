class MushroomEnemy extends EnemyBase {
    constructor(ctx, x, y, id, world) {
        const sequences = {
            idleLeft:    { x: 1050, y: 1200, width: -150, height: 150, count: 4, timing: 150, loop: true },
            idleRight:   { x: 0,    y: 300,  width: 150,  height: 150, count: 4, timing: 150, loop: true },

            walkLeft:    { x: 1050, y: 1350, width: -150, height: 150, count: 8, timing: 150, loop: true },
            walkRight:   { x: 0,    y: 450,  width: 150,  height: 150, count: 8, timing: 150, loop: true },

            attackLeft:  { x: 1050, y: 900,  width: -150, height: 150, count: 8, timing: 150, loop: true },
            attackRight: { x: 0,    y: 0,    width: 150,  height: 150, count: 8, timing: 150, loop: true },

            hitLeft:     { x: 1050, y: 1500, width: -150, height: 150, count: 4, timing: 150, loop: false },
            hitRight:    { x: 0,    y: 600,  width: 150,  height: 150, count: 4, timing: 150, loop: false },

            deathLeft:   { x: 1050, y: 1050, width: -150, height: 150, count: 4, timing: 150, loop: false },
            deathRight:  { x: 0,    y: 150,  width: 150,  height: 150, count: 4, timing: 150, loop: false },
        };

        super(ctx, x, y, id, world, {
            sheet: "images/mushroom_spritesheet.png",
            scale: 3,
            shadowScale: { x: 0, y: 0 },
            initialSequence: sequences.idleRight,
            sounds: {
                attack: new Audio("sounds/SwordSwing.mp3"),
                damage: new Audio("sounds/EnemyDamage.wav"),
                death:  new Audio("sounds/Explosion.wav")
            },
            speed: 90,
            maxHealth: 250,
            maxPoise: 45,
            range: 55,
            attackDuration: 72,
            attackCooldown: 216,
            damageFrame: 9,
            damageAmount: 20,
            size: { hHalfSize: 35, vUpperSize: 33, vLowerSize: 78 },
            patrol: { xl: 300, xr: 1800 }
        });

        this.sequences = sequences;
        this.animationState = "idleRight";
    }

    getAnimationState() {
        const dir = this.animationDirection == -1 ? "Left" : "Right";
        if (this.recoverTimer > 0)
            return `hit${dir}`;
        if (this.attackStanceTimer > 0)
            return `attack${dir}`;
        if (this.isMoving)
            return `walk${dir}`;
        return `idle${dir}`;
    }
}

const Mushroom = function(ctx, x, y, id, world) {
    return new MushroomEnemy(ctx, x, y, id, world);
};