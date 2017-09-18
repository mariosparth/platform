/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: services/server/boot/soap-services.js
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const soap = require('soap');
const uuidV1 = require('uuid/v1');
const simpleParser = require('mailparser').simpleParser;
const Request = require('request');
const concatStream = require('concat-stream');
const _ = require('lodash');

var credentials;

module.exports = function(app) {

  app.soapServices = {};
  var config = app.get('wsdl');
  if (!config) {
    return;
  }

  if (!credentials) {
    credentials = app.secrets.get('wsdl');
  }

  var dirServices = config.path || path.join(app.get('services_dir'), 'wsdl');

  //-----------------------------------------------------------

  return fs.readdir(dirServices)
    .then(function(files) {
      return Promise.map(files, onFile);
    });

  //-----------------------------------------------------------

  function onFile(file) {

    var fileParsed = path.parse(file);
    var fileName = fileParsed.name;
    var fileConfig = _.get(config, `file.${fileName}`) || {};

    return soap.createClientAsync(path.join(dirServices, file), {
      wsdl_headers: {
        connection: 'keep-alive'
      },
      request: function(options, cb) {

        setSecurity({
          config: fileConfig,
          requestOptions: options
        });

        //console.log(options);
        //---------------------------------------------------

        var request = Request(options, cb);

        request.on('response', function(response) {
          response.pipe(concatStream({
            encoding: 'buffer'
          }, function(buffer) {
            request.bufferResult = buffer;
          }));
        });

        return request;
      }
    })
      .then(function(client) {

        if (!fileConfig.security) {
          switch (credentials.scheme) {
            case 'BasicAuth':
              client.setSecurity(new soap.BasicAuthSecurity(
                credentials.username,
                credentials.password));
              break;
            default:
          }

        }
        
        //------------------------------------------------------------------------

        var methodName = client.wsdl.definitions.$name;
        var method = client[methodName];
        var methodPromise = client[methodName + 'Async'];
        var responses = {};

        //------------------------------------------------------------------------

        client.on('soapError', function() {
          console.log(arguments);
        });

        client.on('response', onClientResponse);

        //------------------------------------------------------------------------

        app.soapServices[fileName] = {
          getResult: methodPromise,
          getDetails: function(query, options) {

            return new Promise(function(resolve, reject) {

              var uuid = uuidV1();

              responses[uuid] = {
                resolve: resolve,
                reject: reject
              };

              method(query, function(err) {
                if (err) {
                  return reject(err);
                }
              }, {
                methodOptions: options,
                exchangeId: uuid
              });
            });
          }
        };

        //------------------------------------------------------------------------

        function onClientResponse(result, incomingMessage, exchangeId) {

          var responseParsed = responses[exchangeId];
          if (!responseParsed) {
            return;
          }

          delete responses[exchangeId];

          if (!result) {
            return responseParsed.reject('No incoming response. Check the log for errors');
          }

          var resContentType = incomingMessage.headers['content-type'];
          var attachments = [];

          Promise.resolve()
            .then(function() {

              var buffer = Buffer.concat([
                Buffer.from('content-type: ' + resContentType + '\r\n', 'utf8'),
                incomingMessage.request.bufferResult
              ]);

              return simpleParser(buffer)
                .then(function(parsed) {
                  attachments = parsed.attachments;
                });

            })
            .then(function() {

              responseParsed.resolve({
                attachments: attachments,
                raw: result
              });

            });

        }

      });
  }

  function setSecurity(options) {

    var config = options.config;
    var requestOptions = options.requestOptions;

    if (!config.security){
      return;
    }

    if (config.security.roleCertificate){

      requestOptions.agentOptions = {
        crt: fs.readFileSync(
          path.join(process.cwd(),'..','certificates/wsdl/supplier.crt')
        ),
        key: fs.readFileSync(
          path.join(process.cwd(),'..','certificates/wsdl/supplier.key')
        ),
        passphrase: '123!@#',
        securityOptions: 'SSL_OP_NO_SSLv3'
      };

      //var req = requestOptions.methodOptions.req;
      //var clientCRT = req.socket.getPeerCertificate().raw.toString('base64');
      return;
    }

  }



};
