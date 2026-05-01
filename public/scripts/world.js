const World = function() {
    const players = [];
    const enemies = [];
    const bullets = [];
    const coins = [];
    const obstacles = [];
    const cloudStrikes = []; 

    let socket;

    return { players, enemies, bullets, coins, obstacles, cloudStrikes, socket };
};