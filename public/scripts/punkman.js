// This function defines the Player module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
const Punkman = function(ctx, x, y, world) {

    // This is the sprite sequences of the player facing different directions.
    // It contains the idling sprite sequences `idleLeft`, `idleUp`, `idleRight` and `idleDown`,
    // and the moving sprite sequences `moveLeft`, `moveUp`, `moveRight` and `moveDown`.
    const sequences = {
        idleLeft:  { x: 1024, y: 1536, width: 256, height: 256, count: 1, timing: 2000, loop: false },
        idleRight: { x: 0, y: 0, width: 256, height: 256, count: 1, timing: 2000, loop: false },

        idleShootLeft:  { x: 0, y: 1792, width: 256, height: 256, count: 1, timing: 2000, loop: false },
        idleShootRight: { x: 1024, y: 256, width: 256, height: 256, count: 1, timing: 2000, loop: false },

        moveLeft:  { x: 1024, y: 1792, width: -256, height: 256, count: 4, timing: 150, loop: true },
        moveRight: { x: 0, y: 256, width: 256, height: 256, count: 4, timing: 150, loop: true },

        moveShootLeft:  { x: 768, y: 2048, width: -256, height: 256, count: 4, timing: 150, loop: true },
        moveShootRight: { x: 256, y: 512, width: 256, height: 256, count: 4, timing: 150, loop: true },

        jumpLeft: { x: 0, y: 1536, width: 256, height: 256, count: 1, timing: 2000, loop: false },
        jumpRight: { x: 1024, y: 0, width: 256, height: 256, count: 1, timing: 2000, loop: false },

        jumpShootLeft: { x: 1024, y: 2048, width: 256, height: 256, count: 1, timing: 2000, loop: false },
        jumpShootRight: { x: 0, y: 512, width: 256, height: 256, count: 1, timing: 2000, loop: false },

        recoverLeft:  { x: 768, y: 2304, width: -256, height: 256, count: 2, timing: 100, loop: true },
        recoverRight: { x: 256, y: 768, width: 256, height: 256, count: 2, timing: 100, loop: true },
    };

    // This is the sprite object of the player created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the player sprite here.
    sprite.setSequence(sequences.idleRight)
          .setScale(0.5)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet("images/rockman_spritesheet.png");

    // This is the moving direction, which can be a number from 0 to 4:
    // - `0` - not moving
    // - `1` - moving to the left
    // - `2` - moving up
    // - `3` - moving to the right
    // - `4` - moving down
    let direction = 0;

    let animationDirection = 3;

    const sounds = {
        buster: new Audio("sounds/MegaBuster.wav"),
        land: new Audio("sounds/MegamanLand.wav"),
        damage: new Audio("sounds/MegamanDamage.wav"),
        death: new Audio("sounds/MegamanDefeat.wav")
    };

    let speed = 250;

    const move = function(dir) {
        if (recoverTimer == 0) {
            direction = dir;
            animationDirection = dir;
        }
    };

    const stop = function(dir) {
        if (direction == dir) {
            direction = 0;
        }
    };

    const speedUp = function() {
        speed = 350;
    };

    const slowDown = function() {
        speed = 250;
    };

    const maxHealth = 100;
    let health = maxHealth;
    let recoverTimer = 0;
    let alive = true;

    const takeDamage = function(damage) {
        if (!alive)
            return;
        
        health -= damage;

        if (health > 0) {
            recoverTimer = 40;
            velocityY = 0;
            sounds.damage.currentTime = 0;
            sounds.damage.play();
            let progress = health / maxHealth * 100 + '%';
            $("#player1-healthbar").animate({height: progress}, 500);
        }
        else {
            alive = false;
            sounds.death.currentTime = 0;
            sounds.death.play();
            $("#player1-healthbar").animate({height: "0%"}, 500);
        }
    }

    const gravity = 1;
    const jumpVelocity = -20;
    let velocityY = 0;
    let enableJump = true;
    let falling = false;

    const jump = function() {
        if (standing() && recoverTimer == 0 && enableJump && alive){
            enableJump = false;
            velocityY = jumpVelocity;
        }
    };

    const resetJump = function() {
        velocityY /= 3;
        enableJump = true;
    }

    const standing = function() {
        let {x, y} = sprite.getXY();
        for (const obstacle of world.obstacles) {
            if (obstacle.getBoundingBox().isPointInBox(x, y+vLowerSize+1)) {
                return true;
            }
        }
        return false;
    };

    let shootStanceTimer = 0;
    let cooldownTimer = 0;
    let enableShoot = true;

    const shoot = function() {
        if (recoverTimer == 0 && cooldownTimer == 0 && enableShoot && alive) {
            enableShoot = false;
            shootStanceTimer = 20;
            cooldownTimer = 10;
            sounds.buster.currentTime = 0;
            sounds.buster.play();
            let {x, y} = sprite.getXY();
            if (animationDirection == 3)
                world.bullets.push(Bullet(ctx, x+hHalfSize, y, animationDirection, world));
            else
                world.bullets.push(Bullet(ctx, x-hHalfSize, y, animationDirection, world));
        }
    };

    const stopShoot = function () {
        enableShoot = true;
    };

    let animationState = 7;

    const updateAnimation = function() {
        if (!alive)
            return;
        if (animationDirection == 1) {
            if (recoverTimer == 0) {
                if (standing()) {
                    if (direction == 0) {
                        if (shootStanceTimer == 0) {
                            if (animationState != 0) {
                                sprite.setSequence(sequences.idleLeft);
                                animationState = 0;
                            }
                        }
                        else {
                            if (animationState != 1) {
                                sprite.setSequence(sequences.idleShootLeft);
                                animationState = 1;
                            }
                            shootStanceTimer--;
                        }
                    }
                    else {
                        if (shootStanceTimer == 0) {
                            if (animationState != 2) {
                                sprite.setSequence(sequences.moveLeft);
                                animationState = 2;
                            }
                        }
                        else {
                            if (animationState != 3) {
                                sprite.setSequence(sequences.moveShootLeft);
                                animationState = 3;
                            }
                            shootStanceTimer--;
                        }
                    }
                }
                else {
                    if (shootStanceTimer == 0) {
                        if (animationState != 4) {
                            sprite.setSequence(sequences.jumpLeft);
                            animationState = 4;
                        }
                    }
                    else {
                        if (animationState != 5) {
                            sprite.setSequence(sequences.jumpShootLeft);
                            animationState = 5;
                        }
                        shootStanceTimer--;
                    }
                }
            }
            else if (animationState != 6) {
                sprite.setSequence(sequences.recoverLeft);
                animationState = 6;
            }
        }
        else if (animationDirection == 3) {
            if (recoverTimer == 0) {
                if (standing()) {
                    if (direction == 0) {
                        if (shootStanceTimer == 0) {
                            if (animationState != 7) {
                                sprite.setSequence(sequences.idleRight);
                                animationState = 7;
                            }
                        }
                        else {
                            if (animationState != 8) {
                                sprite.setSequence(sequences.idleShootRight);
                                animationState = 8;
                            }
                            shootStanceTimer--;
                        }
                    }
                    else {
                        if (shootStanceTimer == 0) {
                            if (animationState != 9) {
                                sprite.setSequence(sequences.moveRight);
                                animationState = 9;
                            }
                        }
                        else {
                            if (animationState != 10) {
                                sprite.setSequence(sequences.moveShootRight);
                                animationState = 10;
                            }
                            shootStanceTimer--;
                        }
                    }
                }
                else {
                    if (shootStanceTimer == 0) {
                        if (animationState != 11) {
                            sprite.setSequence(sequences.jumpRight);
                            animationState = 11;
                        }
                    }
                    else {
                        if (animationState != 12) {
                            sprite.setSequence(sequences.jumpShootRight);
                            animationState = 12;
                        }
                        shootStanceTimer--;
                    }
                }
            }
            else if (animationState != 13) {
                sprite.setSequence(sequences.recoverRight);
                animationState = 13;
            }
        }
    };

    const hHalfSize = 25;
    const vUpperSize = 30;
    const vLowerSize = 55;

    const getBoundingBox = function() {
        let { x, y } = sprite.getXY();
        return BoundingBox(ctx, y-vUpperSize, x-hHalfSize, y+vLowerSize, x+hHalfSize);
    }

    const update = function(time) {
        if (!alive)
            return;
        let { x, y } = sprite.getXY();

        if (!standing() || velocityY < 0) {
            velocityY += gravity;
            let validLocation = true;
            let voffset = 0;
            if (velocityY > 0) {
                while (validLocation && voffset <= velocityY) {
                    voffset++;
                    let target = BoundingBox(ctx, y-vUpperSize+voffset, x-hHalfSize, y+vLowerSize+voffset, x+hHalfSize);
                    for (const obstacle of world.obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            voffset--;
                            break;
                        }
                    }
                }
            }
            else{
                while (validLocation && velocityY <= voffset) {
                    voffset--;
                    let target = BoundingBox(ctx, y-vUpperSize+voffset, x-hHalfSize, y+vLowerSize+voffset, x+hHalfSize);
                    for (const obstacle of world.obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            velocityY = 0;
                            voffset++;
                            break;
                        }
                    }
                }
            }
            y += voffset;
            sprite.setXY(x, y);
        }
        else{
            velocityY = 0;
        }

        if (recoverTimer == 0) {
            let validLocation = true;
            let hoffset = 0;
            if (direction == 1) {
                while (validLocation && -hoffset < speed / 60){
                    hoffset--;
                    let target = BoundingBox(ctx, y-vUpperSize, x-hHalfSize+hoffset, y+vLowerSize, x+hHalfSize+hoffset);
                    for (const obstacle of world.obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            hoffset++;
                            break;
                        }
                    }
                }
            }
            else if (direction == 3) {
                while (validLocation && hoffset < speed / 60){
                    hoffset++;
                    let target = BoundingBox(ctx, y-vUpperSize, x-hHalfSize+hoffset, y+vLowerSize, x+hHalfSize+hoffset);
                    for (const obstacle of world.obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            hoffset--;
                            break;
                        }
                    }
                }
            }
            x += hoffset;
            sprite.setXY(x, y);
        }
        else {
            recoverTimer--;
        }

        if (!standing()) {
            falling = true;
        }
        else if (falling) {
            falling = false;
            sounds.land.currentTime = 0;
            sounds.land.play();
        }
        else {
            falling = false;
        }

        if(cooldownTimer > 0)
            cooldownTimer--;
        updateAnimation();
        sprite.update(time);
    };

    return {
        move: move,
        stop: stop,
        jump: jump,
        resetJump: resetJump,
        attack: shoot,
        stopAttack: stopShoot,
        takeDamage: takeDamage,
        speedUp: speedUp,
        slowDown: slowDown,
        getBoundingBox: getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};
