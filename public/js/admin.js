var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope) {
    $scope.name = "Doe";
    console.log("it works");
});
