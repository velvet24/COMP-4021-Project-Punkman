// This function defines the BoundingBox module.
// - `ctx` - A canvas context for using isPathInPoint()
// - `top` - The top side of the box
// - `left` - The left side of the box
// - `bottom` - The bottom side of the box
// - `right` - The right side of the box
const BoundingBox = function(ctx, top, left, bottom, right) {

    // This is the path containing the bounding box.
    // It is initialized using the parameters of the function.
    //
    // `Path2D()` creates a new path that can be re-used by
    // the canvas context. This path is used to detect the
    // intersection of a point or a box against this
    // bounding box.
    const path = new Path2D();
    path.rect(left, top, right - left, bottom - top);

    // This function gets the top side of the bounding box.
    const getTop = function() {
        return top;
    };

    // This function gets the left side of the bounding box.
    const getLeft = function() {
        return left;
    };

    // This function gets the bottom side of the bounding box.
    const getBottom = function() {
        return bottom;
    };

    // This function gets the right side of the bounding box.
    const getRight = function() {
        return right;
    };

    // This function gets the four corner points of the bounding box.
    const getPoints = function() {
        return {
            topLeft: [left, top],
            topRight: [right, top],
            bottomLeft: [left, bottom],
            bottomRight: [right, bottom]
        };
    };

    // This function tests whether a point is in the bounding box.
    // - `x`, `y` - The (x, y) position to be tested
    const isPointInBox = function(x, y) {
        return ctx.isPointInPath(path, x, y);
    };

    // This function checks whether the two bounding boxes intersect.
    // - `box` - The other bounding box
    const intersect = function(box) {
        if (right < box.getLeft() || left > box.getRight()) return false;
        if (bottom < box.getTop() || top > box.getBottom()) return false;
        return true;
    };

    // This function generates a random point inside the bounding box.
    const randomPoint = function() {
        const x = left + (Math.random() * (right - left));
        const y = top + (Math.random() * (bottom - top));
        return {x, y};
    };

    // This function draws the bounding box for debugging.
    // - `color` - The stroke color of the bounding box
    // - `lineWidth` - The line width of the bounding box
    const draw = function(color = "red", lineWidth = 3) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke(path);
        ctx.restore();
    };

    // The methods are returned as an object here.
    return {
        getTop: getTop,
        getLeft: getLeft,
        getBottom: getBottom,
        getRight: getRight,
        getPoints: getPoints,
        isPointInBox: isPointInBox,
        intersect: intersect,
        randomPoint: randomPoint,
        draw: draw
    };
};
