
const {Pool, Client} = require("pg");

const credentials = {
    user: "postgres",
    host: process.env.DB_HOST,
    database: "Author-Write-Us",
    password: process.env.DB_PASSWORD,
    // port: process.env.DB_PORT
    port: 1111
}
const pool = new Pool(credentials);

module.exports = {pool};
