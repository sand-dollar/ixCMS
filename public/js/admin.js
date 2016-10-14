var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http) {


    $scope.settings = {};

  $http.get('/admin/settings')
      .then(function (result) {
          console.log(result.data);
        $scope.settings = result.data;
      }, function (error) {
        
    });


  $scope.saveSettings = function () {
      $http.post('/admin/settings', $scope.settings)
          .then(function (result) {
              // show "settings saved"
          });
  }

    
});
