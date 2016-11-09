const path = require('path');
const Joi = require('joi');
const versionParser = require('../helpers/version-parser.js');

const setupRoutes = (server) => {
  // AJAX/FETCH CALLS
  server.route({
    method: 'OPTIONS',
    path: '/{param*}',
    config: {
      auth: false,
      handler: (request, reply) => {
        const accessControlAllowHeaders = [];
        Object.keys(request.headers).forEach((index) => {
          accessControlAllowHeaders.push(request.headers[index]);
        });
        reply().type('text/plain')
          .header('Access-Control-Allow-Origin', '*')
          .header('Access-Control-Allow-Headers', accessControlAllowHeaders.join(', ').trim())
          .header('Access-Control-Allow-Methods', 'HEAD,PUT,GET,POST,DELETE');
      }
    }
  });

  // ROOT
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, '../../static'),
        index: true,
        lookupCompressed: true
      }
    }
  });

  // STATUS
  server.route({
    method: 'GET',
    path: '/system/health',
    config: {
      tags: ['api'],
      description: 'Get Server Health',
      notes: [
        'Returns a JSON status of the current servers health status.'
      ].join('\n'),
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'OK',
              schema: Joi.object().keys({
                running: Joi.boolean().valid(true)
              })
            },
            '500': {
              description: 'Internal Server Error',
              schema: Joi.object().keys({
                statusCode: Joi.number().valid(500),
                error: Joi.string().valid('Internal Server Error'),
                message: Joi.string().valid('An internal server error occurred')
              })
            }
          },
          payloadType: 'application/json'
        }
      },
      handler: (request, reply) => {
        reply({
          running: true
        });
      }
    }
  });

  // SYSTEM INFO
  // STATUS
  server.route({
    method: 'GET',
    path: '/system/info',
    config: {
      tags: ['api'],
      description: 'Get Server Info',
      notes: [
        'Returns a JSON status of the current servers loaded packages.'
      ].join('\n'),
      plugins: {
        limiter: {
          limit: 1,
          duration: 60
        },
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'OK',
              schema: Joi.object().keys({
                [global.Pack.name]: Joi.object().keys({
                  version: Joi.string().valid(global.Pack.version),
                  dependencies: Joi.object()
                })
              })
            },
            '500': {
              description: 'Internal Server Error',
              schema: Joi.object().keys({
                statusCode: Joi.number().valid(500),
                error: Joi.string().valid('Internal Server Error'),
                message: Joi.string().valid('An internal server error occurred')
              })
            }
          },
          payloadType: 'application/json'
        }
      },
      handler: (request, reply) => {
        reply(versionParser.getVersionInfo(path.join(__dirname, '../../')));
      }
    }
  });
};

module.exports = {
  setupRoutes
};
