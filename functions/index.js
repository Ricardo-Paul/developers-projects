const {admin, db} = require('./util/admin')

const functions = require('firebase-functions');
const app = require('express')();


// Adding firebase for auth
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

//   Projets imports
const {fetchProjects, addProject} = require('./handlers/projects');

// Developpers imports
const {signup} = require('./handlers/developers');

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
};





// Project routes
app.get('/projects', fetchProjects );
app.post('/project', DevAuth, addProject );


// Developer routes


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
app.post('/signup', signup);

  
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