

let consprint = document.getElementById('console');

let db = new PouchDB('myDB.db', {adapter: 'cordova-sqlite'});



function addContacts(){
    navigator.contacts.pickContact( (contact) =>{
        let contactSet = {
            _id: contact.id,
            name : contact.displayName,
            phone: contact.phoneNumbers[0].value
        };
        
        db.put(contactSet, (err, res)=> {
            if (!err) {
                console.log('Sucess !')
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
    db.allDocs({
        include_docs: true,
        attachments: true
      }).then(function (result) {
        console.log(result);
      }).catch(function (err) {
        console.log(err);
      });
    
}      
/*
    console.log('Contact Name is: ',db.allDocs({include_docs: true, descending: true}, function(err, doc) {
        console.log(doc.rows);
      }))
      */




document.addEventListener('deviceready', onDeviceReady, true)
function onDeviceReady (){
    console.log('Device is Ready SafeCrash Starting...')
}