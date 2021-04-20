const sqlite3 = require('sqlite3').verbose();

let database = new sqlite3.Database(process.env.database_dir, (error) => {
    if (error) {
        return console.error(error.message);
    } else {
        console.log('Connected to SQlite database.');
    }
});

module.exports = database;