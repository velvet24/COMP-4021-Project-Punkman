const Enemy = function(ctx, x, y, options = {}) {
	const sequences = {
		moveLeft: { x: 162, y: 361, width: 45, height: 55, count: 13, timing: 80, loop: true, pingpong: true },
		moveRight: { x: 162, y: 361, width: 45, height: 55, count: 13, timing: 80, loop: true, pingpong: true }
	};

	const movementBounds = options.movementBounds ?? { left: 96, right: 1824 };
	const speed = options.speed ?? 180;
	const spawnSide = options.spawnSide === "right" ? "right" : "left";

	const sprite = Sprite(ctx, x, y);
	sprite.setSequence(spawnSide === "left" ? sequences.moveRight : sequences.moveLeft)
		  .setScale(2)
		  .setShadowScale({ x: 0, y: 0 })
		  .setBoundingBox({ width: 40, height: 55, offsetY: 6 })
		  .useSheet("images/Enemy.png");

	let direction = spawnSide === "left" ? 1 : -1;

	const update = function(time) {
		let { x: currentX, y: currentY } = sprite.getXY();
		currentX += direction * speed / 60;

		if (currentX <= movementBounds.left) {
			currentX = movementBounds.left;
			direction = 1;
			sprite.setSequence(sequences.moveRight);
		}
		else if (currentX >= movementBounds.right) {
			currentX = movementBounds.right;
			direction = -1;
			sprite.setSequence(sequences.moveLeft);
		}

		sprite.setXY(currentX, currentY);
		sprite.update(time);
	};

	return {
		getBoundingBox: sprite.getBoundingBox,
		draw: sprite.draw,
		update: update
	};
};
