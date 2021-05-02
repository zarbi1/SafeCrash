let consprint = document.getElementById('console');
const PouchDB = require('pouchdb');

let db = new PouchDB('safecrashDB');


function addContacts(){
    navigator.contacts.pickContact( (contact) =>{
        let contactSet = [contact.id, contact.name, contact.phoneNumbers]
        db.put(contactSet, (err, res)=> {
            if (!err) {
                console.log('Sucess !')
            }else{
                console.error(err);
            }
        })

    },
    () =>{
        console.log(err)
    }
    )
    
    /* NOTIFACTION
    navigator.notification.alert(
        'You are the winner!',  // message
        alertDismissed,         // callback
        'Game Over',            // title
        'Done'                  // buttonName
    );
        */

    console.log('Contact Name is: ',db.allDocs({include_docs: true, descending: true}, function(err, doc) {
        redrawTodosUI(doc.rows);
      }))

}



document.addEventListener('deviceready', onDeviceReady, true)
function onDeviceReady (){
    console.log('Device is Ready SafeCrash Starting...')
}