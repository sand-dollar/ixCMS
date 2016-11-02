let app = angular.module('myApp', []);

app.controller('loginCtrl', function($scope, $http, $window) {
  $scope.login = {};

  // Authenticate the user
  $scope.submit = function() {
    $http.post('/authenticate', {username: $scope.login.username, password: $scope.login.password})
      .then(function(result) {
        $scope.loginFailed = false;
        $window.location.pathname = '/admin/menu/overview';
      }, function(error) {
        console.log(error);
        $scope.loginFailed = true;
      });
  };
});

app.controller('headerCtrl', function($scope, $window) {
  let pathname = $window.location.pathname;
  $scope.activeMenu = pathname.substr(pathname.lastIndexOf('/') + 1);
});

app.controller('settingsCtrl', function($scope, $http) {
  $scope.settings = {};

  $http.get('/admin/settings')
    .then(function(result) {
      $scope.settings = result.data;
    }, function(error) {
      console.log(error);
    });

  $scope.saveSettings = function() {
    $http.post('/admin/settings', $scope.settings)
      .then(function(result) {
        // show "settings saved"
      }, function(error) {
        console.log(error);
      });
  };
});

app.controller('overviewCtrl', function($scope, $http) {
  $http.get('/admin/overview')
    .then(function(result) {
      $scope.overview = result.data;
      console.log($scope.overview);
    }, function(error) {
      console.log(error);
    });
});

app.controller('commentsCtrl', function($scope, $http) {
});

app.controller('postsCtrl', function($scope, $http) {
  $http.get('/admin/posts')
    .then(function(result) {
      $scope.posts = result.data;
    }, function(error) {
      console.log(error);
    });

  $scope.deletePost = function(id) {
    // TODO show "really" dialog HERE
    $http.post('/admin/editor/posts/delete/' + id)
      .then(function(result) {
        console.log('post deleted');
        // Remove one element of array based on 'id' index.
        $scope.posts.splice($scope.posts.findIndex((element, id) => {
          return element._id === id;
        }), 1);
      });
  };
});

app.controller('pagesCtrl', function($scope, $http) {
  $http.get('/admin/pages')
    .then(function(result) {
      $scope.pages = result.data;
    }, function(error) {
      console.log(error);
    });

  $scope.deletePage = function(id) {
    // TODO show "really" dialog HERE
    $http.post('/admin/editor/pages/delete/' + id)
      .then(function(result) {
        console.log('page deleted');
        // Remove one element of array based on 'id' index.
        $scope.pages.splice($scope.pages.findIndex((element, id) => {
          return element._id === id;
        }), 1);
      });
  };
});

app.controller('editorCtrl', function($scope, $http, $window) {
  let simplemde = new SimpleMDE({  // BUG? We load JS files in a wrong order (simpleMDE at the end)
    element: document.getElementById('editorText'),
    status: false,
    toolbar: false,
    autoDownloadFontAwesome: false,  // FontAwesome is used for icons in toolbar
    spellChecker: false,
  });

  $scope.editor = {};
  $scope.editor.status = 'published';
  $scope.editor.allowComments = true;
  $scope.editor.date = new Date();

  let location = $window.location.pathname.split('/');
  $scope.editor._id = location[location.length - 1];
  $scope.collection = location[location.length - 2];

  $http.get('/admin/' + $scope.collection + '/' + $scope.editor._id)
    .then(function(result) {
      result.data.tags = result.data.tags.join(', ');
      Object.assign($scope.editor, result.data);
      simplemde.value($scope.editor.markdown);
    }, function(error) {
      console.log(error);
    });


  $scope.docSave = function() {
    $scope.editor.markdown = simplemde.value();
    $http.post('/admin/editor/' + $scope.collection + '/save', $scope.editor)
      .then(function(result) {
        console.log('saved');
      }, function(error) {
        console.log(error);
      });
  };

  $scope.docExit = function() {
    $window.location.replace('/admin/menu/' + $scope.collection);
  };
});
