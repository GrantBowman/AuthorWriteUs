const http = require('http');
const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const express = require("express");
const expressSession = require("express-session");
const cookieParser = require("cookie-parser");
const Users = require("./controllers/Users.js");
const Stories = require("./controllers/stories.js");
const Quiries = require("./controllers/queries.js");
const slugify = require("slugify");


// routing
const app = express();
// data encoding (cookies, json as urlEncoded)
app.use(cookieParser());
app.use(express.urlencoded({extended : true}));
// in-page variable rendering (...and more? :o)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const ip = process.env.SERVER_IP;
const port = process.env.SERVER_PORT;


// middleware


// espress-session (res.locals allows one-time use in views and such?)
app.use(expressSession({
    secret: "mydirtylittlesecret",
    resave: false,
    saveUninitialized: true
}));

// default session username
app.use((req, res, next) => {
    // if (!req.session.username)
    // {
    //     req.session.username = "guest";
    // }
    next();
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} from ${req.socket.remoteAddress}`);

    res.locals.session = req.session;
    next();
});


// routes

app.get('/library', async (req, res) => {
    
    username = req.session.username;
    const stories = await Stories.getStoryTitles();
    res.render('library', {username, stories});
});

app.get('/user/:username', async (req, res) => {
    const username = slugify(req.params.username);
    const userid = await Users.getUserId(username);
    if (userid === null) {
        res.status(404).send("User does not exist");
        return;
    }
    const stories = await Quiries.getStoriesByUser(userid);
    res.render('user', {username, stories});
});

app.get('/story/:storytitle', async (req, res) => {
    const storytitle = slugify(req.params.storytitle, " ", {upper: true});
    const storyid = await Stories.getStoryId(storytitle);
    const storycontent = await Stories.getStoryContent(storyid);
    const authors = await Quiries.getUsernamesByStory(storyid);
    username = req.session.username;
    res.render('story', {username, storytitle, storycontent, authors});
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.status(200).redirect('/login.html');
});

app.get('/home', (req, res) => {
    const username = req.session.username;
    res.render('home', {username});
});


app.post("/login-submitted", async (req, res) => {
    const {username, password} = req.body;

    const userId = await Users.authenticateUser(username, password);
    if (userId) {
        console.log("valid login userId");
        console.log(userId);
        req.session.username = username;
        data = {
            success : true,
            message : "Login successful."
        }
        res.status(200).json(data);
        return;
    }
    else {
        console.log("invalid login userId");
        console.log(userId);
        // TODO: notify the user of the input being bad???
        data = {
            success : false,
            message : "Login failed."
        }
        res.status(400).json(data);
        return;
    }
});

app.post("/signup-submitted", async (req, res) => {
    const {username, password, confirmPassword} = req.body;

    
    // Validate username (no spaces)
    if (username.includes(' ')) {
        data = {
            success : false,
            message : "Username cannot contain spaces."
        }
        res.status(400).json(data);
        return;
    }

    // check passwords match
    if (password !== confirmPassword) {
        data = {
            success : false,
            message : "Passwords do not match."
        }
        res.status(400).json(data);
        return;
    }

    // check user doesnt already exist
    const userId = await Users.getUserId(username);
    console.log("userId=");
    console.log(userId);
    if (userId) {
        data = {
            success : false,
            message : "Username already taken."
        }
        res.status(400).json(data);
        return;
    }

    // add user
    Users.addUser(username, password);
    data = {
        success : true,
        message : "User registered successfully!"
    }
    res.status(200).json(data);
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


// order matters

// this handles the html GETs methinks
// app.use("/pages", express.static(path.join(__dirname + "/pages")));
app.use(express.static("pages"));

app.use((req, res) => {
    res.status(404).send("Page not found");
});

app.listen(port, ip, () => {
    console.log(`Server is running at http://${ip}:${port}`);
});
