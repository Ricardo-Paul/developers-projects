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