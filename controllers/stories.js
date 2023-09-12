
const db = require("./database.js");
const pool = db.pool;

module.exports = {
    
    getStoryContent: async function getStoryContent(storyid) {

        // -- get the settings json to know how to concatenate
        const settingsQuery = "\
        SELECT storysettings\
        FROM StoryTable AS s\
        WHERE s.storyId=$1"
        const settingsResult = await pool.query(settingsQuery, [storyid]);
        if (settingsResult.rowCount !== 1) {
            return null;
        }
        const inputLength = settingsResult.rows[0].storysettings.inputLength;

        const separator = (inputLength === "paragraph") ? '\n' : " ";

        // -- get the full content of a story
        const contentQuery = "\
        SELECT sc.inputOrder, sc.content\
        FROM StoryContentTable AS sc\
        WHERE sc.storyId=$1\
        ORDER BY sc.inputOrder ASC;"
        const contentResult = await pool.query(contentQuery, [storyid]);

        const content = contentResult.rows.map(item => item.content).join(separator);

        return content;
    },

    getStoryId: async function getStoryId(storytitle) {
        const result = await pool.query('SELECT storyid FROM storytable WHERE storytitle=$1', [storytitle]);
        if (result.rowCount === 1) {
            return result.rows[0].storyid;
        }
        return null;
    },

    getStoryTitle: async function getStoryTitle(storyid) {
        const result = await pool.query('SELECT storytitle FROM storytable WHERE storyid=$1', [storyid]);
        if (result.rowCount === 1) {
            return result.rows[0].username;
        }
        return null;
    },

    getStoryTitles: async function getStoryTitles() {
        const result = await pool.query('SELECT storytitle FROM storytable');
        return result.rows;
    },

    getActiveStoryTitles: async function getActiveStoryTitles() {
        const result = await pool.query('SELECT storytitle FROM storytable WHERE inprogress=TRUE');
        return result.rows;
    },

    getInactiveStoryTitles: async function getInactiveStoryTitles() {
        const result = await pool.query('SELECT storytitle FROM storytable WHERE inprogress=FALSE');
        return result.rows;
    },

    isActiveStory: async function isActiveStory(storyid) {
        const result = await pool.query('SELECT storytitle FROM storytable WHERE storyid=$1 AND inprogress=TRUE', [storyid]);
        return result.rowCount > 0;
    },

    getPreviousInput: async function getPreviousInput(storyid) {
        const result = await pool.query('SELECT content FROM storycontenttable WHERE storyid=$1 ORDER BY inputorder DESC LIMIT 1', [storyid]);
        return result.rows[0];
    },

    getStorySettings: async function getStorySettings(storyid) {
        const result = await pool.query('SELECT storysettings from storytable WHERE storyid=$1', [storyid]);
        return result.rows[0];
    },

    addStory: async function addStory(storytitle, storysettings) {
        // TODO: FIXME
        console.log(`addStory: storytitle=${storytitle}, storysettings=${storysettings}`);
        console.log(storysettings);
        // check username does not already exist
        let storyId = await this.getStoryId(storytitle);
        console.log("seeing if story already exists...");
        console.log(storyId);
        if (storyId === null || typeof storyId === "undefined") {
            // storyid, storytitle, inprogress, storysettings
            console.log("about to query...");
            const result = await pool.query('INSERT INTO StoryTable (storytitle, inprogress, storysettings) VALUES ($1, TRUE, $2);', [storytitle, storysettings]);
            console.log("should be added....");
            console.log(result);
            console.log(result.rows);
            storyId = await this.getStoryId(storytitle);
            console.log("storyId after add?:");
            console.log(storyId); 
            return true;
        }
        return false;
    },

    appendStory: async function appendStory(storyid, userid, content, ) {
        // storycontenttable
    },

    setStoryInactive: async function setStoryInactive(storyid) {
        console.log("setStoryInactive not yet implemented!");
        return false;
    }
}
