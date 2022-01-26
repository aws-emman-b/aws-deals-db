var Q = require('q');
var nodemailer = require('nodemailer');
var config = require('../config.json');

var service = {};

service.sendMail = sendMail;

module.exports = service;

function sendMail(req,res){

    var deferred = Q.defer();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        //service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: req.user, // generated ethereal user
            pass: req.pass  // generated ethereal password
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: req.from, // sender address
        to: req.to, // list of receivers
        subject: req.subject, // Subject line
        text: req.text, // plain text body
        html: req.html // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (!checkMailOptions()){
            //console.log(!checkMailOptions());
            deferred.reject("insufficient data");
        }
        if (error) {
            deferred.reject(error);
        }
            deferred.resolve();
    });

    return deferred.promise;

    function checkMailOptions(){
        var total=0;
        if (req.subject){
            total++;
        }
        if (req.text){
            total++;
        }
        if (req.html){
            total++;
        }
        if (total >= 1){
            return true;
        } else {
            return false;
        }
    }
}