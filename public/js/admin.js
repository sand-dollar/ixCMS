var app = angular.module('myApp', []);
app.controller('settingsCtrl', function ($scope, $http) {
  $scope.settings = {};

  $http.get('/admin/settings')
    .then(function (result) {
      console.log(result.data);
      $scope.settings = result.data;
    }, function (error) {
      console.log(error);
    });

  $scope.saveSettings = function () {
    $http.post('/admin/settings', $scope.settings)
      .then(function (result) {
        // show "settings saved"
      }, function (error) {
        console.log(error);
      });
  }
});

app.controller('overviewCtrl', function ($scope, $http) {
});

app.controller('commentsCtrl', function ($scope, $http) {
});

app.controller('postsCtrl', function ($scope, $http) {
});

app.controller('pagesCtrl', function ($scope, $http) {
  $http.get('/admin/pages')
    .then(function (result) {
      console.log(result.data);
      $scope.pages = result.data;
    }, function (error) {
      console.log(error);
    });

});

app.controller('editorCtrl', function ($scope, $http, $window) {
  var simplemde = new SimpleMDE({  // BUG? We load JS files in a wrong order (simpleMDE at the end)
		element: document.getElementById("editorText"),
		status: false,
    toolbar: false,
    autoDownloadFontAwesome: false,  // FontAwesome is used for icons in toolbar
    spellChecker: false
	});

  $scope.editor = {};
  
  $scope.docSave = function () {
    $scope.editor.text = simplemde.value();
    $http.post('/admin/editor/save', $scope.editor)
      .then(function (result) {
        console.log('saved _id: ' + result.data._id);
        $scope.editor._id = result.data._id;
      }, function (error) {
        console.log(error);
      });
  }

  $scope.docExit = function () {  // BUG: Tohle reseni neudela reload stranky. Ale zase potrebujeme vedet, kam se vratit.
    $window.history.go(-1);
  }


});
