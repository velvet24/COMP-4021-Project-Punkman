// This function defines the Player module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
// - `gameArea` - The bounding box of the game area
const Player = function(ctx, x, y, gameArea, obstacles, enemies, bullets) {

    // This is the sprite sequences of the player facing different directions.
    // It contains the idling sprite sequences `idleLeft`, `idleUp`, `idleRight` and `idleDown`,
    // and the moving sprite sequences `moveLeft`, `moveUp`, `moveRight` and `moveDown`.
    const sequences = {
        /* Idling sprite sequences for facing different directions */
        idleLeft:  { x: 1024, y: 1536, width: 256, height: 256, count: 1, timing: 2000, loop: false },
        idleRight: { x: 0, y: 0, width: 256, height: 256, count: 1, timing: 2000, loop: false },

        idleShootLeft:  { x: 0, y: 1792, width: 256, height: 256, count: 1, timing: 2000, loop: false },
        idleShootRight: { x: 1024, y: 256, width: 256, height: 256, count: 1, timing: 2000, loop: false },

        /* Moving sprite sequences for facing different directions */
        moveLeft:  { x: 1024, y: 1792, width: -256, height: 256, count: 4, timing: 150, loop: true },
        moveRight: { x: 0, y: 256, width: 256, height: 256, count: 4, timing: 150, loop: true },

        moveShootLeft:  { x: 768, y: 2048, width: -256, height: 256, count: 4, timing: 150, loop: true },
        moveShootRight: { x: 256, y: 512, width: 256, height: 256, count: 4, timing: 150, loop: true },

        jumpLeft: { x: 0, y: 1536, width: 256, height: 256, count: 1, timing: 2000, loop: false },
        jumpRight: { x: 1024, y: 0, width: 256, height: 256, count: 1, timing: 2000, loop: false },

        jumpShootLeft: { x: 1024, y: 2048, width: 256, height: 256, count: 1, timing: 2000, loop: false },
        jumpShootRight: { x: 0, y: 512, width: 256, height: 256, count: 1, timing: 2000, loop: false },
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
        buster: new Audio("sounds/MegaBuster.wav")
    };

    // This is the moving speed (pixels per second) of the player
    let speed = 250;

    // This function sets the player's moving direction.
    // - `dir` - the moving direction (1: Left, 2: Up, 3: Right, 4: Down)
    const move = function(dir) {
        if (dir >= 1 && dir <= 4 && dir != direction) {
            direction = dir;
            animationDirection = dir;
        }
    };

    // This function stops the player from moving.
    // - `dir` - the moving direction when the player is stopped (1: Left, 2: Up, 3: Right, 4: Down)
    const stop = function(dir) {
        if (direction == dir) {
            direction = 0;
        }
    };

    // This function speeds up the player.
    const speedUp = function() {
        speed = 350;
    };

    // This function slows down the player.
    const slowDown = function() {
        speed = 250;
    };

    const gravity = 1;
    const jumpVelocity = -20;
    let velocityY = 0;
    let enableJump = true;

    const jump = function() {
        if (standing() && enableJump){
            enableJump = false;
            velocityY = jumpVelocity;
        }
    };

    const resetJump = function() {
        velocityY = 0;
        enableJump = true;
    }

    const standing = function() {
        let {x, y} = sprite.getXY();
        for (const obstacle of obstacles) {
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
        if (cooldownTimer == 0 && enableShoot) {
            enableShoot = false;
            shootStanceTimer = 20;
            cooldownTimer = 10;
            sounds.buster.currentTime = 0;
            sounds.buster.play();
            let {x, y} = sprite.getXY();
            if (animationDirection == 3)
                bullets.push(Bullet(ctx, x+hHalfSize, y, animationDirection, enemies));
            else
                bullets.push(Bullet(ctx, x-hHalfSize, y, animationDirection, enemies));
        }
    };

    const stopShoot = function () {
        enableShoot = true;
    };

    let animationState = 6;

    const updateAnimation = function() {
        if (animationDirection == 1) {
            if (standing()) {
                if (direction == 0) {
                    if (shootStanceTimer == 0){
                        if (animationState != 0){
                            sprite.setSequence(sequences.idleLeft);
                            animationState = 0;
                        }
                    }
                    else {
                        if (animationState != 1){
                            sprite.setSequence(sequences.idleShootLeft);
                            animationState = 1;
                        }
                        shootStanceTimer--;
                    }
                }
                else {
                    if (shootStanceTimer == 0){
                        if (animationState != 2){
                            sprite.setSequence(sequences.moveLeft);
                            animationState = 2;
                        }
                    }
                    else {
                        if (animationState != 3){
                            sprite.setSequence(sequences.moveShootLeft);
                            animationState = 3;
                        }
                        shootStanceTimer--;
                    }
                }
            }
            else {
                if (shootStanceTimer == 0){
                    if (animationState != 4){
                        sprite.setSequence(sequences.jumpLeft);
                        animationState = 4;
                    }
                }
                else {
                    if (animationState != 5){
                        sprite.setSequence(sequences.jumpShootLeft);
                        animationState = 5;
                    }
                    shootStanceTimer--;
                }
            }
        }
        else if (animationDirection == 3) {
            if (standing()) {
                if (direction == 0) {
                    if (shootStanceTimer == 0){
                        if (animationState != 6){
                            sprite.setSequence(sequences.idleRight);
                            animationState = 6;
                        }
                    }
                    else {
                        if (animationState != 7){
                            sprite.setSequence(sequences.idleShootRight);
                            animationState = 7;
                        }
                        shootStanceTimer--;
                    }
                }
                else {
                    if (shootStanceTimer == 0){
                        if (animationState != 8){
                            sprite.setSequence(sequences.moveRight);
                            animationState = 8;
                        }
                    }
                    else {
                        if (animationState != 9){
                            sprite.setSequence(sequences.moveShootRight);
                            animationState = 9;
                        }
                        shootStanceTimer--;
                    }
                }
            }
            else {
                if (shootStanceTimer == 0){
                    if (animationState != 10){
                        sprite.setSequence(sequences.jumpRight);
                        animationState = 10;
                    }
                }
                else {
                    if (animationState != 11){
                        sprite.setSequence(sequences.jumpShootRight);
                        animationState = 11;
                    }
                    shootStanceTimer--;
                }
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

    // This function updates the player depending on his movement.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        let { x, y } = sprite.getXY();

        if (!standing() || velocityY < 0) {
            velocityY += gravity;
            let validLocation = true;
            let voffset = 0;
            if (velocityY > 0) {
                while (validLocation && voffset <= velocityY) {
                    voffset++;
                    let target = BoundingBox(ctx, y-vUpperSize+voffset, x-hHalfSize, y+vLowerSize+voffset, x+hHalfSize);
                    for (const obstacle of obstacles) {
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
                    for (const obstacle of obstacles) {
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
            if (gameArea.isPointInBox(x, y))
                sprite.setXY(x, y);
        }
        else{
            velocityY = 0;
        }

        /* Update the player if the player is moving */
        if (direction != 0) {
            /* Move the player */
            let validLocation = true;
            let hoffset = 0;
            if (direction == 1) {
                while (validLocation && -hoffset < speed / 60){
                    hoffset--;
                    let target = BoundingBox(ctx, y-vUpperSize, x-hHalfSize+hoffset, y+vLowerSize, x+hHalfSize+hoffset);
                    for (const obstacle of obstacles) {
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
                    for (const obstacle of obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            hoffset--;
                            break;
                        }
                    }
                }
            }
            x += hoffset;
            if (gameArea.isPointInBox(x, y))
                sprite.setXY(x, y);
        }

        if(cooldownTimer > 0)
            cooldownTimer--;
        updateAnimation();
        sprite.update(time);
    };

    // The methods are returned as an object here.
    return {
        move: move,
        stop: stop,
        jump: jump,
        resetJump: resetJump,
        shoot: shoot,
        stopShoot: stopShoot,
        speedUp: speedUp,
        slowDown: slowDown,
        getBoundingBox: getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};
