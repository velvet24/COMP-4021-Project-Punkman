const ShooterBullet = function(ctx, x, y, targetX, targetY) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 5;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    const sequence = {
        x: 158, y: 27, width: 10, height: 10,
        count: 4, timing: 100, loop: true
    };

    const sprite = Sprite(ctx, x, y);
    sprite.setSequence(sequence)
          .setScale(2)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet("images/shooter.png");

    const damage = 15;
    let alive = true;

    const update = function(players) {
        if (!alive) return false;
        let { x, y } = sprite.getXY();
        x += vx;
        y += vy;
        sprite.setXY(x, y);
        for (const player of players) {
            if (player.getBoundingBox && player.getBoundingBox().isPointInBox(x, y)) {
                player.takeDamage(damage);
                alive = false;
                return false;
            }
        }
        if (x < -50 || x > 1970 || y < -50 || y > 1130) {
            alive = false;
            return false;
        }
        return true;
    };

    return {
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};