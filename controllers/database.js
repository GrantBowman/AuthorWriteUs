
const {Pool, Client} = require("pg");

const credentuals = {
    user: "postgres",
    host: process.env.DB_HOST,
    database: "Author-Write-Us",
    password: process.env.DB_PASSWORD,
    post: process.env.DB_PORT
}
const pool = new Pool(credentuals);







module.exports = {pool};


