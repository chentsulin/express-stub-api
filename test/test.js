'use strict'

var stubApi = require('../')
var request = require('supertest')
var express = require('express')
var Promise = require('native-or-bluebird')
var app


var STUB = { id: 1, name: 'Wow' }
var STUB2 = { id: 2, name: 'Yaa' }


describe('express-stub-api', function() {
  beforeEach(function() {
    app = express()
  })

  it('can direct response object', function(done) {
    app.use(stubApi(STUB))

    get('/', {}, validateStub('direct response'), done)
  })

  it('can response when match query', function(done) {
    app.use(stubApi({
      query: { a: '1', b: '2' }
    }, STUB))

    get('/', { a: '1', b: '2' }, validateStub('response when match query'), done)
  })

  it('can response when match query (urlencoded)', function(done) {
    app.use(stubApi({
      query: 'a=1&b=2'
    }, STUB))

    get('/', { a: '1', b: '2' }, validateStub('response when match query'), done)
  })

  it('can response when match body', function(done) {
    app.use(stubApi({
      body: { a: '1', b: '2' }
    }, STUB))

    post('/', {}, { a: '1', b: '2' }, validateStub('response when match body'), done)
  })

  it('can response when match body (urlencoded)', function(done) {
    app.use(stubApi({
      body: 'a=1&b=2'
    }, STUB))

    post('/', {}, { a: '1', b: '2' }, validateStub('response when match body'), done)
  })

  it('can use multiple times', function(done) {
    app.use(stubApi({
      query: { a: '1', b: '2' }
    }, STUB))
    app.use(stubApi({
      query: { a: '2', b: '1' }
    }, STUB2))

    var p1 = new Promise(function(resolve, reject) {
      get('/', { a: '1', b: '2' }, validateStub('response when match first condition'), resolve)
    })

    var p2 = new Promise(function(resolve, reject) {
      get('/', { a: '2', b: '1' }, validateStub2('response when match second condition'), resolve)
    })

    Promise.all([ p1, p2 ]).then(done);
  })

  it('can use array as argument', function(done) {
    app.use(stubApi([
      stubApi({
        query: { a: '1', b: '2' }
      }, STUB),
      stubApi({
        query: { a: '2', b: '1' }
      }, STUB2)
    ]))

    var p1 = new Promise(function(resolve, reject) {
      get('/', { a: '1', b: '2' }, validateStub('response when match first condition'), resolve)
    })

    var p2 = new Promise(function(resolve, reject) {
      get('/', { a: '2', b: '1' }, validateStub2('response when match second condition'), resolve)
    })

    Promise.all([ p1, p2 ]).then(done);
  })

  it('can use with specific url', function(done) {
    app.get('/users', stubApi(STUB))

    get('/users', {}, validateStub('response when match with specific url'), done)
  })

  it('can response when match url params', function(done) {
    app.get('/users/:userId/cars/:carId', stubApi({
      param: { userId: '1', carId: '2' }
    }, STUB))

    get('/users/1/cars/2', {}, validateStub('response when match parameter'), done)
  })

  it('can response when match query + body + param', function(done) {
    app.post('/users/:userId/cars/:carId', stubApi({
      query: { a: '1', b: '2' },
      body: { a: '2', b: '1' },
      param: { userId: '1', carId: '2' }
    }, STUB))

    post('/users/1/cars/2', { a: '1', b: '2' }, { a: '2', b: '1'},
    validateStub('response when match query + body + param'), done)
  })

  it('can use multiple within on one app get', function(done) {
    app.get('/users',
    stubApi({
      query: { a: '1', b: '2' }
    }, STUB),
    stubApi({
      query: { a: '2', b: '1' }
    }), STUB2)

    var p1 = new Promise(function(resolve, reject) {
      get('/users', { a: '1', b: '2' }, validateStub('response when match first condition'), resolve)
    })

    var p2 = new Promise(function(resolve, reject) {
      get('/users', { a: '2', b: '1' }, validateStub2('response when match first condition'), resolve)
    })

    Promise.all([ p1, p2 ]).then(done);
  })

  it('can use with router', function(done) {
    var router = express.Router()

    router.get('/users', stubApi(STUB))

    app.use(router)

    get('/users', { a: '1', b: '2' }, validateStub('response when match route'), done)
  })

  it('can use multiple within on one router get', function(done) {
    var router = express.Router()

    router.get('/users',
    stubApi({
      query: { a: '1', b: '2' }
    }, STUB),
    stubApi({
      query: { a: '2', b: '1' }
    }, STUB2))

    app.use(router)

    var p1 = new Promise(function(resolve, reject) {
      get('/users', { a: '1', b: '2' }, validateStub('response when match first condition'), resolve)
    })

    var p2 = new Promise(function(resolve, reject) {
      get('/users', { a: '2', b: '1' }, validateStub2('response when match first condition'), resolve)
    })

    Promise.all([ p1, p2 ]).then(done);
  })

});

function get(url, query, resExpect, done) {
  return request(app)
    .get(url)
    .query(query)
    .expect('Content-Type', /json/)
    .expect(200)
    .expect(resExpect)
    .end(done)
}

function post(url, query, body, resExpect, done) {
  return request(app)
    .post(url)
    .query(query)
    .send(body)
    .expect('Content-Type', /json/)
    .expect(200)
    .expect(resExpect)
    .end(done)
}

function validate(id, name, sentence) {
  return function(res) {
    if (!('id' in res.body)) return sentence + ' failed'
    if (!(id === res.body.id)) return sentence + ' incorrect'
    if (!('name' in res.body)) return sentence + ' failed'
    if (!(name === res.body.name)) return sentence + ' incorrect'
  }
}


function validateStub(sentence) {
  return validate(1, 'Wow', sentence)
}

function validateStub2(sentence) {
  return validate(2, 'Yaa', sentence)
}
