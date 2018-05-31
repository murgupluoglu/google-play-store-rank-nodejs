//var request = require("request");
const requestpromise = require('request-promise');
var Promise = require("bluebird");
var countries = require("./countries.js");

const regex_list = /class="card no-rationale square-cover apps small" data-docid="(.*?)"/g;
//const regex_category = '<a class="document-subtitle category" href="[\/]store[\/]apps[\/]category[\/](.*?)">';
const regex_category = '<a itemprop="genre" href="https:[\/][\/]play.google.com[\/]store[\/]apps[\/]category[\/](.*?)"'


var pid = ''
var category = ''
var price = 'free'

var getStoreDetailURL = function() {
    return 'https://play.google.com/store/apps/details?id=' + pid + '&gl=us&hl=en'
}

var getStoreListingURL = function() {
    return 'https://play.google.com/store/apps/category/' + category + '/collection/topselling_' + price
}


// var makeCall = function(country, link) {

//     return new Promise(function(resolve, reject) {

//         var data = {
//             'start': "0",
//             'num': "120",
//             'numChildren': 0,
//             'cctcss': 'square-cover',
//             'cllayout': 'NORMAL',
//             'ipf': '1',
//             'xhr': '1'
//         }

//         // Set the headers
//         var headers = {
//             'User-Agent': 'Chrome/59.0.3071.115',
//             'Content-Type': 'application/x-www-form-urlencoded'
//         }

//         var options = {
//             url: link,
//             method: 'POST',
//             headers: headers,
//             form: data
//         }

//         request(options, function(error, response, body) {
//             if (!error && response.statusCode == 200) {
//                 var response = parseBody(body, country);
//                 resolve(response);
//             } else {
//                 reject(error);
//             }
//         })

//     })
// }


var parseBody = function(body, country) {

    let m;
    let counter = 0;
    var response = {
        'country_code': country.code,
        'country_name': country.name,
        'rank': 'not in 120'
    };
    while ((m = regex_list.exec(body)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex_list.lastIndex) {
            regex_list.lastIndex++;
        }

        var packageid = m[1];

        if (packageid == pid) {
            response.rank = counter + 1;
        }

        counter++;
    }

    return response;

}



var getAllCountries = function(res) {

    var count = 0;
    var all_array = [];

    const promises = countries.getAll().map(country => {
        var data = {
            'start': "0",
            'num': "120",
            'numChildren': 0,
            'cctcss': 'square-cover',
            'cllayout': 'NORMAL',
            'ipf': '1',
            'xhr': '1'
        }

        // Set the headers
        var headers = {
            'User-Agent': 'Chrome/59.0.3071.115',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        var options = {
            url: getStoreListingURL() + '?gl=' + country.code,
            method: 'POST',
            headers: headers,
            form: data
        }
        //console.log(getStoreListingURL() + '?gl=' + country.code);
        return requestpromise(options);
    });
    Promise
        .all(promises)
        .each(function(one) {
            var parsed = parseBody(one, countries.getAll()[count]);
            all_array.push(parsed);
            count++
        }).then((data) => {
            console.log(all_array)
            res.send(all_array);
        });



    // Promise.map(countries.getAll(), function(country) {
    //         //console.log(getStoreListingURL() + '?gl=' + country.code);
    //         return makeCall(country, getStoreListingURL() + '?gl=' + country.code);
    //     })
    //     .each(function(result) {
    //      console.log(result)
    //         all_array.push(result);
    //     })
    //     .then(function(results) {
    //      console.log(results);
    //         res.send(results);
    //     }).catch(error => {
    //      console.log(error);
    //         res.send('error');
    //     });


    // var country = countries.getAll()[count]
    // console.log(country)
    // makeCall(country, getStoreListingURL() + '?gl=' + country.code)
    //     .then(function(result) {
    //         console.log(result);
    //         all_array.push(result)
    //         if (count < countries.getAll().length - 1) {
    //             count++
    //             getAllCountries(res)
    //         } else {
    //             res.send(all_array)
    //         }
    //     }).catch(error => {
    //         console.log(error);
    //         res.send('error');
    //     });
}


var getCategory = function(link, res) {

    // var headers = {
    //     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
    //     'Content-Type': 'application/x-www-form-urlencoded'
    // }
    var options = {
        url: link,
        method: 'GET',
        //headers: headers,
    }

    requestpromise(options).then(function(body) {
            var matches = body.match(regex_category);
            category = matches[1].toUpperCase();
            console.log(category);
            getAllCountries(res);
        })
        .catch(function(err) {
            res.send('error');
            console.log(err);
        });

    // request(options, function(error, response, body) {
    //     if (!error && response.statusCode == 200) {
    //         //console.log(response)

    //     } else {

    //     }
    // })
}

// pid = 'com.whatsapp'
// price = 'free'

// console.log(pid)
// console.log(price)
// getCategory(getStoreDetailURL(), null)



const express = require('express')
var bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
app.use('/', express.static(__dirname + '/'));
app.use('/scripts', express.static(__dirname + '/node_modules/'));

app.post('/data', function(req, res) {
    pid = req.body.package_name;
    price = req.body.price;

    console.log(pid)
    console.log(price)
    getCategory(getStoreDetailURL(), res)
});


var server = app.listen(8080, () => console.log('app listening on port 8080!'))
server.timeout = 0;
/*
Express
*/