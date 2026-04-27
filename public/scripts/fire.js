const Fire = function(ctx, x, y){
    const sequence = {x: 0, y: 160, width: 16, height: 16, count:8, timing: 200, loop: true};

    const sprite = Sprite(ctx, x, y);
    
    sprite.setSequence(sequence).setScale(2).setShadowScale({x: 0.75, y: 0.2}).useSheet("object_sprites.png");

    return {
        draw: sprite.draw,
        update: sprite.update
    };
}