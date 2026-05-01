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
            background: new Audio("sounds/FlashManStage.mp3")
        };

        const world = World();

        world.obstacles = [
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
            Wall(context, 32, 920),
            Wall(context, 1888, 920)
        ];

        world.enemies = [
            Skeleton(context, 1500, 960, world)
        ];

        world.coins = [
            Gem(context, 256, 976, "green", world),
            Gem(context, 512, 976, "red", world),
            Gem(context, 768, 976, "yellow", world),
            Gem(context, 1024, 976, "purple", world)
        ];

        let pawn;

        let index = 1;

        for (const id in players) {
            let character;
            switch (players[id].character) {
                case "Rockman":
                    character = Rockman(context, 960+index*100, 300, gameArea, world);
                    break;
                case "Knight":
                    character = Knight(context, 960+index*100, 300, gameArea, world);
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

        context.imageSmoothingEnabled = false;

        function doFrame(now) {
            world.players.forEach(_ => _.update(now));
            world.enemies.forEach(_ => _.update(now));

            for(let i=world.bullets.length-1; i>=0; i--){
                let alive = world.bullets[i].update();
                if(!alive)
                    world.bullets.splice(i, 1);
            }

            for(let i=world.coins.length-1; i>=0; i--){
                let alive = world.coins[i].update(now);
                if(!alive)
                    world.coins.splice(i, 1);
            }

            context.clearRect(0, 0, cv.width, cv.height);

            world.obstacles.forEach(_ => _.draw());
            world.coins.forEach(_ => _.draw());
            world.enemies.forEach(_ => _.draw());
            world.players.forEach(_ => _.draw());
            world.bullets.forEach(_ => _.draw());
            
            shooterSpawnTimer--;
            if (shooterSpawnTimer <= 0) {
                const randomX = 100 + Math.random() * 1720;
                world.enemies.push(Shooter(context, randomX, world));
                shooterSpawnTimer = 1200;
            }
            requestAnimationFrame(doFrame);
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
            if (input.event == "keydown") {
                switch (input.key){
                    case 32:
                    case 75:
                        world.players[input.index].jump();
                        break;
                    case 37:
                    case 65:
                        world.players[input.index].move(1);
                        break;
                    case 39:
                    case 68:
                        world.players[input.index].move(3);
                        break;
                    case 74:
                        world.players[input.index].attack();
                        break;
                    case 76:
                        world.players[input.index].takeDamage(10);
                        break;
                    case 83:
                        world.players[input.index].guard?.();
                        break;
                }
            }
            else if (input.event == "keyup") {
                switch (input.key){
                    case 32:
                    case 75:
                        world.players[input.index].resetJump();
                        break;
                    case 37:
                    case 65:
                        world.players[input.index].stop(1);
                        break;
                    case 39:
                    case 68:
                        world.players[input.index].stop(3);
                        break;
                    case 74:
                        world.players[input.index].stopAttack();
                        break;
                }
            }
        });

        socket.on("game_end", (players) => {
            if(!inGame)
                return;

            inGame = false;
        });
        
        requestAnimationFrame(doFrame);
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