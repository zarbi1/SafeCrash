
let db = new PouchDB('myDB.db', {adapter: 'cordova-sqlite'});
let contactlist = document.getElementById('em-contact-list');


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
    /*
     //NOTIFACTION
    navigator.notification.alert(
        'You are the winner!',  // message
        alertDismissed,         // callback
        'Game Over',            // title
        'Done'                  // buttonName
    );
    */
   //Access to all "document" in the databse
    
   
}      




document.addEventListener('deviceready', onDeviceReady, true)
function onDeviceReady (){
    console.log('Device is Ready SafeCrash Starting...')

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
                phoneNum.innerHTML = phoneNumStr;
                contactName.innerHTML = result.rows[e].doc.name;
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