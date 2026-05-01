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
            attackCooldown: 162,
            damageFrame: 90,
            damageAmount: 25,
            size: { hHalfSize: 30, vUpperSize: 30, vLowerSize: 55 },
            patrol: { xl: 300, xr: 1500 }
        });

        this.sequences = sequences;
        this.animationState = 4;
    }

    updateAnimation() {
        if (!this.alive)
            return;

        if (this.animationDirection == -1) {
            if (this.recoverTimer == 0) {
                if (this.attackStanceTimer == 0) {
                    if (this.direction == 0) {
                        if (this.animationState != 0) {
                            this.sprite.setSequence(this.sequences.idleLeft);
                            this.animationState = 0;
                        }
                    }
                    else {
                        if (this.animationState != 1) {
                            this.sprite.setSequence(this.sequences.walkLeft);
                            this.animationState = 1;
                        }
                    }
                }
                else {
                    if (this.animationState != 2) {
                        this.sprite.setSequence(this.sequences.attackLeft);
                        this.animationState = 2;
                    }
                }
            }
            else {
                if (this.animationState != 3) {
                    this.sprite.setSequence(this.sequences.hitLeft);
                    this.animationState = 3;
                }
            }
        }
        else if (this.animationDirection == 1) {
            if (this.recoverTimer == 0) {
                if (this.attackStanceTimer == 0) {
                    if (this.direction == 0) {
                        if (this.animationState != 4) {
                            this.sprite.setSequence(this.sequences.idleRight);
                            this.animationState = 4;
                        }
                    }
                    else {
                        if (this.animationState != 5) {
                            this.sprite.setSequence(this.sequences.walkRight);
                            this.animationState = 5;
                        }
                    }
                }
                else {
                    if (this.animationState != 6) {
                        this.sprite.setSequence(this.sequences.attackRight);
                        this.animationState = 6;
                    }
                }
            }
            else {
                if (this.animationState != 7) {
                    this.sprite.setSequence(this.sequences.hitRight);
                    this.animationState = 7;
                }
            }
        }
    }
}

const Skeleton = function(ctx, x, y, id, world) {
    return new SkeletonEnemy(ctx, x, y, id, world);
};