


let db = new PouchDB('SafeCrashDB.db', {adapter: 'cordova-sqlite'});
let deviceDB = new PouchDB('DeviceDB.db', {adapter: 'cordova-sqlite'});
let contactlist = document.getElementById('em-contact-list');
let boundState= document.getElementById('boundState');
let boundBtn = document.getElementById('bound-btn');


document.addEventListener('deviceready', onDeviceReady, true)
function onDeviceReady (){
    console.log('Device is Ready SafeCrash Starting...')

    //cordova.plugins.foregroundService.start('SafeCrash Runing', 'Background Service');
    cordova.plugins.backgroundMode.enable(); //enable background mod
    cordova.plugins.backgroundMode.on('enable', () =>{
        console.log('background enabled');
    });

    bleEn(); //check if ble is enabled
    //ble.scan([], 1, success, failure);

    autoconnect()

}
let limiter = 0;

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

                //Crash detected
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
                        SendMessages(phoneNumStrMsg); //Send a message to all registred contacts
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
            if (conectedDevices[z].name == "Boom Shakalaka") { //NEED TO CHANGE THE NAME WHEN ARDUINO CODE IS FINISHED


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
        navigator.notification.alert(
            'SafeCrash if you correctly bounded your SafeCrashBox please restart the app',  // message
            alertDismissed,         // callback
            'Info',           // title
            'Ok !'                  // buttonName
        );
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

function deleteContact(contactID) {
    
    db.get(contactID).then( (doc) =>{ //doc is the result of the db.get(_id)
        db.remove(doc).then( ()=>{ //removing for the db
            window.location.reload(true); //reload the page
        }) 
    })
}

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




//send messages
function SendMessages(phoneNumber) {
    let message = "SafeCrash Test SMS"
    let options= {
        replaceLineBreaks: false, // true to replace \n by a new line, false by default
            android: {
                intent: 'INTENT'  // send SMS with the native android SMS messaging
                //intent: '' // send SMS without opening any other app, require : android.permission.SEND_SMS and android.permission.READ_PHONE_STATE
            }

    };
    let intent = '';
    let sucess = () => {console.log("SMS sent !")};
    let error = (err) => {console.log('Error' + err)};
    sms.send(phoneNumber, message, intent, sucess, error);
}
