class EnemyBase {
    constructor(ctx, x, y, id, world, config) {
        this.ctx = ctx;
        this.id = id;
        this.world = world;

        this.sprite = Sprite(ctx, x, y);
        this.sprite.setSequence(config.initialSequence)
                   .setScale(config.scale || 1)
                   .setShadowScale(config.shadowScale || { x: 0, y: 0 })
                   .useSheet(config.sheet);

        this.direction = config.initialDirection || 1;
        this.animationDirection = this.direction;
        this.isMoving = false;

        this.sounds = {
            attack: null,
            damage: null,
            death: null,
            ...(config.sounds || {})
        };

        this.speed = config.speed || 100;

        this.maxHealth = config.maxHealth || 100;
        this.health = this.maxHealth;
        this.maxPoise = config.maxPoise || 50;
        this.poise = this.maxPoise;
        this.recoverTime = config.recoverTime !== undefined ? config.recoverTime : 72;
        this.recoverTimer = 0;
        this.alive = true;

        this.range = config.range || 50;
        this.attackDuration = config.attackDuration || 60;
        this.attackCooldown = config.attackCooldown || 60;
        // Frame (counting down from attackDuration) at which damage is applied.
        this.damageFrame = config.damageFrame !== undefined ? config.damageFrame : Math.floor(this.attackDuration / 2);
        this.damageAmount = config.damageAmount || 20;

        this.attackStanceTimer = 0;
        this.cooldownTimer = 0;
        this.enableAttack = true;

        this.hasRangeAttack = !!config.hasRangeAttack;
        this.usingRangeAttack = !!config.usingRangeAttack;
        this.rangeAttackDuration = config.rangeAttackDuration || 60;
        this.rangeAttackCooldown = config.rangeAttackCooldown || 0;
        this.rangeAttackCooldownTimer = 0;
        this.castingFrame = config.castingFrame !== undefined ? config.castingFrame : Math.floor(this.attackDuration / 2);

        this.hHalfSize = (config.size && config.size.hHalfSize) || 30;
        this.vUpperSize = (config.size && config.size.vUpperSize) || 30;
        this.vLowerSize = (config.size && config.size.vLowerSize) || 55;

        this.patrolXL = (config.patrol && config.patrol.xl) || 300;
        this.patrolXR = (config.patrol && config.patrol.xr) || 1500;
    }

    isAlive() {
        return this.alive;
    }

    move(dir) {
        if (this.recoverTimer == 0 && this.attackStanceTimer == 0) {
            this.direction = dir;
            this.animationDirection = dir;
        }
    }

    stop(dir) {
        if (this.direction == dir)
            this.direction = 0;
    }

    takeDamage(damage, poiseDamage, isLocalPlayer) {
        if (!this.alive)
            return;

        this.health -= damage;

        if (this.health > 0) {
            if (this.recoverTimer == 0) {
                this.poise -= poiseDamage || 0;
                if (this.poise <= 0) {
                    this.attackStanceTimer = 0;
                    this.recoverTimer = this.recoverTime;
                    this.poise = this.maxPoise;
                }
            }
            if (this.sounds.damage) {
                this.sounds.damage.currentTime = 0;
                this.sounds.damage.play().catch(() => {});
            }
        }
        else {
            this.alive = false;
            if (this.sounds.death) {
                this.sounds.death.currentTime = 0;
                this.sounds.death.play().catch(() => {});
            }
            const seqName = this.animationDirection == -1 ? "deathLeft" : "deathRight";
            this.sprite.setSequence(this.sequences[seqName]);
            if (isLocalPlayer)
                this.world.socket.emit("enemy_dead", this.id);
        }
    }

    attack() {
        this.attackStanceTimer = this.attackDuration;
        this.cooldownTimer = this.attackCooldown;
    }

    rangeAttack() {}

    applyAttack() {
        this.detectPlayer(this.direction, this.range, true);
    }

    applyRangeAttack() {}

    stopAttack() {
        this.enableAttack = true;
    }

    getBoundingBox() {
        const { x, y } = this.sprite.getXY();
        return BoundingBox(this.ctx, y - this.vUpperSize, x - this.hHalfSize, y + this.vLowerSize, x + this.hHalfSize);
    }

    detectPlayer(direction, range, applyDamage = false) {
        const { x, y } = this.sprite.getXY();
        const detector = direction == -1
            ? BoundingBox(this.ctx, y - this.vUpperSize, x - range, y + this.vLowerSize, x)
            : BoundingBox(this.ctx, y - this.vUpperSize, x, y + this.vLowerSize, x + range);

        for (const player of this.world.players) {
            if (detector.intersect(player.getBoundingBox())) {
                if (applyDamage) {
                    if (this.sounds.attack) {
                        this.sounds.attack.currentTime = 0;
                        this.sounds.attack.play().catch(() => {});
                    }
                    player.takeDamage(this.damageAmount);
                }
                return true;
            }
        }
        return false;
    }

    updateAnimation() {
        if (!this.alive) return;
        const target = this.getAnimationState();
        if (target && this.animationState !== target) {
            this.animationState = target;
            this.sprite.setSequence(this.sequences[target]);
        }
    }

    getAnimationState() {
        throw new Error("getAnimationState() must be implemented by subclass");
    }

    update(time) {
        const { x, y } = this.sprite.getXY();
        this.isMoving = false;

        if (this.recoverTimer == 0 && this.attackStanceTimer == 0 && this.alive) {
            if (this.detectPlayer(this.direction, this.range) && this.enableAttack) {
                if (this.cooldownTimer == 0)
                    this.attack();
            }
            else {
                const forward  = this.direction == 1 ? this.patrolXR - x : x - this.patrolXL;
                const backward = this.direction == 1 ? x - this.patrolXL : this.patrolXR - x;

                if (this.detectPlayer(this.direction, forward) && this.hasRangeAttack && this.rangeAttackCooldownTimer == 0) {
                    this.rangeAttack();
                }
                else if (!this.detectPlayer(this.direction, forward) && this.detectPlayer(-this.direction, backward)) {
                    this.move(-this.direction);
                }
                else {
                    const newX = x + this.speed / 60 * this.direction;
                    if (newX > this.patrolXL && newX < this.patrolXR) {
                        this.sprite.setXY(newX, y);
                        this.isMoving = true;
                    }
                    else
                        this.move(-this.direction);
                }
            }
        }

        if (this.recoverTimer > 0)
            this.recoverTimer--;

        if (this.cooldownTimer > 0)
            this.cooldownTimer--;

        if (this.rangeAttackCooldownTimer > 0)
            this.rangeAttackCooldownTimer--;

        if (this.attackStanceTimer == this.damageFrame && !this.usingRangeAttack)
            this.applyAttack();

        if (this.attackStanceTimer == this.castingFrame && this.usingRangeAttack)
            this.applyRangeAttack();

        if (this.attackStanceTimer > 0) {
            this.attackStanceTimer--;
            if (this.attackStanceTimer == 0)
                this.usingRangeAttack = false;
        }

        this.updateAnimation();
        this.sprite.update(time);
    }

    draw() {
        this.sprite.draw();
    }
}
