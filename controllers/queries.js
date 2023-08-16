
const db = require("./database.js");
const pool = db.pool;


async function getStoriesByUser(userid) {
    
    // -- get all the stories a user was involved in
    const query = "\
    SELECT DISTINCT s.storyTitle\
    FROM UserTable AS u\
    INNER JOIN StoryContentTable AS sc\
    ON u.userId=sc.userId\
    INNER JOIN StoryTable AS s\
    ON sc.storyId=s.storyId\
    WHERE u.userId=$1;"
    
    const result = await pool.query(query, [userid])
    console.log(result.rows)
    return result.rows;
}

async function getUsernamesByStory(storyid) {
    
    // -- get all the users involved in a story
    const query = "\
    SELECT DISTINCT u.username\
    FROM StoryTable AS s\
    INNER JOIN StoryContentTable AS sc\
    ON s.storyId=sc.storyId\
    INNER JOIN UserTable AS u\
    ON sc.userId=u.userId\
    WHERE s.storyId=$1;"
    const result = await pool.query(query, [storyid])
    return result.rows;
}


module.exports = {getStoriesByUser, getUsernamesByStory};

