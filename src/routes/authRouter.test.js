const request = require('supertest');
const app = require('../service');

const adminUser = { name: 'admin', email: 'admin@test.com', password: 'ad', roles: [{ role: 'admin' }] };
const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  expect(testUserAuthToken).toBeTruthy();
});

beforeEach(async () => {
  await request(app).delete('/api/auth').set('Authorization', 'Bearer ' + testUserAuthToken);
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  testUserAuthToken = loginRes.body.token;

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body.user).toMatchObject(user);
  expect(password).toBeTruthy();
});

test('register', async () => {
  const registerRes = await request(app).post('/api/auth').send(testUser);
  expect(registerRes.status).toBe(200);
  expect(registerRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  testUserAuthToken = registerRes.body.token;

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(registerRes.body.user).toMatchObject(user);
  expect(password).toBeTruthy();
});

test('update', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  testUserAuthToken = loginRes.body.token;

  const newEmailString = 'notAnEmail@gmail.com';
  const newUser = { email: newEmailString, password: 'notapassword' };
  const updateRes = await request(app).put(`/api/auth/${loginRes.body.user.id}`).set('Authorization', 'Bearer ' + testUserAuthToken).set('Content-Type', 'application/json').send(newUser);
  expect(updateRes.status).toBe(200);

  console.log("Users", testUser, updateRes.body)
  expect(updateRes.body.email).toBe(newEmailString);
})