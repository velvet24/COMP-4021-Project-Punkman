const Punkman = (function(){
    let user = null;
    let inGame = false;

    const init = function(){
        socket = io();

        socket.on("connect_error", (error) => {
            $("#connect-message").text(error.message);
        });

        socket.on("connect", () => {
            $("#connect-page").hide();
            $("#start-page").show();
            validate();
        });

        socket.on("disconnect", () => {
            window.location.reload();
        });

        Avatar.populate($("#register-avatar"));

        $("#start-signin-button").on("click", function() {
            $("#start-page").hide();
            $("#signin-page").show();
            $("#signin-form").get(0).reset();
            $("#signin-message").text("");
        });

        $("#start-register-button").on("click", function() {
            $("#start-page").hide();
            $("#register-page").show();
            $("#register-form").get(0).reset();
            $("#register-message").text("");
        });

        $(".back-button").on("click", function() {
            $("#start-page").show();
            $("#signin-page").hide();
            $("#register-page").hide();
        });

        $("#register-button").on("click", function(e) {
            e.preventDefault();

            const username = $("#register-username").val().trim();
            const avatar = $("#register-avatar").val();
            const name = $("#register-name").val().trim();
            const password = $("#register-password").val().trim();
            const confirmPassword = $("#register-confirm").val().trim();

            if(password != confirmPassword) {
                $("#register-message").text("Passwords do not match.");
                return;
            }

            const json = JSON.stringify({username, avatar, name, password});
            fetch("/register", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: json
            })
            .then((res) => res.json())
            .then((json) => {
                if (json.error) {
                    $("#register-message").text(json.error);
                    return;
                }
                $("#register-form").get(0).reset();
                $("#register-message").text("Your account has been successfully registered.");
            })
            .catch((err) => {
                $("#register-message").text(err);
            });
        });

        $("#signin-button").on("click", function(e) {
            e.preventDefault();
            const username = $("#signin-username").val().trim();
            const password = $("#signin-password").val().trim();
            const json = JSON.stringify({username, password});
            fetch("/signin", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: json
            })
            .then((res) => res.json())
            .then((json) => {
                if (json.error) {
                    $("#signin-message").text(json.error);
                    return;
                }
                user = json.user;
                $("#user-avatar").html(Avatar.getCode(user.avatar));
                $("#user-name").text(user.name);

                $("#signin-page").hide();
                $("#join-page").show();
                initJoinPage();
            })
            .catch((err) => {
                $("#signin-message").text(err);
            });
        });

        $("#signout-button").on("click", function(e) {
            e.preventDefault();
            fetch("/signout")
            .then((res) => res.json())
            .then((json) => {
                if (json.error) {
                    console.log(json.error);
                    return;
                }
                user = null;
                $("#join-page").hide();
                $("#start-page").show();
            })
            .catch((err) => {
                console.log(err);
            });
        });
    };

    const initJoinPage = function(){
        $("#join-button").on("click", function(e){
            e.preventDefault();
            socket.emit("join", user.name);
        });

        socket.on("join_error", (error) => {
            $("#join-message").text(error);
        });

        socket.on("join_success", () => {
            $("#join-page").hide();
            $("#wait-page").show();

            initWaitPage();
            inGame = true;
        });
    };

    const initWaitPage = function(){
        $("#ready-button").on("click", function(e){
            socket.emit("ready");
            $("#ready-button").hide();
            $("#game-message").text("Please wait for the other players...");
        });

        socket.on("update_players", (players) => {
            if(!inGame)
                return;
            updatePlayers(players);
        });

        socket.on("game_start", () => {
            if(!inGame)
                return;

            $("#wait-page").hide();
            $("#lobby").hide();
            $("#main-page").show();

            initMainPage();
        });
    };

    const initMainPage = function(){
        socket.on("game_end", (players) => {
            if(!inGame)
                return;
            updatePlayers(players);

            inGame = false;
        });

        const cv = $("canvas").get(0);
        const context = cv.getContext("2d");
        const gameArea = BoundingBox(context, 0, 0, 1080, 1920);
        
        const sounds = {
            background: new Audio("sounds/FlashManStage.mp3")
        };

        const obstacles = [
            Floor(context, 128, 1048),
            Floor(context, 384, 1048),
            Floor(context, 640, 1048),
            Floor(context, 896, 1048),
            Floor(context, 1152, 1048),
            Floor(context, 1408, 1048),
            Floor(context, 1664, 1048),
            Floor(context, 1920, 1048),
            Floor(context, 128, 792),
            Floor(context, 384, 792),
            Floor(context, 640, 792),
            Floor(context, 896, 792),
            Floor(context, 1152, 792),
            Floor(context, 1408, 792),
            Wall(context, 32, 920),
            Wall(context, 1888, 920)
        ];
        const player = Player(context, 960, 300, gameArea, obstacles);
        const enemies = [];
        const enemyBounds = {left: 96, right: 1824};
        const enemyLaneY = 951;
        const enemySpawnDelay = 3000;
        const enemySpawnInterval = 2500;
        const maxEnemies = 6;
        let gameStartTime = 0;
        let lastSpawnTime = 0;
        let cheatMessageUntil = 0;
        let gameOver = false;

        context.imageSmoothingEnabled = false;

        const getTargetEnemyCount = function(now) {
            const elapsed = now - gameStartTime;
            if (elapsed < enemySpawnDelay)
                return 0;

            return Math.min(maxEnemies, 1 + Math.floor((elapsed - enemySpawnDelay) / 8000));
        };

        const spawnEnemy = function(now) {
            const spawnSide = Math.random() < 0.5 ? "left" : "right";
            const spawnX = spawnSide === "left" ? enemyBounds.left : enemyBounds.right;
            enemies.push(Enemy(context, spawnX, enemyLaneY, {
                spawnSide: spawnSide,
                movementBounds: enemyBounds,
                speed: 170 + enemies.length * 15
            }));
            lastSpawnTime = now;
        };

        const drawHealthBar = function() {
            const barX = 48;
            const barY = 48;
            const barWidth = 320;
            const barHeight = 28;
            const ratio = player.isCheatMode() ? 1 : player.getHealth() / player.getMaxHealth();

            context.save();
            context.fillStyle = "rgba(0, 0, 0, 0.65)";
            context.fillRect(barX - 6, barY - 34, barWidth + 12, barHeight + 46);

            context.font = "28px Helvetica";
            context.fillStyle = "white";
            context.fillText("Health", barX, barY - 10);

            context.strokeStyle = "white";
            context.lineWidth = 3;
            context.strokeRect(barX, barY, barWidth, barHeight);

            context.fillStyle = player.isCheatMode() ? "#4dd0ff" : "#ff5c5c";
            context.fillRect(barX, barY, barWidth * ratio, barHeight);

            context.font = "24px Helvetica";
            context.fillStyle = "white";
            const healthLabel = player.isCheatMode()
                ? "INF"
                : `${player.getHealth()} / ${player.getMaxHealth()}`;
            context.fillText(healthLabel, barX + barWidth + 24, barY + 24);

            context.font = "22px Helvetica";
            context.fillText(`Enemies: ${enemies.length}`, barX, barY + 70);

            if (player.isCheatMode() || performance.now() < cheatMessageUntil) {
                context.fillStyle = "#4dd0ff";
                context.fillText("Cheat mode active (C)", barX, barY + 104);
            }

            context.restore();
        };

        const drawGameOver = function() {
            context.save();
            context.fillStyle = "rgba(0, 0, 0, 0.72)";
            context.fillRect(0, 0, cv.width, cv.height);
            context.font = "96px Helvetica";
            context.textAlign = "center";
            context.fillStyle = "#ff5c5c";
            context.fillText("Game Over", cv.width / 2, cv.height / 2);
            context.font = "42px Helvetica";
            context.fillStyle = "white";
            context.fillText("The enemies caught you.", cv.width / 2, cv.height / 2 + 80);
            context.restore();
        };

        function doFrame(now) {
            if (gameStartTime === 0)
                gameStartTime = now;

            if (gameOver) {
                context.clearRect(0, 0, cv.width, cv.height);
                obstacles.forEach((obstacle) => obstacle.draw());
                enemies.forEach((enemy) => enemy.draw());
                player.draw();
                drawHealthBar();
                drawGameOver();
                return;
            }

            const targetEnemyCount = getTargetEnemyCount(now);
            const canSpawnEnemy = targetEnemyCount > enemies.length &&
                now - lastSpawnTime >= enemySpawnInterval;
            if (canSpawnEnemy)
                spawnEnemy(now);

            player.update(now);
            enemies.forEach((enemy) => enemy.update(now));

            for (const enemy of enemies) {
                if (player.getBoundingBox().intersect(enemy.getBoundingBox())) {
                    player.takeDamage(now);
                    if (!player.isAlive()) {
                        gameOver = true;
                        inGame = false;
                        sounds.background.pause();
                    }
                    break;
                }
            }

            context.clearRect(0, 0, cv.width, cv.height);

            obstacles.forEach(_ => _.draw());
            enemies.forEach((enemy) => enemy.draw());
            player.draw();
            drawHealthBar();

            if (gameOver) {
                drawGameOver();
                return;
            }

            requestAnimationFrame(doFrame);
        }

        $(document).on("keydown", function(event) {
            switch (event.keyCode){
                case 32:
                    player.jump();
                    break;
                case 67:
                    player.toggleCheatMode();
                    cheatMessageUntil = performance.now() + 2000;
                    break;
                case 37:
                    player.move(1);
                    break;
                case 38:
                    break;
                case 39:
                    player.move(3);
                    break;
                case 40:
                    break;
            }
        });

        $(document).on("keyup", function(event) {
            switch (event.keyCode){
                case 32:
                    break;
                case 37:
                    player.stop(1);
                    break;
                case 38:
                    break;
                case 39:
                    player.stop(3);
                    break;
                case 40:
                    break;
            }
        });

        sounds.background.play();
        requestAnimationFrame(doFrame);
    };

    const updatePlayers = function(players){
        $(".player").hide();

        let index = 1;
        for (const id in players) {
            const player = players[id];

            let name = "You are";
            if (id != socket.id)
                name = `${player["name"]} is`;

            let status = "";
            if (player["ready"])
                status = `${name} ready!`;
            else
                status = `${name} not yet ready!`;

            $("#player" + index).find(".status").text(status);
            $("#player" + index).show();

            index++;
        }
    };

    const validate = function(){
        fetch("/validate")
        .then((res) => res.json())
        .then((json) => {
            if(json.error){
                console.log(json.error);
                return;
            }

            user = json.user;
            $("#user-avatar").html(Avatar.getCode(user.avatar));
            $("#user-name").text(user.name);

            $("#start-page").hide();
            $("#join-page").show();
            initJoinPage();
        })
        .catch((error) => {
            console.log(error);
        });
    };

    return {init};
})();