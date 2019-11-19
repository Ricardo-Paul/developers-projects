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
const {fetchProjects, addProject, fetchOneProject, addSuggestion, joinTeam, leaveTeam, deleteProject} = require('./handlers/projects');

// Developpers imports
const {signup, login, addExtraDetails, fetchDevAccount, getDeveloperDetails, markNotificationsRead } = require('./handlers/developers');

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
            req.developer.imageUrl = data.docs[0].data().imageUrl;
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
app.post('/project/:projectId/suggestion', DevAuth, addSuggestion);

app.get('/project/:projectId/join', DevAuth, joinTeam);
app.get('/project/:projectId/leave', DevAuth, leaveTeam);
app.delete('/project/:projectId/delete', DevAuth, deleteProject);

// Developer routes
app.post('/signup', signup);
app.post('/login', login );

app.post('/developer/image', DevAuth, uploadImage);
app.post('/developer', DevAuth, addExtraDetails);
app.get('/developer', DevAuth, fetchDevAccount );

// additonal backend routes
app.get('/developer/:devHandle', getDeveloperDetails);
app.post('/notifications', DevAuth, markNotificationsRead);

// export GOOGLE_APPLICATION_CREDENTIALS="/home/ricardo/Videos/React Social/developers-583454dd32cc.json"
// request.time < timestamp.date(2019, 12, 12);



exports.createNotificationOnJoin = functions.region('us-central1').firestore.document('contributors/{id}')
.onCreate((snapshot) => {
    db.doc(`/projects/${snapshot.data().projectId}`).get()
    .then(doc => {
        if(doc.exists){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().devHandle,
                sender: snapshot.data().devHandle,
            
                type: 'join',
                read: false,
                projectId: doc.id
            })
        }
    })
    .then (() => {
        return;
    })
    .catch(err => {
        console.error(err)
        return;
    })
})

exports.createNotificationOnSuggestion = functions.region('us-central1').firestore.document('suggestions/{id}')
.onCreate((snapshot) => {
    db.doc(`/projects/${snapshot.data().projectId}`).get()
    .then(doc => {
        if(doc.exists){
            return db.doc(`/notifications/${snapshot.id}`).add({
                createdAt: new Date().toISOString(),
                recipient: doc.data().devHandle,
                sender: snapshot.data().devHandle,
            
                type: 'suggestion',
                read: false,
                projectId: doc.id
            })
        }
    })
    .then (() => {
        return;
    })
    .catch(err => {
        console.error(err)
        return;
    })
})

exports.deleteNotificationOnLeave = functions.region('us-central1').firestore.document('contributors/{id}')
.onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`).delete()
    .then(() => {
        return;
    })
    .catch(err => {
        console.error(err)
    });
})



exports.api = functions.https.onRequest(app);