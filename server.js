const http = require('http');
const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const express = require("express");
const cookieParser = require("cookie-parser");
const users = require("./controllers/users.js");

// routing
const app = express();
// data encoding (cookies, json as urlEncoded)
app.use(cookieParser());
app.use(express.urlencoded({extended : true}));
// in-page variable rendering (...and more? :o)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const ip = '127.0.0.1';
const port = 3000;

// Create a map to store session data 
// sessions = sessionId : session
// session = "user" : User
const sessions = new Map();

// Function to generate a session ID using a timestamp
function generateSessionId() {
  return Date.now().toString();
}

function getOrCreateSession(req, res) {
    const sessionIdCookie = req.cookies.sessionId;
    
    let sessionId = sessionIdCookie;
    if (!sessionId) {
        console.log("generating sessionId");
        sessionId = generateSessionId();
        res.cookie("sessionId", sessionId, {httpOnly: true});
    }
    
    let session = sessions.get(sessionId);
    if (!session) {
        console.log("creating a new session");
        session = new Map();
        session.set("user", users.guestUser);
        sessions.set(sessionId, session);
    }

    return session;
}

function getSessionUsername(session) {
    if (!session) {
        return "guest";
    }
    return session.get("user").username;
}

app.get("/", (req, res, next) => {
    console.log("GET /");
    const session = getOrCreateSession(req, res);
    next();
});

app.post("/login-submitted", (req,res) => {
    const session = getOrCreateSession(req, res);
    const {username, password} = req.body;

    const user = users.authenticateUser(username, password);
    if (user) {
        session.set("user", user);
        data = {
            success : true,
            message : "Login successful."
        }
        res.json(data);
        return;
    }
    else {
        // TODO: notify the user of the input being bad???
        data = {
            success : false,
            message : "Login failed."
        }
        res.json(data);
    };
});

app.post("/signup-submitted", (req, res) => {
    const {username, password, confirmPassword} = req.body;

    // check passwords match
    if (password !== confirmPassword) {
        data = {
            success : false,
            message : "Passwords do not match."
        }
        res.json(data);
        return;
    }

    // check user doesnt already exist
    const user = users.getUser(username);
    if (users.getUser(username)) {
        data = {
            success : false,
            message : "Username already taken."
        }
        res.json(data);
        return;
    }

    // add user
    users.addUser(username, password);
    data = {
        success : true,
        message : "User registered successfully!"
    }
    res.json(data);
    return;
});
    

app.get("/scripts/:filename", (req, res) => {
    const filepath = path.join(__dirname, "scripts", req.params.filename);

    fs.readFile(filepath, "utf8", (err, data) => {
        if (err) {
            res.status(404).send("File not found.");
        }
        else {
            res.status(200).type("application/javascript").send(data);
        }
    });
});

app.get("/get-username", (req, res) => {
    const session = getOrCreateSession(req, res);
    const data = {
        success : true,
        username : session.get("user").username
    }
    res.status(200).json(data);
});

// order matters

// this handles the html GETs methinks
// app.use("/pages", express.static(path.join(__dirname + "/pages")));
app.use(express.static("pages"));

app.use((req, res) => {
    res.status(404).send("Page not found");
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
