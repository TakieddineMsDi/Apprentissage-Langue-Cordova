apprentissage.controller("speechRecognizer", function($scope) {

   $scope.taki = "this is taki";

    $scope.speakText = function(data) {
        $scope.taki = "it changed :)";
         TTS.speak({
            text: data,
            locale: 'en-GB',
            rate: 0.75
        }, function () {
            alert('success');
        }, function (reason) {
            alert(reason);
        });
    }

   $scope.recognizeSpeech = function () {
                var maxMatches = 5;
                var promptString = "Speak now"; // optional
                var language = "ar-TN";                     // optional
                window.plugins.speechrecognizer.startRecognize(function(result){
                    alert(result);
                }, function(errorMessage){
                    console.log("Error message: " + errorMessage);
                }, maxMatches, promptString, language);
    }
                // Show the list of the supported languages
    $scope.getSupportedLanguages = function () {
                window.plugins.speechrecognizer.getSupportedLanguages(function(languages){
                    // display the json array
                    alert(languages);
                }, function(error){
                    alert("Could not retrieve the supported languages : " + error);
                });
    }
                // Check to see if a recognition activity is present
    $scope.checkSpeechRecognition = function () {
                window.plugins.speechrecognizer.checkSpeechRecognition(function(){
                    alert('Speech Recogition is present! :D');
                }, function(){
                    alert('Speech Recogition not found! :(');
                });
    }
});
