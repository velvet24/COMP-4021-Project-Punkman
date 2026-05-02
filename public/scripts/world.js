const World = function() {
    const players = [];
    const enemies = [];
    const bullets = [];
    const coins = [];
    const obstacles = [];

    let socket;

    return { players, enemies, bullets, coins, obstacles, socket };
};