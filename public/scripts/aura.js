const Aura = function(ctx, x, y){
    const sequence = {x: 0, y: 0, width: 428, height: 442, count: 4, timing: 200, loop: true};

    const sprite = Sprite(ctx, x, y);
    
    sprite.setSequence(sequence).setScale(0.35).setShadowScale({x: 0, y: 0}).useSheet("images/aura.png");

    return {
        draw: sprite.draw,
        update: sprite.update,
        setXY: sprite.setXY
    };
}