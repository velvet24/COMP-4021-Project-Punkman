// This function defines the Player module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
// - `gameArea` - The bounding box of the game area
const Player = function(ctx, x, y, gameArea, obstacles) {

    // This is the sprite sequences of the player facing different directions.
    // It contains the idling sprite sequences `idleLeft`, `idleUp`, `idleRight` and `idleDown`,
    // and the moving sprite sequences `moveLeft`, `moveUp`, `moveRight` and `moveDown`.
    const sequences = {
        /* Idling sprite sequences for facing different directions */
        idleLeft:  { x: 1024, y: 1536, width: 256, height: 256, count: 1, timing: 2000, loop: false },
        idleRight: { x: 0, y: 0, width: 256, height: 256, count: 1, timing: 2000, loop: false },

        /* Moving sprite sequences for facing different directions */
        moveLeft:  { x: 1024, y: 1792, width: -256, height: 256, count: 4, timing: 150, loop: true },
        moveRight: { x: 0, y: 256, width: 256, height: 256, count: 4, timing: 150, loop: true },
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

    // This is the moving speed (pixels per second) of the player
    let speed = 250;

    // This function sets the player's moving direction.
    // - `dir` - the moving direction (1: Left, 2: Up, 3: Right, 4: Down)
    const move = function(dir) {
        if (dir >= 1 && dir <= 4 && dir != direction) {
            switch (dir) {
                case 1: sprite.setSequence(sequences.moveLeft); break;
                case 2: sprite.setSequence(sequences.moveLeft); break;
                case 3: sprite.setSequence(sequences.moveRight); break;
                case 4: sprite.setSequence(sequences.moveRight); break;
            }
            direction = dir;
        }
    };

    // This function stops the player from moving.
    // - `dir` - the moving direction when the player is stopped (1: Left, 2: Up, 3: Right, 4: Down)
    const stop = function(dir) {
        if (direction == dir) {
            switch (dir) {
                case 1: sprite.setSequence(sequences.idleLeft); break;
                case 2: sprite.setSequence(sequences.idleLeft); break;
                case 3: sprite.setSequence(sequences.idleRight); break;
                case 4: sprite.setSequence(sequences.idleRight); break;
            }
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

    const jump = function() {
        if (standing())
            velocityY = jumpVelocity;
    };

    const standing = function() {
        let {x, y} = sprite.getXY();
        for (const obstacle of obstacles) {
            if (obstacle.getBoundingBox().isPointInBox(x, y+vLowerSize+1)) {
                return true;
            }
        }
        return false;
    };

    const shoot = function() {};

    const hHalfSize = 25;
    const vUpperSize = 30;
    const vLowerSize = 55;

    const getBoundingBox = function() {
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
            console.log(voffset);
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

        /* Update the sprite object */
        sprite.update(time);
    };

    // The methods are returned as an object here.
    return {
        move: move,
        stop: stop,
        jump: jump,
        shoot: shoot,
        speedUp: speedUp,
        slowDown: slowDown,
        getBoundingBox: getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};
