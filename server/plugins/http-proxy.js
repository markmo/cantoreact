'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  fastify.register(require('@fastify/http-proxy'), {
    upstream: '',
    prefix: '/api',
    rewritePrefix: '/api',
    replyOptions: {
      getUpstream: (original, base) => {
        const searchParams = new URLSearchParams(parseQueryString(original.url));
        const tenant = searchParams.get('tenant');
        return 'https://' + tenant;
      }
    }
  })
})

const parseQueryString = (str) => {
  const parts = str.split('?');
  if (parts.length > 1) {
    return parts[1];
  }
  return '';
};