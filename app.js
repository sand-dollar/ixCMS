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

var settingsId = 0;


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
    status: 'draft'
  });
});



/**********************************************************************/
/**********************************************************************/
/**********************************************************************/

/**
 * Get site settings from database.
 */
function getSettings() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        db.collection('settings').findOne({ _id: settingsId })
          .then((result) => {
            db.close();
            if (result) {
              resolve(result);
            } else {
              resolve({});
            }
          }, (err) => {
            reject(new Error(err));
          }
        );
      }
    });
  });
}

/**
 * Save site settings to database.
 */
function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        settings._id = settingsId;
        db.collection("settings").save(settings, (error, result) => {
          if (error) {
            console.log('Settings update error: ' + error);
            reject(new Error(error));
          } else {
            console.log('Settings update successful!');
            resolve();
          }
          db.close();
        });
      }
    });
  });  
}

/**
 * Get overview/
 */
function getOverview() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        Promise.all([
          db.collection("pages").count(),
          db.collection("posts").count(),
          db.collection('settings').findOne({ _id: settingsId })
        ])
          .then(([pageCount, postCount, settings]) => {
            let siteName = settings ? settings.siteName : '';
            resolve({ pageCount, postCount, siteName });
          })
          .catch(err => {
            // Receives first rejection among the Promises
            reject(new Error(err));
          });
      }
    });
  });
}

/**
 * List all articles (pages or posts).
 */
function listArticles(collection) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        db.collection(collection).find({}, { text: false }).toArray((err, docs) => {
          db.close();
          if (err) {
            reject(new Error(err));
          } else {
            resolve(docs);
          }
        });
      }
    });
  });
}

/**
 * Get requested article (page or post) with given ID.
 */
function getArticle(collection, id) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        db.collection(collection).findOne({ _id: ObjectId(id) })
          .then((result) => {
            db.close();
            resolve(result);
          }, (error) => {
            console.log('Article not found. Collection: ' + collection + ', ID: ' + id);
            db.close();
            reject(new Error(error));
        });
      }
    });
  });
}

/**
 * Save article (page or post) with given ID.
 */
function saveArticle(collection, id, article) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        article._id = ObjectId(id);
        db.collection(collection).save(article).then((result) => {
            console.log('Saved id: ' + article._id);
            db.close();
            resolve(article._id);
          }, (error) => {
            console.log('Entry update error: ' + error);
            db.close();
            reject(new Error(error));
          }
        );
      }
    });
  });  
}

/**
 * Delete article (page or post) with given ID.
 */
function deleteArticle(collection, id) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        db.collection(collection).deleteOne({ _id: ObjectId(id) }, (error, result) => {
          if (error) {
            console.log('error');
            reject(new Error(error));
          } else {
            console.log('success delete');
            resolve();
          }
        });
      }
    });
  });
}

/**
 * Login into administration and show 'overview' page.
 */
app.get('/login', (req, res) => {
  //res.render('admin/menu/login');
  res.redirect('/admin/menu/overview');
  // TODO after login redirect to /admin/overview
  // TODO redirect to login, if not logged in.
});

/**
 * Show requested page from menu.
 */
app.get('/admin/menu/:page', (req, res) => {
  res.render('admin/pages/' + req.params.page);
});

/**
 * Load site settings from the database.
 */
app.get('/admin/settings', (req, res) => {
  getSettings().then((result) => {
    res.send(result);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Get overview.
 */
app.get('/admin/overview', (req, res) => {
  getOverview().then((result) => {
    res.send(result);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Save new settings into the database.
 */
app.post('/admin/settings', (req, res) => {
  saveSettings(req.body).then((result) => {
    res.sendStatus(200);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * List all pages (show title, url)
 */
app.get('/admin/pages', (req, res) => {
  listArticles('pages').then((result) => {
    res.send(result);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * List all posts (show title, url)
 */
app.get('/admin/posts', (req, res) => {
  listArticles('posts').then((result) => {
    res.send(result);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Get all info to given page ID.
 * Currently: title, url, text.
 */
app.get('/admin/pages/:id', (req, res) => {
  getArticle('pages', req.params.id).then((result) => {
    res.send(result);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Get all info to given post ID.
 * Currently: title, url, text, abstract, date, tags, status, allowComments.
 */
app.get('/admin/posts/:id', (req, res) => {
  getArticle('posts', req.params.id).then((result) => {
    res.send(result);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Create a new page.
 */
app.get('/admin/editor/pages', (req, res) => {
  res.redirect('/admin/editor/pages/' + ObjectId());
});

/**
 * Create a new post.
 */
app.get('/admin/editor/posts', (req, res) => {
  res.redirect('/admin/editor/posts/' + ObjectId());
});

/**
 * Show editor for given page with ID.
 */
app.get('/admin/editor/pages/:id', (req, res) => {
  res.render('admin/pages/editor');
});

/**
 * Show editor for given post with ID.
 */
app.get('/admin/editor/posts/:id', (req, res) => {
  res.render('admin/pages/editor');
});

/**
 * Save changes in given page.
 */
app.post('/admin/editor/pages/save', (req, res) => {
  saveArticle('pages', req.body._id, req.body).then((result) => {
    res.sendStatus(200);
  }, (error) => {
    res.sendStatus(500);
  })
});

/**
 * Save changes in given post.
 */
app.post('/admin/editor/posts/save', (req, res) => {
  saveArticle('posts', req.body._id, req.body).then((result) => {
    res.sendStatus(200);
  }, (error) => {
    res.sendStatus(500);
  })
});

/**
 * Delete post with ID.
 */
app.post('/admin/editor/posts/delete/:id', (req, res) => {
  deleteArticle('posts', req.params.id).then((result) => {
    res.sendStatus(200);
  }, (error) => {
    res.sendStatus(500);
  })
});

/**
 * Delete page with ID.
 */
app.post('/admin/editor/pages/delete/:id', (req, res) => {
  deleteArticle('pages', req.params.id).then((result) => {
    res.sendStatus(200);
  }, (error) => {
    res.sendStatus(500);
  })
});



// must be the last route
// TODO render a helpful page here.
/*app.get('*', (req, res) => {
  res.status(404).send({url: req.url});
  return;
});*/

app.listen(3000, () => {
  console.log('ixCMS listening on port 3000!');
});
