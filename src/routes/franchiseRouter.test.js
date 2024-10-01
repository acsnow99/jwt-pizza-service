const request = require('supertest');
const app = require('../service');

const adminUser = { email: 'a@gmail.com', password: 'passwordagain'}
const testFranchise = {name: 'pizzaTest', admins: [{email: 'admin@admin.admin'}]};
let testUserAuthToken;
let testUserId;

beforeAll(async () => {
    const loginRes = await request(app).put('/api/auth').send(adminUser);
    testUserAuthToken = loginRes.body.token;
    testUserId = loginRes.body.user.id;
    testFranchise.name = Math.random().toString(36).substring(2, 12);
});

test('create franchise', async () => {
    const createRes = await request(app).post('/api/franchise').set('Content-Type', 'application/json').set('Authorization', 'Bearer ' + testUserAuthToken).send(testFranchise);
    expect(createRes.status).toBe(200);
    expect(createRes.body.name).toBe(testFranchise.name);
});

test('get franchises', async () => {
    const getRes = await request(app).get('/api/franchise');
    expect(getRes.status).toBe(200);
    console.log("Got franchises:", getRes.body);
    const names = [];
    getRes.body.forEach((fran) => names.push(fran.name));
    expect(names.includes(testFranchise.name));
});

test('get a user\'s franchises', async () => {
    const getRes = await request(app).get('/api/franchise/' + testUserId).set('Authorization', 'Bearer ' + testUserAuthToken);
    expect(getRes.status).toBe(200);
    console.log("Got franchises:", getRes.body);
    const names = [];
    getRes.body.forEach((fran) => names.push(fran.name));
    expect(names.includes(testFranchise.name));
});

