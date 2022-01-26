var ModulesService = require('../services/modules.service');
var chai = require('chai');

var should = chai.should;
var expect = chai.expect;

var details = {
    author: 'Jeremy Reccion',
    dateExecuted: new Date(),
}

/* 
    the test cases only check return values from the service (promise). 
    check (& clean) inserted test data to the database before running tests.
*/

describe('Modules Service', function(){
    before(function(){

        console.log('   Author: ' + details.author);
        console.log('   Date Executed: ' + details.dateExecuted);

        /**
         * CLEAN TEST DATA before tests
         * modules created after last test case: 'testmodule2' & 'testmodule3'
         * DELETE the collections and documents from 'modules' collection
         */

         /* return ModulesService.deleteModule('testmodule2')
         .then(ModulesService.deleteModule('testmodule3')); */
    });

    //based from trial & error, updates in database may be slower
    //therefore, set a delay for codes to get the latest values from database
    beforeEach(function(done){
        setTimeout(function(){
            done();
        }, 300);
    });

    
    describe('addModule()', function(){
    
        //when successful, it resolves. otherwise, this will result in failure
        it('should add "testmodule1" to "modules" collection', function(){
            return ModulesService.addModule({name: 'testmodule1'});
        });
    
        it('should return an error object with "exists" property', function(){
            return ModulesService.addModule({name: 'testmodule1'}).then(function(){
            }).catch(function(err){
                console.log(err);
                expect(err).to.have.property('exists', true);
            });
        });
        
    });
    
    
    describe('getAllModules()', function(){
        it('should get all documents from "modules" collection', function(){
            return ModulesService.getAllModules().then(function(data){
                expect(data).to.be.an('array');
            });
        });
    });
    
    describe('getModuleByName()', function(){
         
        //get 'testmodule1' created from previous test case
        it('should get an existing "testmodule1" document from "modules" collection', function(){
            return ModulesService.getModuleByName('testmodule1').then(function(data){
                //check the result's 'name' property
                expect(data).to.have.property('name', 'testmodule1');
            });
        });
    
        it('should return an error object with "notFound" property when trying to get a non-existing "asdlsadk" document from "modules collection"', function(){
            return ModulesService.getModuleByName('asdlsadk')
            .catch(function(err){
                console.log(err);
                expect(err).to.have.property('notFound', true);
            });
        });
    });
    
    describe('updateModule()', function(){
        //since this is update, get '_id' of test data from database before running the test
        var updateModule = {};
        //use the 'testmodule1' created from previous test case
        it('should update the module name "testmodule1" to a unique name "testmodule2" in the database', function(){
            return ModulesService.getModuleByName('testmodule1').then(function(data){
                updateModule = data;
                updateModule.name = 'testmodule2';
                //console.log(updateModule);
                ModulesService.updateModule(updateModule);
            });            
        });

        //to simulate duplicates, create 'testmodule3', then use 'testmodule2' from previous test case and try to update its name to 'testmodule3'
        it('should return an error if there is an already existing document named "testmodule3" from the database', function(){
            return ModulesService.addModule({name: 'testmodule3'})
            .then(function(){
                //updateModule is 'testmodule2' from previous test case
                updateModule.name = 'testmodule3';
                //console.log(updateModule);
                ModulesService.updateModule(updateModule)
                .catch(function(err){
                    console.log(err);
                    expect(err).to.have.property('exists', true);
                });
            });
        });        
    });

    describe('deleteModule()', function(){

        it('should delete "testmodule3" from "modules" collection', function(){
            return ModulesService.deleteModule('testmodule3');
        });

        it('should return an error if the module is non existing', function(){
            return ModulesService.deleteModule('testmodule3').catch(function(err){
                console.log(err);
                expect(err).to.have.property('notFound', true);
            });
        });
    });

    /*
        the service method updateModuleField() DOES NOT CHECK:
            - duplicate field names
        the service methods addModuleField() & updateModuleField() DO NOT CHECK:
            - properties of the field object (e.g. name, unique)
    */
    describe('addModuleField()', function(){
        var fieldObject = {
            name: 'testfield1',
            unique: true
        }

        it('should push a new field object with name "testfield1" to the "fields" array of "testmodule2"', function(){
            return ModulesService.addModuleField('testmodule2', fieldObject);
        });

        it('should return an error if the field name "testfield1" already exists in the "fields" array of "testmodule2"', function(){
            return ModulesService.addModuleField('testmodule2', fieldObject)
            .catch(function(err){
                console.log(err);
                expect(err).to.have.property('exists', true);
            });
        });
    });

    describe('updateModuleField()', function(){
        //to get the 'id' property of "testfield1", use getModuleByName() and array.find() to get the field object.
        var fieldObject = {};
        before(function(){
            return ModulesService.getModuleByName('testmodule2').then(function(data){
                fieldObject = data.fields.find(function(x){
                    return x.name == 'testfield1';
                });
            });
        });

        it('should update name of the "testfield1" from "testmodule2" to "testfield2"', function(){
            fieldObject.name = 'testfield2';
            return ModulesService.updateModuleField('testmodule2', fieldObject);
        });

        //add a new field "testfield3" first, then update the fieldObject from the previous test case to "testfield3".
        it('should return an error if the field name "testfield2" already exists in the "fields" array of "testmodule1"', function(){
            var fieldObject2 = {
                name: 'testfield3',
                unique: false
            }
            return ModulesService.addModuleField('testmodule2', fieldObject2)
            .then(function(){
                fieldObject.name = 'testfield3'
                ModulesService.updateModuleField('testmodule2', fieldObject)
                .catch(function(err){
                    console.log(err);
                    expect(err).to.have.property('exists', true);
                });
            });
        });

        //add a new module "testmodule3" first then use it as the first parameter of the method
        it('should return a notFound error if the fieldObject does not exist in the module document', function(){
            return ModulesService.addModule({name: 'testmodule3'})
            .then(ModulesService.updateModuleField('testmodule3', fieldObject)
            .catch(function(err){
                console.log(err);
                expect(err).to.have.property('notFound', true);
            }));
        });

        //get "testfield2" from "testmodule2"
        //then, change name to "testfield4"
        //finally, update to "testmodule3"
        it('should return a notFound error if the field does not exists in the specific module', function(){
            var fieldObject3 = {};
            return ModulesService.getModuleByName('testmodule2').then(function(data){
                fieldObject3 = data.fields.find(function(x){
                    return x.name == 'testfield3'
                });
                fieldObject3.name = 'testfield2';
                ModulesService.updateModuleField('testmodule3', fieldObject3)
                .catch(function(err){
                    console.log(err);
                    //should be notFound
                    expect(err).to.have.property('notFound', true);
                });
            });
        });

        //add 'testfield1' to 'testmodule3'
        //get 'testfield2' from 'testmodule2'
        //change it to 'testfield1'
        //update to 'testmodule3'
        it('should return a notFound error if the new name from a module has the same name on another', function(){
            var fieldObject4 = {};
            fieldObject.name = 'testfield1';
            return ModulesService.addModuleField('testmodule3', fieldObject)
            .then(ModulesService.getModuleByName('testmodule2').then(function(data){
                fieldObject4 = data.fields.find(function(x){
                    return x.name == 'testfield2';
                });

                fieldObject4.name = 'testfield1';
                ModulesService.updateModuleField('testmodule3', fieldObject4).catch(function(err){
                    console.log(err);
                    expect(err).to.have.property('notFound', true);
                });
            }));
        });
    });

    describe('deleteModuleField()', function(){
        //delete 'testfield1' which was created from the previous test case
        var fieldObject5 = {};
        it('should delete "testfield1" from "testmodule3"', function(){
            return ModulesService.getModuleByName('testmodule3')
            .then(function(data){
                fieldObject5 = data.fields.find(function(x){
                    return x.name == 'testfield1';
                });
                ModulesService.deleteModuleField('testmodule3', fieldObject5.id);
            });
        });

        it('should return a notFound error if the field is not existing in the specific module', function(){
            //use fieldObject.id (which was deleted from the previous test case)
            return ModulesService.deleteModuleField('testmodule3', fieldObject5.id)
            .catch(function(err){
                console.log(err);
                expect(err).to.have.property('notFound', true);
            });
        });

        //get 'testfield2' from 'testmodule2'
        //use 'testmodule3' as first parameter in deleteModuleField()
        it('should return a notFound error if trying to delete a field on the wrong module', function(){
            var fieldObject6 = {};
            return ModulesService.getModuleByName('testmodule2').then(function(data){
                fieldObject6 = data.fields.find(function(x){
                    return x.name == 'testfield2';
                });
                //wrong module since 'testfield2' belongs to 'testmodule2'
                ModulesService.deleteModuleField('testmodule3', fieldObject6)
                .catch(function(err){
                    console.log(err);
                    expect(err).to.have.property('notFound', true);
                });
            });
        });
    });

    /*
     * At this point, 'testmodule2' has the ff fields:
     *  'testfield2' - unique
     *  'testfield3' - not unique
     * 
     * Again, addModuleDoc() & updateModuleDoc() DO NOT CHECK:
     *  - properties of the field object in accordance to the 'fields' of a specific module
     */

    describe('addModuleDoc()', function(){
        it('should add a new document to "testmodule2" with correct properties', function(){
            var newDoc = {
                testfield2: 'testField2Data1',
                testfield3: 'testField3Data1'
            }

            return ModulesService.addModuleDoc('testmodule2', newDoc);
        });

        it('should return an exists error when adding a document with its unique field value already exists', function(){
            //the value of testfield2 already exists in the database due to the previous test case
            var newDoc2 = {
                testfield2: 'testField2Data1',
                testfield3: 'testField3Data2'
            } 

            return ModulesService.addModuleDoc('testmodule2', newDoc2).catch(function(err){
                console.log(err);
                expect(err).to.have.property('exists', true);
            });
        });

        it('should add a document even if the value of a non-unique field already exists', function(){
            //value of testfield3 is the same as the first test case
            var newDoc3 = {
                testfield2: 'testField2Data3',
                testfield3: 'testField3Data1'
            }

            return ModulesService.addModuleDoc('testmodule2', newDoc3);
        });
    });

    describe('getAllModuleDocs()', function(){
        it('should get the documents from a "testmodule2"', function(){
            return ModulesService.getAllModuleDocs('testmodule2').then(function(data){
                expect(data).to.be.an('array');
            });
        });
    });

    describe('updateModuleDoc()', function(){

        //since there is not a method to get a specific document, use getAllModuleDocs()
        //get the object whose 'testfield2' value is 'testField2Data1'
        var updateDoc = {};

        it('should update a document from "testmodule2" because its unique field values are not in db', function(){
            return ModulesService.getAllModuleDocs('testmodule2').then(function(data){
                updateDoc = data.find(function(x){
                    return x.testfield2 == 'testField2Data1';
                });

                //update its testfield2 value to something unique
                updateDoc.testfield2 = 'testField2Data4';
                ModulesService.updateModuleDoc('testmodule2', updateDoc);
            });
        });
        
        it('should return an exists error when adding a document with its unique field value already exists', function(){
            //change the 'testfield2' value of updateDoc to 'testField2Data3' (already added from previous test [addModuleDoc()])
            updateDoc.testfield2 = 'testField2Data3';
            ModulesService.updateModuleDoc('testmodule2', updateDoc).catch(function(err){
                console.log(err);
                expect(err).to.have.property('exists', true);
            });
        });

        it('should return a notFound error when updating to the wrong module', function(){
            //must error since updateDoc was added to 'testmodule2' and not to 'testmodule3' 
            return ModulesService.updateModuleDoc('testmodule3', updateDoc).catch(function(err){
                console.log(err);
                expect(err).to.have.property('notFound', true);
            });
        });
        
    });
    
    describe('deleteModuleDoc()', function(){
        //before running tests, get a specific document from "testmodule2"
        var deleteDoc = {};
        before(function(){
            return ModulesService.getAllModuleDocs('testmodule2').then(function(data){
                //no specific document, so get the first
                deleteDoc = data[0];
            });
        });

        it('should delete the document from "testmodule2"', function(){
            return ModulesService.deleteModuleDoc('testmodule2', deleteDoc._id);
        });

        it('should return a notFound error if the id is non-existing in the db collection', function(){
            return ModulesService.deleteModuleDoc('testmodule2', deleteDoc._id).catch(function(err){
                console.log(err);
                expect(err).to.have.property('notFound', true);
            });
        });

        it('should return a notFound error if trying to delete from the wrong module', function(){
            //to be sure, get another existing document from "testmodule2"
            return ModulesService.getAllModuleDocs('testmodule2').then(function(data){
                //no specific document, so get the first
                deleteDoc = data[0];

                //use 'testmodule3' as 1st parameter. should return an error because the document belongs to 'testmodule2'
                ModulesService.deleteModuleDoc('testmodule3', deleteDoc._id).catch(function(err){
                    console.log(err);
                    expect(err).to.have.property('notFound', true);
                });
            });
        });
    });
});