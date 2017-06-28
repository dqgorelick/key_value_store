process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

const app = require('../server/app.js');
const helpers = require('../server/helpers.js');

chai.use(chaiHttp);

describe('Server', () => {
  describe('GET request', () => {
    it('should have status code 400 for /keys/:key route without a key provided', done => {
      chai.request(app)
        .get('/keys')
        .end(function(err, res) {
          res.should.have.status(400);
          done();
        });
    });
    it('should have status code 200 for /key/:key route with key provided', done => {
      chai.request(app)
        .get('/keys/testing')
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
  describe('PUT request', () => {
    it('should have status code 200 for /key route with valid JSON provided.', done => {
      let mockData = JSON.stringify({data: {key: "hello", value: "world"}});
      chai.request(app)
        .put('/keys')
        .set('content-type', 'application/json')
        .send(mockData)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
    it('should have status code 400 if "content-type" header is not "application/json"', done => {
      let mockData = JSON.stringify({data: {key: "hello", value: "world"}});
      chai.request(app)
        .put('/keys')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(mockData)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
    it('should have status code 422 if data object is not present or cannot be parsed.', done => {
      let mockData = JSON.stringify({cats: {key: "hello", value: "world"}});
      chai.request(app)
        .put('/keys')
        .set('content-type', 'application/json')
        .send(mockData)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    });
    it('should have status code 422 if key parameter is missing within data object.', done => {
      let mockData = JSON.stringify({data: {value: "world"}});
      chai.request(app)
        .put('/keys')
        .set('content-type', 'application/json')
        .send(mockData)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    });
    it('should have status code 422 if value parameter is not defined.', done => {
      let mockData = JSON.stringify({data: {key: "hello"}});
      chai.request(app)
        .put('/keys')
        .set('content-type', 'application/json')
        .send(mockData)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    });
  });
});

describe('Database', () => {
  beforeEach(done => {
    helpers.dropTable((err) => {
      helpers.createTable((err) => {
        done();
      })
    })
  });
  it('getItem should return empty array for unmatched key.', done => {
    helpers.getItem('test', (err, res) => {
      res.should.be.a('array');
      res.length.should.be.equal(0);
      done();
    });
  });
  it('getItem should return correct key value pair for correct key.', done => {
    let mockData = {key: "hello", value: "world"};
    helpers.addItem(mockData.key, mockData.value, (err) => {
      helpers.getItem(mockData.key, (err, res) => {
        res[0]['item_value'].should.equal(mockData.value);
        done();
      });
    });
  });
  it('getItem should return with error if error occurs.', done => {
    let mockData = {key: "hello", value: "world"};
    helpers.dropTable((err) => {
      helpers.getItem(mockData.key, (err, res) => {
        err.code.should.equal('SQLITE_ERROR');
        done();
      });
    });
  });
  it('addItem should replace value if key if key already exists.', done => {
    let mockData = {key: "hello", value: "world"};
    let differentValue = {key: "hello", value: "jupiter"};
    helpers.addItem(mockData.key, mockData.value, (err) => {
      helpers.getItem(mockData.key, (err, res) => {
        let firstValue = res[0]['item_value'];
        helpers.addItem(differentValue.key, differentValue.value, (err) => {
          helpers.getItem(mockData.key, (err, res) => {
            let secondValue = res[0]['item_value'];
            secondValue.should.equal(differentValue.value);
            secondValue.should.not.equal(firstValue);
            done();
          });
        });
      });
    });
  });
  it('addItem should return error if error occurs.', done => {
    let mockData = {key: "hello", value: "world"};
    helpers.dropTable((err) => {
      helpers.addItem(mockData.key, mockData.value, (err, res) => {
        err.code.should.equal('SQLITE_ERROR');
        done();
      });
    });
  });
});

describe('E2E', () => {
  beforeEach(done => {
    helpers.dropTable((err) => {
      helpers.createTable((err) => {
        done();
      })
    })
  });
  it('PUT should insert value with correct JSON and if status code is 200.', done => {
    let mockData = {data: {key: "hello", value: "world"}};
    let mockJSON = JSON.stringify(mockData);
    chai.request(app)
      .put('/keys')
      .set('content-type', 'application/json')
      .send(mockJSON)
      .end((err, res) => {
        res.should.have.status(200);
        helpers.getItem(mockData.data.key, (err, res) => {
          res[0]['item_value'].should.equal(mockData.data.value);
          done();
        })
      });
  });
  it('PUT should not insert value to database if status code is NOT 200.', done => {
    let mockData = {data: {value: "world"}};
    let mockJSON = JSON.stringify(mockData);
    chai.request(app)
      .put('/keys')
      .set('content-type', 'application/json')
      .send(mockJSON)
      .end((err, res) => {
        res.should.not.have.status(200);
        helpers.getItem(mockData.data.key, (err, res) => {
          res.should.be.a('array');
          res.length.should.be.equal(0);
          done();
        })
      });
  });
  it('GET should not return empty string if key value pair does not exist.', done => {
    let mockData = {key: "hello", value: "world"};
    helpers.addItem(mockData.key, mockData.value, (err) => {
      chai.request(app)
        .get('/keys/cats')
        .end((err, res) => {
          res.text.should.equal('');
          done();
        });
    });
  });
  it('GET should return correct value if key value pair exists.', done => {
    let mockData = {key: "hello", value: "world"};
    helpers.addItem(mockData.key, mockData.value, (err) => {
      chai.request(app)
        .get('/keys/hello')
        .end((err, res) => {
          res.text.should.equal('world');
          done();
        });
    });
  });
});
