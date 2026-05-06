const ShieldPickup = function(ctx, x, y, world) {
    const sequences = {
        yellow: { x: 192, y: 64, width: 16, height: 16, count: 4, timing: 200, loop: true }
    };

    const sprite = Sprite(ctx, x, y);
    sprite.setSequence(sequences.yellow)
          .setScale(5)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet("images/object_sprites.png");

    const sound = new Audio("sounds/EnergyFill.wav");
    let alive = true;

    const update = function(time) {
        if (!alive) return false;
        const { x: ix, y: iy } = sprite.getXY();
        for (const player of world.players) {
            if (player.alive && player.getBoundingBox().isPointInBox(ix, iy)) {
                sound.currentTime = 0;
                sound.play().catch(() => {});
                player.activateShield();
                alive = false;
                return false;
            }
        }
        sprite.update(time);
        return true;
    };

    const draw = function() {
        if (alive) sprite.draw();
    };

    const getBoundingBox = function() {
        return sprite.getBoundingBox();
    };

    return { update, draw, getBoundingBox, isAlive: () => alive };
};