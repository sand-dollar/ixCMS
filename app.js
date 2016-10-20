/**
 * Functions and routes which don't require the user to be logged in.
 *
 * @module app
 */

let express = require('express');
let bodyParser = require('body-parser');
let mongodb = require('mongodb');
let MongoClient = mongodb.MongoClient;
let app = express();
let admin = require('./js/admin');
let config = require('./js/config');
let auth = require('./js/auth');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
// app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use('/admin', admin);


app.get('/', (req, res) => {
  MongoClient.connect(config.databaseUrl, function(error, db) {
    if (error) {
      console.log('Unable to connect to the mongoDB server. Error:', error);
    } else {
      console.log('Connection established to', config.databaseUrl);

      // Get the documents collection
      let collection = db.collection('posts');

      // We have a cursor now with our find criteria
      let cursor = collection.find({title: 'modulus'});

      // We need to sort by age descending
      cursor.sort({time: -1});

      // Limit to max 10 records
      cursor.limit(10);

      // Skip specified records. 0 for skipping 0 records.
      cursor.skip(0);

      // Lets iterate on the result
      cursor.each(function(error, doc) {
        if (error) {
          console.log(error);
        } else {
          console.log('Fetched:', doc);
        }
      });
    }
  });

  res.render('pages/index', {
    posts: [{
      title: 'post1 title',
      abstract: 'sample abstract',
      time: '13:00 1.1.2016',
      url: '/pages/xxx',
      tags: ['tag1', 'tag2', 'tag3'],
    }, {
      title: 'post2 title',
      abstract: 'sample abstract',
      time: '13:00 1.1.2016',
      url: '/pages/xxx',
      tags: ['tag1', 'tag2', 'tag3'],
    }, {
      title: 'post3 title',
      abstract: 'sample abstract',
      time: '13:00 1.1.2016',
      url: '/pages/xxx',
      tags: ['tag1', 'tag2', 'tag3'],
    }],
  });
});

// REMOVE this route. This is replaced with /page/:page
// Pokud budeme chtit vynechat angular pro navstevnika, budeme potrebovat dalsi route s template.
app.get('/about', (req, res) => {
  res.render('pages/page', {
    title: 'Title',
    text: 'sample text',
    abstract: 'sample abstract',
    time: '13:00 1.1.2016',
    allowComments: true,
    tags: ['tag1, tag2, tag3'],
    status: 'draft',
  });
});

/**
 * Login into administration and show 'overview' page.
 */
app.get('/login', (req, res) => {
  res.render('admin/pages/login');
});

app.post('/authenticate', (req, res) => {
  auth.logIn(req.body.username, req.body.password, req)
    .then((success) => {
      res.sendStatus(200);
    }, (error) => {
      res.sendStatus(401);
    });
});


app.get('/logout', (req, res) => {
  auth.logOut(req);
});

// must be the last route
// TODO render a helpful page here.
/* app.get('*', (req, res) => {
  res.status(404).send({url: req.url});
  return;
});*/

app.listen(3000, () => {
  console.log('ixCMS listening on port 3000!');
});
