const express = require("express");
const session = require("express-session");
const {createServer} = require("http");
const {Server} = require("socket.io");
const argon2 = require("argon2");
const fs = require("fs");

const app = express();
app.use(express.static("public"));
app.use(express.json());
const gameSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {maxAge: 300000}
});
app.use(gameSession);
const httpServer = createServer(app);
const io = new Server(httpServer);

let players = {};
let gameStarted = false;

const usersFilePath = "data/users.json";

if(!fs.existsSync(usersFilePath)){
    fs.mkdirSync("data");
    fs.writeFileSync(usersFilePath, JSON.stringify({}, null, 2));
}

app.post("/register", async (req, res) => {
    const {username, avatar, name, password} = req.body;
    let users = JSON.parse(fs.readFileSync(usersFilePath));

    if(username == "" || avatar == "" || name == "" || password == ""){
        res.json({error: "Username/avatar/name/password cannot be empty."});
        return;
    }
    if(!/^\w+$/.test(username)){
        res.json({error: "The username can only contain underscores, letters, or numbers."});
        return;
    }
    if(username in users){
        res.json({error: "The username already exists."});
        return;
    }

    const hash = await argon2.hash(password);
    users[username] = {
        "avatar": avatar,
        "name": name,
        "password": hash
    };
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    res.json({success: true});
});

app.post("/signin", async (req, res) => {
    const {username, password} = req.body;
    let users = JSON.parse(fs.readFileSync(usersFilePath));

    if(username == "" || password == "" || !(username in users)){
        res.json({error: "Incorrect username/password."});
        return;
    }

    const user = users[username];

    const verified = await argon2.verify(user.password, password);
    if(!verified){
        res.json({error: "Incorrect username/password."});
        return;
    }

    req.session.user = {
        "username": username,
        "avatar": user.avatar,
        "name": user.name
    }

    res.json({"user": req.session.user});
});

app.get("/validate", (req, res) => {
    let user = req.session.user;
    if(!user){
        res.json({error: "User does not exist."});
        return;
    }

    res.json({"user": user});
});

app.get("/signout", (req, res) => {
    if(req.session.user){
        delete req.session.user;
    }

    res.json({success: true});
});

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("join", (name) => {
        if(gameStarted){
            socket.emit("join_error", "The game has started.");
            return;
        }

        if(Object.keys(players).length == 4){
            socket.emit("join_error", "The game is full.");
            return;
        }

        for(const id in players){
            const player = players[id];
            if(player.name == name){
                socket.emit("join_error", "The name has already been used in the game.");
                return;
            }
        }

        players[socket.id] = {name: name, ready:false};
        socket.emit("join_success");
        io.emit("update_players", players);
        console.log("Current players - ", players);
    });

    socket.on("ready", (character) => {
        players[socket.id]["ready"] = true;
        players[socket.id]["character"] = character;
        io.emit("update_players", players);

        for(const id in players){
            const player = players[id];
            if(player.ready == false)
                return;
        }

        for(const id in players){
            players[id].inGame = true;
        }

        io.emit("game_start", players);
        gameStarted = true;
    });

    socket.on("disconnect", () => {
        if(players[socket.id]){
            delete players[socket.id];
            io.emit("update_players", players);

            for(const id in players){
                if(players[id].inGame)
                    return;
            }
            gameStarted = false;
        }
    });
});

httpServer.listen(8000, () => {
    console.log("http://localhost:8000");
});