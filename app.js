/**
 * Functions and routes which don't require the user to be logged in.
 *
 * @module app
 */

let express = require('express');
let bodyParser = require('body-parser');
let mongodb = require('mongodb');
let session = require('express-session');
let MongoClient = mongodb.MongoClient;
let app = express();
let admin = require('./js/admin');
let config = require('./js/config');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
// app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: config.sessionSecret,
  resave: true,
  saveUninitialized: true,
}));
app.set('view engine', 'ejs');
app.use('/admin', admin);


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
 */
function getPostList(db) {
  return new Promise((resolve, reject) => {
    db.collection('posts').find({}, {text: false}).toArray((error, result) => {
      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    });
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
          db.collection(collection).findOne({url: url}),
          getMenu(db),
        ])
          .then(([article, menu]) => {
            db.close();
            article.menu = menu;
            resolve(article);
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
 */
function getIndexPage() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(config.databaseUrl, (error, db) => {
      if (error) {
        console.log('Unable to connect to the mongoDB server. Error:', error);
        reject(new Error(error));
      } else {
        Promise.all([
          getPostList(db),
          getMenu(db),
        ])
          .then(([posts, menu]) => {
            db.close();
            resolve({posts, menu});
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
  res.redirect('/login');
});

app.listen(config.appPort, () => {
  console.log('ixCMS listening on port 3000!');
});
