var config = require('../config.json');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {native_parser: true});
db.bind('modules');
var Q = require('q');

//sample
var ObjectID = require('mongodb').ObjectID;

var service = {};

service.addModule = addModule;
service.getAllModules = getAllModules;
service.getModuleByName = getModuleByName;
service.updateModule = updateModule;
service.deleteModule = deleteModule;

service.addModuleField = addModuleField;
service.updateModuleField = updateModuleField;
service.deleteModuleField = deleteModuleField;

service.addModuleDoc = addModuleDoc;
service.getAllModuleDocs = getAllModuleDocs;
service.getModuleDocById = getModuleDocById;
service.updateModuleDoc = updateModuleDoc;
service.deleteModuleDoc = deleteModuleDoc;

service.findDuplicateDoc = findDuplicateDoc;
service.updateFieldArray = updateFieldArray;
/*
    Flags
*/
var dbError = {dbError: true};
var exists =  {exists: true};
var notFound = {notFound: true};

/*
    Function name: add module
    Author: Reccion, Jeremy
    Date Modified: 2018/04/02
    Description: 
        creates a new collection by the name inputted by the user. 
        it is then registered to the "modules" collection.
    Parameter(s): Object. includes:
        *name: required. string type
        *fields: optional. Array type. initialized if not existing from input
    Return: Promise
*/
function addModule(newModule){
    //imitate angular promise. start by initializing this
    var deferred = Q.defer();

    newModule.name = newModule.name.toLowerCase();

    //check if there is an existing module
    db.modules.findOne({name: newModule.name}, function(err, aModule){
        if(err){
            deferred.reject(err);
        }
        //already exists
        else if(aModule){
            deferred.reject(exists);
        }
        else{
            //unique, so proceed
            //create table first before adding a new document to 'modules' collection (not necessary?)
            db.createCollection(newModule.name, function(err){
                if(err){
                    deferred.reject(err);
                }
                else{
                    //initialize fields property as empty array if there are none in the input
                    if(newModule.fields == undefined){
                        newModule.fields = [];
                    }

                    db.modules.insert(newModule, function(err){
                        if(err){
                            deferred.reject(err);
                        }
                        else{
                            deferred.resolve();
                        }
                    });
                }
            });
        }
        
    });
    
    //return the promise along with either resolve or reject
    return deferred.promise;
}

/*
    Function name: get all modules
    Author: Reccion, Jeremy
    Date Modified: 2018/04/02
    Description: gets all documents from 'modules' collection
    Parameter(s): none
    Return: Promise
*/
function getAllModules(){
    var deferred = Q.defer();
    db.modules.find().toArray(function(err, modules){
        if(err){
            deferred.reject(err);
        }
        else{
            deferred.resolve(modules);
        }
    });

    return deferred.promise;
}

/*
    Function name: update module
    Author: Reccion, Jeremy
    Date Modified: 2018/04/02
    Description: updates the name of the module
    Parameter(s): Object. Includes:
        *_id: required. string type
        *name: required. string type
    Return: Promise
*/
function updateModule(updateModule){
    var deferred = Q.defer();

    updateModule.name = updateModule.name.toLowerCase();

    //fields array should not be editable when using this function. therefore, delete it from input
    delete updateModule.fields;

    db.modules.find({$or: [
        {_id: mongo.helper.toObjectID(updateModule._id)},
        {name: updateModule.name}
    ]}).toArray(function(err, modules){
        if(err){
            deferred.reject(err);
        }
        else if(modules.length == 0){
            deferred.reject(notFound);
        }
        //vali inputs, no other document have the same name
        else if(modules.length == 1){
            var oldModule = modules[0];
            
            //rename if old & new names are different
            if(oldModule.name != updateModule.name){
                db.bind(oldModule.name);
                db[oldModule.name].rename(updateModule.name, function(err){
                    if(err){
                        deferred.reject(err);
                    }
                    else{
                        update();
                    }
                });
            }
            //go straight to update
            else{
                update();
            }
        }
        //another module document with the same name exists
        else{
            deferred.reject(exists);
        }
    });       

    //updates the document in the 'modules' collection
    function update(){

        //create another object and copy. then delete the '_id' property of the new copy
        var forUpdate = {};
        Object.assign(forUpdate, updateModule);
        delete forUpdate._id;
 
        db.modules.update({_id: mongo.helper.toObjectID(updateModule._id)}, {$set: forUpdate}, function(err){
            if(err){
                deferred.reject(err);
            }
            else{
                deferred.resolve();
            }
        });
    }

    return deferred.promise;
}

/*
    Function name: delete module
    Author: Reccion, Jeremy
    Date Modified: 2018/04/23
    Description: drops the specific collection then remove its document from the 'modules' collection
    Parameter(s):
        *moduleName: string type
    Return: Promise
*/
function deleteModule(moduleName){
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();

    //drop the collection
    db.bind(moduleName);
    db[moduleName].drop(function(err){
        if(err){
            if(err.codeName == 'NamespaceNotFound'){
                deferred.reject(notFound);
            }
            else{
                deferred.reject(err);
            }
        }
        else{
            //remove document from 'modules' collection
            db.modules.remove({name: moduleName}, function(err, writeResult){
                if(err){
                    deferred.reject(err);
                }
                else{
                    //n is used to know if the document was removed
                    if(writeResult.result.n == 0){
                        deferred.reject(notFound);
                    }
                    else{
                        deferred.resolve();
                    }
                }
            });
        }
    });

    return deferred.promise;
}

/*
    Function name: add module field
    Author: Reccion, Jeremy
    Date Modified: 2018/04/20
    Description: insert a new field object to the specific module's fields array
    Parameter(s):
        *moduleName: required. string type
        *fieldObject: required. object type. includes:
            *name: required. string type
            *unique: required. boolean type 
    Return: Promise
*/
function addModuleField(moduleName, fieldObject){
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();

    //create a new objectID to used as query for updates and delete
    fieldObject.id = new ObjectID();

    //the query searches for the module name that do not have the inputted field name
    //this is to avoid pushing same field names on the 'fields' array of the specified module
    //writeResult will determine if the update was successful or not (i.e. writeResult.result.nModified)
    db.modules.update({name: moduleName, fields: {$not: {$elemMatch: {name: fieldObject.name}}}}, {$push: {fields: fieldObject}}, function(err, writeResult){
        if(err){
            deferred.reject(err);
        }
        else{
            //console.log(writeResult.result);
            //check the status of the update, if it failed, it means that there is an existing field name
            if(writeResult.result.nModified == 0){
                deferred.reject(exists);
            }
            else{
                deferred.resolve();
            }
        }
    });

    return deferred.promise;
}

/*
    Function name: update module field
    Author: Reccion, Jeremy
    Date Modified: 2018/04/24
    Description:  update a field object from the specific module's fields array
    Parameter(s):
        *moduleName: required. string type
        *fieldObject: required. object type
    Return: Promise
*/
function updateModuleField(moduleName, fieldObject){
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();

    console.log(fieldObject);

    service.getModuleByName(moduleName).then(function(aModule){        
        //use array.filter() to get the duplicate fields
        var duplicateFields = aModule.fields.filter(function(field){
            //lesson learned: use toString() in id
            return field.id.toString() == fieldObject.id.toString() || field.name == fieldObject.name;
        });
        
        if(duplicateFields.length == 0){
            deferred.reject(notFound);
        }
        //valid inputs
        else if(duplicateFields.length == 1){
            //this is to ensure that the field is inside the specific module (in case of improper input parameters)

            fieldObject.id = new ObjectID(fieldObject.id);

            if(duplicateFields[0].id.toString() == fieldObject.id.toString()){
                db.modules.update({name: moduleName, fields: {$elemMatch: {id: fieldObject.id}}}, {$set: {'fields.$': fieldObject}}, function(err, writeResult){
                    if(err){
                        deferred.reject(err);
                    }
                    else{
                        console.log(writeResult.result);
                        deferred.resolve();
                    }
                });
            }
            //the only element has the same name but is different id, therefore, not inside the module document
            else{
                deferred.reject(notFound);
            }
        }
        else{
            deferred.reject(exists);
        }
    }).catch(function(err){
        deferred.reject(err);
    });

    return deferred.promise;
}

/*
    Function name: delete module field
    Author: Reccion, Jeremy
    Date Modified: 2018/04/24
    Description:  delete a field object from the specific module's fields array
    Parameter(s):
        *moduleName: required. string type
        *fieldID: required. string type
    Return: Promise
*/
function deleteModuleField(moduleName, fieldID){
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();
    
    db.modules.update({name: moduleName}, {$pull: {fields: {id: mongo.helper.toObjectID(fieldID)}}}, function(err, writeResult){
        if(err){
            deferred.reject(err);
        }
        else{
            if(writeResult.result.nModified == 0){
                deferred.reject(notFound);
            }
            else{
                deferred.resolve();
            }
        }
    });

    return deferred.promise;
}

/*
    Function name: get a specific module
    Author: Reccion, Jeremy
    Date Modified: 2018/04/20
    Description: retrieves a specific module by its name
    Parameter(s):
        *moduleName: string type
    Return: Promise
*/
function getModuleByName(moduleName){
    var deferred= Q.defer();
    moduleName = moduleName.toLowerCase();

    db.modules.findOne({name: moduleName}, function(err, aModule){
        if(err){
            deferred.reject(err);
        }
        else if(aModule){
            deferred.resolve(aModule);
        }
        else{
            deferred.reject(notFound);
        }
    });

    return deferred.promise;
}

/*
    Function name: add document
    Author: Reccion, Jeremy
    Date Modified: 2018/04/24
    Description: add a document in a specific collection
    Parameter(s):
        *moduleName: string type
        *newDoc: object type. //fields must be the specific module's 'fields' in 'modules' collection
    Return: Promise
*/
function addModuleDoc(moduleName, newDoc){
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();

    service.findDuplicateDoc(moduleName, newDoc).then(function(){
        db.bind(moduleName);

        db[moduleName].insert(newDoc, function(err){
            if(err){
                deferred.reject(err);
            }
            else{
                deferred.resolve();
            }
        });
    }).catch(function(err){
        deferred.reject(err);
    });

    return deferred.promise;
}

/*
    Function name: get documents of a module
    Author: Reccion, Jeremy
    Date Modified: 2018/04/04
    Description: get all documents of a specific module
    Parameter(s):
        *moduleName: string type
    Return: Promise
*/
function getAllModuleDocs(moduleName){
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();

    db.bind(moduleName);

    db[moduleName].find().toArray(function(err, moduleDocs){
        if(err){
            deferred.reject(err);
        }
        else{
            deferred.resolve(moduleDocs);
        }
    });

    return deferred.promise;
}

/*
    Function name: update a module document
    Author: Reccion, Jeremy
    Date Modified: 2018/04/04
    Description: update a document of a specific module
    Parameter(s):
        *moduleName: string type
        *updateDoc: object type. includes:
            *_id: required. string type
            * //fields must be the specific module's 'fields' in 'modules' collection
    Return: Promise
*/
function updateModuleDoc(moduleName, updateDoc){
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();

    service.findDuplicateDoc(moduleName, updateDoc).then(function(){
        db.bind(moduleName);
        
        //convert '_id' to ObjectID
        updateDoc._id = new ObjectID(updateDoc._id);
        
        db[moduleName].update({_id: updateDoc._id}, {$set: updateDoc}, function(err, writeResult){
            if(err){
                deferred.reject(err);
            }
            else{
                if(writeResult.result.nModified == 0){
                    deferred.reject(notFound);
                }
                else{
                    deferred.resolve();
                }
            }
        });
    }).catch(function(err){
        deferred.reject(err);
    });

    return deferred.promise;
}

/*
    Function name: delete a module document
    Author: Reccion, Jeremy
    Date Modified: 2018/04/04
    Description: delete a document of a specific module
    Parameter(s):
        *moduleName: string type
        *id: string type. //id of the specific document
    Return: Promise
*/
function deleteModuleDoc(moduleName, id){
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();

    db.bind(moduleName);

    db[moduleName].remove({_id: mongo.helper.toObjectID(id)}, function(err, writeResult){
        if(err){
            deferred.reject(err);
        }
        else{
            //n is used to know if the document was removed
            if(writeResult.result.n == 0){
                deferred.reject(notFound);
            }
            else{
                deferred.resolve();
            }
        }
    });

    return deferred.promise;
}

/*
    Function name: find duplicate values
    Author: Reccion, Jeremy
    Date Modified: 2018/04/12
    Description: check for duplicate values according to one or more unique fields
    Parameter(s):
        *moduleName: required. string type
        *moduleDoc: required. object type. includes:
            *_id: optional. string type //if this exists, the document is being updated
    Return: Promise
*/
function findDuplicateDoc(moduleName, moduleDoc){
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();

    //get the fields of the specific module
    service.getModuleByName(moduleName).then(function(aModule){
        //initialize array & object for querying
        var uniqueValues = [];
        var tempObj;

        //push the value of the document when a field is unique
        aModule.fields.forEach(function(field){
            if(field.unique){
                tempObj = {};
                tempObj[field.name] = moduleDoc[field.name];
                uniqueValues.push(tempObj);
            }
        });

        if(uniqueValues.length == 0){
            deferred.resolve();
        }
        else{
            db.bind(moduleName);

            //use $or for checking each field for uniqueness, not their combination
            db[moduleName].findOne({$or: uniqueValues}, function(err, duplicateDoc){
                if(err){
                    deferred.reject(err);
                }
                //a duplicate exists, but needs further checking
                else if(duplicateDoc){
                    //updating a module document
                    if(moduleDoc._id){
                        //different module documents with similar unique values
                        if(moduleDoc._id != duplicateDoc._id){
                            deferred.reject(exists);
                        }
                        //since it is the same document, it is not duplicate
                        else{
                            deferred.resolve();
                        }
                    }
                    //adding new module documennt
                    else{
                        deferred.reject(exists);
                    }
                }
                //does not exist - similar to notFound. but it is not rejected based on design
                else{
                    deferred.resolve();
                }
            });
        }
    }).catch(function(err){
        deferred.reject(err);
    });

    return deferred.promise;
}

/*
    Function name: update fields array
    Author: Reccion, Jeremy
    Date Modified: 2018/04/12
    Description: sets the 'fields' property of the specific module to the inputted array.
    Parameter(s):
        *moduleName: required. string type
        *fieldArray: required. array type. //this array is from angular's UI-SORTABLE
    Return: Promise
*/
function updateFieldArray(moduleName, fieldArray){
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();

    //need to convert each 'id' property to an ObjectID
    for(var i = 0; i < fieldArray.length; i++){
        fieldArray[i].id = new ObjectID(fieldArray[i].id);
    }
    

    db.modules.update({name: moduleName}, {$set: {fields: fieldArray}}, function(err){
        if(err){
            deferred.reject(err);
        }
        else{
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getModuleDocById(moduleName, id) {
    var deferred = Q.defer();
    moduleName = moduleName.toLowerCase();
    db.bind(moduleName);

    db[moduleName].findOne({_id: mongo.helper.toObjectID(id)}, function(err, moduleDoc) {
        if (err) {
            deferred.reject(err);
        } else if (moduleDoc) {
            deferred.resolve(moduleDoc);
        } else {
            deferred.reject(notFound);
        }
    });

    return deferred.promise;
}

module.exports = service;
