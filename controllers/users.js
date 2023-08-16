
// TODO: track users in a database
// runtime map of users
const users = new Map();
const db = require("./database.js");
const pool = db.pool;

class User {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    authenticate(providedPassword) {
        pool.query('SELECT username, password FROM UserTable WHERE username=$1', [username], (error, result) => {
            if (error) {
                res.status(500).send("Internal Server Error");
                return false;
            }

            if (result.rowCount === 1) {

            }
            res.status()
        })

        .then(result => {

            console.log(result.rows);
        })
        .catch(err => {
            console.log(err);
        })
        .finally(result => {
            console.log("finally...");
        });
        return this.password === providedPassword;
    }
};

function addUser(username, password) {
    // TODO: user check and insertion into the database!
    // check username not in use
    if (users.has(username)) {
        return false;
    }
    // add user
    const user = new User(username, password);
    users.set(username, user);
    return true;
}

/*
 * @param {string} username - username to look up
 * @param {string} providedPassword - submitted password with the username 
 * 
 * @returns {?number} - returns the userid associated with username on successful login, else null
 */
async function authenticateUser(username, providedPassword) {
    const result = await pool.query('SELECT userid, username, password FROM UserTable WHERE username=$1', [username])
    if (result.rowCount === 1) {
        if (result.rows[0].password === providedPassword) {
            console.log("authenticateUser passwords match for userid");
            console.log(result.rows);
            console.log(result.rows[0].userid);
            return result.rows[0].userid;
        }
        console.log(`authenticateUser: username '${username}', invalid password '${providedPassword}'.`);
        return null;
    }
    console.log(`authenticateUser: user '${username}' DNE.`);
    return null;
}

async function getUserId(username) {
    const result = await pool.query('SELECT userid FROM usertable WHERE username=$1', [username])
    if (result.rowCount === 1) {
        return result.rows[0].userid;
    }
    return null;
}

/*
 * This function takes a userid, queries the database, and returns the username or null
 * @param {number} userid - The userid
 * @returns {?string} - returns the username string if found, else null
 */
async function getUsername(userid) {
    const result = await pool.query('SELECT username FROM UserTable WHERE userid=$1', [userid])
    if (result.rowCount === 1) {
        return result.rows[0].username;
    }
    return null;
}

module.exports = {addUser, getUserId, getUsername, authenticateUser};

