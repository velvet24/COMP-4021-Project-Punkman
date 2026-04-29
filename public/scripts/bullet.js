const Bullet = function(ctx, x, y, direction, world){
    let sequence, speed;
    if(direction == 3){
        sequence = {x: 512, y: 1024, width: 256, height: 256, count:1, timing: 200, loop: false};
        speed = 15;
    }
    else{
        sequence = {x: 512, y: 2560, width: 256, height: 256, count:1, timing: 200, loop: false};
        speed = -15;
    }

    const sprite = Sprite(ctx, x, y);
    sprite.setSequence(sequence).setScale(0.5).setShadowScale({x: 0, y: 0}).useSheet("images/rockman_spritesheet.png");

    const damage = 10;

    const update = function(){
        let {x, y} = sprite.getXY();

        for(const enemy of world.enemies){
            if(enemy.isAlive() && enemy.getBoundingBox().isPointInBox(x, y)){
                enemy.takeDamage(damage);
                return false;
            }
        }
        
        x += speed;
        if(x < -100 || x > 2000)
            return false;

        sprite.setXY(x+speed, y);
        return true;
    }

    return {
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update
    };
}