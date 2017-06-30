const Promise = require('bluebird');
const path = require('path');
const _ = require('lodash');
const sharp = require('sharp');
const stream = require('stream');

module.exports = function(Model, app) {

    var sizes = app.get('media').sizes;
    var sizeKeys = _.keys(sizes);
    var images = {};

    images.onUpload = function(options, operations) {

        return _.map(sizeKeys, function(key) {

            var size = sizes[key];

            var transformer = sharp()
                .resize(size.width, size.height);

            if (size.crop) {
                transformer = transformer.crop(sharp.gravity.center);
            } else {
                transformer = transformer.max();
            }

            options.file.pipe(transformer);

            var parsed = path.parse(options.name);
            parsed.base += '/' + key;
            var name = path.format(parsed);

            var operation = transformer.toBuffer()
                .then(function(buffer) {

                    var readableStream = new stream.PassThrough();
                    readableStream.end(buffer);

                    return {
                        file: readableStream,
                        size: buffer.length,
                        name: name,
                        id: options.id,
                        mimetype: options.mimetype
                    };

                });
            operations.push(operation);

        });

    };

    images.onUpdate = function(options) {

        if (options.file.type == "image") {
            for (var key in sizes) {
                options.operations.push({
                    source: path.join(options.file.location, key),
                    target: path.join(options.target, key)
                });
            }
        }

    };


    images.onSaveBefore = function(ctx) {

        var instance = ctx.currentInstance || ctx.instance;
        var data = ctx.data || ctx.instance;

        return Promise.resolve()
            .then(function() {

                if (!instance.location) {
                    console.log(ctx);
                    throw new Error('No location found');
                }

                var locationParts = instance.location.split('/');
                locationParts.pop();
                var originalLocation = locationParts.join('/');
                if (!instance.isSize && sizes[instance.name]) {
                    return Model.findOne({
                            where: {
                                location: originalLocation
                            },
                            fields: {
                                type: true
                            }
                        })
                        .then(function(object) {
                            if (object && object.type == 'image') {
                                data.isSize = true;
                            } else {
                                data.isSize = false;
                            }
                            //console.log('isSize', instance.location, data.isSize);
                        });
                } else {
                    data.isSize = false;
                }

            });

    };

    images.onSaveAfter = function(instance) {
        if (instance.type == "image" && !instance.isSize) {

            return Promise.map(sizeKeys, function(sizeKey) {
                var sizeLocation = path.join(instance.location, sizeKey);
                return Model.findOne({
                        where: {
                            location: sizeLocation
                        }
                    })
                    .then(function(object) {
                        if (object) {
                            return object.updateAttribute('updatedAt', instance.updatedAt);
                        }
                    });
            });
        }

        return Promise.resolve();
    };

    images.onDelete = function(options) {

        if (options.file.type == 'image') {

            for (var key in sizes) {
                options.files.push({
                    Key: options.location + '/' + key
                });
            }
        }

    };

    return images;

};
