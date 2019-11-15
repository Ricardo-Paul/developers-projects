const isEmptyField = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

const isValidEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(emailRegEx)) return true;
    else return false;
}

exports.validateSignupData = (devData) => {

    // Validating Email
    let errors = {};
    if(isEmptyField(devData.email)){
        errors.emailError = "Email must not be empty";
    } else if(!isValidEmail){
        errors.emailError = "Please provide a valid email address";
    };

    // Validating Password
    if(isEmptyField(devData.password)) errors.passwordError = "Password cannot be empty";
    if(devData.password !== devData.confirmPassword) errors.passwordError = "Passwords don't match";

    // Validating handle
    if (isEmptyField(devData.handle)) return errors.handleError = "name can't be empty"

    return {
        errors,
        isValid: Object.keys(errors).length > 0 ? false : true
    }
}


exports.validateLoginData = (devData) => {
    let errors = {};
    if (isEmptyField(devData.email)) return errors.emailError = "Email cannot be empty";
    if (isEmptyField(devData.password)) return errors.passwordError = "Please enter your password";

    return{
        errors,
        isValid: Object.keys(errors).length > 0 ? false : true
    }
}


// Those fields are not mandatory so we add them only if they exist
// and don't generate error if there are not provided

exports.reduceExtraDetails = (data) => {
    let extraDetails = {};
    if (!isEmptyField(data.bio.trim())) extraDetails.bio = data.bio;
    if (!isEmptyField(data.company.trim())) extraDetails.company = data.company;
    if (!isEmptyField(data.location.trim())) extraDetails.location = data.location;

    if (!isEmptyField(data.website.trim())){
        if (!isEmptyField(data.website.trim().substring(0, 4)) != 'http'){
            extraDetails.website = `http://${data.website.trim()}`;
        } else extraDetails.website = data.website;
    };

    return extraDetails
};