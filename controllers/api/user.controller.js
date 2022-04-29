var express = require('express');
var router = express.Router();
var userService = require('services/user.service');

router.post('/login', function(req, res, next) {
    userService.authenticate(req.body.email, req.body.password).then(function(token) {
        if (token) {
            req.session.token = token.token;
            req.session.user = token.user;

            res.status(200).send(token);
        }
    }).catch(function(err) {
        console.log("Error is: "+err);
        if(err === false){
            res.status(400).send(err);
        } else {
            res.status(400).send({AUTH_FAIL: true});
        }
    });
});

router.get('/current', function(req, res, next) {
    if(req.session.user !== undefined) {
        res.status(200).send(req.session.user);
    } else {
        res.status(400).send({SESSION_EXPIRED: true});
    }
});

router.get('/logout', function(req, res, next){
    delete req.session.token
    delete req.session.user;

    res.status(200).send();
});

//glenn
router.post('/addUser', function(req, res, next) {
    userService.insert(req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
});

router.put('/:_id', function(req, res, next) {
    var userId = req.params._id
 
    userService.update(userId, req.body)
        .then(function () {
            req.session.user.firstTimeLoggedIn = req.body.firstTimeLoggedIn;
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
});

/*
* START Francis Nash Jasmin 2022/04/28
* Added reset password function route to user controller.
*/
router.post('/resetPassword', function(req, res) {
    userService.resetPass(req.body.email).then(function() {
        res.status(200).send();
    }).catch(function(err) {
        res.status(400).send(err);
    });
});
/*  END Francis Nash Jasmin 2022/04/29 */ 

module.exports = router;