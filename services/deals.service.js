/*
    Deals Service
    Author(s): Sanchez, Macku
                Reccion, Jeremy
    Date Created: June 2018
    Date Modified: June 07, 2018
    Description: Service for the Deals Page
    Functions:
        addDeal();
        editDeal();
        getDealById();
        deleteDeal();
*/

var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
var fs = require('fs');
var emailService = require('services/email.service');
db.bind('deals');

var fs = require('fs');
var multer = require('multer');
var path = require('path');

var xlsx = require('xlsx');

var path = require("path");
var { Console } = require('console');
var moment = require('moment');

var service = {};

service.addDeal = addDeal;
service.editDeal = editDeal;
service.getDealById = getDealById;
service.deleteDeal = deleteDeal;
service.uploadFile = uploadFile;
service.generateLogs = generateLogs;
service.attachFile = attachFile;
service.addFileToDB = addFileToDB;
service.downloadFile = downloadFile;
service.deleteFile = deleteFile;

service.importDeals = importDeals;

module.exports = service;

/*
* START Francis Nash Jasmin 2022/02/23
* 
* Added generation of logs in the backend (for the use of import only).
* 
*/
function generateLogs(dealIDs) {
    var deferred = Q.defer();
    var date = moment(new Date()).format('YYYY-MM-DD_HH-mm-ss');
    var dir = './logs';
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    const logger = new Console({
        stdout: fs.createWriteStream(`${dir}/Log_Import_${date}.txt`)
    });
    if(dealIDs.importedDeals.length !== 0) {
        let importedIDs = [...new Set(dealIDs.importedDeals)];
        importedIDs.forEach(dealID => {
            logger.log(`Deal ID ${dealID} has been added.`);
        })
    }
    if(dealIDs.duplicateDeals.length !== 0) {
        let duplicateIDs = [...new Set(dealIDs.duplicateDeals)];
        duplicateIDs.forEach(dealID => {
            logger.log(`Deal ID ${dealID} already exists.`);
        })
    }

    deferred.resolve();
    return deferred.promise;
}
/* END Francis Nash Jasmin 2022/02/23 */

function addDeal(deal, user) {
    var deferred = Q.defer();

    var ID = "DL-0000";
    var IDnumber;
    var previousID;

    db.deals.find({}).toArray(function (err, deals) {
        if (err) deferred.reject(err);

        /*
        * START Francis Nash Jasmin 2022/02/07
        * 
        * Added checking of duplicate IDs when importing an excel file.
        * 
        */
        //use .length to get number of documents
        if ((deals.length > 0 && deals['ID'] === undefined)) {
            previousID = deals[deals.length - 1].ID;
            IDnumber = previousID.slice(3, 7);
            IDnumber++;
            if (IDnumber <= 9) {
                // 0-9
                ID = previousID.slice(0, 6) + IDnumber;
            } else if (IDnumber > 9 && IDnumber <= 99) {
                // 10-99
                ID = previousID.slice(0, 5) + IDnumber;
            } else if (IDnumber > 99 && IDnumber <= 999) {
                // 100-999
                ID = previousID.slice(0, 4) + IDnumber;
            } else {
                // 1000 above
                ID = previousID.slice(0, 3) + IDnumber;
            }
            saveToDB();

        } else {
            saveToDB();
        }
        /*  END Francis Nash Jasmin 2022/02/09 */ 
    });

    function saveToDB() {

        deal.ID = ID;

        //add change history array here
        deal['Change History'] = [];
        deal['attachments'] = [];
        deal['Change History'].push({
            date: getCurrentDate(),
            user: user,
            level: deal.profile['Level'],
            content: 'Level was changed to ' + deal.profile['Level']
        });

        //set closedDate only if the level is 1
        if (deal.profile['Level'] === '1') {
            deal.closedDate = getCurrentDate();
        }

        db.deals.insert(
            deal,
            function (err, doc) {
                if (err) deferred.reject(err);

                deferred.resolve(deal);
            });

    }

    return deferred.promise;
}

/* START Francis Nash Jasmin 2022/03/09
* Added post, get, and delete request for uploading, downloading and deleting attachments to the backend, 
* as well as adding file information (filename, description, directory) to the database.
*/
function attachFile(req, res) {
    var deferred = Q.defer();

    // Create attachments folder if it does not exist yet.
    var dir = './attachments';
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    // Stores the uploaded file in the attachments folder of the server
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            var folder = file.originalname.split(' ')[0].replace(/[\[\]']+/g,'');
            if(!fs.existsSync(`${dir}/${folder}`)){
                fs.mkdirSync(`${dir}/${folder}`);
            }
            cb(null, `./attachments/${folder}`)
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    });
    
    var upload = multer({
        storage: storage
    }).single('file');

    upload(req, res, function(err) {
        if(err) {
            return deferred.reject({ error_code: 1, err_desc: err });
        }
    })
    
    deferred.resolve({ error_code: 0, err_desc: null });
    return deferred.promise;
}

// Saves the filename, description, and directory in the mongo database.
function addFileToDB(fileInfo) {
    var deferred = Q.defer();
    var deal = fileInfo.deal;
    var attachmentsArr = [];
    fileInfo.files.map(file => {
        attachmentsArr.push({
            fileName: file.file,
            description: file.description,
            directory: `./attachments/${deal.ID}/${file.file}`
        })
    });

    db.deals.findOne({ _id: mongo.helper.toObjectID(deal._id) }, function (err, aDeal) {
        if (err) {
            deferred.reject(err);
        } else if (aDeal) {
            if(aDeal['attachments'] === undefined) {
                aDeal['attachments'] = [];
            }
            
            aDeal['attachments'] = aDeal['attachments'].concat(attachmentsArr);

            db.deals.update({ ID: deal.ID }, { $set: { attachments: aDeal['attachments'] } }, function (err) {
                if (err) {
                    deferred.reject(err);
                }
                deferred.resolve();
            });
        } else {
            deferred.reject({ notFound: true });
        }
    });

    deferred.resolve();
    return deferred.promise;
}

// Gets the file path where the file will be downloaded from.
function downloadFile(filename) {
    var deferred = Q.defer();

    var ID = filename.split(' ')[0].replace(/[\[\]']+/g,'');
    var selectedDeal = {};
    var filePath = '';


    db.deals.findOne({ ID: ID }, function (err, deal) {
        if (err) deferred.reject(err);

        if (deal) {
            selectedDeal = deal;
        } else {
            deferred.reject();
        }

        filePath = selectedDeal.attachments.find(attach => attach.fileName === filename).directory;
        deferred.resolve(filePath);
    });
   
    return deferred.promise;
}

function deleteFile(filename) {
    var deferred = Q.defer();
    var ID = filename.split(' ')[0].replace(/[\[\]']+/g,'');
    var selectedDeal = {};

    db.deals.findOne({ ID: ID }, function (err, deal) {
        if (err) deferred.reject(err);

        if (deal) {
            selectedDeal = deal;
        } else {
            deferred.reject();
        }

        // Remove the file from the attachments folder/ directory first
        let filePath = selectedDeal.attachments.find(attach => attach.fileName === filename).directory;
        fs.stat(filePath, function(err) {
            if(err) {
                console.log(err)
                return deferred.reject(err);
            }

            fs.unlinkSync(filePath, function(err) {
                if(err) {
                    return deferred.reject(err);
                }
                deferred.resolve();
            });
        });

        // Get attachments field
        // Remove the entry with that specific file name
        // Replace the old array with the new attachment array
        deal['attachments'] = deal['attachments'].filter(attach => attach.fileName !== filename);
        delete deal._id;

        // Use update method
        db.deals.update({ ID: deal.ID }, { $set: deal }, function (err) {
            if (err) {
                deferred.reject(err);
            }
            deferred.resolve();
        });
    });

    return deferred.promise;
}
/*  END Francis Nash Jasmin 2022/03/18 */ 

function editDeal(deal, user) {
    var deferred = Q.defer();

    //get the old level for change history
    db.deals.findOne({ _id: mongo.helper.toObjectID(deal._id) }, { 'profile.Level': 1 }, function (err, aDeal) {
        if (err) {
            console.log(err)
            deferred.reject(err);
        } else if (aDeal) {
            //compare current level to the new level. 
            //if different, push to change history. else, continue
            if (aDeal.profile['Level'] !== deal.profile['Level']) {
                //deal['Change History'] array was already created during addDeal()
                deal['Change History'].push({
                    date: getCurrentDate(),
                    user: user,
                    level: deal.profile['Level'],
                    content: 'Level was changed to ' + deal.profile['Level']
                });
            }

            delete deal._id;

            if (deal.profile['Level'] === '1') {
                deal.closedDate = getCurrentDate();
            }

            db.deals.update({ ID: deal.ID }, { $set: deal }, function (err) {
                if (err) {
                    deferred.reject(err);
                }
                deferred.resolve();
            });
        } else {
            deferred.reject({ notFound: true });
        }
    });

    return deferred.promise;
}


function getDealById(ID) {
    var deferred = Q.defer();

    db.deals.findOne({ ID: ID }, function (err, deal) {
        if (err) deferred.reject(err);

        //console.log(deal)
        if (deal) {
            deferred.resolve(deal);
        } else {
            deferred.reject();
        }

    });

    return deferred.promise;
}

//jeremy - 06/06/2018
//ID is the deal's ID (e.g. DL-0000) not _id
function deleteDeal(ID) {
    var deferred = Q.defer();

    //set the deleted flag to true
    db.deals.update({ ID: ID }, { $set: { deleted: true } }, function (err, writeResult) {
        if (err) {
            deferred.reject(err);
        }
        else {
            //n is used to know if the document was removed
            if (writeResult.result.nModified === 0) {
                deferred.reject({ notFound: true });
            }
            else {
                deferred.resolve();
            }
        }
    });

    return deferred.promise;
}

//jeremy 2018-07-02
function uploadFile(req, res) {
    var deferred = Q.defer();
    var storage = multer.diskStorage({
        destination: './uploads',
        filename: function (req, file, cb) {
            return cb(null, file.originalname);
        },
    });
    var upload = multer({
        storage: storage,
        fileFilter: function (req, file, cb) {
            if (path.extname(file.originalname) !== '.xls' &&
                path.extname(file.originalname) !== '.xlsx' &&
                path.extname(file.originalname) !== '.ods' && 
                //for testing
                path.extname(file.originalname) !== '.txt') {
                return cb(new Error('Wrong file extension'));
            }

            cb(null, true);
        }
    }).single(req.params.name);

    var spreadsheet, rows, j, tempObject = {};
    var numberFields = ['Resource Size (MM)', 'Resource Size (FTE)', 'Revenue', 'CM'];

    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            deferred.reject(err);
        } else if (!req.file) {
            console.log('no file uploaded');
            deferred.reject({ NO_FILE: true });
        } else {
            //console.log(req.file);
            /* fs.readFile('./uploads/' + req.file.originalname, function (err, data) {
                if (err) {
                    console.log('error', err);
                    deferred.reject(err);
                } else {
                    //console log produces beeping sounds when uploading excel files and printing them on console
                    console.log(data.toString().split('\n'));
                    deferred.resolve();
                }
            }); */
            spreadsheet = xlsx.readFile('./uploads/' + req.file.originalname);
            /**
             * set specific conditions here
             * this assumes that the excel template is correct
             */

            //0 is the first (essential) and B1 is the value for Document Number
            //store it to 'ID' property
            /* if(spreadsheet['Sheets'][spreadsheet['SheetNames'][0]]['B1'] !== undefined) {
                tempObject['ID'] = spreadsheet['Sheets'][spreadsheet['SheetNames'][0]]['B1'].w;
            } */

            //get the contents of each sheet (each category)
            for(var i = 0; i < spreadsheet['SheetNames'].length; i++) {
                //initialize variables
                //get the keys which represents the cells
                rows = Object.keys(spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]);
                j = 1;
                tempObject[spreadsheet['SheetNames'][i]] = {};
                do {
                    //store cell's value if not undefined
                    if(spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['B' + j] !== undefined) {
                        /**
                            ['A' + j] & ['B' + j] will result to the cell then the 'w' property is the value (formatted text) of that cell
                            ['A' + j].w is the field from the template, ['B' + j].w is the value inputted by the user
                            example of object structure
                            spreadsheet['SheetNames'][i] = 'profile'
                            spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['A' + j].w = 'Country'
                            spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['B' + j].w = 'PH'
                            the difference between v & w is that the v is the true value (if number, etc) whereas w is just the formatted text
                            this is important since Resource Size are in numbers, Level & Step are strings, and Dates are in strings
                         */
                        
                        console.log(spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['B' + j]);
                        tempObject[spreadsheet['SheetNames'][i]][spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['A' + j].w] = 
                        (numberFields.indexOf(spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['A' + j].w) !== -1) ? 
                        spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['B' + j].v : spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['B' + j].w;
                    }
                    //increment j
                    j++;
                    //!ref is the last key of each sheet object. this tells the range of cells e.g. 'A1:B4'
                }while(rows[j] !== '!ref');
            }

            console.log(tempObject);

            //delete essential.Document Number here hmm
            //delete tempObject['essential']['Document Number'];

            //console.log(tempObject);
        
            deferred.resolve();
        }
    });

    return deferred.promise;
}

//jeremy 2018-07-05
function getCurrentDate() {
    const currentDate = new Date();
    //+ 1 since month in javascript starts with 0
    var currentMonth = currentDate.getMonth() + 1, currentDay = currentDate.getDate();
    //add leading zeroes for months and days 1 to 9
    currentMonth = (currentMonth < 10) ? '0' + currentMonth : currentMonth;
    currentDay = (currentDay < 10) ? '0' + currentDay : currentDay;

    //format to yyyy/MM/dd
    return currentDate.getFullYear() + '/' + currentMonth + '/' + currentDay;
}

/*
* START Francis Nash Jasmin 2022/04/19
* 
* Moved excel file reading and import preprocessing functionality to the backend.
* 
*/
// Contains the deal's step, levels, JP and EN equivalent.
var steps_levels = [
    { "Step": "1", "Level": "1.1", "JA": "契約済", "EN": "Contracted" },
    { "Step": "1", "Level": "1.2", "JA": "発注済", "EN": "Order Approved" },
    { "Step": "2", "Level": "2.1", "JA": "発注待ち", "EN": "Waiting for Client Order" },
    { "Step": "2", "Level": "2.2", "JA": "見積り提出済", "EN": "Estimate Submitted" },
    { "Step": "2", "Level": "2.3", "JA": "見積り中", "EN": "Under Estimation" },
    { "Step": "3", "Level": "3.1", "JA": "概算見積り提出済", "EN": "Rough Estimate Submitted" },
    { "Step": "3", "Level": "3.2", "JA": "概算見積り提出予定", "EN": "Rough Estimate Submission Plan" },
    { "Step": "3", "Level": "3.3", "JA": "提案済", "EN": "Plan Proposed" },
    { "Step": "3", "Level": "3.4", "JA": "提案予定", "EN": "Plan Proposal" },
    { "Step": "4", "Level": "4.1", "JA": "概要提案済", "EN": "Planned Overview Proposed" },
    { "Step": "4", "Level": "4.2", "JA": "概要提案予定", "EN": "Planned Overview Proposal" },
    { "Step": "5", "Level": "5.1", "JA": "訪問済", "EN": "Client Visited" },
    { "Step": "5", "Level": "5.2", "JA": "訪問予定", "EN": "Client Visit Scheduled" },
    { "Step": "9", "Level": "9.1", "JA": "失注", "EN": "Lost Order" }
]

// Makes the string into sentence case.
function capitalize(s) { 
    return s.replace(/\w\S*/g, function(t) { return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase(); }); 
}

// Converts date to yyyy/mm/dd format
function convertDateToString(date) {
    return moment(new Date(Math.round((date - 25569) * 86400 * 1000))).format('YYYY/MM/DD');
}

// Get the equivalent/ code for the step, as step is imported as kanji.
function getStep(stepJA) {
    let steps = steps_levels;
    var index = -1;
    for(var i = 0; i < steps.length; i++) {
        if(steps[i].JA.includes(stepJA.trim())) {
            index = i;
            break;
        }
    }
    return steps[index].Level;
}


function preprocessDeals(dealArray) {
    var processedDeals = [];
    dealArray.forEach(dealObj => {
        let deal = {
            essential: {},
            profile: {},
            process: {},
            distribution: {
                'Direct to Client': { res: {}, rev: {}, cm: {} },
                total: {}
            },
            status: {},
            content: {}
        };

        deal['ID'] = dealObj.DocNumber;
        deal.essential['Deal Name'] = dealObj.Subject;
        deal.essential['Due Date'] = convertDateToString(dealObj.DueDate);
        
        deal.profile['Country'] = dealObj.BU;
        deal.profile['Division'] = dealObj.Division;
        deal.profile['Client'] = dealObj.Customer;
        deal.profile['Client Resp'] = dealObj.Customer;
        deal.profile['Level'] = dealObj.Level.toString();
        deal.profile['Step'] = getStep(dealObj.Step);
        deal.profile['Step Description'] = dealObj.Step;
        deal.profile['Type'] = dealObj.ServiceType === 'AG' ? dealObj.ServiceType : capitalize(dealObj.ServiceType);
        deal.profile['Duration (Start)'] = convertDateToString(dealObj.StartDate);
        deal.profile['Duration (End)'] = convertDateToString(dealObj.EndDate);
        deal.profile['AWS Resp (Sales) person'] = dealObj.dspRespSales;
        deal.profile['AWS Resp (Sales) BU'] = dealObj.BU;
        deal.profile['AWS Resp (Dev) person'] = dealObj.dspRespDev;
        deal.profile['AWS Resp (Dev) BU'] = dealObj.BUDev;
        deal.profile['SD'] = dealObj.BUDev;

        // get the fields that starts with Month
        let filteredMonths = Object.keys(dealObj)
            .filter(key => key.startsWith('Month'))
            .reduce((obj, key) => {
                obj[key] = dealObj[key];
                return obj;
            }, {});
        
        // Used to create the values for the distribution field
        let resJP = getKeys(filteredMonths, dealObj, 'res', true)
        let resGD = getKeys(filteredMonths, dealObj, 'res', false)
        let revJP = getKeys(filteredMonths, dealObj, 'rev', true)
        let revGD = getKeys(filteredMonths, dealObj, 'rev', false)
        let cm = getKeys(filteredMonths, dealObj, 'cm', false)

        // add distribution here, key name should be yyyy/mm only
        deal.distribution['Direct to Client'].res['jp'] = resJP;
        deal.distribution['Direct to Client'].res['gd'] = resGD;
        deal.distribution['Direct to Client'].rev['jp'] = revJP;
        deal.distribution['Direct to Client'].rev['gd'] = revGD;
        deal.distribution['Direct to Client'].cm = cm;

        /*
        * START Francis Nash Jasmin 2022/04/26
        * Added code for adding total values for cm, rev and res to deal profile when importing.
        */
        var resSum = 0;
        var revSum = 0;
        var cmSum = 0;

        //compute total resource
        if (Object.values(resJP).length > 0 || Object.values(resGD).length > 0) {
            resSum = Object.values(resJP).concat(Object.values(resGD)).reduce(function (total, value) {
                return (value !== undefined && value !== null) ? total + value : total + 0;
            });
        }

        //compute total revenue
        if (Object.values(revJP).length > 0 || Object.values(revGD).length > 0) {
            revSum = Object.values(revJP).concat(Object.values(revGD)).reduce(function (total, value) {
                return (value !== undefined && value !== null) ? total + value : total + 0;
            });
        }

        //compute total cm
        if (Object.values(cm).length > 0) {
            cmSum = Object.values(cm).reduce(function (total, value) {
                return (value !== undefined && value !== null) ? total + value : total + 0;
            });
        }

        var tempPercent = (cmSum / revSum) * 100;

        deal.profile['Resource Size (MM)'] = resSum;
        deal.profile['Resource Size (FTE)'] = tempPercent;
        deal.profile['Revenue'] = revSum;
        deal.profile['CM'] = cmSum;
        /* END Francis Nash Jasmin 2022/04/29 */

        processedDeals.push(deal);
    })
    return processedDeals;
}

// Get the values for res, rev, and cm under the distribution field
// Sample structure in database:
// distribution -> Direct to Client -> res -> jp -> 2022/04: "12"
// type is res, rev, or cm
// isJP tells whether the values fall under jp or gd
function getKeys(filteredMonths, deal, type, isJP) {
    // check if column names have the same ending (_1, _2, _3...), same ending means they fall on the same month
    // remove J first if isJP is true, e.g. MM_6J to MM_6
    // make value of month the key
    let values = Object.keys(deal)
        .filter(key => 
            ((type === 'res' && isJP) && (key.startsWith('MM') && key.endsWith('J'))) ||
            ((type === 'res' && !isJP) && (key.startsWith('MM') && !key.endsWith('J'))) ||
            ((type === 'rev' && isJP) && (key.startsWith('Yen') && key.endsWith('J'))) ||
            ((type === 'rev' && !isJP) && (key.startsWith('Yen') && !key.endsWith('J'))) ||
            ((type === 'cm') && (key.startsWith('CM')))
        )
        .reduce((obj, key) => {
            if(isJP) {
                obj[key.slice(0, -1).split('_')[1]] = deal[key];
            } else {
                obj[key.split('_')[1]] = deal[key];
            }
            
            return obj;
        }, {});

    let keys = {};
    Object.keys(filteredMonths)
        .filter(month => {
            return Object.keys(values).includes(month.split('_')[1])
        })
        .forEach((month, index) => {
            let value = Object.keys(values)[index];
            if(value !== undefined) {
                if(month.split('_')[1] === value){
                    // Store this in an object
                    keys[convertDateToString(filteredMonths[month]).slice(0, 7)] = parseFloat(values[value])
                }
            }
            if (keys[convertDateToString(filteredMonths[month]).slice(0, 7)] === '') {
                delete keys[convertDateToString(filteredMonths[month]).slice(0, 7)];
            }
            
        })
    return keys;
}

/*
* START Francis Nash Jasmin 2022/05/04
* Added code for preprocessing excel file contents that have multiple sheets.
*/
// This preprocess method is used for an excel file with multiple sheets.
function preprocessDealsMultiSheets(dealArray, intraMMData, intraRevData, intraCMData, directMMData, directRevData, directCMData) {
    var processedDeals = [];
    dealArray.forEach(dealObj => {
        if(dealObj['No'].startsWith('DL')) {
            let deal = {
                essential: {},
                profile: {},
                process: {},
                distribution: {
                    'Direct to Client': { res: {}, rev: {}, cm: {} },
                    'Intra-Company': { res: {}, rev: {}, cm: {} },
                    total: {}
                },
                status: {},
                content: {}
            };
    
            // ESSENTIAL FIELDS
            deal['ID'] = dealObj['No'];
            deal.essential['Deal Name'] = dealObj['Deal name'];
            deal.essential['Due Date'] = moment(new Date(dealObj['Due Date'])).format('YYYY/MM/DD');
            deal.essential['Assignee'] = dealObj['Assignees'].split(',').pop()
            
            // PROFILE FIELDS
            deal.profile['Country'] = dealObj['Country'];
            deal.profile['Division'] = dealObj['Div'];
            deal.profile['Client'] = dealObj['Client'];
            deal.profile['Client Resp'] = dealObj['Client Resp'];
            deal.profile['Service'] = dealObj['Service'];
            deal.profile['Level'] = dealObj['Level'].toString();
            deal.profile['Step'] = getStep(dealObj['Step']);
            deal.profile['Step Description'] = dealObj['Step'];
            deal.profile['Type'] = dealObj['Type'] === 'AG' ? dealObj['Type'] : capitalize(dealObj['Type']);
            deal.profile['Confidence'] = dealObj['Confidence']; 
            deal.profile['Resource Size (MM)'] = parseFloat(dealObj['MM']);
            deal.profile['Resource Size (FTE)'] = parseFloat(dealObj['FTE']);
            deal.profile['Revenue'] = parseFloat(dealObj['Budget'].replace(/¥|,/g, ""));
            deal.profile['CM'] = parseFloat(dealObj['CM Yen']);
            deal.profile['Duration (Start)'] = moment(new Date(dealObj['Start'])).format('YYYY/MM/DD');
            deal.profile['Duration (End)'] = moment(new Date(dealObj['End'])).format('YYYY/MM/DD');
            deal.profile['AWS Resp (Sales) person'] = dealObj['AWS Sales'];
            deal.profile['AWS Resp (Dev) person'] = dealObj['AWS Dev'];
            deal.profile['AWS Resp (Dev) BU'] = dealObj['BU Dev'];
            deal.profile['SD'] = dealObj['BU Dev'];
            deal.profile['Key Assignment'] = dealObj['Key Assign'];
            if(dealObj['Remark'] !== undefined) {
                deal.profile['Remark'] = dealObj['Remark'];
            } 
    
            // PROCESS FIELDS
            deal.process['SRB No'] = dealObj['SRB No'];
            deal.process['SOW Scheme'] = dealObj['SOW Scheme'] === 'Direct to client' ? 'Direct to Customer' : 'Transfer Pricing to UBICOM';
            deal.process['SOW No'] = dealObj['SOW No'];
            deal.process['SRB Date'] = moment(new Date(dealObj['SRB Date'])).format('YYYY/MM/DD');
            deal.process['SOW Date'] = moment(new Date(dealObj['SOW Date'])).format('YYYY/MM/DD');
            deal.process['SRB Status'] = dealObj['SRB Status'];
            deal.process['SOW Status'] = dealObj['SOW Status'];

            // STATUS FIELDS
            deal.status['Dependency'] = dealObj['Dependency'];
            deal.status['Status'] = dealObj['Status'];
            deal.status['Action'] = dealObj['Action'];
            deal.status['Step to Close'] = dealObj['Step to Close'];

            // DISTRIBUTION FIELDS
            deal.distribution['Intra-Company'].res['jp'] = getDistData(intraMMData, dealObj, true);
            deal.distribution['Intra-Company'].res['gd'] = getDistData(intraMMData, dealObj, false);
            deal.distribution['Intra-Company'].rev['jp'] = getDistData(intraRevData, dealObj, true);
            deal.distribution['Intra-Company'].rev['gd'] = getDistData(intraRevData, dealObj, false);
            deal.distribution['Intra-Company'].cm = getDistData(intraCMData, dealObj, true);

            deal.distribution['Direct to Client'].res['jp'] = getDistData(directMMData, dealObj, true);
            deal.distribution['Direct to Client'].res['gd'] = getDistData(directMMData, dealObj, false);
            deal.distribution['Direct to Client'].rev['jp'] = getDistData(directRevData, dealObj, true);
            deal.distribution['Direct to Client'].rev['gd'] = getDistData(directRevData, dealObj, false);
            deal.distribution['Direct to Client'].cm = getDistData(directCMData, dealObj, true);

            processedDeals.push(deal);
        }
    })
    return processedDeals;
}

// Used to get distribution data (resources, revenue, cm) for excel file with multiple sheets.
// the keys of distData json look like this: Mo#1, Mo#2, Mo#3... and Mo#1_1, Mo#2_1, Mo#3_1...
function getDistData(distData, dealObj, isJP) {
    // Used to store dist values (e.g. {2022/04: 10, 2022/05: 12})
    let keys = {};

    distData.map((deal) => {
        // Check if the json data has the same deal number and name.
        if((dealObj['No'] === deal['No']) && (dealObj['Deal name'].includes(deal['Deal name']))) {
            // Starting date for dist values is based on the 'Start' column
            let start = moment(new Date(deal['Start']));
            let end = moment(new Date(deal['Start'])).add(11, 'month');
            
            // Generate the 12 months from the start to end.
            const months = [];
            while (end.diff(start, 'months') >= 0) {
                months.push(start.format('YYYY/MM'));
                start.add(1, 'month');
            }

            // Keys that do not end in _1 indicate JP values, otherwise they are GD.
            let values = Object.keys(deal)
                .filter(key => {
                    if(isJP) {
                        return key.startsWith('Mo#') && !key.endsWith('_1');
                    } else {
                        return key.startsWith('Mo#') && key.endsWith('_1');
                    }
                })
                .reduce((obj, key) => {
                    obj[key] = deal[key];
                    return obj;
                }, {});
            
            // Populate the keys with the values variable, which is the data from distData.
            Object.keys(months)
                .forEach((month, index) => {
                    let value = Object.keys(values)[index];

                    if(value !== undefined) {
                        // Currency symbols and commas are removed from the value.
                        if((parseInt(month) + 1) == value.split('#')[1]) {
                            keys[months[month]] = parseFloat(values[value].replace(/¥|,/g, ""))
                        }
                        if(parseInt(month) + 1 == value.split('#')[1].split('_')[0]) {
                            keys[months[month]] = parseFloat(values[value].replace(/¥|,/g, ""))
                        }
                    }
                })
        }
        
    })
    return keys;
}
/* END Francis Nash Jasmin 2022/05/06 */

function importDeals(req, res) {
    var deferred = Q.defer();
    var dir = './uploads';
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    var storage = multer.diskStorage({
        destination: dir,
        filename: function (req, file, cb) {
            return cb(null, file.originalname);
        },
    });
    var upload = multer({
        storage: storage,
        fileFilter: function (req, file, cb) {
            if (path.extname(file.originalname) !== '.xls' && path.extname(file.originalname) !== '.xlsx' && path.extname(file.originalname) !== '.ods' && path.extname(file.originalname) !== '.xlsm') {
                return cb(new Error('Wrong file extension'));
            }
            cb(null, true);
        }
    }).single(req.params.name);

    var spreadsheet = {};
    var deals = [];

    // Read excel file contents and convert to deal objects.
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            deferred.reject(err);
        } else if (!req.file) {
            console.log('no file uploaded');
            deferred.reject({ NO_FILE: true });
        } else {
            // Read excel file contents
            // NOTE: files with single sheet and files with multiple sheets have different table format.            
            spreadsheet = xlsx.readFile('./uploads/' + req.file.originalname);
            var sheet_name_list = spreadsheet.SheetNames;

            /*
            * START Francis Nash Jasmin 2022/05/04
            * Added code for checking if excel file have single or multiple sheets.
            */
            if(sheet_name_list.length <= 1) {
                var xlData = xlsx.utils.sheet_to_json(spreadsheet.Sheets[sheet_name_list[0]]);
    
                // Preprocess deals (convert dates, step level, month headers)
                deals = preprocessDeals(xlData);
                
            } else {
                // List of sheets:
                // Profile
                // Process, Status
                // Intra MM Dist
                // Intra Rev Dist
                // Intra CM Dist
                // Direct MM Dist
                // Direct Rev Dist
                // Direct CM Dist
                var profileData, processData, intraMMData, intraRevData, intraCMData, directMMData, directRevData, directCMData;

                profileData = xlsx.utils.sheet_to_json(spreadsheet.Sheets[sheet_name_list.find(sheet => sheet.includes('Profile'))]);
                processData = xlsx.utils.sheet_to_json(spreadsheet.Sheets[sheet_name_list.find(sheet => sheet.includes('Process'))]);

                intraMMData = xlsx.utils.sheet_to_json(spreadsheet.Sheets[sheet_name_list.find(sheet => sheet.includes('Intra MM'))]);
                intraRevData = xlsx.utils.sheet_to_json(spreadsheet.Sheets[sheet_name_list.find(sheet => sheet.includes('Intra Rev'))]);
                intraCMData = xlsx.utils.sheet_to_json(spreadsheet.Sheets[sheet_name_list.find(sheet => sheet.includes('Intra CM'))]);
                
                directMMData = xlsx.utils.sheet_to_json(spreadsheet.Sheets[sheet_name_list.find(sheet => sheet.includes('Direct MM'))]);
                directRevData = xlsx.utils.sheet_to_json(spreadsheet.Sheets[sheet_name_list.find(sheet => sheet.includes('Direct Rev'))]);
                directCMData = xlsx.utils.sheet_to_json(spreadsheet.Sheets[sheet_name_list.find(sheet => sheet.includes('Direct CM'))]);
                
                let merged = [];

                // Merge profile and process arrays based on deal number.
                for(let i=0; i < profileData.length; i++) {
                    merged.push({
                        ...profileData[i], 
                        ...(processData.find((deal) => 
                            deal['No'] === profileData[i]['No'] &&
                            deal['Deal name'] === profileData[i]['Deal name']
                        ))
                    });
                }

                // Used to create the deal objects with their distribution values.
                deals = preprocessDealsMultiSheets(merged, intraMMData, intraRevData, intraCMData, directMMData, directRevData, directCMData);
                
                // USed to find duplicate deal IDs in the deal array and rename the duplicate deal IDs by appending _1, _2... to the deal IDs.
                let renamedDeals = [];
                deals.forEach(function(deal) {
                    if (renamedDeals.indexOf(deal.ID) > -1) {
                        deal.ID = renameDuplicate(deal.ID); 
                        while(renamedDeals.indexOf(deal.ID) > -1) {
                            deal.ID = renameDuplicate(deal.ID);
                        }
                    } 
                    renamedDeals.push(deal.ID);
                });
            }
            /* END Francis Nash Jasmin 2022/05/06 */

            // As an object array, add all deals to the database at once, filter out duplicate ids.
            addImportedDeals(deals, req.session.user.firstName + ' ' + req.session.user.lastName)
            .then(function({ importedIDs, duplicateIDs }) {
                // Get added deal IDs and duplicate IDs.
                // Call generate logs function
                // Return deal IDs added and not added to the database.
                deferred.resolve({importedIDs, duplicateIDs});
                generateLogs({
                    importedDeals: importedIDs,
                    duplicateDeals: duplicateIDs
                }).then(function() {
                    console.log('Import logs generated.');
                }).catch(function() {
                    console.log('Error creating logs.');
                })
            }).catch(function() {
                deferred.reject('Deals not added to database.');
            })
        }
    });

    return deferred.promise;
}

/*
* START Francis Nash Jasmin 2022/05/04
* Added code for renaming duplicate Deal IDs in imported excel file.
*/
// Used to rename deal IDs, appending _1, _2... to the ID.
function renameDuplicate(dealID) {
    let splitted = dealID.split("_");
    if(splitted.length > 1) {
        let renamedID = splitted[0];
        let num = parseInt(splitted[1]);
        return `${renamedID}_${num + 1}`;
    } 
    return `${dealID}_${1}`;
}
/* END Francis Nash Jasmin 2022/05/06 */

function addImportedDeals(importedDeals, user) {
    var deferred = Q.defer();

    var duplicateIDs = [];
    var importedIDs = [];

    var IDs = importedDeals.map(deal => { return deal.ID; });

    // check against deals in db for duplicates
    db.deals.find({ ID: { $in: IDs } }, { _id: false, ID: true }).toArray(function(err, existingDeals) {
        dealsToBeAdded = importedDeals.filter(deal => !existingDeals.find(d => d.ID === deal.ID));
        saveToDB(dealsToBeAdded, existingDeals);
    })

    function saveToDB(deals, existingDeals) {
        importedIDs = deals.map(deal => { return deal.ID });
        duplicateIDs = existingDeals.map(deal => { return deal.ID });
        deals.map(deal => {
            //add change history array here
            deal['Change History'] = [];
            deal['attachments'] = [];
            deal['Change History'].push({
                date: getCurrentDate(),
                user: user,
                level: deal.profile['Level'],
                content: 'Level was changed to ' + deal.profile['Level']
            });

            //set closedDate only if the level is 1
            if (deal.profile['Level'] === '1') {
                deal.closedDate = getCurrentDate();
            }
        })
        
        db.deals.insertMany(
            deals,
            function (err, doc) {}
        );

        // Promise returns the deal IDs added and not added to the database.
        deferred.resolve({ importedIDs, duplicateIDs });
    }

    return deferred.promise;
}
/*  END Francis Nash Jasmin 2022/04/22 */ 
