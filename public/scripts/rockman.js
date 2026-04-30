class RockmanPlayer extends PlayerBase {
    constructor(ctx, x, y, gameArea, world) {
        const sequences = {
            idleLeft: { x: 1024, y: 1536, width: 256, height: 256, count: 1, timing: 2000, loop: false },
            idleRight: { x: 0, y: 0, width: 256, height: 256, count: 1, timing: 2000, loop: false },

            idleShootLeft: { x: 0, y: 1792, width: 256, height: 256, count: 1, timing: 2000, loop: false },
            idleShootRight: { x: 1024, y: 256, width: 256, height: 256, count: 1, timing: 2000, loop: false },

            moveLeft: { x: 1024, y: 1792, width: -256, height: 256, count: 4, timing: 150, loop: true },
            moveRight: { x: 0, y: 256, width: 256, height: 256, count: 4, timing: 150, loop: true },

            moveShootLeft: { x: 768, y: 2048, width: -256, height: 256, count: 4, timing: 150, loop: true },
            moveShootRight: { x: 256, y: 512, width: 256, height: 256, count: 4, timing: 150, loop: true },

            jumpLeft: { x: 0, y: 1536, width: 256, height: 256, count: 1, timing: 2000, loop: false },
            jumpRight: { x: 1024, y: 0, width: 256, height: 256, count: 1, timing: 2000, loop: false },

            jumpShootLeft: { x: 1024, y: 2048, width: 256, height: 256, count: 1, timing: 2000, loop: false },
            jumpShootRight: { x: 0, y: 512, width: 256, height: 256, count: 1, timing: 2000, loop: false },

            recoverLeft: { x: 768, y: 2304, width: -256, height: 256, count: 2, timing: 100, loop: true },
            recoverRight: { x: 256, y: 768, width: 256, height: 256, count: 2, timing: 100, loop: true }
        };

        super(ctx, x, y, gameArea, world, {
            initialSequence: sequences.idleRight,
            sheet: "images/rockman_spritesheet.png",
            scale: 0.5,
            shadowScale: { x: 0, y: 0 },
            sounds: {
                land: new Audio("sounds/MegamanLand.wav"),
                damage: new Audio("sounds/MegamanDamage.wav"),
                death: new Audio("sounds/MegamanDefeat.wav")
            },
            size: {
                hHalfSize: 25,
                vUpperSize: 30,
                vLowerSize: 55
            }
        });

        this.sequences = sequences;
        this.busterSound = new Audio("sounds/MegaBuster.wav");
        this.animationState = 7;
    }

    attack() {
        if (this.canAttack()) {
            this.enableAttack = false;
            this.attackStanceTimer = 20;
            this.cooldownTimer = 10;
            this.busterSound.currentTime = 0;
            this.busterSound.play();
            const { x, y } = this.sprite.getXY();
            if (this.animationDirection == 3)
                this.world.bullets.push(Bullet(this.ctx, x + this.hHalfSize, y, this.animationDirection, this.world));
            else
                this.world.bullets.push(Bullet(this.ctx, x - this.hHalfSize, y, this.animationDirection, this.world));
        }
    }

    updateAnimation() {
        if (!this.alive)
            return;

        if (this.animationDirection == 1) {
            if (this.recoverTimer == 0) {
                if (this.standing()) {
                    if (this.direction == 0) {
                        if (this.attackStanceTimer == 0) {
                            if (this.animationState != 0) {
                                this.sprite.setSequence(this.sequences.idleLeft);
                                this.animationState = 0;
                            }
                        }
                        else {
                            if (this.animationState != 1) {
                                this.sprite.setSequence(this.sequences.idleShootLeft);
                                this.animationState = 1;
                            }
                            this.attackStanceTimer--;
                        }
                    }
                    else {
                        if (this.attackStanceTimer == 0) {
                            if (this.animationState != 2) {
                                this.sprite.setSequence(this.sequences.moveLeft);
                                this.animationState = 2;
                            }
                        }
                        else {
                            if (this.animationState != 3) {
                                this.sprite.setSequence(this.sequences.moveShootLeft);
                                this.animationState = 3;
                            }
                            this.attackStanceTimer--;
                        }
                    }
                }
                else {
                    if (this.attackStanceTimer == 0) {
                        if (this.animationState != 4) {
                            this.sprite.setSequence(this.sequences.jumpLeft);
                            this.animationState = 4;
                        }
                    }
                    else {
                        if (this.animationState != 5) {
                            this.sprite.setSequence(this.sequences.jumpShootLeft);
                            this.animationState = 5;
                        }
                        this.attackStanceTimer--;
                    }
                }
            }
            else if (this.animationState != 6) {
                this.sprite.setSequence(this.sequences.recoverLeft);
                this.animationState = 6;
            }
        }
        else if (this.animationDirection == 3) {
            if (this.recoverTimer == 0) {
                if (this.standing()) {
                    if (this.direction == 0) {
                        if (this.attackStanceTimer == 0) {
                            if (this.animationState != 7) {
                                this.sprite.setSequence(this.sequences.idleRight);
                                this.animationState = 7;
                            }
                        }
                        else {
                            if (this.animationState != 8) {
                                this.sprite.setSequence(this.sequences.idleShootRight);
                                this.animationState = 8;
                            }
                            this.attackStanceTimer--;
                        }
                    }
                    else {
                        if (this.attackStanceTimer == 0) {
                            if (this.animationState != 9) {
                                this.sprite.setSequence(this.sequences.moveRight);
                                this.animationState = 9;
                            }
                        }
                        else {
                            if (this.animationState != 10) {
                                this.sprite.setSequence(this.sequences.moveShootRight);
                                this.animationState = 10;
                            }
                            this.attackStanceTimer--;
                        }
                    }
                }
                else {
                    if (this.attackStanceTimer == 0) {
                        if (this.animationState != 11) {
                            this.sprite.setSequence(this.sequences.jumpRight);
                            this.animationState = 11;
                        }
                    }
                    else {
                        if (this.animationState != 12) {
                            this.sprite.setSequence(this.sequences.jumpShootRight);
                            this.animationState = 12;
                        }
                        this.attackStanceTimer--;
                    }
                }
            }
            else if (this.animationState != 13) {
                this.sprite.setSequence(this.sequences.recoverRight);
                this.animationState = 13;
            }
        }
    }
}

const Rockman = function(ctx, x, y, gameArea, world) {
    return new RockmanPlayer(ctx, x, y, gameArea, world);
};
