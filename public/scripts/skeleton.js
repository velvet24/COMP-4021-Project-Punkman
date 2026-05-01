class SkeletonEnemy extends EnemyBase {
    constructor(ctx, x, y, id, world) {
        const sequences = {
            idleLeft:    { x: 731, y: 296, width: -43, height: 37, count: 11, timing: 150, loop: true },
            idleRight:   { x: 0,   y: 111, width:  43, height: 37, count: 11, timing: 150, loop: true },

            walkLeft:    { x: 731, y: 333, width: -43, height: 37, count: 13, timing: 150, loop: true },
            walkRight:   { x: 0,   y: 148, width:  43, height: 37, count: 13, timing: 150, loop: true },

            attackLeft:  { x: 731, y: 185, width: -43, height: 37, count: 18, timing: 150, loop: true },
            attackRight: { x: 0,   y: 0,   width:  43, height: 37, count: 18, timing: 150, loop: true },

            hitLeft:     { x: 731, y: 259, width: -43, height: 37, count:  8, timing: 150, loop: false },
            hitRight:    { x: 0,   y: 74,  width:  43, height: 37, count:  8, timing: 150, loop: false },

            deathLeft:   { x: 731, y: 222, width: -43, height: 37, count: 15, timing: 150, loop: false },
            deathRight:  { x: 0,   y: 37,  width:  43, height: 37, count: 15, timing: 150, loop: false },
        };

        super(ctx, x, y, id, world, {
            sheet: "images/skeleton_spritesheet.png",
            scale: 3,
            shadowScale: { x: 0, y: 0 },
            initialSequence: sequences.idleRight,
            sounds: {
                attack: new Audio("sounds/SwordSwing.mp3"),
                damage: new Audio("sounds/EnemyDamage.wav"),
                death:  new Audio("sounds/Explosion.wav")
            },
            speed: 100,
            maxHealth: 200,
            maxPoise: 50,
            range: 50,
            attackDuration: 162,
            attackCooldown: 324,
            damageFrame: 90,
            damageAmount: 25,
            size: { hHalfSize: 30, vUpperSize: 30, vLowerSize: 55 },
            patrol: { xl: 300, xr: 1500 }
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

const Skeleton = function(ctx, x, y, id, world) {
    return new SkeletonEnemy(ctx, x, y, id, world);
};