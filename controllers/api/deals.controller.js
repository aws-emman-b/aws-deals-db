/*
    Deals Controller
    Author(s): Sanchez, Macku
    Date Created: June 2018
    Description: Middleware for the Deals Service
*/


var express = require('express');
var router = express.Router();
var dealsService = require('services/deals.service');



router.post('/addDeal', function(req, res, next) {
    
    //console.log(req.body);

    dealsService.addDeal(req.body, req.session.user.firstName + ' ' + req.session.user.lastName)
    .then(function() {
        res.status(200).send();
    })
    .catch(function(err) {
        res.status(400).send();
    });
});

router.put('/editDeal', function(req, res, next) {
    dealsService.editDeal(req.body, req.session.user.firstName + ' ' + req.session.user.lastName)
    .then(function() {
        res.status(200).send();
    })
    .catch(function(err) {
        res.status(400).send();
    });
});

router.get('/:ID', function(req, res, next) {
    
    var ID = req.params.ID;
    dealsService.getDealById(ID)
    .then(function(deal) {
        res.status(200).send(deal);
    })
    .catch(function(err) {
        res.status(400).send();
    });
});

//jeremy - 06/06/2018
router.delete('/deleteDeal/:ID', function(req, res, next) {
    dealsService.deleteDeal(req.params.ID).then(function() {
        res.status(200).send();
    }).catch(function(err) {
        res.status(400).send(err);
    });
});

router.post('/upload/:name', function(req, res, next) {
    dealsService.uploadFile(req, res).then(function() {
        res.status(200).send();
    }).catch(function(err) {
        res.status(400).send(err);
    });
});

module.exports = router;

