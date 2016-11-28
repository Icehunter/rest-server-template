const path = require('path');

const Boom = require('boom');
const Joi = require('joi');

const versionParser = require('../helpers/version-parser.js');

const systemInfoCache = (next) => {
  try {
    const versionInfo = versionParser.getVersionInfo(path.join(__dirname, '../../'));
    process.nextTick(() => next(null, versionInfo));
  } catch (err) {
    process.nextTick(() => next(err));
  }
};

const initialize = (server) => {
  // SETUP CACHE FUNCTIONS
  server.method('systemInfo', systemInfoCache, {
    cache: {
      cache: 'redisCache',
      expiresIn: 60 * 1000,
      segment: 'systemInfo',
      generateTimeout: 5000
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
        server.methods.systemInfo((err, result) => {
          if (err) {
            return reply(Boom.expectationFailed(err.message));
          }
          return reply(result);
        });
      }
    }
  });
};

module.exports = {
  initialize
};
