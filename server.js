const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const express = require("express");
const expressSession = require("express-session");
const cookieParser = require("cookie-parser");
require('dotenv').config();
const Users = require("./controllers/users.js");
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

///////
// error catching, because ima  scrub who wants them not to exist yet be super generic
/////
async function errorCatcher(promise) {
    try {
        const data = await promise;
        return {data: data, error: null}
    }
    catch (err) {
        return {data: null, error: err.message}
    }
}

////////////////
// middleware //
////////////////

// //error handling middleware
// app.use((err, req, res, next) => {
//     console.error("An error occured:\n", err);
//     res.status(500).send("Internal Server Error");
//     next();
// });

// espress-session (res.locals allows one-time use in views and such?)
app.use(expressSession({
    secret: "mydirtylittlesecret",
    resave: false,
    saveUninitialized: true
}));


app.use((req, res, next) => {
    console.log(`${req.rawHeaders[req.rawHeaders.indexOf("Host")+1]}: ${req.method} ${req.url}`);

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
    try {
        username = req.session.username;
        const stories = await Stories.getInactiveStoryTitles();
        res.render('library', { username, stories });
    }
    catch (err) {
        console.error(`Unable to get inactive stories`);
        console.error(err);
        res.status(500).redirect('/error-page.html');
        return;
    }
});

app.get('/user/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const userId = await Users.getUserId(username);
        if (userId === null) {
            res.status(404).send("User does not exist.");
            return;
        }
        const stories = await Quiries.getStoriesByUser(userId);
        res.render('user', { username, stories });
    }
    catch (err) {
        console.error(`Unable to get stories for user=${username}`);
        console.error(err);
        res.status(500).redirect('/error-page.html');
        return;
    }
});

app.get('/story/:storyTitle', async (req, res) => {
    const storyTitle = req.params.storyTitle;
    let storyId;
    try {
        storyId = await Stories.getStoryId(storyTitle);
    }
    catch (err) {
        console.error(`Unable to get storyId for storyTitle='${storyTitle}'`);
        console.error(err);
        res.status(500).redirect('/error-page.html');
        return;
    }

    // check story exists. only continue to render a story page if that story exists
    if (storyId === null || typeof storyId === "undefined") {
        res.status(404).send("Story does not exist.");
        return;
    }
    
    // only allow if the story is inactive, else 403
    const isActive = await Stories.isActiveStory(storyId);
    if (isActive) {
        res.status(403).send("Story is being written still!");
        return;
    }

    const storycontent = await Stories.getStoryContent(storyId);
    const authors = await Quiries.getUsernamesByStory(storyId);
    const storysettingsresult = await Stories.getStorySettings(storyId);
    const prompt = storysettingsresult.storysettings.prompt;
    username = req.session.username;
    res.render('story', { username, storyTitle, storycontent, authors, prompt });
});

app.get('/writing/:storyTitle', isLoggedIn, async (req, res) => {
    const storyTitle = req.params.storyTitle;
    let storyId;
    try {
        storyId = await Stories.getStoryId(storyTitle);
    }
    catch (err) {
        console.error(`Unable to get storyId for storyTitle='${storyTitle}'`);
        console.error(err);
        res.status(500).redirect('/error-page.html');
        return;
    }

    // check story exists. only continue to render a story page if that story exists
    if (!storyId) {
        res.status(404).send("Story does not exist.");
        return;
    }

    // only allow if the story is active, else 403
    let isActive;
    try {
        isActive = await Stories.isActiveStory(storyId);
    }
    catch (err) {
        console.error(`Unable get story status for storyId=${storyId}`);
        console.error(err);
        res.status(500).redirect('/error-page.html');
        return;
    }
    
    if (!isActive) {
        res.status(403).send("Story is completed.");
        return;
    }
    
    try {
        // get information to render the writing page
        const previousinputresult = await Stories.getPreviousInput(storyId);
        let previousinput;
        if (previousinputresult) {
            previousinput = previousinputresult.content;
        }
        const storysettingsresult = await Stories.getStorySettings(storyId);
        const storysettings = storysettingsresult.storysettings;
        const prompt = storysettings.prompt;

        let maxlength;
        switch (storysettings.inputLength) {
            case "word-by-word":
                maxlength = 20;
                break;
            case "line-by-line":
                maxlength = 200;
                break;
            case "paragraph-by-paragraph":
                maxlength = 1000;
                break;
            default:
                maxlength = 200;
                break;
        }


        const storycontent = await Stories.getStoryContent(storyId);
        const authors = await Quiries.getUsernamesByStory(storyId);
        username = req.session.username;
        res.render('writing', { username, storyTitle, previousinput, maxlength, prompt });
    }
    catch (err) {
        console.error(`Unable to gather data for rendering writing page for storyId=${storyId}`);
        console.error(err);
        res.status(500).redirect('/error-page.html');
        return;
    }
});

app.get('/home', async (req, res) => {
    const username = req.session.username;
    let stories = [];
    let storiesError = null;
    try {
        stories = await Stories.getActiveStoryTitles();
    }
    catch (err) {
        console.log(err);
        storiesError = err.userMessage;
    }
    res.render('home', { username, stories, storiesError });
});

app.get("/create", isLoggedIn, (req, res) => {
    const username = req.session.username;
    res.render("create", { username });
});

app.get("/writing-sse", async (req, res) => {

    try {

        createSse(req, res);
        const storyTitle = decodeURI(req.get('referer').split('/').at(-1));
        const storyId = await Stories.getStoryId(storyTitle);
        const username = req.session.username;
        addToStoryQueue(storyId, username, res);
        
        resendStoryQueue(req, res, storyId);
    }
    catch (err) {
        console.error(`Unable to initialise writing-SSE for user ${username} and story ${storyId}`);
        console.error(err);
        res.status(500).redirect('/error-page.html');
        return;
    }
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

app.get("/styles/:filename", (req, res) => {
    const filepath = path.join(__dirname, "styles", req.params.filename);

    fs.readFile(filepath, "utf8", (err, data) => {
        if (err) {
            res.status(404).send("File not found.");
        }
        else {
            res.status(200).type("text/css").send(data);
        }
    });
});

//////////
// POST //
//////////

app.post("/login-submitted", async (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;

    let userId;
    try {
        userId = await Users.authenticateUser(username, password);
    }
    catch (err) {
        console.error(`Unable to authenticate user '${username}'`);
        console.error(err);
        let data = {
            success: false,
            message: `Unable to authenticate user '${username}'`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }

    if (userId) {
        console.log(`valid login, userId=${userId}`);
        req.session.username = username;
        returnUrl = req.session.returnUrl || "/home";
        delete req.session.returnUrl;
        let data = {
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
        let data = {
            success: false,
            message: "Login failed."
        }
        res.status(400).json(data);
        return;
    }
});

app.post('/logout', async (req, res) => {
    
    const username = req.session.username;
    const storyTitle = decodeURI(req.get('referer').split('/').at(-1));
    try {
        const storyId = await Stories.getStoryId(storyTitle);
        removeFromStoryQueue(storyId, username);
        resendStoryQueue(req, res, storyId);
        req.session.destroy();
        // res.status(200).redirect('/login.html');
        res.status(200).redirect(req.url);
        return;
    }
    catch (err) {
        console.error(`Unable to logout user ${username}`);
        console.error(err);
        req.session.destroy();
        let data = {
            success: false,
            message: `Unable to logout user '${username}'`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }

});

app.post("/signup-submitted", async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    // Validate alphanumeric username with no spaces
    const alphanumericPattern = /^[A-Za-z0-9]+$/;
    if (!alphanumericPattern.test(username)) {
        let data = {
            success: false,
            message: "Invalid username format. Please use alphanumeric."
        }
        res.status(400).json(data);
        return;
    }

    // Validate username (no spaces)
    if (username.includes(' ')) {
        let data = {
            success: false,
            message: "Username cannot contain spaces."
        }
        res.status(400).json(data);
        return;
    }

    // check passwords match
    if (password !== confirmPassword) {
        let data = {
            success: false,
            message: "Passwords do not match."
        }
        res.status(400).json(data);
        return;
    }

    try {
        // check user doesnt already exist
        const userId = await Users.getUserId(username);
        if (userId) {
            console.log(`user already exists: userId=${userId}`);
            let data = {
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
        let data = {
            success: true,
            message: "User registered successfully!"
        }
        res.status(200).json(data);
        return;
    }
    catch (err) {
        console.error(`Unable to signup user ${username}`);
        console.error(err);
        let data = {
            success: false,
            message: `Unable to signup user '${username}'`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }
});

app.post("/story-create", async (req, res) => {
    let { storyTitle, ...storysettings } = req.body;

    try {
        // check story doesnt not already exist
        let storyId = await Stories.getStoryId(storyTitle);
        if (storyId) {
            console.log(`story already exists: storyId=${storyId}`);
            let data = {
                success: false,
                message: "Story title already exists."
            }
            res.status(400).json(data);
            return;
        }
    }
    catch (err) {
        console.error("Unable to get Story ID for story creation.");
        console.error(err);
        let data = {
            success: false,
            message: `Unable to get Story ID for story creation.`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }

    try {
        const result = await Stories.addStory(storyTitle, storysettings);
        console.log(`story added: result=${result}`);
        let data = {
            success: true,
            message: "Story created successfully!",
            returnUrl: "/writing/"+storyTitle
        }
        res.status(200).json(data);
    }
    catch (err) {
        console.error(`Unable to add storyTitle='${storyTitle}'`);
        console.error(err);
        let data = {
            success: false,
            message: `Unable to add story '${storyTitle}'`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }
    
    // navigate to writing page?    
});

app.post("/story-append", async (req, res) => {
    const storyTitle = decodeURI(req.get('referer').split('/').at(-1));
    const content = req.body.content;

    let storyId;
    try {
        // check story exists (sanity check) / get storyId
        storyId = await Stories.getStoryId(storyTitle)
        // check story content not null
        if (!content) {
            console.log(`story-append does not have content for '${storyTitle}':'${content}'`);
            const data = {
                success: false,
                message: "No content given to append to story."
            }
            res.status(400).json(data);
        }
    }
    catch (err) {
        console.error(`Unable to get storyId to append to ${storyTitle}`);
        console.error(err);
        let data = {
            success: false,
            message: `Unable to get storyId to append to storyTitle='${storyTitle}'`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }

    let previousinputresult;
    let previousinputorder = 0;
    try {
        // get latest index of story
        previousinputresult = await Stories.getPreviousInput(storyId);
        if (previousinputresult) {
            previousinputorder = previousinputresult.inputorder;
        }
    }
    catch (err) {
        console.error(`Unable to add story ${storyTitle}`);
        console.error(err);
        let data = {
            success: false,
            message: `Unable to add story storyTitle='${storyTitle}'`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }

    // get userid for sql
    const username = req.session.username;
    let userId;
    try {
        userId = await Users.getUserId(username);
    }
    catch (err) {
        console.error(`Unable to get userId for ${username}`);
        console.error(err);
        let data = {
            success: false,
            message: `Unable to get userId for username='${username}'`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }

    // sql
    let result;
    try {
        result = await Stories.appendStory(storyId, userId, previousinputorder + 1, content);
    }
    catch (err) {
        console.error(`Unable to append to story storyId=${storyId} from userId=${userId}`);
        console.error(err);
        let data = {
            success: false,
            message: `Unable to append to story storyId=${storyId} from userId=${userId}`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }

    // check if story complete
    let storysettingsresult;
    let returnUrl = null;
    try {
        storysettingsresult = await Stories.getStorySettings(storyId);
        const storysettings = storysettingsresult.storysettings;
    
        // catches === and any remaining from development
        if (storysettings.numInputs <= previousinputorder+1) {
            Stories.setStoryInactive(storyId);
            // kick user out of writing page to story page
            returnUrl = "/story/" + storyTitle;
            finishStoryQueue(storyId, returnUrl);
        }
    }
    catch (err) {
        console.error(`Unable to get story settings for storyId=${storyId}`);
        console.error(err);
        let data = {
            success: false,
            message: `Unable to get story settings for storyId=${storyId}`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }

    const data = {
        success: true,
        message: "Added to story successfully!",
        returnUrl: returnUrl
    }
    res.status(200).json(data);
    
    // refresh the page (should auto-update latest input)
    try {
        resendStoryQueue(req, res, storyId);
    }
    catch (err) {
        console.error(`Unable to resend the story queue`);
        console.error(err);
        let data = {
            success: false,
            message: `Unable to resend the story queue`,
            returnUrl: '/error-page.html'
        }
        res.status(500).json(data);
        return;
    }
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

function finishStoryQueue(storyId, returnUrl) {
    storyQueue[storyId].forEach(async (obj) => {
        obj.res.write(`data: ${JSON.stringify({ returnUrl: returnUrl })}\n\n`);
    });
}

function getQueueUsernames(arr) {
    result = [];
    arr.forEach((item) => {
        result.push(item.username);
    });
    return result;
}

function resendStoryQueue(req, res, storyId) {
    if (!storyId) {
        return;
    }

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
            try {
                const previousinputresult = await Stories.getPreviousInput(storyId);
                let content = previousinputresult? previousinputresult.content: "(write the first input!)";
                obj.res.write(`data: ${JSON.stringify({ isWriter: true, previousInput: content })}\n\n`); // res.write() instead of res.send()
            }
            catch (err) {
                console.error(`Unable to get preivous story input for ${storyId}`);
                console.error(err);
                throw err;
            }
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
        try {
            console.log(`sse dropped by ${req.socket.remoteAddress}`);
            const storyTitle = decodeURI(req.get('referer').split('/').at(-1));
            const storyId = await Stories.getStoryId(storyTitle)
            resendStoryQueue(req, res, storyId);
            // clearInterval(interValID);
            res.end();
        }
        catch (err) {
            console.error(`Unable to add story ${storyTitle}`);
            console.error(err);
            res.status(500).redirect('/error-page.html');
            return;
        }
    });


}

app.get('/', (req, res) => {
    res.json({message: "example response"});
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// app.listen(port, ip, () => {
//     console.log(`Server is running at http://${ip}:${port}`);
// });
