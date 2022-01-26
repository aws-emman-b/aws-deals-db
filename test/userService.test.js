var config = require('../config.json');
var _ = require('lodash');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });


var userService = require('../services/user.service');
var chai = require('chai');
var should = chai.should;
var expect = chai.expect;

var details = {
    author: 'Jenny Ayala',
    dateExecuted: new Date(),
}

function testAuthor(){
    console.log('   Author: ' + details.author);
    console.log('   Date Executed: ' + details.dateExecuted+'\n');
}


//the test cases only check return values from the service (promise). check db values manually
describe("User Service", function() {
	
	before(function(){
		testAuthor();
	});

	beforeEach(function(done){
        setTimeout(function(){
            done();
        }, 300);
    });

//db should not have a user with email "jennyayala@yahoo.com"	
describe('addUser', function(){
	this.timeout(5000);
	 it('should return nothing if data is saved in db', function(){		
		var user = {email: 'jennyayala@yahoo.com', firstName: 'AddedByTest', lastName: 'AddedByTest', role: 'User'};
		
        return userService.insert(user).then(function(){
        })
    });

    it('should return an object with property exists with value equal to true if email is already in db', function(){
		var user = {email: 'saasteamaws@gmail.com'};
		
        return userService.insert(user).catch(function(error) {
			expect(error).to.be.an('object').that.have.property('exists', true);;
		});
    });
	
	it('should return an object with property invalid set to true if email is invalid', function(){
		this.timeout(10000);
		
		var user = {email: 'jenny.ayala'};
		
        return userService.insert(user).catch(function(error) {
			expect(error).to.be.an('object').that.have.property('invalid', true);;
		});
    });    
});

describe('saveLanguage', function(){
	
    it('should update the setLanguage property of user', function(){
		var language = {body:{option:'english',email:'saasteamaws@gmail.com'}};
	
        return userService.saveLanguage(language).then(function(){
        });
    });
	
	it('should return nothing if email/language is undefined', function(){
		var language = {body:{}};
         return userService.saveLanguage(language).then(function(){
        });
    });
    
});

describe('authenticate', function(){
	
    it('should return an object with token since email and password is valid', function(){
		var email = 'saasteamaws@gmail.com';
		var password = 'admin';
		
        return userService.authenticate(email, password).then(function(response){
            expect(response).to.be.an('object').that.have.keys('token', 'user')
			
        });
    });
	
	it('should return nothing if email/password is incorrect', function(){
		var email = 'saasteamaws@gmail';
		var password = 'admin123';
		
        return userService.authenticate(email, password).then(function(token){
            expect(token).to.be.undefined;
        });
    });
    
});

describe('resetPass', function(){

     it('should return the new password for the registered email', function(){
		var email = 'jennyayala@yahoo.com';
		
        return userService.resetPass(email).then(function(password){
            expect(password).to.be.a('string');
			console.log(password);
        });
    });
	
	it('should return nothing if email is not found in db', function(){
		var email = 'saas@gmail.com';
		
        return userService.resetPass(email).then(function(){
		})
		.catch(function(error) {
			console.log("update error in db");
		});
    });
    
});

describe('getById', function(){
	
	var sample = {};
	db.collection('users').findOne({email: 'saasteamaws@gmail.com'}, function (err, user) {
        if (user) {
            sample = user;
		}
   
    });

    it('should return the user object', function(){
        return userService.getById(sample._id).then(function(response){
            expect(response).to.be.an('object');
        });
    });
	
	it('should return nothing if id was not found', function(){
		var id = "abcdefg123";
        return userService.getById(id).then(function(response){
			expect(response).to.be.undefined;
        });
    });
    
    
});

describe('getAll', function(){
	
    it('should return an object', function(){		
        return userService.getAll().then(function(response){
            expect(response).to.be.an('object');
        })
		.catch(function(error) {
		});
    });
	
    
});


describe('updateUser', function(){
	var jenny = {};
	db.collection('users').findOne({email: 'jenny.ayala@awsys-i.com'}, function (err, user) {
        if (user) {
            jenny = user;
		}
   
    });
	
	 it('should return nothing if data is saved in db', function(){
		jenny.firstName = "sample";
		jenny.role = "User";
		
        return userService.update(jenny._id, jenny).then(function(){
        })
    });

     it('should return error if oldPassword property exists but incorrect', function(){
		jenny.oldPassword = "abc123";
		
        return userService.update(jenny._id, jenny).catch(function(error) {
			expect(error).to.be.an('object').that.have.property('incorrectPW', true);;
		});
    });
	
	it('should return nothing if user was updated including password', function(){
		jenny.oldPassword = "Jenny123";
		jenny.password = "Jenny123"; //new password to be set
		
        return userService.update(jenny._id, jenny).then(function(){
        })
		.catch(function(error) {
			expect(error).to.be.an('object').that.have.property('incorrectPW', true);;
		});
    });
	
    
});


describe('delete', function(){
	this.timeout(5000);
	
	var toBeDeleted= {};
	var acct = {email: 'sample@gmail.com'};
	userService.insert(acct).then(function() {
				db.collection('users').findOne({email: 'sample@gmail.com'}, function (err, response) {
					if (response) {
						toBeDeleted = response;
					}
				});
	});
	
	
    it('should remove document from db', function(){
			return userService.delete(toBeDeleted._id).then(function() {
			});
	});
	
	it('should return an error if not found', function() {
		return userService.delete(toBeDeleted._id).catch(function(err) {
			expect(err).to.have.property('notFound', true);
		});
	});
});
});
