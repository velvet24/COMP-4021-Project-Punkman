const Skeleton = function(ctx, x, y, players) {

    const sequences = {
        idleLeft:  { x: 731, y: 296, width: -43, height: 37, count: 11, timing: 150, loop: true },
        idleRight: { x: 0, y: 111, width: 43, height: 37, count: 11, timing: 150, loop: true },

        walkLeft:  { x: 731, y: 333, width: -43, height: 37, count: 13, timing: 150, loop: true },
        walkRight: { x: 0, y: 148, width: 43, height: 37, count: 13, timing: 150, loop: true },

        attackLeft:  { x: 731, y: 185, width: -43, height: 37, count: 18, timing: 150, loop: true },
        attackRight: { x: 0, y: 0, width: 43, height: 37, count: 18, timing: 150, loop: true },

        hitLeft:  { x: 731, y: 259, width: -43, height: 37, count: 8, timing: 150, loop: false },
        hitRight: { x: 0, y: 74, width: 43, height: 37, count: 8, timing: 150, loop: false },

        deathLeft:  { x: 731, y: 222, width: -43, height: 37, count: 15, timing: 150, loop: false },
        deathRight: { x: 0, y: 37, width: 43, height: 37, count: 15, timing: 150, loop: false },
    };

    const sprite = Sprite(ctx, x, y);

    sprite.setSequence(sequences.idleRight).setScale(3).setShadowScale({x: 0, y: 0}).useSheet("images/skeleton_spritesheet.png");

    let direction = 3;
    let animationDirection = 3;

    const sounds = {
        buster: new Audio("sounds/MegaBuster.wav"),
        land: new Audio("sounds/MegamanLand.wav"),
        damage: new Audio("sounds/MegamanDamage.wav"),
        death: new Audio("sounds/MegamanDefeat.wav")
    };

    let speed = 150;

    const move = function(dir) {
        if (recoverTimer == 0 && attackStanceTimer == 0) {
            direction = dir;
            animationDirection = dir;
        }
    };

    const stop = function(dir) {
        if (direction == dir) {
            direction = 0;
        }
    };

    const maxHealth = 200;
    let health = maxHealth;
    const maxPoise = 5;
    let poise = maxPoise;
    let recoverTimer = 0;
    let alive = true;

    const isAlive = function() {
        return alive;
    }

    const takeDamage = function(damage) {
        if (!alive)
            return;
        
        health -= damage;

        if (health > 0) {
            if (attackStanceTimer == 0){
                poise--;
                if (poise == 0) {
                    recoverTimer = 72;
                    poise = maxPoise;
                }
            }
            sounds.damage.currentTime = 0;
            sounds.damage.play();
        }
        else {
            alive = false;
            sounds.death.currentTime = 0;
            sounds.death.play();
            if (animationDirection == 1)
                sprite.setSequence(sequences.deathLeft);
            else
                sprite.setSequence(sequences.deathRight);
        }
    }

    const range = 50;
    let attackStanceTimer = 0;
    let cooldownTimer = 0;
    let enableAttack = true;

    const attack = function() {
        if (recoverTimer == 0 && cooldownTimer == 0 && enableAttack && alive) {
            attackStanceTimer = 162;
            cooldownTimer = 162;
            sounds.buster.currentTime = 0;
            sounds.buster.play();
        }
    };

    const stopAttack = function () {
        enableAttack = true;
    };

    let animationState = 4;

    const updateAnimation = function() {
        if (!alive)
            return;
        if (animationDirection == 1) {
            if (recoverTimer == 0) {
                if (attackStanceTimer == 0) {
                    if (direction == 0) {
                        if (animationState != 0) {
                            sprite.setSequence(sequences.idleLeft);
                            animationState = 0;
                        }
                    }
                    else {
                        if (animationState != 1) {
                            sprite.setSequence(sequences.walkLeft);
                            animationState = 1;
                        }
                    }
                }
                else {
                    if (animationState != 2) {
                        sprite.setSequence(sequences.attackLeft);
                        animationState = 2;
                    }
                    attackStanceTimer--;
                }
            }
            else {
                if (animationState != 3) {
                    sprite.setSequence(sequences.hitLeft);
                    animationState = 3;
                }
                recoverTimer--;
            }
        }
        else if (animationDirection == 3) {
            if (recoverTimer == 0) {
                if (attackStanceTimer == 0) {
                    if (direction == 0) {
                        if (animationState != 4) {
                            sprite.setSequence(sequences.idleRight);
                            animationState = 4;
                        }
                    }
                    else {
                        if (animationState != 5) {
                            sprite.setSequence(sequences.walkRight);
                            animationState = 5;
                        }
                    }
                }
                else {
                    if (animationState != 6) {
                        sprite.setSequence(sequences.attackRight);
                        animationState = 6;
                    }
                    attackStanceTimer--;
                }
            }
            else {
                if (animationState != 7) {
                    sprite.setSequence(sequences.hitRight);
                    animationState = 7;
                }
                recoverTimer--;
            }
        }
    };

    const hHalfSize = 30;
    const vUpperSize = 30;
    const vLowerSize = 55;

    const getBoundingBox = function() {
        let { x, y } = sprite.getXY();
        return BoundingBox(ctx, y-vUpperSize, x-hHalfSize, y+vLowerSize, x+hHalfSize);
    }

    const detectPlayer = function(applyDamage=false) {
        let { x, y } = sprite.getXY();
        let detector = BoundingBox(ctx, y-range, x, y+range, x+range*2);
        if (direction == 1)
            detector = BoundingBox(ctx, y-range, x-range*2, y+range, x);
        for (const player of players) {
            if (detector.intersect(player.getBoundingBox())){
                console.log("OK")
                if (applyDamage)
                    player.takeDamage(25);
                return true;
            }
        }
    }

    const xl = 300;
    const xr = 1500;

    const update = function(time) {
        let { x, y } = sprite.getXY();

        if (recoverTimer == 0 && attackStanceTimer == 0 && alive) {
            if (detectPlayer()) {
                attack();
            }
            else {
                if (direction == 1) {
                    if (x - speed / 60 < xl)
                        move(3);
                    else
                        x -= speed / 60;
                }
                else if (direction == 3) {
                    if (x + speed / 60 > xr)
                        move(1);
                    else
                        x += speed / 60;
                }
                sprite.setXY(x, y);
            }
        }

        if (cooldownTimer > 0)
            cooldownTimer--;

        if (attackStanceTimer == 90) {
            detectPlayer(true);
        }

        updateAnimation();
        sprite.update(time);
    };

    return {
        move: move,
        stop: stop,
        attack: attack,
        stopAttack: stopAttack,
        isAlive: isAlive,
        takeDamage: takeDamage,
        getBoundingBox: getBoundingBox,
        draw: sprite.draw,
        update: update
    }
}