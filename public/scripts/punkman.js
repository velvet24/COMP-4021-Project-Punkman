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

        let collectedGems = 0; 
        
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
        const gems = [
            Gem(context, 150, 980, "green"),
            Gem(context, 512, 980, "red"),
            Gem(context, 768, 980, "yellow"),
            Gem(context, 1024, 980, "purple")
        ];

        const players = [];

        const enemies = [
            Skeleton(context, 1500, 960, players)
        ];
        const bullets = [];
        const player = Player(context, 960, 300, gameArea, obstacles, enemies, bullets);

        context.imageSmoothingEnabled = false;

        function doFrame(now) {
            enemies.forEach(_ => _.update(now));
            player.update(now);
            for(let i=bullets.length-1; i>=0; i--){
                let alive = bullets[i].update();
                if(!alive)
                    bullets.splice(i, 1);
            }

            context.clearRect(0, 0, cv.width, cv.height);

            obstacles.forEach(_ => _.draw());
            gems.forEach(_ => _.draw());
            
            const playerBoundingBox = player.getBoundingBox();
            gems.forEach((gem) => {
                const gemXY = gem.getXY();
                if (playerBoundingBox.isPointInBox(gemXY.x, gemXY.y)) {
                    gem.collect();
                    console.log("Gem collected!");
                    collectedGems++;
                }
            });
            enemies.forEach(_ => _.draw());
            player.draw();
            bullets.forEach(_ => _.draw());

            requestAnimationFrame(doFrame);
        }

        let pawn = player;

        $(document).on("keydown", function(event) {
            switch (event.keyCode){
                case 32:
                case 75:
                    pawn.jump();
                    break;
                case 37:
                case 65:
                    pawn.move(1);
                    break;
                case 39:
                case 68:
                    pawn.move(3);
                    break;
                case 74:
                    pawn.attack();
                    break;
                case 76:
                    pawn.takeDamage(10);
                    break;
            }
        });

        $(document).on("keyup", function(event) {
            switch (event.keyCode){
                case 32:
                case 75:
                    pawn.resetJump();
                    break;
                case 37:
                case 65:
                    pawn.stop(1);
                    break;
                case 39:
                case 68:
                    pawn.stop(3);
                    break;
                case 74:
                    pawn.stopAttack();
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