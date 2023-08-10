const http = require('http');
const fs = require('fs');
const path = require('path');
const qs = require('querystring');

const hostname = '127.0.0.1';
const port = 3000;

// Create a map to store session data
const sessions = new Map();

// Function to generate a session ID using a timestamp
function generateSessionId() {
  return Date.now().toString();
}

// TODO: serveJSFile
function serveHTMLFile(res, filename, filetype, session) {
    const filePath = path.join(__dirname, filename);
    console.log(`server filePath=${filePath}`);
  
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading the file');
        return;
      }
  
      res.writeHead(200, { 'Content-Type': filetype });
      content = content.replace("<!-- session.username -->", session.get("username"));
      res.end(content);
    });
  }




const server = http.createServer((req, res) => {
    console.log(`\nRequest Received!: ip=${req.socket.remoteAddress} method=${req.method} url=${req.url}`);
    console.log(`__dirname=${__dirname}`);
    

    // Parse cookies from the request headers
    const cookies = req.headers.cookie ? req.headers.cookie.split('; ') : [];
    const sessionIdCookie = cookies.find(cookie => cookie.startsWith('sessionId='));
    // console.log(`cookies=${cookies}`);


    const requestedFilename = path.basename(req.url, '.html') + '.html';
    // const requestedFilename = req.url.substring(1);
    // console.log(`requestedFilename='${requestedFilename}'`);
    

    
    // session + cookie getting/creation
    let sessionId;
    if (sessionIdCookie) {
        console.log(`ip ${req.socket.remoteAddress} has cookie: ${cookies}`);
        sessionId = sessionIdCookie.split('=')[1];
    }
    else {
        // Generate a new session ID
        sessionId = generateSessionId();
        console.log(`ip ${req.socket.remoteAddress} does not have cookie. Making cookie: ${sessionId}`);
        // Set the session ID in a cookie
        // res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly`);
    }

    // Get or create a session for the current user
    let session = sessions.get(sessionId);
    if (!session) {
        session = new Map();
        session.set("username", "guest");
        sessions.set(sessionId, session);
    }

    console.log(`"req.url.startsWith('/scripts/')"? t/f=${req.url.startsWith('/scripts/')}`);

    // js
    if (req.url.startsWith('/scripts/') && req.method==="GET") {
        const filePath = path.join(__dirname, req.url);
        console.log(`js request filePath=${filePath}`);
        
        console.log("before read");
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.log("error");
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }
            else {
                // console.log(`js read, data=\n${data}`);
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
                return;
            }
        });
        console.log("after read");
        return;
    }

    // html
    fs.readdir(__dirname, (err, files) => {
        // console.log(`files='${files}'`);
        if (err) {
            res.writeHead(500);
            res.end('Error reading directory');
            return;
        }
        
        if (files.includes(requestedFilename) && req.method==="GET") {
            serveHTMLFile(res, requestedFilename, 'text/html', session);
            return;
        }
        else if (req.url === "/" && req.method==="GET") {
            console.log(`Someone joined to '/'!: ip=${req.socket.remoteAddress}`);
            serveHTMLFile(res, "/index.html", 'text/html', session);
            return;
        }

        if (req.url === "/login-submitted" && req.method==="POST") {
            console.log(`login submitted...`);
            let body = '';
            req.on('data', (data) => {
                body += data.toString(); // convert Buffer to string
            });
            req.on('end', () => {
                // res.end('ok');
                const parsedData = qs.parse(body);
                const username = parsedData.username;
                const password = parsedData.password;
                console.log(`body=${body}`);
                console.log(`user=${parsedData.username} pass=${parsedData.password}`);
                if (username === password) {
                    console.log("assigning username");
                    session.set("username", username);
                    serveHTMLFile(res, "/login-submitted.html", 'text/html', session);
                    return;
                }
            });
            serveHTMLFile(res, "/login.html", 'text/html', session);
            return;
        }
                
        // Detect client disconnection
        req.on('close', () => {
            console.log(`Client ${req.socket.remoteAddress} disconnected`);
            // Perform cleanup or other actions as needed
            sessions.delete(sessionId);
        });

        // Handle other requests
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Page not found');
        return;
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});