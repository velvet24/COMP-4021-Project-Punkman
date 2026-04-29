// This function defines the Gem module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the gem
// - `y` - The initial y position of the gem
// - `color` - The colour of the gem
const Gem = function(ctx, x, y, color, world) {

    // This is the sprite sequences of the gem of four colours
    // `green`, `red`, `yellow` and `purple`.
    const sequences = {
        green:  { x: 192, y:  0, width: 16, height: 16, count: 4, timing: 200, loop: true },
        red:    { x: 192, y: 16, width: 16, height: 16, count: 4, timing: 200, loop: true },
        yellow: { x: 192, y: 32, width: 16, height: 16, count: 4, timing: 200, loop: true },
        purple: { x: 192, y: 48, width: 16, height: 16, count: 4, timing: 200, loop: true }
    };

    // This is the sprite object of the gem created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the gem sprite here.
    sprite.setSequence(sequences[color])
          .setScale(5)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet("images/object_sprites.png");

    const sound = new Audio("sounds/EnergyFill.wav");

    const update = function(time) {
        let {x, y} = sprite.getXY();
        for (const player of world.players) {
            if (player.getBoundingBox().isPointInBox(x, y)) {
                sound.currentTime = 0;
                sound.play();
                return false;
            }
        }
        sprite.update(time);
        return true;
    };

    // The methods are returned as an object here.
    return {
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update,
    };
};
