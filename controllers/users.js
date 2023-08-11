
// TODO: track users in a database
// runtime map of users
const users = new Map();

class User {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    authenticate(providedPassword) {
        return this.password === providedPassword;
    }
};

function addUser(username, password) {
    // check username not in use
    if (users.has(username)) {
        return false;
    }
    // add user
    const user = new User(username, password);
    users.set(username, user);
    return true;
}

function getUser(username) {
    return users.get(username);
}

function authenticateUser(username, providedPassword) {
    // TODO: user a O(1) library to deter security attacks ulnerability
    const user = users.get(username);
    if (user) {
        if (user.password === providedPassword){
            return user;
        }
        console.log(`authenticateUser: username '${username}', invalid password '${password}'.`);
        return null;
    }
    console.log(`authenticateUser: user '${username}' DNE.`);
    return null;
}

// add some default users
addUser("user1", "pass1");
addUser("user2", "pass2");
addUser("user3", "pass3");

const guestUser = new User("guest", "");

module.exports = {addUser, getUser, authenticateUser, guestUser};

