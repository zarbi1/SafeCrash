const db = new PouchDB('SafeCrashDB.db', { adapter: 'cordova-sqlite' });
const deviceDB = new PouchDB('DeviceDB.db', { adapter: 'cordova-sqlite' });

let boundState = document.getElementById('boundState');
let boundBtn = document.getElementById('bound-btn');
let bigdiv = document.getElementById('globalDiv');
let alarmdiv = document.getElementById('alarm');
let smsState = document.getElementById('smsstatepara');
let callNow = false
let doCall = false
let callNowBtn = document.getElementById('callNow').addEventListener('click', () => {
    callNow = true;
});
let doNotCall = document.getElementById('doNotCall').addEventListener('click', () => {
    doNotCall = true;
});

let dropdown = document.getElementById('contact-list-ul');

let switchBound = document.getElementById('boudnSwitch');




let boundStateSwitch = false;


document.addEventListener('deviceready', onDeviceReady, true)
function onDeviceReady() {
    console.log('Device is Ready SafeCrash Starting...')
    const permissions = cordova.plugins.permissions;


    //Check app Permissions
    const permissionlist = [ //Add new permissions here
        permissions.READ_CONTACTS,
        permissions.VIBRATE,
        permissions.RECEIVE_BOOT_COMPLETED,
        permissions.SEND_SMS,
        permissions.BLUETOOTH,
        permissions.BLUETOOTH_ADMIN,
        permissions.FOREGROUND_SERVICE,
        permissions.FOREGROUND_SERVICE,
        permissions.WAKE_LOCK,
        permissions.WRITE_EXTERNAL_STORAGE,
        permissions.ACCESS_COARSE_LOCATION,
        permissions.ACCESS_FINE_LOCATION,
        permissions.ACCESS_BACKGROUND_LOCATION,
        permissions.SYSTEM_ALERT_WINDOW
    ]


    permissions.checkPermission(permissionlist, (sucess) => {
        if (!sucess.hasPermission) {
            permissions.requestPermissions(
                permissionlist,
                (state) => {
                    if (!state.hasPermission) console.log(state);
                }, (err) => {
                    console.log(err);
                }
            )
        };
        console.log('permission1 ok!');
    }, () => {

    });
    cordova.plugins.backgroundMode.requestForegroundPermission();






    //BackGround
    cordova.plugins.backgroundMode.enable(); //enable background mod
    cordova.plugins.backgroundMode.on('enable', () => {
        console.log('background enabled');
    });


    cordova.plugins.backgroundMode.on('activate', function () {
        cordova.plugins.backgroundMode.disableWebViewOptimizations();
        cordova.plugins.backgroundMode.excludeFromTaskList();
    });

    cordova.plugins.backgroundMode.setDefaults({
        title: 'SafeCrash Runnig in background',
        text: 'Trying to determine if you are alive or not',
        subText: '', // see https://developer.android.com/reference/android/support/v4/app/NotificationCompat.Builder.html#setSubText(java.lang.CharSequence)
        icon: 'icon', // this will look for icon.png in platforms/android/res/drawable|mipmap
        color: undefined, // hex format like 'F14F4D'
        resume: false,
        hidden: false,
        bigText: false,
        channelName: 'SafeCrash App', // Shown when the user views the app's notification settings
        channelDescription: "SafeCrash App can save your life consider contributing to it's git", // Shown when the user views the channel's settings
        allowClose: false, // add a "Close" action to the notification
        closeIcon: 'power', // An icon shown for the close action
        closeTitle: 'Close', // The text for the close action
        showWhen: false, //(Default: true) Show the time since the notification was created
        visibility: 'public', // Android only: one of 'private' (default), 'public' or 'secret' (see https://developer.android.com/reference/android/app/Notification.Builder.html#setVisibility(int))
    })

    cordova.plugins.backgroundMode.isIgnoringBatteryOptimizations((isIgnoring) => {
        if (isIgnoring) {
            console.log('batterie optimisation is ignored.')
        } else {
            navigator.notification.alert(
                "To correctly use SafeCrash you need to allow the app to ignore battery opimization if you didn't allowed it please restart the app and allow it.",  // message
                alertDismissed,         // callback
                'Info',           // title
                'Ok !'                  // buttonName
            );

            function alertDismissed() {
                //do nothing be must be here
            }
            cordova.plugins.backgroundMode.disableBatteryOptimizations();
        }
    })






    //BLE
    bleEn(); //check if ble is enabled
    autoconnect()






    //Autostart | I dont know if it's working
    cordova.plugins.autoStart.enable();




}
let limiter = 0;


//EVENTS
//to prevent gps to stop working









async function getDeviceID() {
    let get = new Promise((res, rej) => {
        deviceDB.allDocs({
            include_docs: true,
            attachments: true
        }).then((result) => {
            console.log("result is: ", result.rows[0].id)
            res(result.rows[0].id)
        }).catch((err) => {
            console.log(err);
            res(null)
        })
    })

    return await get;

}

async function autoconnect() {
    let tempID = await getDeviceID();
    console.log('tempid: ', tempID)
    if (tempID !== '' || tempID !== null) {
        boundStateSwitch = false;
        boundStateSwitch.checked = true;
    }
    //launching auto connect to check if we didn't crash into a tree (^人^)
    if (tempID !== '' && !boundStateSwitch || tempID !== null && !boundStateSwitch) { //we will need to add an other check to see if we recived an information about a bound mode
        console.log('starting autoconnect');

        ble.autoConnect(tempID, (device) => {
            if (limiter != 0) {
                console.log("bug detected it's not a crash")
            } else {

                //CRASH DETECTED WE NEED TO SEND SMS
                console.log('connected to:', device)
                console.log('crash detected');

                //TEST ZONE:

                //getAdapterInfo
                cordova.plugins.backgroundMode.unlock();
                alarm();









            }

        }, (device) => {
            console.log('safecrash disconnected')//The connectCallback is buged so I am going to detect if the device is disconnected
            bluetoothle.disconnect((suc) => {
                console.log('disconnect sucess: ', suc);
            }, (err) => {
                console.log('disconnect err: ', err);
            }, { address: tempID });
            ble.stopScan();//stoping the scan
        });


    } else {
        console.log('bound switch is on');
    }

}



//Adding contacts
function addContacts() {
    navigator.contacts.pickContact((contact) => {
        let contactSet = {
            _id: contact.id,
            name: contact.displayName,
            phone: contact.phoneNumbers[0].value
        };



        db.put(contactSet, (err, result) => {
            if (!err) {
                console.log('Sucess !')
                window.location.reload();
            } else {
                console.error(err);

            }
        })


    })


}



//if the button to clear the database is pressed
async function clearDB() {
    deviceDB.allDocs({
        include_docs: true,
        attachments: true
    }).then((result) => {
        for (let x = 0; x < result.rows.length; x++) {
            console.log(result.rows[x].doc._id);
            deviceDB.get(result.rows[x].id).then((doc) => {
                deviceDB.remove(doc);
            })

        }

    }).catch((err) => {
        console.log('NEW ERR: ' + err);
    });

}


//check if safeCrash is bounded
let bounded = false;
let deviceID = '';
async function checkBound() {

    deviceDB.allDocs({
        include_docs: true,
        attachments: true
    }).then((result) => {
        for (let x = 0; x < result.rows.length; x++) {
            console.log(result.rows[x].doc._id);
            if (result.rows[x].doc.name == "SafeCrash127EBoundMode" || result.rows[x].doc.name == "SafeCrash127E") {
                console.log('Bounded !')
                boundState.innerHTML = "<strong>SafeCrash Bounded !</strong>"
                boundBtn.innerHTML = "ReBound"
                boundBtn.style.display = "initial";
                bounded = true;





            }


        }

    }).catch((err) => {
        console.log('NEW ERR: ' + err);
    });


    //When the arduino code will be finished I will add a function to check if safeCrash is in bound mode or not

    //To prevent a bug where SafeCrash is activating the crash mod only if it's the first time that the device is bouded










}






function bleEn() {
    ble.isEnabled(

        () => {
            console.log('Bluetooth enabled');
            checkBound();
        },
        () => {
            boundState.innerHTML = "Please Turn on your Bluetooth before using SafeCrash"
            boundBtn.style.display = "none"; //Hidding the bound button
            ble.enable(() => {
                //if the user enable the ble after the notification
                console.log('Bluetooth enabled')
                boundState.innerHTML = ""
                //show or hide bound button
                checkBound() //Ble enabled so we need to check if SafeCrash is connected or not.
                if (bounded) {
                    boundState.innerHTML = "<strong>SafeCrash Bounded !</strong>"
                    boundBtn.innerHTML = "ReBound"
                    boundBtn.style.display = "initial";

                } else {
                    boundState.innerHTML = "Please Bound SafeCrash before using the app."
                    boundBtn.style.display = "initial";
                    boundStateSwitch = false; //Device is not bounded so we are activating the checkbox
                    switchBound.checked = true;
                }

            })
        }
    );
}







async function Bound() {
    clearDB().then(  //we need to clear the DB to not have any error.
        ble.scan([], 25, (devices) => {
            console.log(devices);
            let deviceId = devices.id;

            if (devices.name == "SafeCrash127EBoundMode" || devices.name == "SafeCrash127E") {
                let deviceInfo = {
                    _id: deviceId,
                    name: devices.name
                };


                deviceDB.put(deviceInfo, (err, result) => {
                    if (!err) {
                        console.log('Registered id in db')
                    } else if (err.name == 'conflict') {
                        deviceDB.get(deviceId).then((doc) => { //doc is the result of the db.get(_id)
                            deviceDB.remove(doc).then(() => { //removing for the db
                                deviceDB.put(deviceInfo, (err, result) => {
                                    if (!err) {
                                        console.log("device updated")
                                    } else {
                                        console.log(err)
                                    }
                                })
                            })
                        })
                    } else {
                        console.log(err);
                    }
                })

                navigator.notification.alert(
                    "SafeCrash is now Bounded ! Please stop your SafeCrash device BEFORE closing this message !",  // message
                    alertDismissed,         // callback
                    'SafeCrash Bounded',           // title
                    'Ok !'                  // buttonName
                );
                function alertDismissed() {
                    window.location.reload() //reload the page
                }
                ble.stopScan((sucess) => {
                    console.log('Scan Stopped ', sucess);
                }, (fail) => {
                    console.log('Cant stop scan ', fail);
                });
            }


        }, (fail) => {
            console.log("SafeCrash Scan Fail", fail);
        })
    )



}


function onloadJS() {





    function loadContacts() {
        //Getting saved contacts and diplaying them
        db.allDocs({
            include_docs: true,
            attachments: true
        }).then(function (result) {
            console.log(result);
            for (let e = 0; e < result.rows.length; e++) {
                let list = document.createElement('li');
                let deleteButton = document.createElement('button');

                //Clase Names
                deleteButton.className = "button";


                //Attributes
                deleteButton.setAttribute("onclick", 'deleteContact("' + result.rows[e].doc._id + '")')


                //Inner HTML
                list.innerHTML = "<strong>" + result.rows[e].doc.name + "</strong>";
                deleteButton.innerHTML = 'Delete';

                dropdown.appendChild(list);
                dropdown.appendChild(deleteButton);

            }
        }).catch(function (err) {
            console.log(err);
        });
    }

    loadContacts();

}



//DELETE BUTTON
function deleteContact(contactID) {

    db.get(contactID).then((doc) => { //doc is the result of the db.get(_id)
        db.remove(doc).then(() => { //removing for the db
            window.location.reload(true); //reload the page
        })
    })
}



//HELP BUTTON
function infonotification() {
    navigator.notification.alert(
        'To correctly use SafeCrash you need to add emergency contacts, they will be automaticly contacted if you have an accident',  // message
        alertDismissed,         // callback
        'Help',           // title
        'Ok !'                  // buttonName
    );

    function alertDismissed() {
        //do nothing be must be here
    }
}






//will be added soon
function alarm() {
    let sound = {
        track: {
            src: 'file:///android_asset/www/media/annoying-alarm.mp3',
            title: 'Fight Club Rules',
            volume: 30 //set to max volume
        },
        media: null,
        status: {
            '0': 'MEDIA_NONE',
            '1': 'MEDIA_STARTING',
            '2': 'MEDIA_RUNNING',
            '3': 'MEDIA_PAUSED',
            '4': 'MEDIA_STOPPED'
        },
        err: {
            '1': 'MEDIA_ERR_ABORTED',
            '2': 'MEDIA_ERR_NETWORK',
            '3': 'MEDIA_ERR_DECODE',
            '4': 'MEDIA_ERR_NONE_SUPPORTED'
        }
    }

    let src = sound.track.src;
    sound.media = new Media(src, () => {
        console.log('sound played succesfully')
    }, (err) => {
        console.warn('SafeCrash Failure');
        console.log(err);
    }, (statechange) => {
        console.log('media status is now ' + sound.status[status]);
    });



    bigdiv.style.display = "none";// we need to hide everything extept the alarm
    alarmdiv.style.display = "contents"//displaying the alarm

    const FULL_DASH_ARRAY = 283;
    const WARNING_THRESHOLD = 10;
    const ALERT_THRESHOLD = 5;

    const COLOR_CODES = {
        info: {
            color: "green"
        },
        warning: {
            color: "orange",
            threshold: WARNING_THRESHOLD
        },
        alert: {
            color: "red",
            threshold: ALERT_THRESHOLD
        }
    };

    const TIME_LIMIT = 15;
    let timePassed = 0;
    let timeLeft = TIME_LIMIT;
    let timerInterval = null;
    let remainingPathColor = COLOR_CODES.info.color;

    document.getElementById("countdown").innerHTML = `
    <div class="base-timer">
    <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g class="base-timer__circle">
        <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
        <path
            id="base-timer-path-remaining"
            stroke-dasharray="283"
            class="base-timer__path-remaining ${remainingPathColor}"
            d="
            M 50, 50
            m -45, 0
            a 45,45 0 1,0 90,0
            a 45,45 0 1,0 -90,0
            "
        ></path>
        </g>
    </svg>
    <span id="base-timer-label" class="base-timer__label">${formatTime(
        timeLeft
    )}</span>
    </div>
    `;

    startTimer();



    function startTimer() {
        sound.media.play({ numberOfLoops: 9999 }) //looping for 15 sec
        timerInterval = setInterval(() => {
            timePassed = timePassed += 1;
            timeLeft = TIME_LIMIT - timePassed;
            document.getElementById("base-timer-label").innerHTML = formatTime(
                timeLeft
            );
            setCircleDasharray();
            setRemainingPathColor(timeLeft);

            //Emergency Buttons
            if (callNow) { //Call now btn have been pressed
                Crash(); //calling the crash function
                bigdiv.style.display = "contents";// showing the page after countdown
                alarmdiv.style.display = "none"//hidding the alarm
                sound.media.stop()
                timeLeft = 0; //setting time left to 0 beacuse if the timer is at 10 sec remaining it will excature Crash() 11 times

            } else if (doNotCall) {
                sound.media.stop()
                bigdiv.style.display = "contents";// showing the page after countdown
                alarmdiv.style.display = "none"//hidding the alarm
            }

            if (timeLeft === 0) {
                sound.media.stop()
                onTimesUp();

            }
        }, 1000);
    }



    function onTimesUp() {
        clearInterval(timerInterval);
        console.log('time up')

        if (doNotCall) {
            console.log('do Not call pressed')
            doNotCall = false
        } else if (callNow) {
            console.log('Call now pressed no need to resend sms');
            callNow = false
        } else {
            Crash();// calling the crash function / No button pressed
            bigdiv.style.display = "contents";// showing the page after countdown
            alarmdiv.style.display = "none"//hidding the alarm
        }

    }

    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        let seconds = time % 60;

        if (seconds < 10) {
            seconds = `0${seconds}`;
        }

        return `${minutes}:${seconds}`;
    }

    function setRemainingPathColor(timeLeft) {
        const { alert, warning, info } = COLOR_CODES;
        if (timeLeft <= alert.threshold) {
            document
                .getElementById("base-timer-path-remaining")
                .classList.remove(warning.color);
            document
                .getElementById("base-timer-path-remaining")
                .classList.add(alert.color);
        } else if (timeLeft <= warning.threshold) {
            document
                .getElementById("base-timer-path-remaining")
                .classList.remove(info.color);
            document
                .getElementById("base-timer-path-remaining")
                .classList.add(warning.color);
        }
    }

    function calculateTimeFraction() {
        const rawTimeFraction = timeLeft / TIME_LIMIT;
        return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
    }

    function setCircleDasharray() {
        const circleDasharray = `${(
            calculateTimeFraction() * FULL_DASH_ARRAY
        ).toFixed(0)} 283`;
        document
            .getElementById("base-timer-path-remaining")
            .setAttribute("stroke-dasharray", circleDasharray);
    }

}








//crash function that send the request to send SMS
function Crash() {
    db.allDocs({
        include_docs: true,
        attachments: true
    }).then((result) => {
        for (let x = 0; x < result.rows.length; x++) {
            let phoneNumStrMsg = result.rows[x].doc.phone;
            phoneNumStrMsg = phoneNumStrMsg.replace(/-/g, "");
            phoneNumStrMsg = phoneNumStrMsg.replace(/+33/g, "");
            let name = result.rows[x].doc.name;

            let data = {
                name: name,
                phone: phoneNumStrMsg
            }
            console.log('sendding msg to:', result.rows[x].doc.name);
            getCoordinateAndSendMessage(data); //Send a message to all registred contacts


        }

    }).catch((err) => {
        console.log(err);
    });
}












//Send message and get position
async function getCoordinateAndSendMessage(phoneNumber) {
    let get = new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition((position) => {

            var coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }
            this.coordinates = coordinates;
            res(coordinates);
        }, (err) => {
            console.log('error: ', err)
            res(err)
        }, { timeout: 30000, maximumAge: 2000, enableHighAccuracy: true });
    })

    get.then(() => {
        let msgCoordinate = this.coordinates

        let latitude = msgCoordinate.latitude;
        let longitude = msgCoordinate.longitude;

        let message = "🚨I had an accident !!!💥 \n Please come help me these are my coordinates: \n 🛰️🛰️Latitude: " + latitude + "\n 🛰️Longitude: " + longitude + "\n🌐Easy link: https://www.google.com/maps/search/?api=1&query=" + latitude + "," + longitude + "\n This message have been sent automaticly using SafeCrash 🚙"
        let options = {
            replaceLineBreaks: true, // true to replace \n by a new line
            android: {
                intent: 'INTENT'  // send SMS with the native android SMS messaging
                //intent: '' // send SMS without opening any other app, require : android.permission.SEND_SMS and android.permission.READ_PHONE_STATE
            }

        };




        console.log('name:', phoneNumber.name, "phone: ", phoneNumber.phone, "data: ", phoneNumber);

        let number = phoneNumber.phone

        let intent = '';
        let error = (err) => { console.log('Error: ' + err) };
        sms.send(number, message, intent, () => {
            console.log('SOS SENT ! ')
            cordova.plugins.notification.local.schedule({
                title: 'SOS SENT !',
                text: 'An SOS have been sent to ' + phoneNumber.name,
                foreground: true
            });
        }, error);

    })
    return await get;
}


async function boundSelected() {
    let tempID = await getDeviceID();
    if (boundStateSwitch) {
        boundStateSwitch = false;
        console.log(boundStateSwitch);

        navigator.notification.alert(
            'SafeCrash Activated ! You can now drive !',  // message
            alertDismissed1,         // callback
            'Alert',           // title
            'Nice !'                  // buttonName
        )

        function alertDismissed1() {
            //do nothing be must be here
        }
        autoconnect()
    } else {
        boundStateSwitch = true;
        console.log(boundStateSwitch);
        ble.disconnect(tempID, (suc) => {
            console.log('disconnected from device: ', suc);
        }, (err) => {
            console.log('error during disco: ', err);
        });

        navigator.notification.alert(
            'SafeCrash desactivated ! Please dont forget to reactivate it before taking the wheel.',  // message
            alertDismissed2,         // callback
            'Alert',           // title
            'Nice !'                  // buttonName
        )
        function alertDismissed2() {
            //do nothing be must be here
        }

    }
}