var express = require('express');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var app = express();
var databaseUrl = 'mongodb://localhost:27017/ixcms_test';

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');


app.get('/', function(req, res) {
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
      tags: ['tag1', 'tag2', 'tag3']
    }, {
      title: 'post2 title',
      abstract: 'sample abstract',
      time: '13:00 1.1.2016',
      tags: ['tag1', 'tag2', 'tag3']
    }, {
      title: 'post3 title',
      abstract: 'sample abstract',
      time: '13:00 1.1.2016',
      tags: ['tag1', 'tag2', 'tag3']
    }]
  });
});


app.get('/about', function(req, res) {
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


app.get('/login', function(req, res) {
  res.render('admin/pages/login');
  // TODO after login redirect to /admin/overview
  // TODO redirect to login, if not logged in.
});


app.get('/admin/:page', function(req, res) {
  var page = req.params.page;

  MongoClient.connect(databaseUrl, function(error, db) {
    if (error) {
      console.log('Unable to connect to the mongoDB server. Error:', error);
    } else {
      console.log('Connection established to', databaseUrl);

      // Get the documents collection
      var collection = db.collection('posts');

      // TODO load this to angular $scope

    }
  });

  res.render('admin/pages/' + page);
});



app.put('/admin/:page', function(req, res) {
  var page = req.params.page;
  MongoClient.connect(databaseUrl, function(error, db) {
    if (error) {
      console.log('Unable to connect to the mongoDB server. Error:', error);
    } else {
      console.log('Connection established to', databaseUrl);

      var collection = db.collection(page);  // SAVE ANGULAR $scope.page to collection

      // Insert some users
      collection.insert(req.body, function(error, result) {
        if (error) {
          console.log(error);
        } else {
          console.log('Inserted %d documents. The documents are:', result.length, result);
        }
        db.close();
      });
    }
  });
});

// must be the last route
// TODO render a helpful page here.
/*app.get('*', function(req, res) {
  res.status(404).send({url: req.url});
  return;
});*/

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
