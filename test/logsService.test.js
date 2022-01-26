var logsService = require('../services/logs.service');
var chai = require('chai');
var should = chai.should;
var expect = chai.expect;

var details = {
    author: 'Hipolito, Joren',
    dateExecuted: new Date(),
}

function testAuthor(){
    console.log('   Author: ' + details.author);
    console.log('   Date Executed: ' + details.dateExecuted+'\n');
}


//the test cases only check return values from the service (promise). check db values manually


describe('Logs Service Testing', function(){

   before(function(){
        //set timeout to 10s
        this.timeout(10000);
        console.log('   Author: ' + details.author);
        console.log('   Date Executed: ' + details.dateExecuted);
    });
    //based from trial & error, updates in database may be slower
    //therefore, set a delay for codes to get the latest values from database
    beforeEach(function(done){
        setTimeout(function(){
            done();
        }, 300);
    });

    describe('Insert Log', function(){

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
        //var log = {performedBy:'Joren Hipolito',event:'add module field', date: displayDate, details: 'PASS'}

        it('should insert logs ', function(){
            return logsService.moduleLogs({user:'Joren Hipolito',moduleName:'add module field', moduleDoc: displayDate, functionName: 'PASS'})
              
        }); 
        
        
    });

    
    
});

