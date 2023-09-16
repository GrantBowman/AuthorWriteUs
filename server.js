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


// routing
const app = express();
// data encoding (cookies, json as urlEncoded)
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
// in-page variable rendering (...and more? :o)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const ip = process.env.SERVER_IP;
const port = process.env.SERVER_PORT;

////////////////
// middleware //
////////////////

// espress-session (res.locals allows one-time use in views and such?)
app.use(expressSession({
    secret: "mydirtylittlesecret",
    resave: false,
    saveUninitialized: true
}));


app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} from ${req.socket.remoteAddress}`);

    res.locals.session = req.session;
    next();
});

app.use('/favicon.ico', express.static('public/favicon.ico'));

function isLoggedIn(req, res, next) {
    if (req.session && req.session.username) {
        return next();
    }
    else {
        console.log(`coming from ${req.url}`);
        req.session.returnUrl = req.url;
        res.status(200).redirect('/login.html');
    }
}


// routes

/////////
// GET //
/////////

app.get('/library', async (req, res) => {

    username = req.session.username;
    const stories = await Stories.getInactiveStoryTitles();
    res.render('library', { username, stories });
});

app.get('/user/:username', async (req, res) => {
    const username = req.params.username;
    const userId = await Users.getUserId(username);
    if (userId === null) {
        res.status(404).send("User does not exist.");
        return;
    }
    const stories = await Quiries.getStoriesByUser(userId);
    res.render('user', { username, stories });
});

app.get('/story/:storyTitle', async (req, res) => {
    const storyTitle = req.params.storyTitle;
    const storyId = await Stories.getStoryId(storyTitle);

    // check story exists. only continue to render a story page if that story exists
    if (storyId === null || typeof storyId === "undefined") {
        res.status(404).send("Story does not exist.");
        return;
    }

    const storycontent = await Stories.getStoryContent(storyId);
    const authors = await Quiries.getUsernamesByStory(storyId);
    username = req.session.username;
    res.render('story', { username, storyTitle, storycontent, authors });
});

app.get('/writing/:storyTitle', isLoggedIn, async (req, res) => {
    const storyTitle = req.params.storyTitle;
    const storyId = await Stories.getStoryId(storyTitle);

    // check story exists. only continue to render a story page if that story exists
    if (!storyId) {
        res.status(404).send("Story does not exist.");
        return;
    }

    // only allow if the story is active, else 403
    const isActive = await Stories.isActiveStory(storyId);
    if (!isActive) {
        res.status(403).send("Story is completed.");
        return;
    }

    const previousinputresult = await Stories.getPreviousInput(storyId);
    let previousinput;
    if (previousinputresult) {
        previousinput = previousinputresult.content;
    }
    const storysettingsresult = await Stories.getStorySettings(storyId);
    const storysettings = storysettingsresult.storysettings;

    let maxlength;
    switch (storysettings.inputLength) {
        case "word":
            maxlength = 20;
            break;
        case "line":
            maxlength = 200;
            break;
        case "paragraph":
            maxlength = 1000;
            break;
        default:
            maxlength = 200;
            break;
    }


    const storycontent = await Stories.getStoryContent(storyId);
    const authors = await Quiries.getUsernamesByStory(storyId);
    username = req.session.username;
    res.render('writing', { username, storyTitle, previousinput, maxlength });
});

app.get('/home', async (req, res) => {
    const username = req.session.username;
    const stories = await Stories.getActiveStoryTitles();
    res.render('home', { username, stories });
});

app.get("/create", isLoggedIn, (req, res) => {
    const username = req.session.username;
    res.render("create", { username });
});

app.get("/writing-sse", async (req, res) => {

    createSse(req, res);
    const storyTitle = decodeURI(req.get('referer').split('/').at(-1));
    const storyId = await Stories.getStoryId(storyTitle);
    const username = req.session.username;
    addToStoryQueue(storyId, username, res);
    
    resendStoryQueue(req, res, storyId);

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

//////////
// POST //
//////////

app.post("/login-submitted", async (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;

    const userId = await Users.authenticateUser(username, password);
    if (userId) {
        console.log(`valid login, userId=${userId}`);
        req.session.username = username;
        returnUrl = req.session.returnUrl || "/home";
        delete req.session.returnUrl;
        data = {
            success: true,
            message: "Login successful.",
            returnUrl: returnUrl
        }
        res.status(200).json(data);
        return;
    }
    else {
        console.log("invalid login userId");
        // TODO: notify the user of the input being bad???
        data = {
            success: false,
            message: "Login failed."
        }
        res.status(400).json(data);
        return;
    }
});

app.post('/logout', async (req, res) => {
    
    const storyTitle = decodeURI(req.get('referer').split('/').at(-1));
    const storyId = await Stories.getStoryId(storyTitle);
    const username = req.session.username;
    removeFromStoryQueue(storyId, username);
    resendStoryQueue(req, res, storyId);

    req.session.destroy();
    // res.status(200).redirect('/login.html');
    res.status(200).redirect(req.url);
});

app.post("/signup-submitted", async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    // Validate alphanumeric username with no spaces
    const alphanumericPattern = /^[A-Za-z0-9]+$/;
    if (!alphanumericPattern.test(username)) {
        data = {
            success: false,
            message: "Invalid username format. Please use alphanumeric."
        }
        return res.status(400).json(data);
    }

    // Validate username (no spaces)
    if (username.includes(' ')) {
        data = {
            success: false,
            message: "Username cannot contain spaces."
        }
        res.status(400).json(data);
        return;
    }

    // check passwords match
    if (password !== confirmPassword) {
        data = {
            success: false,
            message: "Passwords do not match."
        }
        res.status(400).json(data);
        return;
    }

    // check user doesnt already exist
    const userId = await Users.getUserId(username);
    if (userId) {
        console.log(`user already exists: userId=${userId}`);
        data = {
            success: false,
            message: "Username already taken."
        }
        res.status(400).json(data);
        return;
    }
    
    // add user
    const result = await Users.addUser(username, password);
    console.log(`user added: result=${result}`);
    req.session.username = username;
    data = {
        success: true,
        message: "User registered successfully!"
    }
    res.status(200).json(data);
    return;
});

app.post("/story-create", async (req, res) => {
    let { storyTitle, ...storysettings } = req.body;

    // check story doesnt not already exist
    let storyId = await Stories.getStoryId(storyTitle);
    if (storyId) {
        console.log(`story already exists: storyId=${storyId}`);
        data = {
            success: false,
            message: "Story title already exists."
        }
        res.status(400).json(data);
        return;
    }

    const result = await Stories.addStory(storyTitle, storysettings);
    console.log(`story added: result=${result}`);
    data = {
        success: true,
        message: "Story created successfully!"
    }
    res.status(200).json(data);

    // navigate to writing page?    
});

app.post("/story-append", async (req, res) => {
    const storyTitle = decodeURI(req.get('referer').split('/').at(-1));
    const content = req.body.content;

    // check story exists (sanity check) / get storyId
    const storyId = await Stories.getStoryId(storyTitle)
    // check story content not null
    if (!content) {
        console.log(`story-append does not have content for '${storyTitle}':'${content}'`);
        const data = {
            success: false,
            message: "No content given to append to story."
        }
        res.status(400).json(data);
    }

    // get latest index of story
    const previousinputresult = await Stories.getPreviousInput(storyId);
    let previousinputorder = 0;
    if (previousinputresult) {
        previousinputorder = previousinputresult.inputorder;
    }

    // get userid for sql
    const username = req.session.username;
    const userId = await Users.getUserId(username);

    // sql
    const result = await Stories.appendStory(storyId, userId, previousinputorder + 1, content);
    const data = {
        success: true,
        message: "Added to story successfully!"
    }
    res.status(200).json(data);
    
    // refresh the page (should auto-update latest input)
    resendStoryQueue(req, res, storyId);
});


//////////////
// defaults //
//////////////

// order matters

// this handles the html GETs methinks
// app.use("/pages", express.static(path.join(__dirname + "/pages")));
app.use(express.static("public"));

app.use((req, res) => {
    res.status(404).send("Page not found");
});

// maintain list of clients, sending updates for writing page
// eg. your turn, youre done, story content update
// storyqueue object holding
//   storyqueue = { storyId : [{res:username}, {res:username},...] }

const storyQueue = {};

// Function to add a user's SSE connection to the story queue
function addToStoryQueue(storyId, username, res) {
    if (!storyQueue[storyId]) {
        storyQueue[storyId] = [];
    }
    let obj = { username, res };
    storyQueue[storyId].push(obj);
    
    // Handle res.on('close') to remove the closed connection
    res.on('close', () => {
        removeFromStoryQueue(storyId, username);
    });

    return obj;
}

// Function to remove a user's SSE connection from the story queue
function removeFromStoryQueue(storyId, username) {
    if (storyQueue[storyId]) {
        let obj;
        storyQueue[storyId].forEach((item) => {
            if (item.username === username) {
                obj = item;
            }
        });
        storyQueue[storyId] = storyQueue[storyId].filter((entry) => entry.username !== username);
        return obj;
    }
    return null;
}


function toBackInStoryQueue(storyId, username) {
    let obj = removeFromStoryQueue(storyId, username);
    if (obj) {
        addToStoryQueue(storyId, obj.username, obj.res);
    }
}

function getQueueUsernames(arr) {
    result = [];
    arr.forEach((item) => {
        result.push(item.username);
    });
    return result;
}

function resendStoryQueue(req, res, storyId) {
    
    //update other writing users
    let arr = getQueueUsernames(storyQueue[storyId]);
    // if was last user in story queue, queue no longer exists - no updates needed
    if (!arr) {
        return;
    }
    storyQueue[storyId].forEach(async (obj) => {
        //update user queue display
        obj.res.write(`data: ${JSON.stringify({ users: arr })}\n\n`); // res.write() instead of res.send()

        // allow first in queue to write
        if (obj.username === arr[0]) {
            const previousinputresult = await Stories.getPreviousInput(storyId);
            obj.res.write(`data: ${JSON.stringify({ isWriter: true, previousInput: previousinputresult.content })}\n\n`); // res.write() instead of res.send()
        }
        else {
            obj.res.write(`data: ${JSON.stringify({ isWriter: false, previousInput: "" })}\n\n`); // res.write() instead of res.send()
        }
    })
}

function createSse(req, res) {
    console.log(`sse creation for ${req.socket.remoteAddress}`);
    // SO says I dont need a fancy librarby/package/module, so trying out the basics ofc!
    // https://stackoverflow.com/questions/34657222/how-to-use-server-sent-events-in-express-js

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client

    res.write(`data: ${JSON.stringify({ awesome: "yes" })}\n\n`); // res.write() instead of res.send()

    // If client closes connection, stop sending events
    res.on('close', async () => {
        console.log(`sse dropped by ${req.socket.remoteAddress}`);
        const storyTitle = decodeURI(req.get('referer').split('/').at(-1));
        const storyId = await Stories.getStoryId(storyTitle)
        resendStoryQueue(req, res, storyId);
        // clearInterval(interValID);
        res.end();
    });


}

app.listen(port, ip, () => {
    console.log(`Server is running at http://${ip}:${port}`);
});
