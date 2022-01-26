var express = require('express');
var router = express.Router();
var clientService = require('services/client.service');

//routes
router.post('/addClient', addClient);
router.get('/getAllClients', getAllClients);
router.put('/updateClient/:_id', updateClient);

/*router.post('/addClient', function(req, res, next) {
    
    //console.log(req.body);

    clientService.addClient(req.body)
    .then(function(token) {
        res.status(200);
    })
    .catch(function(err) {
        res.status(400);
    });
});*/

module.exports = router;

function addClient(req, res) {
	clientService.addClient(req.body)
	    .then(function(token) {
	        res.status(200);
	    })
	    .catch(function(err) {
	        res.status(400).send(err);
	    });
}

function getAllClients(req, res) {
	clientService.getAllClients()
        .then(function (client) {
            if (client) {
                res.send(client);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function updateClient(req, res) {
    var clientId = req.params._id
 
    clientService.updateClient(clientId, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}