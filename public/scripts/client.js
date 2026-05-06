const Client = (function(){
    let user = null;
    let inGame = false;
    let characters = [];
    let selectedCharacter = "Knight";

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
        function generateCharacterIcon(sheetSrc, frameX, frameY, frameW, frameH, targetWidth) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const scale = targetWidth / Math.abs(frameW);
                    canvas.width = targetWidth;
                    canvas.height = frameH * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, frameX, frameY, frameW, frameH, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL());
                };
                img.src = sheetSrc;
            });
        }

        Promise.all([
            generateCharacterIcon("images/knight.png", 29, 23, 32, 32, 80),
            generateCharacterIcon("images/rockman_spritesheet.png", 0, 0, 256, 256, 80)
        ]).then(([knightUrl, rockmanUrl]) => {
            $("#char-knight").attr("src", knightUrl);
            $("#char-rockman").attr("src", rockmanUrl);
        });


        $(".character-option").on("click", function() {
            $(".character-option").removeClass("selected");
            $(this).addClass("selected");
            selectedCharacter = $(this).data("character");
        });
        
        $("#ready-button").on("click", function(e){
            socket.emit("ready", selectedCharacter);
            $("#ready-button").hide();
            $("#game-message").text("Please wait for the other players...");
        });

        socket.on("update_players", (players) => {
            if(!inGame)
                return;

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
        });

        socket.on("game_start", (players) => {
            if (!inGame) return;
            $("#wait-page").hide();
            $("#lobby").hide();
            $("#main-page").show();
            initMainPage(players);
        });
    };

    const initMainPage = function(players){
        const cv = $("canvas").get(0);
        const context = cv.getContext("2d");
        const gameArea = BoundingBox(context, 0, 0, 1080, 1920);
        
        const sounds = {
            background: new Audio("sounds/FlashManStage.mp3"),
            cheat: new Audio("sounds/1up.wav")
        };

        const world = World();

        world.socket = socket;

        world.obstacles = [
            Wall(context, 0, 728),
            Wall(context, 0, 536),
            Wall(context, 0, 344),
            Wall(context, 0, 152),
            Wall(context, 1920, 920),
            Wall(context, 1920, 728),
            Wall(context, 1920, 536),
            Wall(context, 1920, 344),

            Floor(context, 128, 1048),
            Floor(context, 384, 1048),
            Floor(context, 640, 1048),
            Floor(context, 896, 1048),
            Floor(context, 1152, 1048),
            Floor(context, 1408, 1048),
            Floor(context, 1664, 1048),
            Floor(context, 1920, 1048),

            Floor(context, 128, 856),
            Floor(context, 384, 856),
            Floor(context, 640, 856),
            Floor(context, 896, 856),
            Floor(context, 1152, 856),
            Floor(context, 1408, 856),
            Floor(context, 1664, 856),

            Floor(context, 128, 664),

            Floor(context, 384, 472),
            Floor(context, 640, 472),
            Floor(context, 896, 472),
            Floor(context, 1152, 472),
            Floor(context, 1408, 472),
            Floor(context, 1664, 472),
            Floor(context, 1920, 472),

            Floor(context, 128, 280),
            Floor(context, 384, 280),
            Floor(context, 640, 280),
            Floor(context, 896, 280),
            Floor(context, 1408, 280),
            Floor(context, 1664, 280),
            Floor(context, 1920, 280),
        ];

        world.enemies = [
            Skeleton(context, 500, 942, "skeleton", world),
            Goblin(context, 850, 938, "skeleton", world),
            Mushroom(context, 1200, 938, "skeleton", world),
            
            Boss(context, 350, 638, "death_bringer", world),

            Skeleton(context, 400, 366, "skeleton", world),
            Goblin(context, 700, 362, "skeleton", world),
            Mushroom(context, 1000, 362, "skeleton", world),
            Bat(context, 1300, 362, "skeleton", world),

            Bat(context, 300, 170, "skeleton", world),
            Bat(context, 900, 170, "skeleton", world),
            Bat(context, 1500, 170, "skeleton", world),
        ];

        world.coins = [
            Gem(context, 256, 976, "green", "gem0", world),
            Gem(context, 512, 976, "red", "gem1", world),
            Gem(context, 768, 976, "yellow", "gem2", world),
            Gem(context, 1024, 976, "purple", "gem3", world)
        ];

        world.flag = ArrowSign(context, 1850, 175);

        let pawn;

        let index = 1;

        for (const id in players) {
            let character;
            switch (players[id].character) {
                case "Rockman":
                    character = Rockman(context, index*100, 960, gameArea, world);
                    break;
                case "Knight":
                    character = Knight(context, index*100, 960, gameArea, world);
                    break;
            }

            if (id == socket.id) {
                character.setLocalPlayer();
                pawn = character;
            }
            $(`#player${index}-bar`).show();
            character.setIndex(index);
            world.players.push(character);
            index++;
        }

        let shooterSpawnTimer = 300;
        let spawnX = 200;

        const FIXED_STEP_MS = 1000 / 60;
        const MAX_CATCHUP_STEPS = 8;
        let lastFrameTime = 0;
        let accumulator = 0;
        let simulationNow = 0;

        context.imageSmoothingEnabled = false;

        let rafId = null;

        function doFrame(now) {
            if (lastFrameTime == 0) {
                lastFrameTime = now;
                simulationNow = now;
            }

            let frameTime = now - lastFrameTime;
            if (frameTime > 250)
                frameTime = 250;
            lastFrameTime = now;

            accumulator += frameTime;

            let catchupSteps = 0;
            while (accumulator >= FIXED_STEP_MS && catchupSteps < MAX_CATCHUP_STEPS) {
                simulationNow += FIXED_STEP_MS;

                world.players.forEach(_ => _.update(simulationNow));
                world.enemies.forEach(_ => _.update(simulationNow));

                for(let i=world.bullets.length-1; i>=0; i--){
                    let alive = world.bullets[i].update(simulationNow);
                    if(!alive)
                        world.bullets.splice(i, 1);
                }

                for(let i=world.coins.length-1; i>=0; i--){
                    let alive = world.coins[i].update(simulationNow);
                    if(!alive)
                        world.coins.splice(i, 1);
                }
                for (let i = world.shields.length - 1; i >= 0; i--) {
                    let alive = world.shields[i].update(simulationNow);
                    if (!alive)
                        world.shields.splice(i, 1);
                }
                shooterSpawnTimer--;
                if (shooterSpawnTimer == 0 && world.isShooterAlive()) {
                    spawnX += 500;
                    if (spawnX > 1900)
                        spawnX -= 1900;
                    world.enemies.push(Shooter(context, spawnX, world));
                    shooterSpawnTimer = 1200;
                }

                accumulator -= FIXED_STEP_MS;
                catchupSteps++;
            }

            if (catchupSteps == MAX_CATCHUP_STEPS) {
                accumulator = 0;
            }

            context.clearRect(0, 0, cv.width, cv.height);
            
            world.flag?.draw();

            world.obstacles.forEach(_ => _.draw());
            world.coins.forEach(_ => _.draw());
            world.shields.forEach(_ => _.draw());
            world.enemies.forEach(_ => _.draw());
            world.players.forEach(_ => _.draw());
            world.bullets.forEach(_ => _.draw());

            rafId = requestAnimationFrame(doFrame);
        }

        let cheatModeEnabled = false;

        function cheatMode() {
            sounds.cheat.currentTime = 0;
            sounds.cheat.play();
            if (cheatModeEnabled) {
                for (const player of world.players) {
                    player.disableCheatMode();
                    player.slowDown();
                }
                cheatModeEnabled = false;
            }
            else {
                for (const player of world.players) {
                    player.enableCheatMode();
                    player.speedUp();
                }
                cheatModeEnabled = true;
            }

        }

        $(document).on("keydown", function(event) {
            let input = {};
            input.event = "keydown";
            input.key = event.keyCode;
            input.index = pawn.getIndex() - 1;
            socket.emit("input", input);
        });

        $(document).on("keyup", function(event) {
            let input = {};
            input.event = "keyup";
            input.key = event.keyCode;
            input.index = pawn.getIndex() - 1;
            socket.emit("input", input);
        });

        socket.on("input", (input) => {
            if (!world.players[input.index].getAcceptInput())
                return;
            
            if (input.event == "keydown") {
                switch (input.key){
                    case 32:
                    case 87:
                        world.players[input.index].jump();
                        break;
                    case 65:
                        world.players[input.index].move(-1);
                        break;
                    case 68:
                        world.players[input.index].move(1);
                        break;
                    case 74:
                        world.players[input.index].attack();
                        break;
                    case 75:
                    case 83:
                        world.players[input.index].guard?.();
                        break;
                    case 76:
                        cheatMode();
                        break;
                }
            }
            else if (input.event == "keyup") {
                switch (input.key){
                    case 32:
                    case 87:
                        world.players[input.index].resetJump();
                        break;
                    case 65:
                        world.players[input.index].stop(-1);
                        break;
                    case 68:
                        world.players[input.index].stop(1);
                        break;
                    case 74:
                        world.players[input.index].stopAttack();
                        break;
                    case 75:
                    case 83:
                        world.players[input.index].stopGuard?.();
                        break;
                }
            }
        });

        socket.on("next_level", () => {
            cancelAnimationFrame(rafId);
            rafId = null;

            const FADE_DURATION = 600;
            let fadeStart = null;

            function reinitWorld() {
                world.obstacles = [
                    Floor(context, 128, 1048),
                    Floor(context, 384, 1048),
                    Floor(context, 640, 1048),
                    Floor(context, 896, 1048),
                    Floor(context, 1152, 1048),
                    Floor(context, 1408, 1048),
                    Floor(context, 1664, 1048),
                    Floor(context, 1920, 1048),

                    Floor(context, 500, 880),
                    Floor(context, 900, 880),


                    Floor(context, 700, 680),
                    Floor(context, 1100, 680),
                    Floor(context, 300, 680),

                    Floor(context, 500, 480),
                    Floor(context, 900, 480),

                ];
                world.enemies = [
                    Boss(context, 350, 830, "boss", world),
                    WitchBoss(context, 1570, 700, "witch_boss", world)
                ];
                    world.shields = [
                    ShieldPickup(context, 500, 820, world),
                    ShieldPickup(context, 900, 820, world),


                    ShieldPickup(context, 700, 620, world),
                    ShieldPickup(context, 1100, 620, world),
                    ShieldPickup(context, 300, 620, world),

                    ShieldPickup(context, 500, 420, world),
                    ShieldPickup(context, 900, 420, world),
                ];
                world.coins = [];
                world.bullets = [];
                world.flag = null;
                shooterSpawnTimer = 300;
                spawnX = 200;

                let idx = 1;
                for (const player of world.players) {
                    player.setLocation(idx * 100, 960);
                    idx++;
                }

                lastFrameTime = 0;
                accumulator = 0;
            }

            function drawCurrentState() {
                context.clearRect(0, 0, cv.width, cv.height);
                world.flag?.draw();
                world.obstacles.forEach(_ => _.draw());
                world.coins.forEach(_ => _.draw());
                world.enemies.forEach(_ => _.draw());
                world.players.forEach(_ => _.draw());
                world.bullets.forEach(_ => _.draw());
            }

            function fadeOut(now) {
                if (!fadeStart) fadeStart = now;
                const alpha = Math.min((now - fadeStart) / FADE_DURATION, 1);
                drawCurrentState();
                context.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                context.fillRect(0, 0, cv.width, cv.height);

                if (alpha < 1) {
                    requestAnimationFrame(fadeOut);
                } else {
                    reinitWorld();
                    fadeStart = null;
                    requestAnimationFrame(fadeIn);
                }
            }

            function fadeIn(now) {
                if (!fadeStart) fadeStart = now;
                const alpha = 1 - Math.min((now - fadeStart) / FADE_DURATION, 1);
                drawCurrentState();
                context.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                context.fillRect(0, 0, cv.width, cv.height);

                if (alpha > 0) {
                    requestAnimationFrame(fadeIn);
                } else {
                    rafId = requestAnimationFrame(doFrame);
                }
            }

            requestAnimationFrame(fadeOut);
        });

        socket.on("game_end", (players) => {
            if(!inGame)
                return;

            inGame = false;

            $("#main-page").hide();
            $("#lobby").show();
            $("#end-page").show();
            const rankedPlayers = Object.entries(players).map(([id, player]) => {
                const enemies = player.enemies_killed || {};
                const skeletonKills = Number(enemies.skeleton ?? 0);
                const bossKills = Number(enemies.boss ?? 0);
                const totalKills = skeletonKills + bossKills;
                return {
                    id,
                    name: player.name || "Unknown",
                    coins: Number(player.coin_collected ?? 0),
                    score: Number(player.score ?? 0),
                    skeletonKills,
                    bossKills,
                    totalKills,
                    isLocal: id === socket.id
                };
            });

            rankedPlayers.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.coins !== a.coins) return b.coins - a.coins;
                return b.totalKills - a.totalKills;
            });

            const formatNumber = (value) => Number(value).toLocaleString("en-US");

            const leaderboardRows = rankedPlayers.map((player, index) => {
                const rowClass = player.isLocal ? "leaderboard-row is-local" : "leaderboard-row";
                return `
                    <div class="${rowClass}" style="--row-delay:${index * 70}ms">
                        <div class="cell rank">${index + 1}</div>
                        <div class="cell name">${player.name}${player.isLocal ? " <span class=\"you-badge\">You</span>" : ""}</div>
                        <div class="cell kills">
                            <div class="kills-total">${formatNumber(player.totalKills)} kills</div>
                            <div class="kills-breakdown">Skeleton ${formatNumber(player.skeletonKills)} | Boss ${formatNumber(player.bossKills)}</div>
                        </div>
                        <div class="cell coins">${formatNumber(player.coins)}</div>
                        <div class="cell score">${formatNumber(player.score)}</div>
                    </div>
                `;
            }).join("");

            const leaderboardHtml = `
                <div class="leaderboard">
                    <div class="leaderboard-row leaderboard-head">
                        <div class="cell rank">#</div>
                        <div class="cell name">Player</div>
                        <div class="cell kills">Kills</div>
                        <div class="cell coins">Coins</div>
                        <div class="cell score">Score</div>
                    </div>
                    ${leaderboardRows}
                </div>
            `;

            $("#game-results").html(leaderboardHtml);
        });

        rafId = requestAnimationFrame(doFrame);
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