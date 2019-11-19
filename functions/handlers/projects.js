const {db} = require('../util/admin');

exports.fetchProjects = (req, res) => {
    db.collection('projects')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
        let projects = [];
        data.forEach( doc => {
            projects.push({
                projectId: doc.id,
                title: doc.data().title,
                imageUrl: doc.data().imageUrl,
                devHandle: doc.data().devHandle,
                createdAt: doc.data().createdAt,

                contributorCount: doc.data().contributorCount,
                suggestionCount: doc.data().suggestionCount,

                overview: doc.data().overview,
                help: doc.data().help,
                gitLink: doc.data().gitLink
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

        contributorCount: 0,
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
    if (req.body.content == '') return res.status(500).json({suggestion: 'Please provide a suggestion'});

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
            return doc.ref.update({ suggestionCount: doc.data().suggestionCount + 1 });
        })
        .then(()=> {
            db.collection('suggestions').add({newSuggestion});
        })
        .then(() => {
            res.json(newSuggestion);
        })
        .catch(err => {
            console.error(err);
        });
};

exports.joinTeam = (req, res) => {
   let contributorDocument = db.collection('contributors').where('devHandle', '==', req.developer.handle)
        .where('projectId', '==', req.params.projectId).limit(1)

   let projectDocument = db.doc(`/projects/${req.params.projectId}`);

   let projectData;
   
   projectDocument.get()
    .then( doc => {
        if(doc.exists){
            projectData = doc.data();
            projectData.projectId = doc.id;
            return contributorDocument.get()
        }
    })
    .then(data =>{
        if(data.empty){
           return db.collection('contributors').add({
                devHandle: req.developer.handle,
                projectId: req.params.projectId
            })
            .then ( () =>{
                projectData.contributorCount++;
                return projectDocument.update( {contributorCount: projectData.contributorCount});
            })
            .then(()=>{
                return res.json(projectData);
            })
        } else {
            return res.status(500).json({message: 'You\'re already collaborating on this project'});
        }
    })
    .catch(err => {
        console.error(err)
    })
}

exports.leaveTeam = (req, res) => {
    let contributorDocument = db.collection('contributors').where('devHandle', '==', req.developer.handle)
    .where('projectId', '==', req.params.projectId).limit(1)

let projectDocument = db.doc(`/projects/${req.params.projectId}`);

let projectData;

projectDocument.get()
.then( doc => {
    if(doc.exists){
        projectData = doc.data();
        projectData.projectId = doc.id;
        return contributorDocument.get()
    }
})
.then(data =>{
    if(data.empty){
       return res.json({message: 'You\'re not part of this project'})
    } else {
        return db.doc(`/contributors/${data.docs[0].id}`).delete()
            .then(() => {
                projectData.contributorCount--;
               return projectDocument.update({contributorCount: projectData.contributorCount});
            })
            .then(()=>{
                return res.json(projectData);
            })
    }
})
.catch(err => {
    console.error(err)
})
};




exports.deleteProject = (req, res) => {
    const projectDocument = db.doc(`/projects/${req.params.projectId}`);
    projectDocument.get()
    .then(doc => {
        if(!doc.exists){
           return res.status(404).json({ error: 'project not found'});
        }
        if(doc.data().devHandle !== req.developer.handle){
           return res.status(500).json({error: 'deletion attempt revoked'});
        }
        projectDocument.delete();
    })
    .then(() => {
        return res.json({message: 'Project deleted successfully'});
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: err.code})
    })
}