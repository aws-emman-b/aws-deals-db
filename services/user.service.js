var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
var fs=require('fs');
var emailService = require('services/email.service');
db.bind('users');

var fs = require('fs');
 
var service = {};

//Added by Glenn
service.getAll = getAll;

service.authenticate = authenticate;
service.resetPass = resetPass;      
service.getById = getById;
service.insert = insert;    // macku
service.update = update;
service.delete = _delete;
service.saveLanguage = saveLanguage; //glenn
 
module.exports = service;

function saveLanguage(req, res){
    var deferred = Q.defer();

    //update db
    db.users.findOne({ email: req.body.email }, function (err, user) {
        if (err) deferred.reject(err);
 
        if (user) {
            db.users.update({email: req.body.email}, {$set: { setLanguage: req.body.option}}, function(err){
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

    return deferred.promise;
}
 
function authenticate(email, password) {
    var deferred = Q.defer();
 
    db.users.findOne({ email: email }, function (err, user) {
        if (err) {
            console.log("User service is "+err);
            deferred.reject(err);
        }
 
        if (user && bcrypt.compareSync(password, user.hash)) {
            //reject if user is deactivated
            if(user.status === false){
                console.log('user is deactivated');
                deferred.reject(user.status);
            } else {
                // authentication successful
                console.log('login accepted...');
                delete user.hash;
                deferred.resolve({token: jwt.sign({ sub: user._id }, config.secret), user: user});
            }
        } else {
            // authentication failed
            console.log('login rejected...');
            deferred.reject();
        }
    });
 
    return deferred.promise;
}

function resetPass(email) {
    var deferred = Q.defer();
    db.users.findOne({ email: email }, function (err, user) {
        if (err) deferred.reject(err);
 
        if (user) {
            var crypto = require("crypto");
            var tempPass = crypto.randomBytes(4).toString('hex');
            // authentication successful

            hash = bcrypt.hashSync(tempPass, 10);

            db.users.update({email: email}, 
                {$set:{hash: hash}}, 
                function(err, task){
                    if (err) deferred.reject(err);
                
                    deferred.resolve();
            });

            deferred.resolve(tempPass);
        } else {
            // authentication failed
            deferred.resolve();
        }
    });
 
    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();
    
 
    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err);
 
        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

/*
    Function name: User Service Get All Users
    Author(s): Flamiano, Glenn
    Date Modified: 2018/03/01
    Description: Retrieves all the users from user collection
    Parameter(s): none
    Return: none
*/
function getAll() {
    var deferred = Q.defer();
 
    //db.users.find({role:  {$ne : "Admin"}}).toArray(function(err, user) {
    db.users.find({}).toArray(function(err, user) {
        if (err) deferred.reject(err);
 
        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });
    
    return deferred.promise;
}
/*
    Function name: Add User Function
    Author(s): Sanchez, Macku
    Date Modified: January 2018
    Description: Adds new user to the database and checks for duplicate data
*/
function insert(userParam){
    var deferred = Q.defer();
    db.users.findOne(
        { email: userParam.email },
        function (err, user) {
            if (err) deferred.reject(err);
 
            if (user) {
                // email already exists
                 deferred.reject({exists:true});
            } else {
                sendMail();
            }
        });
		
		function sendMail(){
			
			var email = userParam.email;
			
			var crypto = require("crypto");
			var password = crypto.randomBytes(4).toString('hex');
			
            const output = `
                            <p>You have been registered to the Saas App</p>
                            <h3> Account Details</h3>
                            <ul>
                                <li>Email: ${email}</li>
                                <li>Password: ${password}</li>
                            </ul>
                            <h3>Message</h3>
                            <p>Please change your password to your convenience.</p>
                        `;

                    var mailInfos = {};
                    mailInfos.user = config.user;
                    mailInfos.pass = config.pass;
                    mailInfos.from = config.from;
                    mailInfos.to = email;
                    mailInfos.subject = "Account Registered";
                    mailInfos.text = "Welcome to Saas Project";
                    mailInfos.html = output;
            
                    emailService.sendMail(mailInfos).then(function(){
                        insertUser(password);
                    })
                    .catch(function (err) {
                        //console.log('user.service Error is: ')
                        //console.log(err);
                        deferred.reject({invalid:true});
                    });
        }
    function insertUser(password) {

		var user = userParam;
        user.hash = bcrypt.hashSync(password, 10);
			
		
		db.collection('language').findOne({name:"defaultLanguage"}, function(err, language) {
			if (err) deferred.reject(err);
			
			if(language) {
				user.setLanguage = language.value;
				saveUser();
			}
			else {
				saveUser();
			}
		});

		function saveUser() {
        db.users.insert(
            user,
            function (err, doc) {
                if (err) deferred.reject(err);
 
                deferred.resolve();
            });
		}
    }
 
    return deferred.promise;
}
 
function update(_id, userParam) {
    var deferred = Q.defer();
    //console.log(userParam);
 
    // validation
    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err);
 
            db.users.findOne(
                { email: userParam.email },
                function (err, user) {
                    if (err) deferred.reject(err);

					if(userParam.oldPassword){
						if (user && bcrypt.compareSync(userParam.oldPassword, user.hash)){
							updateUser();
						}else{
							deferred.reject({incorrectPW : true});
						}
					}
					else{
						updateUser();
					}
                });
    });

    /*
        Function name: Update User Function
        Author(s): Sanchez, Macku
        Date Modified: January 2018
        Description: Updates Data,Checks for old password and checks for duplicate data
    */
 
    function updateUser() {
        // fields to update
        delete userParam.oldPassword;
        delete userParam.confirmPassword;
        var set = _.omit(userParam,'_id');
 
        // update password if it was entered
        if (userParam.password) {
            set.hash = bcrypt.hashSync(userParam.password, 10);
        }
        delete set.password;
       
       db.users.update({_id: mongo.helper.toObjectID(_id)}, {$set: set}, function(err){
            if(err) {
               deferred.reject(err);
            }
            deferred.resolve();
        });
    }
 
    return deferred.promise;
}
 
// prefixed function name with underscore because 'delete' is a reserved word in javascript
function _delete(_id) {
    var deferred = Q.defer();

    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err);

        //console.log(user.profilePicUrl);
		if(user) {
			fs.unlink('profile_pictures/'+user.profilePicUrl, function (err) {});

			db.users.remove(
			{ _id: mongo.helper.toObjectID(_id) },
			function (err) {
				if (err){};
 
				deferred.resolve();
			});
		}
		else {
			deferred.reject({notFound:true});
		}

    });
 
    return deferred.promise;
}
