apprentissage.config(function($routeProvider){
   $routeProvider
      .when("/home",{templateUrl: "partials/home.html"})
      .when("/about",{templateUrl: "partials/about.html"})
      .when("/learn",{templateUrl: "partials/learn.html",controller="speechRecognizer"})
      .when("/exam",{templateUrl: "partials/exam.html"})
      .otherwise({redirectTo: '/home'});
});