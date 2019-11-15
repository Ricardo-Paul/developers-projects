const {admin, db} = require('./util/admin')

const functions = require('firebase-functions');
const app = require('express')();


// Adding firebase for auth
const firebase = require('firebase');
const { config } = require('./util/config')
  firebase.initializeApp(config);

// Image upload import
const { uploadImage } = require('./handlers/image');

//   Projets imports
const {fetchProjects, addProject, fetchOneProject} = require('./handlers/projects');

// Developpers imports
const {signup, login, addExtraDetails, fetchDevAccount } = require('./handlers/developers');

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

app.get('/project/:projectId', fetchOneProject);


// Developer routes
app.post('/signup', signup);
app.post('/login', login );

app.post('/developer/image', DevAuth, uploadImage);
app.post('/developer', DevAuth, addExtraDetails);
app.get('/developer', DevAuth, fetchDevAccount );

// export GOOGLE_APPLICATION_CREDENTIALS="/home/ricardo/Videos/React Social/developers-c75a6f368a97.json"
// request.time < timestamp.date(2019, 12, 12);

exports.api = functions.https.onRequest(app);