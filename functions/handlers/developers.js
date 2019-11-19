const firebase = require('firebase');
const {db} = require('../util/admin');
const { config } = require('../util/config');

const {validateSignupData, validateLoginData, reduceExtraDetails} = require('../util/validators');

let devId, devToken;
exports.signup =  (req, res) => {

    const newDeveloper = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      handle: req.body.handle
    };

    if (newDeveloper.handle === '' || newDeveloper.handle.length < 2){
        return res.json({error: 'Please enter a valid name'})
    }
    const {errors, isValid} = validateSignupData(newDeveloper);
    if (!isValid){
        return res.status(400).json(errors);
    }

            firebase
            .auth()
            .createUserWithEmailAndPassword(newDeveloper.email, newDeveloper.password)
            .then((data) => {
                devId = data.user.uid;
                return data.user.getIdToken();
              })
              .then((token) =>{
                  devToken = token;

                  const devCredentials = {
                    email: newDeveloper.email,
                    handle: newDeveloper.handle,
                    createdAt: new Date().toISOString(),
                    imageUrl:  `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/blank-profile.png?alt=media`,
                    devId: devId
                  };
                 return db.collection('developers').doc(`${newDeveloper.handle}`).set(devCredentials);
              })
              .then(()=>{
                  return res.json(devToken);
              })
      .catch((err) => {
        console.error(err);
        if (err.code === 'auth/invalid-email') return res.status(400).json({error: "Wrong email format"});
        if (err.code === 'auth/email-already-in-use') return res.status(400).json({error: "Another the developer has already used this email"});
      });
  };

  exports.login = (req, res) =>{
    devLoginData = {
        email: req.body.email,
        password: req.body.password
    };

    const {errors, isValid} = validateLoginData(devLoginData);
    if (!isValid) return res.status(500).json(errors);

    firebase.auth()
        .signInWithEmailAndPassword(devLoginData.email, devLoginData.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(loginToken => {
            return res.json({loginToken})
        })
        .catch(err => {
            if(err.code === 'auth/wrong-password'){
                return res.status(403).json({error: 'Wrong credentials, please try again'});
            };
            console.error(err);
            res.status(500).json({error: 'something went wrong'});
        });
  };


  exports.addExtraDetails = (req, res) => {
    let extraDetails = reduceExtraDetails(req.body);
    db.doc(`/developers/${req.developer.handle}`).update(extraDetails)
        .then(()=>{
           return res.json({ message: 'Profile updated'});
        })
        .catch(err => {
            console.error(err);
        })
  };

// Get any developer details
exports.getDeveloperDetails = (req, res) =>{
    let developerDetails = {};
    db.doc(`/developers/${req.params.devHandle}`).get()
        .then(doc =>{
            if(doc.exists){
                developerDetails.developer = doc.data();
                return db.collection('projects').where('devHandle', '==', req.params.devHandle).get();
            } else {
                return res.status(500).json({ error: 'Developer account not found'});
            }
        })
        .then(data => {
            developerDetails.projects = [];
            data.forEach(doc => {
                developerDetails.projects.push({
                    title: doc.data().title,
                    createdAt: doc.data().createdAt,
                    developer: doc.data().developer,
                    imageUrl: doc.data().imageUrl,
                    contributorCount: doc.data().contributorCount,
                    suggestionCount: doc.data().suggestionCount,
                    projectId: doc.data().projectId
                })
            });
            return res.json(developerDetails);
        })
        .catch(err => {
            console.error(err);
        })
};


exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach(notificationId => {
        const notifications = db.doc(`/notifications/${notificationId}`);
        batch.update(notifications, {read: true} )
    });
    batch.commit()
        .then( () => {
            res.json({message: 'All notifications are read'});
        })
        .catch(err => {
            console.error(err);
        })
}

  exports.fetchDevAccount = (req, res) => {
      let devAccountDetails = {};
      db.doc(`/developers/${req.developer.handle}`).get()
        .then( doc => {
            if (doc.exists){
                devAccountDetails = doc.data();
            } else {
                return res.status(404).json({ message: 'Account not found'});
            }
            return db.collection('contributors').where('devHandle', '==', req.developer.handle ).get()
        })
        .then( data => {
            devAccountDetails.contributors = [];
            data.forEach(doc => {
                devAccountDetails.contributors.push(doc.data())
            });
            return  db.collection('notifications').where('recipient', '==', req.developer.handle).limit(10).get();
        })
        .then(data => {
            devAccountDetails.notifications = [];
            data.forEach(doc => {
                devAccountDetails.notifications.push({
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    createdAt: doc.data().createdAt,
                    screamId: doc.data().screamId,
                    type: doc.data().type,
                    read: doc.data().read,
                    notificationId: doc.id
                })
            });
            return res.json(devAccountDetails);
        })
        .catch(err => {
            console.error(err);
        });
  };

