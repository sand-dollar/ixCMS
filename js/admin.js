/**
 * Functions and routes required in administration.
 * All routes require the user to be logged in.
 *
 * @module admin
 */

let express = require('express');
let config = require('./config');
let auth = require('./auth');
let mongodb = require('mongodb');
let MongoClient = mongodb.MongoClient;
let objectId = mongodb.ObjectId;
let admin = express();

auth.setAuthentication(admin);

/**
 * Get site settings from database.
 */
function getSettings() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        db.collection('settings').findOne({_id: config.settingsId})
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
    MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        settings._id = config.settingsId;
        db.collection('settings').save(settings, (error, result) => {
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
    MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        Promise.all([
          db.collection('pages').count(),
          db.collection('posts').count(),
          db.collection('settings').findOne({_id: config.settingsId}, {siteName: true}),
        ])
          .then(([pageCount, postCount, siteName]) => {
            resolve({pageCount, postCount, siteName});
          })
          .catch((err) => {
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
    MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        db.collection(collection).find({}, {text: false}).toArray((err, docs) => {
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
    MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        db.collection(collection).findOne({_id: objectId(id)})
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
    MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        article._id = objectId(id);
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
    MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        db.collection(collection).deleteOne({_id: objectId(id)}, (error, result) => {
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
 * Show requested page from menu.
 */
admin.get('/menu/:page', (req, res) => {
  res.render('admin/pages/' + req.params.page);
});


/**
 * Load site settings from the database.
 */
admin.get('/settings', (req, res) => {
  getSettings().then((result) => {
    res.send(result);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Get overview.
 */
admin.get('/overview', (req, res) => {
  getOverview().then((result) => {
    res.send(result);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Save new settings into the database.
 */
admin.post('/settings', (req, res) => {
  saveSettings(req.body).then((result) => {
    res.sendStatus(200);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * List all pages (show title, url)
 */
admin.get('/pages', (req, res) => {
  listArticles('pages').then((result) => {
    res.send(result);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * List all posts (show title, url)
 */
admin.get('/posts', (req, res) => {
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
admin.get('/pages/:id', (req, res) => {
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
admin.get('/posts/:id', (req, res) => {
  getArticle('posts', req.params.id).then((result) => {
    res.send(result);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Create a new page.
 */
admin.get('/editor/pages', (req, res) => {
  res.redirect('/admin/editor/pages/' + objectId());
});

/**
 * Create a new post.
 */
admin.get('/editor/posts', (req, res) => {
  res.redirect('/admin/editor/posts/' + objectId());
});

/**
 * Show editor for given page with ID.
 */
admin.get('/editor/pages/:id', (req, res) => {
  res.render('admin/pages/editor');
});

/**
 * Show editor for given post with ID.
 */
admin.get('/editor/posts/:id', (req, res) => {
  res.render('admin/pages/editor');
});

/**
 * Save changes in given page.
 */
admin.post('/editor/pages/save', (req, res) => {
  saveArticle('pages', req.body._id, req.body).then((result) => {
    res.sendStatus(200);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Save changes in given post.
 */
admin.post('/editor/posts/save', (req, res) => {
  saveArticle('posts', req.body._id, req.body).then((result) => {
    res.sendStatus(200);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Delete post with ID.
 */
admin.post('/editor/posts/delete/:id', (req, res) => {
  deleteArticle('posts', req.params.id).then((result) => {
    res.sendStatus(200);
  }, (error) => {
    res.sendStatus(500);
  });
});

/**
 * Delete page with ID.
 */
admin.post('/editor/pages/delete/:id', (req, res) => {
  deleteArticle('pages', req.params.id).then((result) => {
    res.sendStatus(200);
  }, (error) => {
    res.sendStatus(500);
  });
});

module.exports = admin;
