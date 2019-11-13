const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const app = require('express')();
const db = admin.firestore();

const firebase = require('firebase');

var config = {
    apiKey: "AIzaSyBd3G2ViDG1HPJBdPFcA8wXeNllQnhMOR4",
    authDomain: "developers-9160b.firebaseapp.com",
    databaseURL: "https://developers-9160b.firebaseio.com",
    projectId: "developers-9160b",
    storageBucket: "developers-9160b.appspot.com",
    messagingSenderId: "499686252076",
    appId: "1:499686252076:web:a890fc8c6d78c08d6a3b89",
    measurementId: "G-TZYKGQTPY4"
  };

  firebase.initializeApp(config);

//  Get Projects
app.get('/projects', (req, res) => {
    db.collection('projects')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
        let projects = [];
        data.forEach( doc => {
            projects.push({
                title: doc.data().title,
                devHandle: doc.data().devHandle,
                createdAt: doc.data().createdAt
            })
        });
        return res.json(projects);
    })
    .catch( err => res.status(500).json({error: err.code}) );
})

// Post Project
app.post('/project', (req, res) => {
    if(req.body.title.trim() === '' || req.body.devHandle.trim() === '' ){
        return res.status(400).json({ message: 'cannot be empty' })
    }

    const newProject = {
        title: req.body.title,
        devHandle: req.body.devHandle,
        createdAt: new Date().toISOString()
    };

    db.collection('projects').add(newProject)
        .then(doc => {
            res.json({ message: `document ${doc.id} created with success`});
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({error: 'creation failed' });
        });
});


// signup 
let devId, devToken;

app.post('/signup', (req, res) => {
    const newDeveloper = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      handle: req.body.handle
    };
            firebase
            .auth()
            .createUserWithEmailAndPassword(newDeveloper.email, newDeveloper.password)
            .then((data) => {
                // return res.status(201).json({message: ` Developer id: ${data.user.uid} created`})
                devId = data.user.uid;
                return data.user.getIdToken();
              })
              .then((token) =>{
                  devToken = token;

                  const devCredentials = {
                    email: newDeveloper.email,
                    handle: newDeveloper.handle,
                    createdAt: new Date().toISOString(),
                    devId: devId
                  };
                //   Here we use the newDeveloper handle on authentication to create the developer
                // document in the database
                 return db.collection('developers').doc(`${newDeveloper.handle}`).set(devCredentials);
              })
              .then(()=>{
                  return res.json(devToken);
              })
      .catch((err) => {
        console.error(err);
      });
  });

// export GOOGLE_APPLICATION_CREDENTIALS="/home/ricardo/Videos/React Social/socialape-bed783570d01.json"
// request.time < timestamp.date(2019, 12, 12);

exports.api = functions.https.onRequest(app);