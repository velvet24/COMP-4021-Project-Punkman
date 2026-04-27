const Floor = function(ctx, x, y){
    const sequence = {x: 0, y: 0, width: 128, height: 32, count:0, timing: 200, loop: false};

    const sprite = Sprite(ctx, x, y);
    
    sprite.setSequence(sequence).setScale(2).setShadowScale({x: 0, y: 0}).useSheet("images/tiles/1_Industrial_Tileset_1B.png");

    return {
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: sprite.update
    };
}