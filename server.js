/*Main Server of the Saas Team Project*/
require('rootpath')();
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('config.json');


const scheduler = require('node-schedule');
const moment = require('moment');

//added by dyan0 --socket.io for realtime
var http = require('http').Server(app);
var io = require('socket.io')(http);

//macku
var net = require('net'),
    JsonSocket = require('json-socket');
var MongoClient = require('mongodb').MongoClient;
//var url = "mongodb://192.168.254.103:27017/";
var url = "mongodb://localhost:27017/dealmanager";
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');

//services for email reminders
//const userService = require('./services/user.service');
const ModuleService = require('./services/modules.service');
const EmailService = require('./services/email.service');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/profile_pictures'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: config.secret, resave: false, saveUninitialized: true })); //equvalent of 9h (same as jwt)

// use JWT auth to secure the api   // edited by dyan0: added '/api/users/emailOn'
app.use('/api', expressJwt({ secret: config.secret }).unless({ path: ['/api/user/login', '/api/user/current', '/api/user/logout'] }), function (err, req, res, next) {

});

// routes
app.use('/app', require('./controllers/app.controller'));
app.use('/api/user', require('./controllers/api/user.controller'));
app.use('/api/client', require('./controllers/api/client.controller'));
app.use('/api/deals', require('./controllers/api/deals.controller'));
app.use('/api/modules', require('./controllers/api/modules.controller'));

app.use('/scripts', express.static(__dirname + '/node_modules/'));


//added by dyan0
io.on('connection', function (socket) {

    //console.log('a user is connected');
    socket.on('disconnect', function () {
        //console.log('a user has disconnected');
    })
});

// make '/app' default route
app.get('/', function (req, res) {
    return res.redirect('/app');
});



// start server --edited by dyan0 from app.listen to http.listen
var server = http.listen(5000, function () {
    console.log(5000);
    //[sec] (optional) [min] [hour] [day of month] [month] [day of week]
/*
 * START Dullao, Joshua C. 03/04/2022
 * 
 * Temporarily disabled chron job
 * 
 */
/** 
    //send @ 05:00 AM
    scheduler.scheduleJob('0 5 * * *', function () {
        console.log(new Date().toLocaleTimeString());
        var diff, mailOptions;
        ModuleService.getAllModuleDocs('deals').then(function (deals) {
            for (var i = 0; i < deals.length; i++) {
                //check the due date and compare to the current date
                diff = moment().diff(deals[i]['essential']['Due Date'].replace(/\//g, '-'), 'days', false);
                if(diff > 0) {
                    console.log('overdue: ' + deals[i]['essential']['Deal Name']);
                    console.log('people responsible: \n' + deals[i]['essential']['Assignee'] + '\n' + 
                    deals[i]['profile']['AWS Resp (Sales) person'] + '\n' + 
                    deals[i]['profile']['AWS Resp (Dev) person']);

                    //send email to aws dev person (assumed to be jeremybreccion@gmail.com for testing purposes)
                    mailOptions = {
                        //sender user & pass
                        user: config.user,
                        pass: config.pass,
                        from: config.from,
                        to: deals[i]['profile']['AWS Resp (Dev) person'],
                        subject: 'Deal Management System - Deal overdue: ' + deals[i]['essential']['Deal Name'] + '!',
                        html: `
                            <p>The Project ${deals[i]['essential']['Deal Name']} is delayed by ${diff} days.<p>
                            `
                    }

                    EmailService.sendMail(mailOptions).then(function() {
                        console.log('email sent!');
                    }).catch(function(err) {
                        console.log(err);
                        console.log('error sending email');
                    });
                    
                }
            }
        });
    });
*/
/**END Dullao, Joshua C. 03/04/2022 */
});