var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectID;
var app = express();
var databaseUrl = 'mongodb://localhost:27017/ixcms_test';

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
//app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
  MongoClient.connect(databaseUrl, function(error, db) {
    if (error) {
      console.log('Unable to connect to the mongoDB server. Error:', error);
    } else {
      console.log('Connection established to', databaseUrl);

      // Get the documents collection
      var collection = db.collection('posts');

      // We have a cursor now with our find criteria
      var cursor = collection.find({title: 'modulus'});

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
      tags: ['tag1', 'tag2', 'tag3']
    }, {
      title: 'post2 title',
      abstract: 'sample abstract',
      time: '13:00 1.1.2016',
      url: '/pages/xxx',
      tags: ['tag1', 'tag2', 'tag3']
    }, {
      title: 'post3 title',
      abstract: 'sample abstract',
      time: '13:00 1.1.2016',
      url: '/pages/xxx',
      tags: ['tag1', 'tag2', 'tag3']
    }]
  });
});


app.get('/about', (req, res) => {
  res.render('pages/page', {
    title: 'Title',
    text: 'sample text',
    abstract: 'sample abstract',
    time: '13:00 1.1.2016',
    allowComments: true,
    tags: ['tag1, tag2, tag3'],
    status: 'draft'
  });
});

/**********************************************************************/
/**********************************************************************/
/**********************************************************************/

app.get('/login', (req, res) => {
  res.render('admin/menu/login');
  // TODO after login redirect to /admin/overview
  // TODO redirect to login, if not logged in.
});


app.get('/admin/menu/:page', (req, res) => {
  let page = req.params.page;
  res.render('admin/pages/' + page);
});


app.get('/admin/settings', (req, res) => {
  MongoClient.connect(databaseUrl, function(error, db) {
    if (error) {
      console.log('Unable to connect to the mongoDB server. Error:', error);
    } else {
      let doc = db.collection('settings').find({}).toArray(function(err, docs) {
        if (docs.length === 1) {
          res.send(docs[0]);
        } else {
          res.send({});
        }
        db.close();
      });
    }
  });
});

app.post('/admin/settings', (req, res) => {
  MongoClient.connect(databaseUrl, function(error, db) {
    if (error) {
      console.log('Unable to connect to the mongoDB server. Error:', error);
    } else {
      var collection = db.collection("settings");
      let value = req.body;
      value._id = 0;
      console.log(value);
      collection.save(value, function(error, result) {
        if (error) {
          console.log('Settings update error: ' + error);
        } else {
          console.log('Settings update successful!');
        }
        db.close();
      });
    }
  });
});


// page: title, url, text
// Not used
app.get('/admin/pages', (req, res) => {
  MongoClient.connect(databaseUrl, function(error, db) {
    if (error) {
      console.log('Unable to connect to the mongoDB server. Error:', error);
    } else {
      let doc = db.collection('pages').find({}, {text: false}).toArray(function(err, docs) {
        res.send(docs);
        db.close();
      });
    }
  });
});

// Not used
app.post('/admin/pages', (req, res) => {
  MongoClient.connect(databaseUrl, function(error, db) {
    if (error) {
      console.log('Unable to connect to the mongoDB server. Error:', error);
    } else {
      var collection = db.collection("pages");
      let value = req.body;
      value._id = 0;
      console.log(value);
      collection.save(value, function(error, result) {
        if (error) {
          console.log('Settings update error: ' + error);
        } else {
          console.log('Settings update successful!');
        }
        db.close();
      });
    }
  });
});

app.post('/admin/editor/save', (req, res) => {
  MongoClient.connect(databaseUrl, function(error, db) {
    if (error) {
      console.log('Unable to connect to the mongoDB server. Error:', error);
    } else {
      var collection = db.collection("pages");
      let value = req.body;
      if (!value._id) {
        // Insert a new entry
        collection.insert(value, function(error, result) {
          if (error || result.insertedCount !== 1) {
            console.log('Entry insert error: ' + error);
          } else {
            console.log('Settings update successful!');
            res.send({ _id: result.ops[0]._id });  // Return newly generated ID
          }
          db.close();
        });
      } else {
        // Edit entry
        value._id = ObjectId(value._id);
        collection.findOneAndUpdate({ _id: value._id }, value)
          .then(function (result) {
            console.log(result);
          }, function (error) {
            console.log('Entry update error: ' + error);
            // TODO Try insert as a fallback
          });
      }
    }
  });
});



// must be the last route
// TODO render a helpful page here.
/*app.get('*', (req, res) => {
  res.status(404).send({url: req.url});
  return;
});*/

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
