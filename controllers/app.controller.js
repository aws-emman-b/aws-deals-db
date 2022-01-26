var express = require('express');
var router = express.Router();
//var counter = 0;
router.use('/', function (req, res, next) {
    /**
     * this comparison is needed because authorization headers are retained on each browser tab.
     * if you logged out of a tab, other opened tabs still have valid tokens
     * on /api/user/logout, req.session.token is deleted
     */
    //Authorization format is 'Bearer [token]'
    const authToken = req.get('Authorization');
    //console.log('middleware call count: ' + ++counter);
    //check if there is an authorization header
    if(authToken) {
        //compare tokens
        if(authToken.split(' ')[1] !== req.session.token) {
            //send 401 - Unauthorized
            console.log('Unauthorized');
            //return is needed so that next() will not be called
            return res.status(401).send();
        }
    } 
    
    next();
});

router.get('/token', function (req, res) {
    res.send(req.session.token);
});

router.use('/', express.static('app'));
 
module.exports = router;