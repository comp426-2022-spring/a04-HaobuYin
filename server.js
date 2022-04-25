const express = require('express');
const app = express();
const minimist =require('minimist');
const morgan = require('morgan')
const fs = require('fs');
/*const errorhandler = require('errorhandler')
const { argv } = require('process');
*/
const logdb = require('./database')
//middleware global
app.use(express.json())
app.use(express.urlencoded({extended: true}))

/*
const logging = (req, res, next) =>{
    console.log(req.body.number)
    res.statusCode = 200;
    console.log(req.ip + ' - -' + Date.now())
    //req.
    next();
}*/

//use morgan for logging

//app.use(morgan('combined'))

//let logging2 = morgan('combined')
//app.use(logging2('common', ))
/*app.use(fs.writeFile('./access.log', data, { flag: "A" },
    (err, req, res, next) => {
        if (err) {
            console.err(err)
        } else {
            console.log()
        }
    })
)
*/
let debug = false;
let log = true;
const args = require('minimist')(process.argv.slice(2))
//args['port']
console.log(args)
const port = args.port || 5555
log = args.log
debug = args.debug

const server = app.listen(port, () => {
    console.log('App is running on port %port%'.replace('%port%', port));
})

// logging middleware
// Set up the access logging middleware
if (log===true){
    const WRITESTREAM = fs.createWriteStream('./access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: WRITESTREAM }))
}
// app.use(logging)

// help
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}


// endpoints
app.get('/app', (req, res) =>{
    res.type('text/plain')
    res.status(200).end('200 OK')
})

if (debug === true){
    app.get("/app/log/access", (req, res, next) => {
        const content = logdb.prepare('SELECT * FROM accesslog').all()
        res.status(200).json(content)
        console.log('code reached')
    });
    
    app.get('/app/error', (req, res) => {
        throw new Error('Error test successful.')
      })
}

//:number gives req.params
app.get('/app/echo/:number', (req, res) =>{
    res.status(200).json({'message': req.params.number});
})

app.get('/app/echo', (req, res)=> {
    res.status(200).json({'message': req.query.number})
})

/*app.get('/app/echo', (req, res)=> {
    res.status(200).json({'message': req.body.number})
})
use curl -X GET -H 'Content-Type: application/json'  -d '{'number': "30"}' http://localhost:5000/app/echo/
*/

app.get('/app/flip', (req, res) => {
    let flip = coinFlip();
    res.status(200).json({'flip': flip})
})

app.get('/app/flips/:number', (req, res)=>{
    if (req.params.number < 1 || req.params.number > 10000) {
        res.status(200).end('invalid flip number')
    } else {
        const flips = coinFlips(req.params.number)
        const count = countFlips(flips)
        res.status(200).json({ "raw": flips, "summary": count })
    }
})

/* Same endpoint with regex
app.get('/app/flips/:number([0-9])', (req, res) => {
    //number([0-9][0-9]?)match 0 to 9 or 0 to 99,second opt
    //number([0-9]{1,4}) match 0 to 9999
    const flips = coinFlips(req.params.number) 
    const count = countFlips(flips)
    res.status(200).json({"raw": flips, "summary": count})

})
*/

app.get('/app/flip/call/:guess(heads|tails)', (req, res)=>{
    game = flipACoin(req.params.guess)
    res.status(200).json(game)
})

app.use(function(req, res){
    res.type('text/plain')
    res.status(404).send('404 NOT FOUND')
})


// database
app.use( (req, res, next) => {
    // Your middleware goes here.
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, date, method, url, protocol, httpversion, status, referrer_url, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, 
        logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    console.log(info)
    })

// functions
function coinFlip() {
    return Math.random() < 0.5 ? 'heads' : 'tails'
}

function coinFlips(flips) {
    if (!(flips > 0)) { flips = 1 };
    const result = [];
    for (let i = 0; i < flips; i++) {
        result.push(Math.random() < 0.5 ? 'heads' : 'tails')
    }
    return result;
}

//param {string[]} array, returns {{ heads: number, tails: number }}
 
function countFlips(array) {
    const result = { tails: 0, heads: 0 };
    array.forEach(element => {
        if (element === "heads") {
            result.heads++
        } else if (element === "tails") {
            result.tails++
        } else {
            return "Error"
        };
    });
    return result;
}

function flipACoin(_call) {
    if (_call !== "heads" && _call !=="tails"){
      console.log("Error: no input. Usage: node guess-flip --call=[heads|tails]")
      return
    }
    const record = {call: _call, flip:"", result:""}
    record.flip = coinFlip();
    record.result = _call === record.flip ? "win" : "lose";
    return record;
  }
