var express = require('express');
var router = express.Router();
var ModulesService = require('services/modules.service');
var logsService = require('services/logs.service');

//declare routes that are to be called from the client (angular)
router.post('/addModule', addModule);
router.get('/getAllModules', getAllModules);
router.put('/updateModule', updateModule);
router.delete('/deleteModule/:id/:name', deleteModule);

router.put('/addModuleField', addModuleField);
router.put('/updateModuleField', updateModuleField);
router.put('/deleteModuleField/:name/:id', deleteModuleField);


router.get('/getModuleByName/:name', getModuleByName);
router.post('/addModuleDoc', addModuleDoc);
router.get('/getAllModuleDocs/:name', getAllModuleDocs);
router.get('/getModuleDocById/:name/:id', getModuleDocById);
router.put('/updateModuleDoc', updateModuleDoc);
router.delete('/deleteModuleDoc/:name/:id', deleteModuleDoc);

router.put('/updateFieldArray', updateFieldArray);

function addModule(req, res){
    ModulesService.addModule(req.body).then(function(){
        res.status(200).send();
    }).catch(function(err){
        res.status(400).send(err);
    });
}

function getAllModules(req, res){
    ModulesService.getAllModules().then(function(modules){
        res.status(200).send(modules);
    }).catch(function(err){
        res.status(400).send(err);
    });
}

function updateModule(req, res){
    ModulesService.updateModule(req.body).then(function(){
        res.status(200).send();
    }).catch(function(err){
        res.status(400).send(err); 
    });
}

function deleteModule(req, res){
    ModulesService.deleteModule(req.params.name).then(function(){
        res.status(200).send();
    }).catch(function(err){
        res.status(400).send(err);
    });
}

function addModuleField(req, res){
    ModulesService.addModuleField(req.body.moduleName, req.body.field).then(function(){
        logsService.moduleLogs(req.session.user, req.body.moduleName, req.body.field, "add module field")
            .then(function(){
                res.status(200).send();
            })
            .catch(function(){
                res.status(400).send();
            });
    }).catch(function(err){
        res.status(400).send(err);
    });
}

function updateModuleField(req, res){
    ModulesService.updateModuleField(req.body.moduleName, req.body.field).then(function(){
        logsService.moduleLogs(req.session.user, req.body.moduleName, req.body.field, "update module field")
            .then(function(){
                res.status(200).send();
            })
            .catch(function(){
                res.status(400).send();
            });
    }).catch(function(err){
        res.status(400).send(err);
    });
}

function deleteModuleField(req, res){
    logsService.moduleLogs(req.session.user, req.params.name, req.params.id, "delete module field")
        .then(function(){
            ModulesService.deleteModuleField(req.params.name, req.params.id).then(function(){
                res.status(200).send();
            }).catch(function(err){
                res.status(400).send(err);
            });
        })
        .catch(function(){
            res.status(400).send();
        });
}

function getModuleByName(req, res){
    ModulesService.getModuleByName(req.params.name).then(function(aModule){
        res.status(200).send(aModule);
    }).catch(function(err){
        res.status(400).send(err);
    });
}

function addModuleDoc(req, res){
    ModulesService.addModuleDoc(req.body.moduleName, req.body.moduleDoc).then(function(){
        logsService.moduleLogs(req.session.user, req.body.moduleName, req.body.moduleDoc, "add module document")
        .then(function(){
            res.status(200).send();
        })
        .catch(function(){
            res.status(400).send();
        });
    }).catch(function(err){
            console.log(err);
            res.status(400).send(err);
    });
}

function getAllModuleDocs(req, res){
    ModulesService.getAllModuleDocs(req.params.name).then(function(moduleDocs){
        res.status(200).send(moduleDocs);
    }).catch(function(err){
        res.status(400).send(err);
    });
}

function updateModuleDoc(req, res){
    ModulesService.updateModuleDoc(req.body.moduleName, req.body.moduleDoc).then(function(){
        logsService.moduleLogs(req.session.user, req.body.moduleName, req.body.moduleDoc, "update module document")
        .then(function(){
            res.status(200).send();
        })
        .catch(function(){
            res.status(400).send();
        });
    }).catch(function(err){
        res.status(400).send(err);
    });
}

function deleteModuleDoc(req, res){
    //console.log(req.session.user);
    logsService.moduleLogs(req.session.user, req.params.name, req.params.id, "delete module document")
        .then(function(){
            ModulesService.deleteModuleDoc(req.params.name, req.params.id).then(function(){
                res.status(200).send();
            }).catch(function(err){
                res.status(400).send(err);
            });
        })
        .catch(function(){
            res.status(400).send();
        });
}

function updateFieldArray(req, res){
    ModulesService.updateFieldArray(req.body.moduleName, req.body.fieldArray).then(function(){
        res.status(200).send();
    }).catch(function(err){
        res.status(400).send(err);
    });
}

function getModuleDocById(req, res){
    ModulesService.getModuleDocById(req.params.name, req.params.id).then(function(moduleDoc){
        //console.log(moduleDoc);
        res.status(200).send(moduleDoc);
    }).catch(function(err){
        res.status(400).send(err);
    });
}

module.exports = router;

