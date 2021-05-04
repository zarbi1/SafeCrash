
let db = new PouchDB('myDB.db', {adapter: 'cordova-sqlite'});
let contactlist = document.getElementById('em-contact-list');



document.addEventListener('deviceready', onDeviceReady, true)
function onDeviceReady (){
    console.log('Device is Ready SafeCrash Starting...')

    //cordova.plugins.foregroundService.start('GPS Running', 'Background Service');
    cordova.plugins.backgroundMode.enable(); //enable background mod

    cordova.plugins.notification.local.schedule({
        title: 'My first notification',
        text: 'Thats pretty easy...',
        foreground: true
    });
    

    cordova.plugins.backgroundMode.on('enable', () =>{
        console.log('background enabled');
    });
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
    console.log('I need to delete the contact id: ', contactID)
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