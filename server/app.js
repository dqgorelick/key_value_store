const express = require('express');
const app = express();
const port = 8080;
const bodyParser = require('body-parser');
const helpers = require('./helpers');

app.use(bodyParser.json({ type: 'application/json' }));

helpers.createTable((err) => {
  if (err) console.log('error creating table', err);
});

// view all network activity
app.all('*', (req, res, next) => {
  if(process.env.NODE_ENV !== 'test') {
    console.log(`received ${req.method} on ${req.headers.host}${req.originalUrl}`);
  }
  next();
})

app.route('/keys').get((req, res) => {
  res.status(400).send('query keys via endpoint: `/keys/:key`');
});

app.route('/keys/:key').get((req, res) => {
  helpers.getItem(req.params.key, (err, result) => {
    if (!err) {
      if (result.length) {
        res.status(200).send(result[0]['item_value']);
      } else {
        res.status(200).send('');
      }
    } else {
      res.status(500).send(`internal error ${err}`);
    }
  });
});

app.route('/keys').put((req, res) => {
  // data validation
  if (req.headers['content-type'] !== 'application/json') {
    res.status(400).send('incorrect headers, looking for "application/json".');
    return;
  }
  if (!req.body.data) {
    res.status(422).send('unable to parse "data" object of body.');
    return;
  }
  if (!req.body.data.key) {
    res.status(422).send('missing "key" parameter.');
    return;
  }
  if (!req.body.data.value) {
    res.status(422).send('cannot store empty "value" parameter.');
    return;
  }

  let key = req.body.data.key;
  let value = req.body.data.value;

  helpers.addItem(key, value, (err) => {
    if (err) {
      res.status(500).send('unable to store values in database');
    } else {
      res.status(200).send(`successfully stored (${key} : ${value})`);
    }
  });
})

app.listen(port, () => {
  console.log(`awaiting REST calls on port ${port}`);
});

module.exports = app;
