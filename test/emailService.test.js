var emailService = require('../services/email.service');
var chai = require('chai');
var should = chai.should;
var expect = chai.expect;

var details = {
    author: 'Omugtong, Jano',
    dateExecuted: new Date(),
}

function testAuthor(){
    console.log('   Author: ' + details.author);
    console.log('   Date Executed: ' + details.dateExecuted+'\n');
}


//the test cases only check return values from the service (promise). check db values manually


describe('email service testing', function(){

   before(function(){
        //set timeout to 10s
        this.timeout(10000);
        testAuthor();
    });

    describe('sendiMail function', function(){

        var mailInfos = {
            user: 'saasteamaws@gmail.com',
            pass: '12angDum^^y',
            from: '"SaaS Team 👻" <saasteamaws@gmail.com>',
            to: 'jano.omugtong@awsys-i.com',
            subject: 'service testing',
            text: 'sending test mail',
            html: `<p>This mail is sent to test the service</p>
                    <h3> Sent</h3>
                    <p>This is a working service.</p>`
        }

        it('will send an email with the following details in the mailInfos object.', function(){

            emailService.sendMail(mailInfos)
                .then(function(){})
                .catch(function(){});
        });


        it('will return an error if the senders email or password is invalid', function(){
            mailInfos.pass = "Inc0rrextp@ss"

            emailService.sendMail(mailInfos)
            .then(function(data){
            })
            .catch(function(error){
                expect(error).to.have.property('EAUTH', true);
            })
        });
        
        it('will return an error if the recipient is not a valid email', function(){
            mailInfos.pass = "12angDum^^y"
            mailInfos.to = "jano.omugtong";

            emailService.sendMail(mailInfos)
            .then(function(data){
            })
            .catch(function(error){
                expect(error).to.have.property('EENVELOPE', true);
            })
        });

        it('will return an error if the mailInfos details are insufficeint', function(){
            mailInfos.to = "jano.omugtong@awsys-i.com"
            mailInfos.subject = "";
            mailInfos.text = "";
            mailInfos.html = "";

            emailService.sendMail(mailInfos)
            .then(function(data){
            })
            .catch(function(error){
                expect(error).to.equal("insufficient data");
            })
        });

    });

});

