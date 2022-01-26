var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
var multer = require('multer');
var fs=require('fs');
 
var service = {};

//Added by Glenn
service.uploadFile = uploadFile; //glenn
service.deleteFile = deleteFile; //glenn
service.readFile = readFile; //glenn
 
module.exports = service;

/*
    Function name: Upload File Service Read File
    Author(s): Flamiano, Glenn
    Date Modified: 2018/04/??
    Update Date: 2018/04/06
    Description: Reads a file in the server directory
    Parameter(s): req, res
    Return: deferred.promise
*/
function readFile(req, res){
    //console.log(req.query);
    var deferred = Q.defer();
    var found = false;
    try{
        var file=fs.readFileSync(req.query.urlFile);
        //console.log('file found');
        deferred.resolve('true');
    }catch(err){
        //if file of profile picture is not found
        //console.log('no file found');
        deferred.resolve('false');
    }
    return deferred.promise;
}

/*
    Function name: Upload File Service Delete File
    Author(s): Flamiano, Glenn
    Date Modified: 2018/03/08
    Update Date: 2018/04/06
    Description: Deletes the file url in the database and file in the server directory
    Parameter(s): req, res
    Return: deferred.promise
*/
function deleteFile(req, res){
    db.bind(req.body.dbName);
    //console.log(req.body.dbName);
    //console.log(db.collection(req.body.dbName));
    var deferred = Q.defer();

    //update db
    db.collection(req.body.dbName).findById(req.body._id, function (err, result) {
        if (err) deferred.reject(err);
 
        if (result) {
            db.collection(req.body.dbName).update({_id: mongo.helper.toObjectID(req.body._id)}, {$set: { fileUrl: ''}}, function(err){
                if(err) deferred.reject(err);
                //If no errors, send it back to the client
                try{
                    var file=fs.readFileSync(req.body.pathUsed+result.fileUrl); //catch error here if file not found
                    fs.unlink(req.body.pathUsed+result.fileUrl, function (err) {
                        if (err) deferred.reject(err);
                    });
                    //console.log('file deleted');
                    deferred.resolve();
                }catch(err){
                    //if file of profile picture is not found
                    //console.log('file delete failed not found');
                    deferred.resolve();
                }
                deferred.resolve();
            });
        } else {
            // authentication failed
            deferred.resolve();
        }
    });
    deferred.resolve();

    return deferred.promise;
}

/*
    Function name: Upload File Service Upload Profile Picture
    Author(s): Flamiano, Glenn
    Date Modified: 2018/03/01
    Update Date: 2018/04/05
    Description: Updates file url in collection and saves file
        within the workspace
    Parameter(s): none
    Return: none
*/
function uploadFile(req, res){
    db.bind(req.query.dbName);

     /*
        Function name: Split by last dot
        Author(s): Flamiano, Glenn
        Date Created: 2018/03/05
        Date Updated: 2018/03/05
        Description: Gets file name and extension and returns the file extension by last dot
        Parameter(s): text
        Return: text after last dot
    */
    function splitByLastDot(text) {
        var index = text.lastIndexOf('.');
        return [text.slice(0, index), text.slice(index + 1)]
    }

    /*
    Function name: Upload File Service Multer Storage
    Author(s): Flamiano, Glenn
    Date Modified: 2018/03/01
    Description: Configuration for saving uploaded image file
    Parameter(s): request, file, cb
    Return: cb
    */
    var storage = multer.diskStorage({
        destination: './'+req.query.pathUsed,
        filename: function(req, file, cb) {
            //console.log(req.body.id +'.'+ splitByLastDot(file.originalname)[1]);
            return cb(null, req.body.id +'.'+ splitByLastDot(file.originalname)[1]);
        }
    });

    var upload = multer({storage: storage}).single("myfile");

    var deferred = Q.defer();
    upload(req, res, function (err) {
        //console.log(req.file);
        if (err) {
            deferred.reject(err)
        } else {
            if (!req.file) {
                deferred.reject(err)
            } else {
                //update db
                db.collection(req.query.dbName).findById(req.body.id, function (err, result) {
                    if (err) deferred.reject(err);
             
                    if (result) {
                        db.collection(req.query.dbName).update({_id: mongo.helper.toObjectID(req.body.id)}, {$set: { fileUrl: req.file.filename}}, function(err){
                            if(err) deferred.reject(err);
                            //If no errors, send it back to the client
                            deferred.resolve();
                        });
                    } else {
                        // authentication failed
                        deferred.resolve();
                    }
                });
                deferred.resolve();
            }
        }
        deferred.resolve();
    });
    return deferred.promise;
}
