const ArrowSign = function(ctx, x, y){
    const sequence = {x: 0, y: 0, width: 300, height: 300, count: 0, timing: 200, loop: false};

    const sprite = Sprite(ctx, x, y);
    
    sprite.setSequence(sequence).setScale(0.5).setShadowScale({x: 0, y: 0}).useSheet("images/arrow.png");

    return {
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: sprite.update
    };
}