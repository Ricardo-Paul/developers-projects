const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

//  Get Projects
exports.getProjects = functions.https.onRequest((req, res) => {
    db.collection('projects').get()
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

// Post Project
exports.newProject = functions.https.onRequest((req, res) => {

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

