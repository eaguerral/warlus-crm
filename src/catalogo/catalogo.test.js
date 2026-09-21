const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('./index');

test('GET /health debe responder HTTP 200', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.statusCode, 200);
});

test('GET /health debe identificar el servicio catalogo', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.body.service, 'catalogo');
    assert.equal(response.body.status, 'OK');
});