const Shooter = function(ctx, x, world) {
    const ROOF_Y = 40;
    const START_Y = -80;
    const SLIDE_SPEED = 5;
    const LEAVE_SPEED = 5;
    const LIFE_TIME = 800;
    const SHOOT_COOLDOWN = 240;
    const BURST_COUNT = 2;
    const BURST_INTERVAL = 30;

    const sequences = {
        attackLeft:  { x: 0,   y: 0,  width: 26, height: 63, count: 6, timing: 150, loop: true },
        attackRight: { x: 0, y: 64,  width: 26, height: 63, count: 6, timing: 150, loop: true },

    };

    let y = START_Y;
    const sprite = Sprite(ctx, x, y);
    sprite.setSequence(sequences.attackRight)
          .setScale(3)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet("images/shooter.png");

    let state = "slide";
    let lifeTimer = LIFE_TIME;
    let shootCooldown = 0;
    let burstLeft = 0;
    let burstTimer = 0;
    let direction = 1;
    let animationState = "attackRight";

    const getClosestPlayer = function() {
        let minDist = Infinity;
        let closest = null;
        for (const player of world.players) {
            if (player.getBoundingBox) {
                const box = player.getBoundingBox();
                const px = (box.getLeft() + box.getRight()) / 2;
                const py = (box.getTop() + box.getBottom()) / 2;
                const dx = px - x;
                const dy = py - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    minDist = dist;
                    closest = { player, x: px, y: py };
                }
            }
        }
        return closest;
    };

    const updateAnimation = function() {
        const closest = getClosestPlayer();
        if (closest && closest.x < x) {
            direction = -1;
        } else {
            direction = 1;
        }
        const targetState = direction === -1 ? "attackLeft" : "attackRight";
        if (animationState !== targetState) {
            animationState = targetState;
            sprite.setSequence(sequences[targetState]);
        }
    };

    const update = function(time) {
        if (state === "slide") {
            y += SLIDE_SPEED;
            if (y >= ROOF_Y) {
                y = ROOF_Y;
                state = "active";
            }
        } else if (state === "active") {
            lifeTimer--;
            if (lifeTimer <= 0) {
                state = "leave";
            }

            if (shootCooldown > 0) {
                shootCooldown--;
            } else if (burstLeft === 0) {
                const closest = getClosestPlayer();
                if (closest) {
                    burstLeft = BURST_COUNT;
                    burstTimer = BURST_INTERVAL;
                }
            }

            if (burstLeft > 0) {
                burstTimer--;
                if (burstTimer <= 0) {
                    const closest = getClosestPlayer();
                    if (closest) {
                        world.bullets.push(ShooterBullet(ctx, x, y, closest.x, closest.y, world));
                    }
                    burstLeft--;
                    if (burstLeft > 0) {
                        burstTimer = BURST_INTERVAL;
                    } else {
                        shootCooldown = SHOOT_COOLDOWN;
                    }
                }
            }
        } else if (state === "leave") {
            y -= LEAVE_SPEED;
            if (y < -100) {
                return false;
            }
        }

        sprite.setXY(x, y);
        updateAnimation();
        sprite.update(time);
        return true;
    };

    return {
        isAlive: function() { return state !== "leave"; },
        takeDamage: function(dmg) {},
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};