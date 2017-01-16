var apprentissage = angular.module("apprentissage", ["ngRoute"]);

apprentissage.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when("/home", {
            templateUrl: "partials/home.html"
        })
        .when("/about", {
            templateUrl: "partials/about.html"
        })
        .when("/learn/:language/:niveau", {
            templateUrl: "partials/learn.html",
            controller: "learn"
        })
        .when("/exam/:language/:niveau", {
            templateUrl: "partials/exam.html",
            controller: "exams"
        })
        .otherwise({
            redirectTo: '/home'
        });
});

apprentissage.factory('shared', function($routeParams) {
    var specific = false;
    var srpp = false;
    var down = 0;
    var total = -1;
    var info = "this is a test";
    var error = 1;
    var connected = false;
    return {
        checkSpecfication: function() {
            specific = false;
            if ($routeParams.language == "default" && $routeParams.niveau == 0) {
                specific = false;
            } else {
                specific = true;
            }
            return specific;
        },
        // Show the list of the supported languages
        getSupportedLanguages: function() {
            window.plugins.speechrecognizer.getSupportedLanguages(function(languages) {
                // display the json array
                return languages;
            }, function(error) {
                return "Could not retrieve the supported languages : " + JSON.stringify(error);
            });
        },
        // Check to see if a recognition activity is present
        checkSpeechRecognition: function() {
            window.plugins.speechrecognizer.checkSpeechRecognition(function() {
                srpp = true;
                return srpp;
            }, function() {
                srpp = false;
                return srpp;
            });
        },
        downloaded: function(){
            down++;
        },
        initdownloaded: function(){
            down = 0;
            total = -1;
        },
        getdownloaded(){
        	return down;
        },
        setfileList(data){
        	total = data;
        },
        getfileList(){
        	return total;
        }
    };
});

apprentissage.constant("FTP", {
    ftp: {
        ADDRESS: 'ftp.byethost8.com', // domain name is also supported, e.g. 'one.two.com'
        USERNAME: 'b8_19228011',
        PASSWORD: 'marwaketiti',
        HOME_PATH: '/' // any ftp start path you want, e.g. '/', '/myFtpHome/'...
    },
    remote: {
        changes: '/htdocs/Changes.json', // the dir for mkdir test, e.g. '/myFtpHome/testDir/'
        appDB: '/htdocs/AppDB.json',
        img: '/htdocs/img/'
    },
    local: {
        changes: '///storage/emulated/0/Android/data/com.cordova.apprentissage/files/Changes.json', // the file for upload test, e.g. '/tmp/test.mp4'
        appDB: '///storage/emulated/0/Android/data/com.cordova.apprentissage/files/AppDB.json',
        img: '///storage/emulated/0/Android/data/com.cordova.apprentissage/files/',
        success: 'file:///android_asset/www/sounds/soundSuccess.mp3',
        failure: 'file:///android_asset/www/sounds/soundFailure.mp3'
    }
})

apprentissage.controller("navCtrl", function($scope) {
    $scope.menu = 'home';
})
apprentissage.controller("exams", function($scope, shared, $http, $routeParams, FTP) {
    $scope.specific = shared.checkSpecfication();
    $scope.languageRP = $routeParams.language;
    $scope.niveauRP = $routeParams.niveau;

    $scope.appDB = "";
    $scope.steps = 2;
    $scope.currentStep = -1;
    $scope.spoken = [];
    $scope.languages = [];
    $scope.language = "";
    $scope.niveaux = [];
    $scope.niveau = "";
    $scope.exerciceSteps = 0;
    $scope.exCurrentStep = 0;
    $scope.currentExercice = "";
    $scope.spokenCorrectly = false;
    $scope.evaluation = -1;
    $scope.successSound = "soundSuccess.mp3";
    $scope.srpp = false;
    $scope.loading = false;
    $scope.loaded = false;
    $scope.change = false;
    $scope.exists = false;
    $scope.score = 0;
    $scope.info = "";
    $scope.connected = false;
    $scope.error = 0;
    $scope.goBack = function() {
        $scope.currentStep--;
        $scope.consigne = -1;
        $scope.exCurrentStep = 0;
        $scope.evaluation = -1;
    }
    $scope.changes = function() {
        var permissions = window.cordova.plugins.permissions;
        permissions.requestPermission(permissions.WRITE_INTERNAL_STORAGE, null, null);
        if ($scope.loaded == false) {
            if (window.cordova && window.cordova.plugin && window.cordova.plugin.ftp) {
                window.cordova.plugin.ftp.connect(FTP.ftp.ADDRESS.toString(), FTP.ftp.USERNAME.toString(), FTP.ftp.PASSWORD.toString(), function(ok) {
                    $scope.error = 1;
                    $scope.info = "Verifying Data Updates ...";
                    window.cordova.plugin.ftp.download(FTP.local.changes.toString(), FTP.remote.changes.toString(), function(percent) {
                        if (percent == 1) {
                            //alert("FTP Download Finished ");
                            $http.get(FTP.local.changes.toString()).success(function(dataC) {
                                //alert("changes");
                                $http({
                                    method: 'GET',
                                    url: FTP.local.appDB.toString()
                                }).then(function successCallback(response) {
                                    // this callback will be called asynchronously
                                    // when the response is available
                                    //alert("succuss");
                                    $scope.appDB = response.data;
                                    $scope.languages = Object.keys($scope.appDB.data);
                                    //alert($scope.languages);
                                    /*$scope.currentStep = 0;
                                    $scope.loaded = true;*/
                                    $scope.exists = true;
                                    var chge = dataC;

                                    //alert(chge.version+" = "+$scope.appDB.version);
                                    if (chge.version == $scope.appDB.version) {
                                        $scope.currentStep = 0;
                                        $scope.error = 0;
                                        $scope.info = "Up to date";
                                        if ($scope.specific == true) {
                                            $scope.saveLanguage($scope.languageRP);
                                            $scope.saveLevel($scope.niveauRP);
                                            $scope.apply();
                                        }
                                        $scope.loaded = true;
                                        $scope.error = 0;
                                    } else {
                                        $scope.error = 1;
                                        $scope.info = "Updating ...";
                                        $scope.initialize();
                                    }
                                }, function errorCallback(response) {
                                    $scope.error = 1;
                                    $scope.info = "Downloading Data ...";
                                    $scope.initialize();
                                });

                            });

                            // 6. delete one file on ftp server
                        } else {
                            //alert("FTP Download Percent = " + percent * 100 + "%");
                        }
                    }, function(error) {
                        $scope.error = 2;
                        $scope.info = "can't Download ... trying again";
                        $scope.changes();

                    });
                }, function(error) {
                    $scope.error = 2;
                    $scope.info = "can't connect to FTP server ";
                    $scope.changes();
                });
            }
        }

    }
    $scope.checkConnection = function() {
        var networkState = navigator.connection.type;

        var states = {};
        states[Connection.UNKNOWN] = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI] = 'WiFi connection';
        states[Connection.CELL_2G] = 'Cell 2G connection';
        states[Connection.CELL_3G] = 'Cell 3G connection';
        states[Connection.CELL_4G] = 'Cell 4G connection';
        states[Connection.CELL] = 'Cell generic connection';
        states[Connection.NONE] = 'No network connection';

        if (states[networkState] == 'No network connection') {
            $scope.connected = false;
            $scope.info = "You're no connected, can't retrieve data";
            $scope.error = 2;

        } else {
            $scope.connected = true;
            $scope.info = "Connected";
            $scope.error = 1;
            $scope.changes();
        }
    }
    $scope.checkConnection();
    $scope.initialize = function() {

        var permissions = window.cordova.plugins.permissions;
        permissions.requestPermission(permissions.WRITE_INTERNAL_STORAGE, null, null);
        if ($scope.loaded == false) {
            if (window.cordova && window.cordova.plugin && window.cordova.plugin.ftp) {
                window.cordova.plugin.ftp.connect(FTP.ftp.ADDRESS.toString(), FTP.ftp.USERNAME.toString(), FTP.ftp.PASSWORD.toString(), function(ok) {
                    $scope.error = 1;
                    $scope.info = "Download Data ...";
                    window.cordova.plugin.ftp.download(FTP.local.appDB.toString(), FTP.remote.appDB.toString(), function(percent) {
                        if (percent == 1) {
                            //alert("FTP Download Finished ");

                            $http.get(FTP.local.appDB.toString()).success(function(data) {
                                $scope.appDB = data;
                                $scope.languages = Object.keys($scope.appDB.data);
                                $scope.currentStep = 0;
                                //alert("up to date");
                                //alert($scope.specific);
                                if ($scope.specific == true) {
                                    $scope.saveLanguage($scope.languageRP);
                                    $scope.saveLevel($scope.niveauRP);
                                    $scope.apply();
                                }

                                $scope.loaded = true;
                                $scope.error = 0;
                            });

                            // 6. delete one file on ftp server
                        } else {
                            //alert("FTP Download Percent = " + percent * 100 + "%");
                        }
                    }, function(error) {
                        $scope.error = 1;
                        $scope.info = "can't Download ... trying again";
                        $scope.initialize();

                    });
                }, function(error) {
                    $scope.error = 1;
                    $scope.info = "can't connect to FTP server ... trying again";
                    $scope.initialize();
                });
            }
        }

    }




    $scope.saveLanguage = function(data) {

        if (data != null && data != "") {
            //alert(data);
            $scope.language = data;
            $scope.niveaux = Object.keys($scope.appDB.data[$scope.language].niveaux);
            $scope.currentStep = 1;
            //alert(Object.keys($scope.appDB.data[$scope.language]["exercices"]));
        }

    }

    $scope.saveLevel = function(data) {

        if (data != null && data != "") {
            //alert(data);
            $scope.niveau = data;

            $scope.exerciceSteps = Object.keys($scope.appDB.data[$scope.language].niveaux[$scope.niveau].exercices).length;
            //alert(Object.keys($scope.appDB.data[$scope.language]["exercices"]));
            $scope.next(false);
            $scope.srpp = shared.checkSpeechRecognition();
            if ($scope.srpp == false) {
                $scope.error = 2;
                $scope.info = "Your device doesn't support speech recognition";
            }
            $scope.currentStep = 2;
            $scope.score = 0;

        }

    }

    $scope.next = function(data) {
        if ($scope.evaluation != -1 && data == true && $scope.exCurrentStep < $scope.exerciceSteps) {
            //$scope.spokenCorrectly == true &&
            $scope.exCurrentStep++;
            $scope.spokenCorrectly = false;
        }

        $scope.evaluation = -1;
        $scope.spokenCorrectly = false;
        $scope.currentExercice = $scope.appDB.data[$scope.language].niveaux[$scope.niveau].exercices[Object.keys($scope.appDB.data[$scope.language].niveaux[$scope.niveau].exercices)[$scope.exCurrentStep]];
        //alert(Object.keys($scope.appDB.data[$scope.language]["exercices"])[$scope.exCurrentStep]);


    }

    $scope.back = function() {
        if ($scope.exCurrentStep > 0) {
            $scope.exCurrentStep--;
        }
        $scope.evaluation = -1;
        $scope.spokenCorrectly = false;
        $scope.currentExercice = $scope.appDB.data[$scope.language].niveaux[$scope.niveau].exercices[Object.keys($scope.appDB.data[$scope.language].niveaux[$scope.niveau].exercices)[$scope.exCurrentStep]];
        //alert(Object.keys($scope.appDB.data[$scope.language]["exercices"])[$scope.exCurrentStep]);

    }

    $scope.calculateProgress = function() {
        return ($scope.exCurrentStep * 100) / $scope.exerciceSteps;
    }
    $scope.speakText = function(data) {
        TTS.speak({
            text: data,
            locale: $scope.language,
            rate: 0.75
        }, function() {
            //alert('success');
        }, function(reason) {

        });

    }

    $scope.playaudio = function(url) {
        // Play the audio file at url
        var my_media = new Media(url.toString(),
            // success callback
            function() {
                //alert("playAudio():Audio Success");
            },
            // error callback
            function(err) {
                //alert("playAudio():Audio Error: " + err);
            }
        );
        // Play audio
        my_media.play({
            numberOfLoops: 1
        });
    }

    $scope.simulatesuccuss = function() {
        $scope.spokenCorrectly = true;
        $scope.evaluation = true;
        //$scope.playaudio("sounds/soundSuccess.mp3");
    }

    $scope.simulatefailure = function() {
        $scope.spokenCorrectly = false;
        $scope.evaluation = false;
    }
    $scope.recognizeSpeech = function(exam) {

        var maxMatches = 10;
        //var promptString = "Speak now"; // optional
        var language = $scope.language; // optional
        window.plugins.speechrecognizer.startRecognize(function(result) {
            $scope.error = 0;
            $scope.spoken = result;
            var boo = false;
            var cr = $scope.currentExercice.value.toLowerCase();
            for (var i in result) {
                var sug = result[i].toLowerCase();
                if (boo == false) {
                    boo = cr == sug;
                    if (boo == true) {
                        $scope.spokenCorrectly = true;
                        $scope.evaluation = true;
                        $scope.score++;
                        $scope.playaudio(FTP.local.success);
                        //$scope.playaudio("sounds/soundSuccess.mp3");
                    }
                }
                //alert(sug +" = "+cr+" ? "+boo );

            }
            if (boo == false) {
            	$scope.playaudio(FTP.local.failure);
                $scope.spokenCorrectly = false;
                $scope.evaluation = false;
            }
            $scope.$apply();
        }, function(errorMessage) {
            $scope.error = 2;
            $scope.info = "didn't catch what you've said";
        }, maxMatches /*, promptString*/ , language);
    }


})
apprentissage.controller("learn", function($scope, shared, $http, $routeParams, FTP) {
    $scope.specific = shared.checkSpecfication();
    $scope.languageRP = $routeParams.language;
    $scope.niveauRP = $routeParams.niveau;

    $scope.appDB = "";
    $scope.steps = 2;
    $scope.currentStep = -1;
    $scope.spoken = [];
    $scope.languages = [];
    $scope.language = "";
    $scope.niveaux = [];
    $scope.niveau = "";
    $scope.exerciceSteps = 0;
    $scope.exCurrentStep = 0;
    $scope.currentExercice = "";
    $scope.spokenCorrectly = false;
    $scope.evaluation = -1;
    $scope.consigne = -1;
    $scope.consignes = 0;
    $scope.successSound = "soundSuccess.mp3";
    $scope.srpp = false;
    $scope.loading = false;
    $scope.loaded = false;
    $scope.change = false;
    $scope.exists = false;
    $scope.isimage = false;
    $scope.image = "";
    $scope.isnextlevel = false;
    $scope.newNiveau = "";
    $scope.info = "";
    $scope.connected = false;
    $scope.error = 0;
    $scope.goBack = function() {
        $scope.currentStep--;
        $scope.consigne = -1;
        $scope.exCurrentStep = 0;
        $scope.evaluation = -1;
    }
    $scope.changes = function() {

        var permissions = window.cordova.plugins.permissions;
        permissions.requestPermission(permissions.WRITE_INTERNAL_STORAGE, null, null);
        if ($scope.loaded == false) {
            if (window.cordova && window.cordova.plugin && window.cordova.plugin.ftp) {
                window.cordova.plugin.ftp.connect(FTP.ftp.ADDRESS.toString(), FTP.ftp.USERNAME.toString(), FTP.ftp.PASSWORD.toString(), function(ok) {
                    $scope.error = 1;
                    $scope.info = "Verifying data updates ...";
                    window.cordova.plugin.ftp.download(FTP.local.changes.toString(), FTP.remote.changes.toString(), function(percent) {
                        if (percent == 1) {
                            //alert("FTP Download Finished ");
                            $http.get(FTP.local.changes.toString()).success(function(dataC) {
                                //alert("changes");
                                $http({
                                    method: 'GET',
                                    url: FTP.local.appDB.toString()
                                }).then(function successCallback(response) {
                                    // this callback will be called asynchronously
                                    // when the response is available
                                    //alert("succuss");
                                    $scope.appDB = response.data;
                                    $scope.languages = Object.keys($scope.appDB.data);
                                    //alert($scope.languages);
                                    /*$scope.currentStep = 0;
                                    $scope.loaded = true;*/
                                    $scope.exists = true;
                                    var chge = dataC;

                                    //alert(chge.version+" = "+$scope.appDB.version);
                                    if (chge.version == $scope.appDB.version) {
                                        $scope.currentStep = 0;
                                        $scope.error = 1;
                                        $scope.info = "Up to date";
                                        if ($scope.specific == true) {
                                            $scope.saveLanguage($scope.languageRP);
                                            $scope.saveLevel($scope.niveauRP);
                                            $scope.apply();
                                        }
                                        $scope.loaded = true;
                                        $scope.error = 0;
                                    } else {
                                        $scope.error = 1;
                                        $scope.info = "Updating ...";
                                        $scope.initialize();
                                    }
                                }, function errorCallback(response) {
                                    $scope.error = 1;
                                    $scope.info = "Downloading data ...";
                                    $scope.initialize();
                                });

                            });

                            // 6. delete one file on ftp server
                        } else {
                            //alert("FTP Download Percent = " + percent * 100 + "%");
                        }
                    }, function(error) {
                        $scope.error = 1;
                        $scope.info = "Can't download data ... trying again";
                        $scope.changes();

                    });
                }, function(error) {
                    $scope.error = 1;
                    $scope.info = "Can't connect to FTP server ... trying again";
                    $scope.changes();
                });
            }
        }

    }

    $scope.checkConnection = function() {
        var networkState = navigator.connection.type;

        var states = {};
        states[Connection.UNKNOWN] = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI] = 'WiFi connection';
        states[Connection.CELL_2G] = 'Cell 2G connection';
        states[Connection.CELL_3G] = 'Cell 3G connection';
        states[Connection.CELL_4G] = 'Cell 4G connection';
        states[Connection.CELL] = 'Cell generic connection';
        states[Connection.NONE] = 'No network connection';

        if (states[networkState] == 'No network connection') {
            $scope.connected = false;
            $scope.info = "You're no connected, can't retrieve data";
            $scope.error = 2;

        } else {
            $scope.connected = true;
            $scope.info = "Connected";
            $scope.error = 1;
            $scope.changes();
        }
    }
    $scope.checkConnection();

    $scope.initialize = function() {

        var permissions = window.cordova.plugins.permissions;
        permissions.requestPermission(permissions.WRITE_INTERNAL_STORAGE, null, null);
        if ($scope.loaded == false) {
            if (window.cordova && window.cordova.plugin && window.cordova.plugin.ftp) {
                window.cordova.plugin.ftp.connect(FTP.ftp.ADDRESS.toString(), FTP.ftp.USERNAME.toString(), FTP.ftp.PASSWORD.toString(), function(ok) {
                    $scope.error = 1;
                    $scope.info = "Downloading data";
                    window.cordova.plugin.ftp.download(FTP.local.appDB.toString(), FTP.remote.appDB.toString(), function(percent) {
                        if (percent == 1) {
                            //alert("FTP Download Finished ");

                            $http.get(FTP.local.appDB.toString()).success(function(data) {
                                $scope.appDB = data;
                                $scope.languages = Object.keys($scope.appDB.data);
                                $scope.loadImages();
                                $scope.currentStep = 0;
                                //alert("up to date");
                                //alert($scope.specific);
                                if ($scope.specific == true) {
                                    $scope.saveLanguage($scope.languageRP);
                                    $scope.saveLevel($scope.niveauRP);
                                    $scope.apply();
                                }
                                $scope.loaded = true;
                                $scope.error = 0;
                                $scope.info = "Looking goog :)";
                                
                            });

                            // 6. delete one file on ftp server
                        } else {
                            //alert("FTP Download Percent = " + percent * 100 + "%");
                        }
                    }, function(error) {
                        $scope.error = 1;
                        $scope.info = "Can't download ... trying again";
                        $scope.initialize();

                    });
                }, function(error) {
                    $scope.error = 1;
                    $scope.info = "Can't connect to FTP server ... trying again";
                    $scope.initialize();
                });
            }
        }

    }

    $scope.loadImages = function() {
                            $scope.error = 1;
                            $scope.info = "Downloading images ...";
                            
                                    if (window.cordova && window.cordova.plugin && window.cordova.plugin.ftp) {
            window.cordova.plugin.ftp.connect(FTP.ftp.ADDRESS.toString(), FTP.ftp.USERNAME.toString(), FTP.ftp.PASSWORD.toString(), function(ok) {
                //alert("FTP Connect State = "+ok);

                window.cordova.plugin.ftp.ls(FTP.remote.img.toString(), function(fileList) {
                    if (fileList && fileList.length > 0) {
                    	shared.setfileList(fileList.length);
                        //alert("xtest: ftp: the last file'name is " + fileList[fileList.length - 1].name);
                        //alert(fileList.length);
                        for (var i in fileList) {

                            window.cordova.plugin.ftp.download(FTP.local.img.toString() + fileList[i].name.toString(), FTP.remote.img.toString() + fileList[i].name.toString(), function(percent) {
                                if (percent == 1) {
                                	
                                    shared.downloaded();

                                    // 6. delete one file on ftp server
                                } else {
                                    //alert("FTP Download Percent = " + percent * 100 + "%");
                                    //alert($scope.images);
                                }
                            }, function(error) {
                            	shared.downloaded();
                                //$scope.loadImages();
                                //alert("can't Download");
                            });
                        }
                    } else {
                    	shared.setfileList(0);
                        //alert("xtest: ftp: no files");
                    }
                });

            }, function(error) {

                //$log.error("FTP connect error =" + JSON.stringify(error));
            });
        }
        while(shared.getdownloaded() < shared.getfileList()){
        	$scope.info = "Downloaded : "+shared.getdownloaded()+" / "+shared.getfileList();
        }
    }



    $scope.saveLanguage = function(data) {

        if (data != null && data != "") {
            //alert(data);
            $scope.language = data;
            $scope.niveaux = Object.keys($scope.appDB.data[$scope.language].niveaux);
            $scope.currentStep = 1;
            //alert(Object.keys($scope.appDB.data[$scope.language]["exercices"]));


        }

    }

    $scope.saveLevel = function(data) {
        if (data != null && data != "") {
            //alert(data);
            $scope.niveau = data;

            $scope.exerciceSteps = Object.keys($scope.appDB.data[$scope.language].niveaux[$scope.niveau].exercices).length;
            //alert(Object.keys($scope.appDB.data[$scope.language]["exercices"]));
            $scope.next(false);
            $scope.srpp = shared.checkSpeechRecognition();
            if ($scope.srpp == false) {
                $scope.error = 1;
                $scope.info = "Your device doesn't support speech recognition";
            }
            $scope.currentStep = 2;
            $scope.exCurrentStep = 0;

        }

    }

    $scope.next = function(data) {
        if ($scope.spokenCorrectly == true && data == true && $scope.exCurrentStep < $scope.exerciceSteps) {
            //$scope.spokenCorrectly == true &&
            $scope.exCurrentStep++;
            $scope.spokenCorrectly = false;
            //if($scope.exCurrentStep == $scope.exerciceSteps){
            var index = $scope.niveaux.indexOf($scope.niveau.toString());

            if (index < $scope.niveaux.length - 1) {
                $scope.isnextlevel = true;
                $scope.newNiveau = $scope.niveaux[index + 1];
            } else {
                $scope.isnextlevel = false;
            }
            //}
        }
        if ($scope.evaluation == -1 || $scope.evaluation == true) {
            $scope.evaluation = -1;
            $scope.spokenCorrectly = false;
            $scope.currentExercice = $scope.appDB.data[$scope.language].niveaux[$scope.niveau].exercices[Object.keys($scope.appDB.data[$scope.language].niveaux[$scope.niveau].exercices)[$scope.exCurrentStep]];
            $scope.consignes = $scope.currentExercice.consignes.length;
        }
        //alert(Object.keys($scope.appDB.data[$scope.language]["exercices"])[$scope.exCurrentStep]);


    }

    $scope.back = function() {
        if ($scope.exCurrentStep > 0) {
            $scope.exCurrentStep--;
        }
        $scope.consigne = -1;
        $scope.evaluation = -1;
        $scope.spokenCorrectly = false;
        $scope.currentExercice = $scope.appDB.data[$scope.language].niveaux[$scope.niveau].exercices[Object.keys($scope.appDB.data[$scope.language].niveaux[$scope.niveau].exercices)[$scope.exCurrentStep]];
        //alert(Object.keys($scope.appDB.data[$scope.language]["exercices"])[$scope.exCurrentStep]);

    }

    $scope.calculateProgress = function() {
        return ($scope.exCurrentStep * 100) / $scope.exerciceSteps;
    }
    $scope.speakText = function(data) {
        TTS.speak({
            text: data,
            locale: $scope.language,
            rate: 0.75
        }, function() {
            //alert('success');
        }, function(reason) {

        });

    }

    $scope.playaudio = function(url) {
        // Play the audio file at url
        var my_media = new Media(url.toString(),
            // success callback
            function() {
                //alert("playAudio():Audio Success");
            },
            // error callback
            function(err) {

            }
        );
        // Play audio
        my_media.play({
            numberOfLoops: 1
        });
    }

    $scope.simulatesuccuss = function() {
        $scope.spokenCorrectly = true;
        $scope.evaluation = true;
        //$scope.playaudio("sounds/soundSuccess.mp3");
        $scope.consigne = -1;
    }

    $scope.simulatefailure = function() {
        $scope.spokenCorrectly = false;
        $scope.evaluation = false;
        if ($scope.consigne < $scope.consignes) {
            $scope.consigne++;
        }
    }
    $scope.recognizeSpeech = function(exam) {

        var maxMatches = 10;
        //var promptString = "Speak now"; // optional
        var language = $scope.language; // optional
        window.plugins.speechrecognizer.startRecognize(function(result) {
            $scope.error = 0;
            $scope.spoken = result;
            var boo = false;
            var cr = $scope.currentExercice.value.toLowerCase();
            for (var i in result) {
                var sug = result[i].toLowerCase();
                if (boo == false) {
                    boo = cr == sug;
                    if (boo == true) {
                        $scope.spokenCorrectly = true;
                        $scope.evaluation = true;


                        //$scope.playaudio("sounds/soundSuccess.mp3");
                        $scope.consigne = -1;
                        $scope.playaudio(FTP.local.success);
                    }
                }
                //alert(sug +" = "+cr+" ? "+boo );

            }
            if (boo == false) {
            	$scope.playaudio(FTP.local.failure);
                $scope.spokenCorrectly = false;
                $scope.evaluation = false;
                if ($scope.consigne < $scope.consignes) {
                    $scope.consigne++;
                    $scope.$apply();
                    if ($scope.currentExercice.consignes[$scope.consigne].img) {
                        $scope.isimage = true;
                        $scope.image = "file:" + FTP.local.img.toString() + $scope.currentExercice.consignes[$scope.consigne].img.toString();
                        window.resolveLocalFileSystemURL($scope.image, function(oFile) {
                            oFile.file(function(readyFile) {
                                var reader = new FileReader();
                                reader.onloadend = function(evt) {
                                    $scope.image = evt.target.result;
                                };
                                reader.readAsDataURL(readyFile);
                            });
                        }, function(err) {
                            $scope.error = 1;
                            $scope.info = "Image not present waiting download";
                        });
                    } else {
                        $scope.isimage = false;
                    }
                }
            }
            $scope.$apply();
        }, function(errorMessage) {

        }, maxMatches /*, promptString*/ , language);
    }

});