
// TODO: track users in a database
// runtime map of users
const users = new Map();
const db = require("./database.js");
const pool = db.pool;

async function addUser(username, password) {
    // TODO: FIXME
    // check username does not already exist
    let userId = await getUserId(username)
    console.log("seeing if user already exists...");
    console.log(userId);
    if (userId === null) {
        // add user + password to the UserTable    
        const result = await pool.query('INSERT INTO UserTable (username, password) VALUES ($1, $2);', [username, password]);
        console.log("should be added....");
        console.log(result);
        console.log(result.rows);
        userId = await getUserId(username);
        console.log("userId after add?:");
        console.log(userId); 
        return true;
    }
    return false;
    // TODO: user check and insertion into the database!
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
            console.log(`authenticateUser passwords match for username ${username}, password ${providedPassword}`);
            console.log(result.rows);
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

