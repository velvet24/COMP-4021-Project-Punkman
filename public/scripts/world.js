const World = function() {
    const players = [];
    const enemies = [];
    const bullets = [];
    const coins = [];
    const obstacles = [];

    let socket;

    let shooterAlive = true;

    const isShooterAlive = function() {return shooterAlive;}

    const killShooter = function() {shooterAlive = false;}

    return { 
        players, enemies, bullets, coins, obstacles, socket, 
        isShooterAlive, killShooter 
    };
};