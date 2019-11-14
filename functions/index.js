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
});

const DevAuth = (req, res, next) => {
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
    };
    // we need to verify if this token is from our app using firebase-admin.auth()

    admin.auth()
    .verifyIdToken(idToken)
    .then( decodedToken =>{
        req.developer = decodedToken;
     return db.collection('developers').where('devId', '==', req.developer.uid)
        .limit(1)
        .get();
    })
    .then(data =>{
        if (data){
            req.developer.handle = data.docs[0].data().handle;
        }else{
            return res.status(500).json({error: 'Not existed in our database'})
        }
        return next();
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Error while verifying token'});
    })
}



// Post Project
app.post('/project', DevAuth, (req, res) => {
    if(req.body.title.trim() === '' ){
        return res.status(400).json({ message: 'cannot be empty' })
    }

    const newProject = {
        title: req.body.title,
        // devHandle: req.body.devHandle, no longer need the developer handle in the request body
        devHandle: req.developer.handle,
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

const isEmptyField = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

const isValidEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(emailRegEx)) return true;
    else return false;
}

// signup 
let devId, devToken;
app.post('/signup', (req, res) => {

    const newDeveloper = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      handle: req.body.handle
    };

    // Body data validation
    // Validating Email
    let errors = {};
    if(isEmptyField(newDeveloper.email)){
        errors.emailError = "Email must not be empty";
    } else if(!isValidEmail){
        errors.emailError = "Please provide a valid email address";
    };

    // Validating Password
    if(isEmptyField(newDeveloper.password)) errors.passwordError = "Password cannot be empty";
    if(newDeveloper.password !== newDeveloper.confirmPassword) errors.passwordError = "Passwords don't match";


    if (Object.keys(errors).length > 0 ) return res.status(400).json(errors);

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
                    devId: devId
                  };
                 return db.collection('developers').doc(`${newDeveloper.handle}`).set(devCredentials);
              })
              .then(()=>{
                  return res.json(devToken);
              })
      .catch((err) => {
        console.error(err);
        if (err.code === 'auth/invalid-email') return res.status(400).json({error: "Bad email format"});
        if (err.code === 'auth/email-already-in-use') return res.status(400).json({error: "Another the developer has already used this email"});
      });
  });

  
  app.post('/login', (req, res) =>{
    devLoginData = {
        email: req.body.email,
        password: req.body.password
    }

    let errors = {};
    if (isEmptyField(devLoginData.email)) return errors.emailError = "Email cannot be empty";
    if (isEmptyField(devLoginData.password)) return errors.passwordError = "Please enter your password";

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
  })

// export GOOGLE_APPLICATION_CREDENTIALS="/home/ricardo/Videos/React Social/developers-558666438ebc.json"
// request.time < timestamp.date(2019, 12, 12);

exports.api = functions.https.onRequest(app);