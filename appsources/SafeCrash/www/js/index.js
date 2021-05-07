


const db = new PouchDB('SafeCrashDB.db', {adapter: 'cordova-sqlite'});
const deviceDB = new PouchDB('DeviceDB.db', {adapter: 'cordova-sqlite'});

let contactlist = document.getElementById('em-contact-list');
let boundState= document.getElementById('boundState');
let boundBtn = document.getElementById('bound-btn');



document.addEventListener('deviceready', onDeviceReady, true)
function onDeviceReady (){
    console.log('Device is Ready SafeCrash Starting...')
    const permissions = cordova.plugins.permissions;






    //Check app Permissions
    const permissionlist= [ //Add new permissions here
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


    permissions.checkPermission(permissionlist, (sucess)=>{
        if (!sucess.hasPermission){
            permissions.requestPermissions(
                permissionlist,
                (state)=>{
                    if (!state.hasPermission) console.log(state);
                }, (err) =>{
                    console.log(err);
                }
            )
        };
        console.log('permission1 ok!');
    }, ()=>{

    });
    cordova.plugins.backgroundMode.requestForegroundPermission();






    //BackGround
    cordova.plugins.backgroundMode.enable(); //enable background mod
    cordova.plugins.backgroundMode.on('enable', () =>{
       console.log('background enabled');
    });


    cordova.plugins.backgroundMode.on('activate', function() {
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

    cordova.plugins.backgroundMode.isIgnoringBatteryOptimizations((isIgnoring) =>{
        if(isIgnoring){
            console.log('batterie optimisation is ignored.')
        }else{
            navigator.notification.alert(
                "To correctly use SafeCrash you need to allow the app to ignore battery opimization if you didn't allowed it please restart the app and allow it.",  // message
                alertDismissed,         // callback
                'Info',           // title
                'Ok !'                  // buttonName
            );
        
            function alertDismissed(){
                //do nothing be must be here
            }
            cordova.plugins.backgroundMode.disableBatteryOptimizations();
        }
    })


    //GPS







    //BLE
    bleEn(); //check if ble is enabled
    autoconnect()//auto connect to the safecrash device







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
        }).then( (result) => {
            console.log("result is: ", result.rows[0].id)
            res(result.rows[0].id)
        }).catch( (err) => {
            console.log(err);
            res(null)
        })
    }) 

    return await get;

}

async function autoconnect(){
    let tempID = await getDeviceID();
    console.log('tempid: ', tempID)
    //launching auto connect to check if we didn't crash into a tree (^人^)
    if (tempID !== '' || tempID !== null) { //we will need to add an other check to see if we recived an information about a bound mode
        ble.autoConnect(tempID, (device) => { 
            console.log('safecrash disconnected')     //The connectCallback is buged so I am going to detect if the device is disconnected
        }, (device) => {
            if (limiter !=0) {
                console.log("bug detected it's not a crash")
            }else{

                //CRASH DETECTED WE NEED TO SEND SMS
                console.log('connected to:', device )
                console.log('crash detected')
                db.allDocs({
                    include_docs: true,
                    attachments: true
                }).then( (result) =>{

                    for (let x = 0; x < result.rows.length; x++) {
                        let phoneNumStrMsg= result.rows[x].doc.phone;
                        phoneNumStrMsg = phoneNumStrMsg.replace(/-/g, "");
                        console.log('sendding msg to:', result.rows[x].doc.name);
                        getCoordinateAndSendMessage(phoneNumStrMsg); //Send a message to all registred contacts
                    }
                    
                }).catch( (err) => {
                    console.log(err);
                });

            }

            
        });
    }
}


function addContacts(){
    navigator.contacts.pickContact( (contact) =>{
        let contactSet = {
            _id: contact.id,
            name : contact.displayName,
            phone: contact.phoneNumbers[0].value
        };
        

            
        db.put(contactSet, (err, result)=> {
            if (!err) {
                console.log('Sucess !')
                window.location.reload();
            }else{
                console.error(err);

            }
        })

        
    })
    
   
}      




//check if safeCrash is bounded
let bounded = false;
let deviceID = '';
function checkBound() {
    ble.bondedDevices((conectedDevices) =>{
        console.log('Bounded devices: ', conectedDevices);
        for (let z = 0; z < conectedDevices.length; z++) {
            if (conectedDevices[z].name == "Boom Shakalaka" || conectedDevices[z].name == "LE-Boom Shakalaka") { //NEED TO CHANGE THE NAME WHEN ARDUINO CODE IS FINISHED


                //Saving the device in internal db
                deviceID = conectedDevices[z].id;
                let deviceName = conectedDevices[z].name;

                let deviceInfo = {
                    _id: deviceID,
                    name: deviceName
                }

                
                deviceDB.put(deviceInfo, (err, result) =>{
                    if (!err) {
                        console.log('Registered id in db')
                    }else if (err.name == 'conflict'){
                        deviceDB.get(deviceID).then( (doc) =>{ //doc is the result of the db.get(_id)
                            deviceDB.remove(doc).then( ()=>{ //removing for the db
                                deviceDB.put(deviceInfo, (err, result) => {
                                    if (!err) {
                                        console.log("device updated")
                                    } else {
                                        console.log(err)
                                    }
                                })
                            }) 
                        })
                    }else{
                        console.log(err);
                    }
                })



                //When the arduino code will be finished I will add a function to check if safeCrash is in bound mode or not
                console.log('Bounded !')
                boundBtn.style.display = "none"; //no need to display the bound btn if safecrash is bounded
                boundState.innerHTML="SafeCrash Bounded !"
                bounded =true;
                 //To prevent a bug where SafeCrash is activating the crash mod only if it's the first time that the device is bouded
            }
            
        }       

    }, (error) =>{
        console.log(error)
    });
    
}






function bleEn() {
    ble.isEnabled(
        
        () => {
            console.log('Bluetooth enabled');
            checkBound();
        },
        () => {
            boundState.innerHTML="Please Turn on your Bluetooth before using SafeCrash"
            boundBtn.style.display = "none"; //Hidding the bound button
            ble.enable(() => {
                //if the user enable the ble after the notification
                console.log('Bluetooth enabled')
                boundState.innerHTML=""
                //show or hide bound button
                checkBound() //Ble enabled so we need to check if SafeCrash is connected or not.
                if (bounded) {
                    boundBtn.style.display = "none";
                    boundState.innerHTML="SafeCrash Bounded !"
                    
                }else{
                    boundBtn.style.display = "initial"; 
                }
                 
            })
        }
    );
}







//futur: 
/*
ble.requestConnectionPriority(device_id, priority, [success], [failure]); // request the priority for the connection
ble.startNotification(device_id, service_uuid, characteristic_uuid, success, failure); //when the phone recive a signal, then...
*/

async function Bound() {
    //open blue settings
    limiter = 1;
    ble.showBluetoothSettings((checkDevice) => {
        console.log(checkDevice);
        location.reload(); 
    }, (error) => {
        console.log(error)
    });
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
                let divContact = document.createElement('div');
                let phoneNum = document.createElement('p');
                let contactName = document.createElement('p');
                let deleteButton = document.createElement('button'); 


                //Clase Names
                divContact.className="contactContainer";
                phoneNum.className = "phoneNumber";
                contactName.className = "conctactName";
                deleteButton.className = "button";


                //Attributes
                deleteButton.setAttribute("onclick", 'deleteContact("' + result.rows[e].doc._id + '")')
                


                //remplace "-"" to nothing
                let phoneNumStr= result.rows[e].doc.phone;
                phoneNumStr = phoneNumStr.replace(/-/g, "");

                //Inner HTML
                phoneNum.innerHTML = "Phone Number: " + "<strong>"+ phoneNumStr + "</strong>";
                contactName.innerHTML = "Contact Name: " + "<strong>" + result.rows[e].doc.name+ "</strong>";
                deleteButton.innerHTML ='Delete';


                contactlist.appendChild(divContact);
                divContact.appendChild(contactName);
                divContact.appendChild(phoneNum);
                divContact.appendChild(deleteButton);
                
            }
        }).catch(function (err) {
            console.log(err);
        });
    }
    
    loadContacts();

}



//DELETE BUTTON
function deleteContact(contactID) {
    
    db.get(contactID).then( (doc) =>{ //doc is the result of the db.get(_id)
        db.remove(doc).then( ()=>{ //removing for the db
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

    function alertDismissed(){
        //do nothing be must be here
    }
}





//Send message and get position
async function getCoordinateAndSendMessage(phoneNumber) {
   let get = new Promise((res, rej) =>{
        navigator.geolocation.getCurrentPosition((position) => {

            var coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }
            this.coordinates = coordinates;
            res(coordinates);
        }, (err) =>{
            console.log('error: ', err)
            res(err)
        }, { timeout: 30000, maximumAge: 2000, enableHighAccuracy: true });
   }) 

   get.then(() =>{
        let msgCoordinate = this.coordinates
        
        let latitude = msgCoordinate.latitude;
        let longitude = msgCoordinate.longitude;

        let message = "🚨I had an accident !!!💥 \n Please come help me these are my coordinates: \n 🛰️🛰️Latitude: " + latitude + "\n 🛰️Longitude: " + longitude  + "\n🌐Easy link: https://www.google.com/maps/search/?api=1&query="+ latitude + ","+longitude +"\n This message have been sent automaticly using SafeCrash 🚙"
        let options= {
            replaceLineBreaks: true, // true to replace \n by a new line
                android: {
                    intent: 'INTENT'  // send SMS with the native android SMS messaging
                    //intent: '' // send SMS without opening any other app, require : android.permission.SEND_SMS and android.permission.READ_PHONE_STATE
                }

        };
        let intent = '';
        let sucess = () => {console.log("SMS sent !")};
        let error = (err) => {console.log('Error' + err)};
        sms.send(phoneNumber, message, intent, sucess, error);
        
   })
   return await get;
}



//will be added soon
function alarm() {
    
}
