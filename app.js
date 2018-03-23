var request = require("request");
var Promise = require("bluebird");
var countries = require("./countries.js");

const regex_list = /class="card no-rationale square-cover apps small" data-docid="(.*?)"/g;
const regex_category = '<a class="document-subtitle category" href="[\/]store[\/]apps[\/]category[\/](.*?)">';


var pid = ''
var category = ''
var price = 'free'

var getStoreDetailURL = function() {
    return 'https://play.google.com/store/apps/details?id=' + pid + '&gl=us&hl=en'
}

var getStoreListingURL = function() {
    return 'https://play.google.com/store/apps/category/' + category + '/collection/topselling_' + price
}


var makeCall = function(country, link) {

    return new Promise(function(resolve, reject) {

        var data = {
            'start': "0",
            'num': "100",
            //'numChildren': 0,
            //'cctcss': 'square-cover',
            //'cllayout': 'NORMAL',
            //'ipf': '1',
            //'xhr': '1'
        }

        // Set the headers
        var headers = {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        var options = {
            url: link,
            method: 'POST',
            headers: headers,
            form: data
        }

        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var response = parseBody(body, country);
                resolve(response);
            } else {
                reject(error);
            }
        })

    })
}


var parseBody = function(body, country) {

    let m;
    let counter = 0;
    var response = {
        'country_code': country.code,
        'country_name': country.name,
        'rank': 'not in 100'
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
    all_array = [];

    Promise.map(countries.getAll(), function(country) {
            return makeCall(country, getStoreListingURL() + '?gl=' + country.code);
        })
        .each(function(result) {
            all_array.push(result);
        })
        .then(function(results) {
            res.send(results);
            console.log(results);
        }).catch(error => {
            res.send('error');
            console.log(error);
        });
}


var getCategory = function(link, res) {
    var options = {
        url: link,
        method: 'POST',
    }

    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var matches = body.match(regex_category);
            category = matches[1].toUpperCase();
            console.log(category);
            getAllCountries(res);
        } else {
            res.send('error');
            console.log(error);
        }
    })
}





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


app.listen(8080, () => console.log('app listening on port 8080!'))
/*
Express
*/