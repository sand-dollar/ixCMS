/**
 * Functions and routes which don't require the user to be logged in.
 *
 * @module app
 */

let path = require('path');
let express = require('express');
var expressHelpers = require('express-helpers');
let bodyParser = require('body-parser');
let mongodb = require('mongodb');
let session = require('express-session');
let MongoClient = mongodb.MongoClient;
let app = express();
let admin = require('./js/admin');
let config = require('./js/config');

app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.json()); // for parsing application/json
// app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: config.sessionSecret,
  resave: true,
  saveUninitialized: true,
}));
app.set('view engine', 'ejs');
app.use('/admin', admin);
expressHelpers(app);


/**
 * Helper function to get list of all 'pages' from the database as an array.
 */
function getMenu(db) {
  return new Promise((resolve, reject) => {
    db.collection('pages').find({}, {title: true, url: true}).toArray((error, result) => {
      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Helper function to get list of all posts from the database as an array.
 *
 * @param tag parameter is optional.
 */
function getPostList(db, tag = '') {
  let filter = {status: 'published'};
  if (tag) {
    filter.tags = tag;
  }
  return new Promise((resolve, reject) => {
    db.collection('posts').find(filter, {text: false, markdown: false}).sort({date: -1}).toArray((error, result) => {
      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Get basic site configuration as siteName, siteMotto etc.
 */
function getSiteSettings(db) {
  return new Promise((resolve, reject) => {
    db.collection('settings').findOne({_id: config.settingsId}, {siteName: true, siteMotto: true})
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
  });
}

/**
 * Get page or post.
 */
function getArticle(collection, url) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        Promise.all([
          db.collection(collection).findOne({url: url, status: 'published'}, {markdown: false}),
          getMenu(db),
          getSiteSettings(db),
        ])
          .then(([article, menu, site]) => {
            db.close();
            resolve({article, menu, site});
          })
          .catch((err) => {
            // Receives first rejection among the Promises
            db.close();
            reject(new Error(err));
          });
      }
    });
  });
}

/**
 * Get list of posts
 *
 * @param Tag parameter is optional.
 */
function getIndexPage(tag = '') {
  return new Promise((resolve, reject) => {
    MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        Promise.all([
          getPostList(db, tag),
          getMenu(db),
          getSiteSettings(db),
        ])
          .then(([posts, menu, site]) => {
            db.close();
            resolve({posts, menu, site});
          })
          .catch((err) => {
            // Receives first rejection among the Promises
            db.close();
            reject(new Error(err));
          });
      }
    });
  });
}

/**
 * Save ip and time of the last login
 *
 * TODO: We should be more generic and use this function to monitor all user page views.
 */
function saveLastLogin(ip) {
  MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
      } else {
        db.collection('settings').findAndModify(
          {_id: config.settingsId},
          [],
          {$set: {lastLogin: {ip, time: new Date()}}},
          {new: true}
        ).catch(error => {
          console.log(error);
        });
      }
  });
}

/**
 * Render index page (list of all posts).
 */
app.get('/', (req, res) => {
  getIndexPage().then((result) => {
    res.render('pages/index', result);
  }, (error) => {
    console.log(error);
    res.sendStatus(400);
  });
});

/**
 * Render requested page.
 */
app.get('/pages/:page', (req, res) => {
  getArticle('pages', req.params.page).then((result) => {
    res.render('pages/page', result);
  }, (error) => {
    console.log(error);
    res.sendStatus(400);
  });
});

/**
 * Render requested post.
 */
app.get('/posts/:post', (req, res) => {
  getArticle('posts', req.params.post).then((result) => {
    res.render('pages/page', result);
  }, (error) => {
    console.log(error);
    res.sendStatus(400);
  });
});

/**
 * List all posts with the same tag.
 */
app.get('/tags/:tag', (req, res) => {
  getIndexPage(req.params.tag).then((result) => {
    res.render('pages/search', result);
  }, (error) => {
    console.log(error);
    res.sendStatus(400);
  });
});

/**
 * Login into administration and show 'overview' page.
 */
app.get('/login', (req, res) => {
  res.render('admin/pages/login');
});

/**
 * Authenticate (login) the user so the user can enter the admin section.
 */
app.post('/authenticate', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if(username && username === config.username && password && password === config.password) {
    req.session.loggedIn = true;
    saveLastLogin(req.ip);
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

/**
 * Logout the user.
 */
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(config.appPort, () => {
  console.log('ixCMS listening on port ' + config.appPort + '!');
});
