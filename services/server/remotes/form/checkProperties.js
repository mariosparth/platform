var _ = require('lodash');
var ejs = require('ejs');
var Promise = require('bluebird');

module.exports = function(Model, app) {

    var fieldMessages = Model.clientHelpers.get_data('form/messages');

    var errorMessages = {
        validation: {
            title: {
                en: 'Your form is not valid',
                gr: 'Η φόρμα σας δεν είναι έγκυρη'
            }
        }
    };

    Model.checkProperties = function(formFields) {

        return function(context, account) {

            var params = context.req.body;
            var errors = [];

            return Promise.map(_.keys(params), function(key) {

                    var field = formFields[key];
                    if (!field) {
                        return;
                    }

                    var param = params[key];

                    return Promise.resolve()
                        .then(function() {

                            //----------------------------------------------------------------
                            // Options

                            if (field.options) {

                                var option = _.find(field.options, {
                                    value: param
                                });

                                if (!option) {
                                    errors.push({
                                        code: 'OPTION_INVALID',
                                        message: key + ': The option (' + param + ') you have entered is invalid.'
                                    });
                                }
                            }

                            switch (field.group) {

                                //----------------------------------------------------------------
                                // Recaptcha

                                case 'recaptcha':
                                    return new Promise(function(resolve, reject) {
                                        app.recaptcha.verify(param, function(response) {
                                            if (!response.success) {
                                                errors.push({
                                                    code: 'RECAPTCHA_ERROR',
                                                    message: 'The recaptcha you sent is invalid',
                                                    data: response
                                                });
                                            }
                                            resolve();
                                        });

                                    });

                            }

                        })
                        .then(function() {

                            if (_.isString(param)) {
                                if (!param.length && !field.validators.required) {
                                    return;
                                }
                            }

                            //----------------------------------------------------------------
                            //

                            return Promise.map(_.keys(field.validators), function(name) {

                                var message = fieldMessages[name];
                                var value = field.validators[name];

                                function error() {
                                    message = app.lng(message, context.req);
                                    message = ejs.render(message, {
                                        name: name,
                                        value: value
                                    });
                                    errors.push({
                                        param: key,
                                        message: app.lng(field.title, context.req) +
                                            ': ' +
                                            message
                                    });
                                }

                                switch (name) {

                                    case 'pattern':
                                        message = fieldMessages[value];
                                        var match = param.match(message.pattern);
                                        match = match !== null && param == match[0];

                                        if (!match) {
                                            error();
                                        }
                                        break;
                                    case 'min':
                                        if (param < value) {
                                            error();
                                        }
                                        break;
                                    case 'max':
                                        if (param > value) {
                                            error();
                                        }
                                        break;
                                    case 'minlength':
                                        if (_.isString(param)) {
                                            if (param.length < value) {
                                                error();
                                            }
                                        }
                                        break;
                                    case 'maxlength':
                                        if (_.isString(param)) {
                                            if (param.length > value) {
                                                error();
                                            }
                                        }
                                        break;
                                }

                            });

                        });
                }, {
                    concurrency: 1
                })
                .then(function() {
                    if (errors.length) {
                        throw {
                            title: app.lng(errorMessages.validation.title, context.req),
                            details: errors,
                            statusCode: 400
                        };
                    }
                });

        };
    };
};
