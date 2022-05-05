const database = require('better-sqlite3')

const logdb = new database('log.db')

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)
let row = stmt.get();
if (row === undefined) {
    console.log('Log database appears to be empty. Creating log database...')
    const sqlInit = `
        CREATE TABLE accesslog ( 
            id INTEGER PRIMARY KEY, 
            remoteaddr TEXT, 
            remoteuser TEXT, 
            date TEXT, 
            method TEXT, 
            url TEXT, 
            protocol TEXT,
            httpversion NUMERIC, 
            status INTEGER, 
            content_length NUMERIC,
            referrer_url TEXT,
            user_agent TEXT
        );
    `
    logdb.exec(sqlInit)
} else {
    console.log('Log database exists.')
}

module.exports = logdb