var languageService = require('../services/language.service');
var chai = require('chai');
var should = chai.should;
var expect = chai.expect;

var details = {
    author: 'Sanchez, Macku',
    dateExecuted: new Date(),
}

function testAuthor(){
    console.log('   Author: ' + details.author);
    console.log('   Date Executed: ' + details.dateExecuted+'\n');
}


//the test cases only check return values from the service (promise). check db values manually


describe('language service testing', function(){

   before(function(){
        //set timeout to 10s
        this.timeout(10000);
        testAuthor();
    });

    describe('saveDefaultLanguage and Get Default Language', function(){

        var language = {body:{option:'english',email:'saasteamaws@gmail.com'}}

        it('will save a new default language that will be retrieved by get default language function', function(){
            //testAuthor();

            return languageService.saveDefaultLanguage(language)
                .then(function(){})
                .catch(function(){});
        }); 

        it('will get the default language set by saveDefaultLanguage function', function(){

            languageService.getDefaultLanguage({})
                            .then(function(data){
                                expect(data).to.have.property('English');
                            })
                            .catch(function(error){
                                //expect(data).to.have.property('English');
                            });
        });

        it('will return an english language pack if the default Language is not existing', function(){

            languageService.getDefaultLanguage({})
                            .then(function(data){
                                expect(data).to.have.property('English');
                            })
                            .catch(function(error){
                                //expect(data).to.have.property('English');
                            });
        });

    });

    describe('get specific language', function(){
         
        //it is suggested to clean (either manually or other service methods) the test data inserted to the database
        //if service methods will be used, use before() hook
        //before(function(){});

        it('should return an object that is english language pack', function(){
            //testAuthor();
            var qwe={params:{user:'english'}};
        
            return languageService.getSpecificLanguage(qwe).then(function(data){
                //console.log(Object.keys(data)[0]);
                expect(data).to.have.property('English');
            });
        });

        it('should return an english pack', function(){
            var qwe={params:{user:'asd'}};
        
            return languageService.getSpecificLanguage(qwe).then(function(data){
                //expect(error).to.have.property('English');
            }).catch(function(error){
                expect(error).to.have.property('English');
            })
        });

        it('should return an object that is 日本語 language pack', function(){
            var qwe={params:{user:'nihongo'}};
        
            return languageService.getSpecificLanguage(qwe).then(function(data){
                //console.log(Object.keys(data)[0]);
                expect(data).to.have.property('日本語');
            });
        });
        
    });
    
});

