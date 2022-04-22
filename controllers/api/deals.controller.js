/*
    Deals Controller
    Author(s): Sanchez, Macku
    Date Created: June 2018
    Description: Middleware for the Deals Service
*/


var express = require('express');
var router = express.Router();
var dealsService = require('services/deals.service');

/*
* START Francis Nash Jasmin 2022/02/23
* 
* Added post request for generation of logs in the backend.
* 
*/
router.post('/generateLogs', function(req, res, next) {
    dealsService.generateLogs(req.body)
    .then(function() {
        res.status(200).send();
    })
    .catch(function(err) {
        res.status(400).send();
    });
});
/* END Francis Nash Jasmin 2022/02/23 */

/* START Francis Nash Jasmin 2022/03/09
* Added post, get, and delete request for uploading, downloading and deleting attachments to the backend, 
* as well as adding file information (filename, description, directory) to the database.
*/
router.post('/attachFile', function(req, res, next) {
    dealsService.attachFile(req, res)
        .then(function(data) {
            res.json(data).status(200).send();
        })
        .catch(function(err) {
            res.json(err).status(400).send();
        });
});

router.post('/addFileToDB', function(req, res, next) {
    dealsService.addFileToDB(req.body)
        .then(function() {
            res.status(200).send();
        })
        .catch(function(err) {
            res.json(err).status(400).send();
        });
});

router.get('/downloadFile/:filename', function(req, res, next) {
    dealsService.downloadFile(req.params.filename)
    .then(function(filePath) {
        res.download(filePath, (err) => {
            if (err) {
              res.status(500).send({
                message: "Could not download the file. " + err,
              });
            }
        });
    })
    .catch(function(err) {
        res.status(400).send();
    });
});

router.delete('/deleteFile/:filename', function(req, res, next) {
    dealsService.deleteFile(req.params.filename)
    .then(function() {
        res.status(200).send();
    }).catch(function(err) {
        res.status(400).send(err);
    });
});
/* END Francis Nash Jasmin 2022/03/18 */

router.post('/addDeal', function(req, res, next) {
    
    //console.log(req.body);

    dealsService.addDeal(req.body, req.session.user.firstName + ' ' + req.session.user.lastName)
    .then(function(deal) {
        res.status(200).send(deal);
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
    // dealsService.uploadFile(req, res).then(function() {
    /*
    * START Francis Nash Jasmin 2022/04/19
    * 
    * Changed dealService function used in importing deals.
    * 
    */
    dealsService.importDeals(req, res).then(function(deals) {
        res.status(200).send(deals);
    }).catch(function(err) {
        res.status(400).send(err);
    });
});
/*  END Francis Nash Jasmin 2022/04/22 */ 

module.exports = router;

