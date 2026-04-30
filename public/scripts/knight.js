const KnightPlayer = function(ctx, x, y, gameArea, world) {

    const sheet = "images/knight.png";

    const sequences = {
        idleRight:   { x: 0,    y: 0,     width: 96, height: 84, count: 7,  timing: 200, loop: true },
        idleLeft:    { x: 1056, y: 504,   width: -96, height: 84, count: 7,  timing: 200, loop: true },
        runRight:    { x: 0,    y: 84,    width: 96, height: 84, count: 8,  timing: 100, loop: true },
        runLeft:     { x: 1056, y: 588,   width: -96, height: 84, count: 8,  timing: 100, loop: true },
        jumpRight:   { x: 0,    y: 168,   width: 96, height: 84, count: 5,  timing: 200, loop: false },
        jumpLeft:    { x: 1056, y: 672,   width: -96, height: 84, count: 5,  timing: 200, loop: false },
        attackRight: { x: 0,    y: 252,   width: 96, height: 84, count: 6,  timing: 20, loop: false },
        attackLeft:  { x: 1056, y: 756,   width: -96, height: 84, count: 6,  timing: 20, loop: false },
        hurtRight:   { x: 0,    y: 336,   width: 96, height: 84, count: 4,  timing: 100, loop: false },
        hurtLeft:    { x: 1056, y: 840,   width: -96, height: 84, count: 4,  timing: 100, loop: false },
        deathRight:  { x: 0,    y: 420,   width: 96, height: 84, count: 12, timing: 200, loop: false },
        deathLeft:   { x: 1056, y: 924,   width: -96, height: 84, count: 12, timing: 200, loop: false },
        guardRight:  { x: 0,    y: 1008,   width: 96, height: 84, count: 5,  timing: 85, loop: true },
        guardLeft:   { x: 1056, y: 1090,   width: -96, height: 84, count: 5,  timing: 85, loop: true }
    };

    const sprite = Sprite(ctx, x, y);
    sprite.setSequence(sequences.idleRight)
          .setScale(4)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet(sheet);

    let isLocalPlayer = false;
    let playerIndex = 0;

    const setLocalPlayer = function() {
        isLocalPlayer = true;
    };

    let direction = 0;
    let animationDirection = 3;

    const sounds = {
        attack: new Audio("sounds/KnightAttack.wav"),
        land:   new Audio("sounds/MegamanLand.wav"),
        damage: new Audio("sounds/KnightDamage.wav"),
        death:  new Audio("sounds/KnightDie.wav")
    };

    let speed = 250;

    const move = function(dir) {
        if (recoverTimer == 0 && guardTimer == 0) {
            direction = dir;
            animationDirection = dir;
        }
    };

    const stop = function(dir) {
        if (direction == dir) {
            direction = 0;
        }
    };

    const maxHealth = 100;
    let health = maxHealth;
    let healthBarName = "";
    let recoverTimer = 0;
    let alive = true;

    const setIndex = function(index) {
        playerIndex = index;
        healthBarName = `#player${index}-healthbar`;
    };

    const takeDamage = function(damage) {
        if (!alive) return;
        if (guardTimer > 0) return;
        health -= damage;
        if (health > 0) {
            recoverTimer = 40;
            velocityY = 0;
            sounds.damage.currentTime = 0;
            sounds.damage.play();
            let progress = health / maxHealth * 100 + '%';
            $(healthBarName).animate({height: progress}, 500);
        } else {
            alive = false;
            sounds.death.currentTime = 0;
            sounds.death.play();
            $(healthBarName).animate({height: "0%"}, 500);
        }
    };

    const gravity = 1;
    const jumpVelocity = -20;
    let velocityY = 0;
    let enableJump = true;
    let falling = false;

    let guardTimer = 0;
    let guardCooldownTimer = 0;
    const GUARD_DURATION = 100;
    const GUARD_COOLDOWN = 400;

    const jump = function() {
        if (standing() && recoverTimer == 0 && enableJump && alive && attackStanceTimer == 0 && guardTimer == 0) {
            enableJump = false;
            velocityY = jumpVelocity;
        }
    };

    const resetJump = function() {
        velocityY /= 3;
        enableJump = true;
    };

    const standing = function() {
        let {x, y} = sprite.getXY();
        for (const obstacle of world.obstacles) {
            if (obstacle.getBoundingBox().isPointInBox(x, y + vLowerSize + 1)) {
                return true;
            }
        }
        return false;
    };

    const attackRange = 200;

    const ATTACK_FRAMES = 40;
    let attackStanceTimer = 0;
    let cooldownTimer = 0;
    let enableAttack = true;
    let damageApplied = false;

    const attack = function() {
        if (recoverTimer == 0 && cooldownTimer == 0 && enableAttack && alive && guardTimer == 0 && guardCooldownTimer == 0) {
            enableAttack = false;
            attackStanceTimer = ATTACK_FRAMES;
            cooldownTimer = ATTACK_FRAMES;
            damageApplied = false;
            sounds.attack.currentTime = 0;
            sounds.attack.play();
        }
    };

    const stopAttack = function() {
        enableAttack = true;
    };

    const guard = function() {
        if (recoverTimer == 0 && guardTimer == 0 && guardCooldownTimer == 0 && attackStanceTimer == 0 && alive) {
            guardTimer = GUARD_DURATION;
            velocityY = 0;
            direction = 0;
        }
    };

    const hHalfSize = 25;
    const vUpperSize = 30;
    const vLowerSize = 55;

    const getBoundingBox = function() {
        let { x, y } = sprite.getXY();
        return BoundingBox(ctx, y - vUpperSize, x - hHalfSize, y + vLowerSize, x + hHalfSize);
    };

    const applyMeleeDamage = function() {
        if (damageApplied) return;
        let { x, y } = sprite.getXY();
        let detector;
        if (animationDirection == 3) {
            detector = BoundingBox(ctx, y - 30, x, y + 30, x + attackRange);
        } else {
            detector = BoundingBox(ctx, y - 30, x - attackRange, y + 30, x);
        }
        for (const enemy of world.enemies) {
            if (enemy.isAlive && enemy.isAlive() && enemy.getBoundingBox && enemy.getBoundingBox().intersect(detector)) {
                enemy.takeDamage(30);
                damageApplied = true;
                break;
            }
        }
    };

    let deathPlayed = false;

    let animationState = "";
    const updateAnimation = function() {
        if (!alive) {
            if (!deathPlayed) {
                const seqName = (animationDirection == 1) ? "deathLeft" : "deathRight";
                sprite.setSequence(sequences[seqName]);
                deathPlayed = true;
                animationState = seqName;
            }
            return;
        }

        if (guardTimer > 0) {
            const seqName = (animationDirection == 1) ? "guardLeft" : "guardRight";
            if (animationState !== seqName) {
                sprite.setSequence(sequences[seqName]);
                animationState = seqName;
            }
            return;
        }

        let targetState;
        if (recoverTimer > 0) {
            targetState = (animationDirection == 1) ? "hurtLeft" : "hurtRight";
        } else if (attackStanceTimer > 0) {
            targetState = (animationDirection == 1) ? "attackLeft" : "attackRight";
        } else if (!standing()) {
            targetState = (animationDirection == 1) ? "jumpLeft" : "jumpRight";
        } else if (direction != 0) {
            targetState = (animationDirection == 1) ? "runLeft" : "runRight";
        } else {
            targetState = (animationDirection == 1) ? "idleLeft" : "idleRight";
        }

        if (animationState !== targetState) {
            animationState = targetState;
            sprite.setSequence(sequences[targetState]);
        }
    };

    const update = function(time) {
        if (!alive) {
            updateAnimation();
            sprite.update(time);
            return;
        }

        let { x, y } = sprite.getXY();

        if (guardTimer > 0) {
            guardTimer--;
            if (guardTimer == 0) {
                guardCooldownTimer = GUARD_COOLDOWN;
            }
            direction = 0;
        }
        if (guardCooldownTimer > 0) guardCooldownTimer--;

        if (!standing() || velocityY < 0) {
            velocityY += gravity;
            let validLocation = true;
            let voffset = 0;
            if (velocityY > 0) {
                while (validLocation && voffset <= velocityY) {
                    voffset++;
                    let target = BoundingBox(ctx, y - vUpperSize + voffset, x - hHalfSize, y + vLowerSize + voffset, x + hHalfSize);
                    for (const obstacle of world.obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            voffset--;
                            break;
                        }
                    }
                }
            } else {
                while (validLocation && velocityY <= voffset) {
                    voffset--;
                    let target = BoundingBox(ctx, y - vUpperSize + voffset, x - hHalfSize, y + vLowerSize + voffset, x + hHalfSize);
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
            if (gameArea.isPointInBox(x, y)) sprite.setXY(x, y);
        } else {
            velocityY = 0;
        }

        if (recoverTimer == 0 && attackStanceTimer == 0 && guardTimer == 0) {
            let validLocation = true;
            let hoffset = 0;
            if (direction == 1) {
                while (validLocation && -hoffset < speed / 60) {
                    hoffset--;
                    let target = BoundingBox(ctx, y - vUpperSize, x - hHalfSize + hoffset, y + vLowerSize, x + hHalfSize + hoffset);
                    for (const obstacle of world.obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            hoffset++;
                            break;
                        }
                    }
                }
            } else if (direction == 3) {
                while (validLocation && hoffset < speed / 60) {
                    hoffset++;
                    let target = BoundingBox(ctx, y - vUpperSize, x - hHalfSize + hoffset, y + vLowerSize, x + hHalfSize + hoffset);
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
            if (gameArea.isPointInBox(x, y)) sprite.setXY(x, y);
        } else if (recoverTimer > 0) {
            recoverTimer--;
        }

        if (!standing()) {
            falling = true;
        } else if (falling) {
            falling = false;
            sounds.land.currentTime = 0;
            sounds.land.play();
        } else {
            falling = false;
        }

        if (attackStanceTimer > 0) {
            if (attackStanceTimer == Math.floor(ATTACK_FRAMES / 2)) {
                applyMeleeDamage();
            }
            attackStanceTimer--;
            if (attackStanceTimer == 0) {
                enableAttack = true;
            }
        }
        if (cooldownTimer > 0) cooldownTimer--;

        updateAnimation();
        sprite.update(time);
    };

    return {
        move: move,
        stop: stop,
        jump: jump,
        resetJump: resetJump,
        attack: attack,
        stopAttack: stopAttack,
        guard: guard,
        takeDamage: takeDamage,
        speedUp: function() { speed = 350; },
        slowDown: function() { speed = 250; },
        setLocalPlayer: setLocalPlayer,
        setIndex: setIndex,
        getBoundingBox: getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};