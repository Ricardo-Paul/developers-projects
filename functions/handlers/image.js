
const { admin, db } = require('../util/admin');
const { config } = require('../util/config');

exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');

    const os = require('os');
    const fs = require('fs');
    const path = require('path');
 
    const busboy = new BusBoy ({ headers: req.headers});
    let imageFilename;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png'){
            return res.status(500).json({ error: 'wrong file type, please upload an image' })
        };
        
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFilename = `${Math.round(Math.random() * 1000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFilename);
        imageToBeUploaded = {filepath, mimetype};

        // we have the filepath now let's create the file using nodeJs feature for that
        file.pipe(fs.createWriteStream(filepath))
    });

    busboy.on('finish', ()=>{
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(()=>{
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/developers-9160b.appspot.com/o/${imageFilename}?alt=media`;
           return db.doc(`/developers/${req.developer.handle}`).update({ imageUrl });
        })
        .then( ()=>{
            res.json({message: 'image uploaded successfully'});
        })
        .catch(err =>{
            console.error(err);
        });
    });
    busboy.end(req.rawBody);
};