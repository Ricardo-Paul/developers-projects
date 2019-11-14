const firebase = require('firebase');
const {db} = require('../util/admin');
const {validateSignupData} = require('../util/validators');

let devId, devToken;
exports.signup =  (req, res) => {

    const newDeveloper = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      handle: req.body.handle
    };

    if (newDeveloper.handle === '' || newDeveloper.handle.length < 2){
        return res.json({error: 'Please enter a valid name'})
    }
    const {errors, isValid} = validateSignupData(newDeveloper);
    if (!isValid){
        return res.status(400).json(errors);
    }

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
        if (err.code === 'auth/invalid-email') return res.status(400).json({error: "Wrong email format"});
        if (err.code === 'auth/email-already-in-use') return res.status(400).json({error: "Another the developer has already used this email"});
      });
  };