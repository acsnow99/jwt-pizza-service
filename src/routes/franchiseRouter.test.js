const request = require('supertest');
const app = require('../service');

const adminUser = { email: 'a@gmail.com', password: 'passwordagain'}
const testFranchise = {name: 'pizzaTest', admins: [{email: 'admin@admin.admin'}]};
let testUserAuthToken;

beforeAll(async () => {
    const loginRes = await request(app).put('/api/auth').send(adminUser);
    testUserAuthToken = loginRes.body.token;
});

test('get franchises', async () => {
    const getRes = await request(app).get('/api/franchise');
    console.log("Franchises:", getRes.body, getRes.status);
    expect(getRes.status).toBe(200);
});

test('create franchise', async () => {
    const createRes = await request(app).post('/api/franchise').set('Content-Type', 'application/json').set('Authorization', 'Bearer ' + testUserAuthToken).send(testFranchise);
    expect(createRes.status).toBe(200);
    expect(createRes.body.name).toBe(testFranchise.name);
});
