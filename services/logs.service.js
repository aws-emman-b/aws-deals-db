var config = require('../config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
var fs=require('fs');
var emailService = require('../services/logs.service');
db.bind('logs');


var fs = require('fs');
 
var service = {};

var displayDate;
var start = new Date();
var year = start.getFullYear();
var month = ''+(start.getMonth()+1);
var date = ''+start.getDate();
var hour = ''+start.getHours();
var minutes = ''+start.getMinutes();
var seconds = ''+start.getSeconds();

if (month.length < 2) month = '0' + month;
if (date.length < 2) date = '0' + date;
if (hour.length < 2) hour = '0' + hour;
if (minutes.length < 2) minutes = '0' + minutes;
if (seconds.length < 2) seconds = '0' + seconds;

displayDate = year+"-"+month+"-"+date+" "+hour+":"+minutes+":"+seconds;


service.moduleLogs = moduleLogs;
 
module.exports = service;

function moduleLogs(user,moduleName,moduleDoc,functionName){
    var deferred = Q.defer();
    //console.log(user)

    var log = {}

    if(functionName==="delete module document"){

        
        db.bind(moduleName)
        
        db[moduleName].findOne({ _id: mongo.helper.toObjectID(moduleDoc) }, function (err, result) {
            if (err) deferred.reject(err);

            log = {
                performedBy:""+ user.firstName+" "+user.lastName+"",
                event:functionName,
                date:displayDate,
                details:result
            }

            insertLog(log);
        });
    }else if(functionName=== "delete module field"){

        db.bind('modules')
    
        db.modules.findOne({name:moduleName},function (err, result) {
            if (err) deferred.reject(err);

            var kahitanongpangalan = result.fields.find(function(kahitanongpangalan){
                return kahitanongpangalan.id==moduleDoc
            })

            log = {
                performedBy:""+ user.firstName+" "+user.lastName+"",
                event:functionName,
                date:displayDate,
                details:kahitanongpangalan
            }
            

           insertLog(log);
        });
    }else{
        log = {
            performedBy:""+ user.firstName+" "+user.lastName+"",
            event:functionName,
            date:displayDate,
            details:moduleDoc
        }
        //console.log(log)
        insertLog(log);
    }   
     
    function insertLog(log){
        //console.log(user);
        db.logs.insert(log,function (err, doc) {
            if (err) deferred.reject(err);
 
                deferred.resolve();
        });

    }

    return deferred.promise;
}