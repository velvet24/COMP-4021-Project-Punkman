class PlayerBase {
    constructor(ctx, x, y, gameArea, world, config) {
        this.ctx = ctx;
        this.gameArea = gameArea;
        this.world = world;

        this.sprite = Sprite(ctx, x, y);
        this.sprite.setSequence(config.initialSequence)
                   .setScale(config.scale)
                   .setShadowScale(config.shadowScale || { x: 0, y: 0 })
                   .useSheet(config.sheet);

        this.isLocalPlayer = false;
        this.playerIndex = 0;

        this.direction = 0;
        this.animationDirection = 1;

        this.baseSpeed = config.baseSpeed || 250;
        this.boostedSpeed = config.boostedSpeed || 750;
        this.speed = this.baseSpeed;

        this.maxHealth = config.maxHealth || 100;
        this.health = this.maxHealth;
        this.healthBarName = "";
        this.recoverTimer = 0;
        this.recoverDuration = config.recoverDuration || 40;
        this.alive = true;

        this.gravity = config.gravity || 1;
        this.jumpVelocity = config.jumpVelocity || -20;
        this.velocityY = 0;
        this.enableJump = true;
        this.falling = false;

        this.attackStanceTimer = 0;
        this.cooldownTimer = 0;
        this.enableAttack = true;

        this.hHalfSize = (config.size && config.size.hHalfSize) || 25;
        this.vUpperSize = (config.size && config.size.vUpperSize) || 30;
        this.vLowerSize = (config.size && config.size.vLowerSize) || 55;

        this.sounds = {
            land: null,
            damage: null,
            death: null,
            ...(config.sounds || {})
        };

        this.active = true;
        this.cheatMode = false;
        this.shieldActive = false;
    }

    setLocalPlayer() {
        this.isLocalPlayer = true;
    }

    getLocalPlayer() {
        return this.isLocalPlayer;
    }

    enableCheatMode() {
        this.cheatMode = true;
    }

    disableCheatMode() {
        this.cheatMode = false;
    }

    setIndex(index) {
        this.playerIndex = index;
        this.healthBarName = `#player${index}-healthbar`;
    }

    getIndex() {
        return this.playerIndex;
    }

    move(dir) {
        if (this.canMove()) {
            this.direction = dir;
            this.animationDirection = dir;
        }
    }

    stop(dir) {
        if (this.direction == dir) {
            this.direction = 0;
        }
    }

    setLocation(x, y) {
        this.active = true;
        this.direction = 0;
        this.sprite.setXY(x, y);
    }

    speedUp() {
        this.speed = this.boostedSpeed;
    }

    slowDown() {
        this.speed = this.baseSpeed;
    }

    takeDamage(damage) {
        if (this.cheatMode) {
            if (this.sounds.parry) {
                this.sounds.parry.currentTime = 0;
                this.sounds.parry.play().catch(() => {});
            }
            return;
        }

        if (this.shieldActive) {
            this.shieldActive = false;
            if (this.sounds.parry) {
                this.sounds.parry.currentTime = 0;
                this.sounds.parry.play().catch(() => {});
            }
            return;
        }
        if (!this.alive || this.recoverTimer != 0)
            return;

        this.health -= damage;

        if (this.health > 0) {
            this.recoverTimer = this.recoverDuration;
            this.attackStanceTimer = 0;
            this.velocityY = 0;
            if (this.sounds.damage) {
                this.sounds.damage.currentTime = 0;
                this.sounds.damage.play().catch(() => {});
            }
            const progress = this.health / this.maxHealth * 100 + '%';
            $(this.healthBarName).animate({ height: progress }, 500);
        }
        else {
            this.alive = false;
            if (this.sounds.death) {
                this.sounds.death.currentTime = 0;
                this.sounds.death.play().catch(() => {});
            }
            $(this.healthBarName).animate({ height: "0%" }, 500);
            if (this.isLocalPlayer) {
                this.world.socket.emit("player_died");
            }
        }
    }

    jump() {
        if (this.canJump()) {
            this.enableJump = false;
            this.velocityY = this.jumpVelocity;
        }
    }

    resetJump() {
        this.velocityY /= 3;
        this.enableJump = true;
    }

    standing() {
        const { x, y } = this.sprite.getXY();
        const target = BoundingBox(this.ctx, y + this.vLowerSize - 1, x - this.hHalfSize, y + this.vLowerSize + 1, x + this.hHalfSize);
        for (const obstacle of this.world.obstacles) {
            if (obstacle.getBoundingBox().intersect(target)) {
                return true;
            }
        }
        return false;
    }

    canAttack() {
        return this.recoverTimer == 0 && this.cooldownTimer == 0 && this.enableAttack && this.alive;
    }

    // Subclasses can override to restrict movement (e.g. lock in place while swinging a sword).
    canMove() {
        return this.recoverTimer == 0 && this.attackStanceTimer == 0;
    }

    // Subclasses can override to restrict jumping (e.g. lock in place while swinging a sword).
    canJump() {
        return this.standing() && this.recoverTimer == 0 && this.attackStanceTimer == 0 && this.enableJump && this.alive;
    }

    stopAttack() {
        this.enableAttack = true;
    }

    // Virtual method, subclasses are expected to implement their own attack behavior.
    attack() {
        throw new Error("attack() must be implemented by subclass");
    }

    updateAnimation() {
        if (!this.alive) return;
        const target = this.getAnimationState();
        if (target && this.animationState !== target) {
            this.animationState = target;
            this.sprite.setSequence(this.sequences[target]);
        }
    }

    // Virtual method, subclasses are expected to select their own animation states.
    getAnimationState() {
        throw new Error("getAnimationState() must be implemented by subclass");
    }

    getBoundingBox() {
        const { x, y } = this.sprite.getXY();
        return BoundingBox(this.ctx, y - this.vUpperSize, x - this.hHalfSize, y + this.vLowerSize, x + this.hHalfSize);
    }

    update(time) {
        if (!this.alive)
            return;

        let { x, y } = this.sprite.getXY();

        if (x > 2000 || y > 1100) return;

        if (this.world.flag?.getBoundingBox().isPointInBox(x, y) && this.active) {
            this.active = false;
            this.move(1);

            if (this.isLocalPlayer) {
                setTimeout(() => {
                    this.world.socket.emit("reach_check_point");
                }, 1500);
            }
        }

        if (!this.standing() || this.velocityY < 0) {
            this.velocityY += this.gravity;
            let validLocation = true;
            let voffset = 0;
            if (this.velocityY > 0) {
                while (validLocation && voffset <= this.velocityY) {
                    voffset++;
                    const target = BoundingBox(this.ctx, y - this.vUpperSize + voffset, x - this.hHalfSize, y + this.vLowerSize + voffset, x + this.hHalfSize);
                    for (const obstacle of this.world.obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            voffset--;
                            break;
                        }
                    }
                }
            }
            else {
                while (validLocation && this.velocityY <= voffset) {
                    voffset--;
                    const target = BoundingBox(this.ctx, y - this.vUpperSize + voffset, x - this.hHalfSize, y + this.vLowerSize + voffset, x + this.hHalfSize);
                    for (const obstacle of this.world.obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            this.velocityY = 0;
                            voffset++;
                            break;
                        }
                    }
                }
            }
            y += voffset;
            if (this.gameArea.isPointInBox(x, y))
                this.sprite.setXY(x, y);
        }
        else {
            this.velocityY = 0;
        }

        if (this.canMove()) {
            let validLocation = true;
            let hoffset = 0;
            if (this.direction == -1) {
                while (validLocation && -hoffset < this.speed / 60) {
                    hoffset--;
                    const target = BoundingBox(this.ctx, y - this.vUpperSize, x - this.hHalfSize + hoffset, y + this.vLowerSize, x + this.hHalfSize + hoffset);
                    for (const obstacle of this.world.obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            hoffset++;
                            break;
                        }
                    }
                }
            }
            else if (this.direction == 1) {
                while (validLocation && hoffset < this.speed / 60) {
                    hoffset++;
                    const target = BoundingBox(this.ctx, y - this.vUpperSize, x - this.hHalfSize + hoffset, y + this.vLowerSize, x + this.hHalfSize + hoffset);
                    for (const obstacle of this.world.obstacles) {
                        if (obstacle.getBoundingBox().intersect(target)) {
                            validLocation = false;
                            hoffset--;
                            break;
                        }
                    }
                }
            }
            x += hoffset;
            if (this.gameArea.isPointInBox(x, y) || !this.active)
                this.sprite.setXY(x, y);
        }

        if (this.recoverTimer > 0)
            this.recoverTimer--;

        if (!this.standing()) {
            this.falling = true;
        }
        else if (this.falling) {
            this.falling = false;
            if (this.sounds.land) {
                this.sounds.land.currentTime = 0;
                this.sounds.land.play().catch(() => {});
            }
        }
        else {
            this.falling = false;
        }

        if (this.cooldownTimer > 0)
            this.cooldownTimer--;

        if (this.attackStanceTimer > 0)
            this.attackStanceTimer--;

        this.updateAnimation();
        this.sprite.update(time);
    }

    draw() {
        this.getBoundingBox().draw();
        this.sprite.draw();
        if (this.shieldActive) {
            const { x, y } = this.sprite.getXY();
            const size = this.sprite.getDisplaySize();
            const radius = this.vLowerSize;
            this.ctx.save();
            this.ctx.globalAlpha = 0.4 + 0.2 * Math.sin(Date.now() * 0.01);
            this.ctx.strokeStyle = "#00ffff";
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    activateShield() {
        this.shieldActive = true;
    }
}
