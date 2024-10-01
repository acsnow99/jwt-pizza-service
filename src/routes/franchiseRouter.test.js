const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

const originalPassword = 'passwordagain';
const adminUserRegister = { name: 'admin', email: 'a@gmail.com', password: 'passwordagain', roles: [{ role: Role.Admin }] }
const testFranchise = {name: 'pizzaTest', admins: [{email: 'admin@admin.admin'}]};
const testStore = {franchiseId: 0, name: "thebeststore"};
let testUserAuthToken;
let testUserId;

beforeAll(async () => {
    adminUserRegister.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const addResult = await DB.addUser(adminUserRegister);
    addResult.password = originalPassword;

    const loginRes = await request(app)
        .put('/api/auth')
        .send({ email: addResult.email, password: addResult.password });
    
    expect(loginRes.status).toBe(200);
    
    testUserAuthToken = loginRes.body.token;
    testUserId = addResult.id;
    
    testFranchise.name = Math.random().toString(36).substring(2, 12);
    testFranchise.admins[0].email = addResult.email;
});

test('create franchise', async () => {
    const createRes = await request(app).post('/api/franchise').set('Content-Type', 'application/json').set('Authorization', 'Bearer ' + testUserAuthToken).send(testFranchise);
    expect(createRes.status).toBe(200);
    expect(createRes.body.name).toBe(testFranchise.name);
    testFranchise.id = createRes.body.id;
});

test('get franchises', async () => {
    const getRes = await request(app).get('/api/franchise');
    expect(getRes.status).toBe(200);
    const names = [];
    getRes.body.forEach((fran) => names.push(fran.name));
    expect(names.includes(testFranchise.name)).toBeTruthy();
});

test('create store', async () => {
    testStore.franchiseId = testFranchise.id;
    const createRes = await request(app).post(`/api/franchise/${testFranchise.id}/store`).set('Content-Type', 'application/json').set('Authorization', 'Bearer ' + testUserAuthToken).send(testStore);
    expect(createRes.status).toBe(200);
    expect(createRes.body.name).toBe(testStore.name);
    testStore.id = createRes.body.id;
});

test('get a user\'s franchises', async () => {
    const getRes = await request(app).get('/api/franchise/' + testUserId).set('Authorization', 'Bearer ' + testUserAuthToken);
    expect(getRes.status).toBe(200);
    console.log("Got franchises:", getRes.body);
    const names = [];
    getRes.body.forEach((fran) => names.push(fran.name));
    expect(names.includes(testFranchise.name)).toBeTruthy();
});

test('delete a store', async () => {
    const deleteRes = await request(app).delete(`/api/franchise/${testFranchise.id}/store/${testStore.id}`).set('Authorization', 'Bearer ' + testUserAuthToken);
    expect(deleteRes.status).toBe(200);
    const getRes = await request(app).get('/api/franchise/' + testUserId).set('Authorization', 'Bearer ' + testUserAuthToken);
    console.log("Franchises again:", getRes.body);
    expect(getRes.body[0].stores).toStrictEqual([]);
});

test('delete a franchise', async () => {
    const deleteRes = await request(app).delete('/api/franchise/' + testFranchise.id).set('Authorization', 'Bearer ' + testUserAuthToken);
    expect(deleteRes.status).toBe(200);
    const getRes = await request(app).get('/api/franchise/' + testUserId).set('Authorization', 'Bearer ' + testUserAuthToken);
    expect(getRes.body).toStrictEqual([]);
});

