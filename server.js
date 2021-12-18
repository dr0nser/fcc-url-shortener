require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlparser = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// connect to mongodb database
mongoose.connect(process.env.MONGO_URI); 

// create a schema 
const schema = new mongoose.Schema({ 
  url: String,
  short: Number 
});

// create a model
const Url = mongoose.model('Url', schema);


app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// project starts...

app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;
  const something = dns.lookup(urlparser.parse(inputUrl).hostname, (err, address) => {
    console.log("address: " + address);
    if (!address) {
      res.json({error: 'invalid url'});
    } else {
      Url.find({ url: inputUrl }).exec((err, data) => {
        if (!data[0]) {
          Url.find().count().exec((err, count) => {
            let newCount = count + 1;
            const url = new Url({ url: inputUrl, short: newCount });
            url.save((err, data) => {
              res.json({ original_url: data.url, short_url: newCount });
            });
          });
        } else {
          res.json({ original_url: data[0].url, short_url: data[0].short });
        } 
      });
    }
  });
});

app.get("/api/shorturl/:id", (req, res) => {
  const shortId = req.params.id;
  Url.find({ short: shortId }).exec((err, data) => {
    if (!data[0]) {
      res.json({ error: 'invalid url' });
    } else {
      console.log(data);
      res.redirect(data[0].url);
    }
  });
});