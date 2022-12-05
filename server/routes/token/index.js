'use strict'
const axios = require('axios');

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    const { code } = request.query;
    console.info('');
    console.info('-------------------------------------------');
    console.info(`GET /token [code=${code}]`);
    const params = {
      app_id: process.env.APP_ID,
      app_secret: process.env.APP_SECRET,
      code,
      grant_type: 'authorization_code',
    };
    const url = process.env.AUTHORIZATION_SERVER_TOKEN_URL + '?' + objectToQuery(params);
    // console.log('url:', url);
    const res = await axios.post(url);
    // console.log('res:', res.status, res.data);
    reply.send(res.data);
  })
}

const objectToQuery = (obj) => {
  const params = new URLSearchParams(obj);
  return String(params);
};
