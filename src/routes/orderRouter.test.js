const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

const originalPassword = 'passwordagain';
const adminUserRegister = { name: 'admin', email: 'a@gmail.com', password: 'passwordagain', roles: [{ role: Role.Admin }] }
const testMenuItem = { title: 'my pizza', description: 'nothing', image: 'pizza9.png', price: 0.001 };
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
});

test('add an item to menu', async () => {
    testMenuItem.title = Math.random().toString(36).substring(2, 12);
    const addRes = await request(app).put('/api/order/menu').set('Content-Type', 'application/json').set('Authorization', 'Bearer ' + testUserAuthToken).send(testMenuItem);
    const titles = [];
    addRes.body.forEach((item) => titles.push(item.title));
    expect(titles.includes(testMenuItem.title)).toBeTruthy();
});

test('get the menu', async () => {
    const getRes = await request(app).get('/api/order/menu');
    const titles = [];
    getRes.body.forEach((item) => titles.push(item.title));
    expect(titles.includes(testMenuItem.title)).toBeTruthy();
});
