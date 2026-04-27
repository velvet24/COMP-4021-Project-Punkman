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