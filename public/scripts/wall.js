const Wall = function(ctx, x, y){
    const sequence = {x: 96, y: 32, width: 32, height: 96, count:0, timing: 200, loop: false};

    const sprite = Sprite(ctx, x, y);
    
    sprite.setSequence(sequence).setScale(2).setShadowScale({x: 0, y: 0}).useSheet("images/tiles/1_Industrial_Tileset_1B.png");

    return {
        draw: sprite.draw,
        update: sprite.update
    };
}