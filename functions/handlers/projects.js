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
        imageUrl: req.developer.imageUrl,
        devHandle: req.developer.handle,
        createdAt: new Date().toISOString(),

        collaboratorCount: 0,
        suggestionCount: 0
    };

    // not mandatory field
    if(req.body.overview) newProject.overview = req.body.overview;
    if(req.body.techStacks) newProject.techStacks = req.body.techStacks;
    if(req.body.gitLink) newProject.gitLink = req.body.gitLink;
    if(req.body.help) newProject.help = req.body.help;
    
    db.collection('projects').add(newProject)
        .then(doc => {
            newProject.projectId = doc.id;
            res.json(newProject);
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
        return db.collection('suggestions')
        .orderBy('createdAt', 'desc')
        .where('projectId', '==', req.params.projectId).get();
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
};


exports.addSuggestion = (req, res) => {
    if (req.body.content == '') return res.status(500).json({error: 'Please provide a suggestion'});

    let newSuggestion = {
        devHandle: req.developer.handle,
        projectId: req.params.projectId,
        content: req.body.content,
        createdAt: new Date().toISOString(),
        imageUrl: req.developer.imageUrl
    };

    db.doc(`/projects/${req.params.projectId}`).get()
        .then(doc => {
            if(!doc.exists){
                return res.status(404).json({ error: 'project not found'});
            }
            return db.collection('suggestions').add(newSuggestion);
        })
        .then(() => {
            res.json(newSuggestion);
        })
        .catch(err => {
            console.error(err);
        });
};

exports.joinTeam = (req, res) => {

}

exports.leaveTeam = (req, res) => {

};