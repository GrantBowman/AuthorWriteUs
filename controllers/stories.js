
const db = require("./database.js");
const pool = db.pool;


async function getStoryContent(storyid) {

    // -- get the settings json to know how to concatenate
    const settingsQuery = "\
    SELECT storysettings\
    FROM StoryTable AS s\
    WHERE s.storyId=$1"
    const settingsResult = await pool.query(settingsQuery, [storyid]);
    if (settingsResult.rowCount !== 1) {
        return null;
    }
    console.log(settingsResult.rows[0].storysettings);
    const inputLength = settingsResult.rows[0].storysettings.inputLength;
    console.log(inputLength);

    const separator = (inputLength === "paragraph") ? '\n' : " ";

    // -- get the full content of a story
    const contentQuery = "\
    SELECT sc.inputOrder, sc.content\
    FROM StoryContentTable AS sc\
    WHERE sc.storyId=$1\
    ORDER BY sc.inputOrder ASC;"
    const contentResult = await pool.query(contentQuery, [storyid]);

    const content = contentResult.rows.map(item => item.content).join(separator);
    console.log(content);

    return content;

}

async function getStoryId(storytitle) {
    const result = await pool.query('SELECT storyid FROM storytable WHERE storytitle=$1', [storytitle]);
    if (result.rowCount === 1) {
        return result.rows[0].storyid;
    }
    return null;
}

async function getStoryTitle(storyid) {
    const result = await pool.query('SELECT storytitle FROM storytable WHERE storyid=$1', [storyid]);
    if (result.rowCount === 1) {
        return result.rows[0].username;
    }
    return null;
}

async function getStoryTitles() {
    const result = await pool.query('SELECT storytitle FROM storytable');
    return result.rows;
}


module.exports = {getStoryContent, getStoryId, getStoryTitle, getStoryTitles};
