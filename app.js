//var request = require("request");
const requestpromise = require('request-promise');
const Promise = require("bluebird");
const countries = require("./countries.js");
const request = require('sync-request');

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


var parseBody = function(body, country) {

    let m;
    let counter = 0;
    var response = {
        'country_code': country.code,
        'country_name': country.name,
        'rank': 'not in 60'
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

var getAllCountries = function(res) { //for Slow Connections

    var count = 0;
    var all_array = [];

    countries.getAll().map(country => {
        var data = {
            'start': "0",
            'num': "60",
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
            //url: getStoreListingURL() + '?gl=' + country.code,
            method: 'POST',
            headers: headers,
            form: data
        }
        //console.log(getStoreListingURL() + '?gl=' + country.code);
        //return requestpromise(options);
        var res = request('POST', getStoreListingURL() + '?gl=' + country.code, options);
        var one = res.getBody('utf8')
        var parsed = parseBody(one, country);
        console.log(parsed);
        all_array.push(parsed);
    });

	console.log('*****************DONE**********************')
    res.send(all_array);
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
    pid = req.body.package_name
    price = req.body.price
    category = req.body.category

    console.log('Package Name : ' + pid)
    console.log('Price        : ' + price)
    console.log('Category     : ' + category)
    getAllCountries(res)
});


var server = app.listen(8080, () => console.log('app listening on port 8080!'))
server.timeout = 0;

