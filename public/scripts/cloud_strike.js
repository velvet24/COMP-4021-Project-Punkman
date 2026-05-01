const CloudStrike = function(ctx, targetPlayer, world) {
    const SEQUENCE = {
        x: 0, y: 0,
        width: 140, height: 93,
        count: 16,
        timing: 80,
        loop: false
    };

    const DAMAGE_FRAME = 8;
    const DAMAGE_TIME = DAMAGE_FRAME * SEQUENCE.timing;
    const TOTAL_TIME = SEQUENCE.count * SEQUENCE.timing;


    const targetBox = targetPlayer.getBoundingBox();
    const strikeX = (targetBox.getLeft() + targetBox.getRight()) / 2;
    const strikeY = targetBox.getTop() - 20;

    const sprite = Sprite(ctx, strikeX, strikeY);
    sprite.setSequence(SEQUENCE)
          .setScale(2)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet("images/thunder.png");

    let startTime = null;
    let damageDone = false;
    let alive = true;

    const sound = new Audio("sounds/thunder.mp3");

    const update = function(time) {
        if (!alive) return false;
        if (startTime === null) startTime = time;

        const elapsed = time - startTime;
        sprite.update(time);

        if (!damageDone && elapsed >= DAMAGE_TIME) {
            const aoeRange = 60;
            const aoeBox = BoundingBox(ctx, strikeY - aoeRange, strikeX - aoeRange, strikeY + aoeRange, strikeX + aoeRange);

            for (const player of world.players) {
                if (player.alive && player.getBoundingBox().intersect(aoeBox)) {
                    player.takeDamage(35);
                }
            }

            sound.currentTime = 0;
            sound.play().catch(() => {});
            damageDone = true;
        }

        if (elapsed >= TOTAL_TIME) {
            alive = false;
            return false;
        }
        return true;
    };

    const draw = function() {
        if (!alive) return;
        sprite.draw();
    };

    const isAlive = function() { return alive; };

    return { update, draw, isAlive };
};