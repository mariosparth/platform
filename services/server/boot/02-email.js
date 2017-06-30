var path = require('path');
var ejs = require('ejs');
var Promise = require('bluebird');
var _ = require('lodash');
var EmailTemplate = require('email-templates').EmailTemplate;
var yaml = require('js-yaml');
var fs = require('fs');
var htmlToText = require('html-to-text');

module.exports = function(app) {

    var email = app.get('email');
    if (!email) {
        email = {};
        app.set('email', email);
    }
    var templates = {};

    email.text = function(html) {

        return htmlToText.fromString(html, {
            ignoreImage: true,
            ignoreHref: true,
            tables: ['.data'],
            wordwrap: 80
        });
    };

    //////////////////////////////////////////////////////////////////////
    // Load Email Templates
    //////////////////////////////////////////////////////////////////////

    var pathTemplates = path.join(__dirname, '../../templates');
    var templateDirs = fs.readdirSync(pathTemplates);
    var dataMain = yaml.safeLoad(fs.readFileSync(path.join(pathTemplates, '_data.yml'), 'utf8'));

    var helpers = {
        partial: function(path_partial, data) {

            var file_path = path.join(pathTemplates, path_partial + '.ejs');
            var file_content = fs.readFileSync(file_path, 'utf8');

            data = _.extend({}, this, data);

            return ejs.render.apply(this, [file_content, data]);
        },
        lng: function(obj) {
            if(!obj){
              return;
            }
            if (_.isString(obj)) {
                return obj;
            }
            return obj[this.language] || obj.en || obj.gr;
        }
    };

    return Promise.map(templateDirs, function(templateDir) {

            var pathTemplate = path.join(pathTemplates, templateDir);

            var stats = fs.statSync(pathTemplate);

            if (!stats.isDirectory()) {
                return;
            }

            if (templateDir[0] == '_') {
                return;
            }

            var templateData = yaml.safeLoad(fs.readFileSync(path.join(pathTemplate, 'data.yml'), 'utf8'));
            var renderer = new EmailTemplate(pathTemplate);

            templates[templateDir] = {
                renderer: renderer,
                data: templateData,
                render: function(data, cb) {
                    renderer.render(
                        _.extend({}, dataMain, templateData, data, helpers),
                        cb);
                }
            };

        })
        .then(function() {

            email.templates = templates;
            return email;

        });

};
