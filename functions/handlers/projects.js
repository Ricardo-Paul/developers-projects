const {db} = require('../util/admin');

exports.fetchProjects = (req, res) => {
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
};

exports.addProject = (req, res) => {
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
};

exports.fetchOneProject = (req, res) => {
    let projectData = {};
    db.doc(`/projects/${req.params.projectId}`).get()
     .then(doc => {
        if(doc.exists){
            projectData = doc.data();
            projectData.projectId = doc.id;
        };
        return db.collection('suggestions').where('projectId', '==', req.params.projectId).get();
     })
     .then(data =>{
         projectData.suggestions = [];
         data.forEach(doc => {
             projectData.suggestions.push(doc.data());
         });
         res.json(projectData);
     })
     .catch(err => {
         console.error(err);
     })
}