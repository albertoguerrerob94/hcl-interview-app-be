// dependencies
const express = require("express");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require('mongodb').ObjectId;


// express config
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// mongodb config
const url = "mongodb://hcl:hcl2019@ds127015.mlab.com:27015/heroku_fhmkzds2";
const dbName = "heroku_fhmkzds2";
const client = new MongoClient(url, { useNewUrlParser: true });


// mongodb crud operations
function insert(db, collectionName, data, cb) {
  const collection = db.collection(collectionName);
  collection.insertOne(data, cb);
}

function select(db, collectionName, query, cb) {
  const collection = db.collection(collectionName);
  collection.find(query).toArray(cb);
}

function selectOne(db, collectionName, query, cb) {
  const collection = db.collection(collectionName);
  collection.find(query).limit(1).toArray((err, res) => {
    cb(err, res[0]);
  });
}

function update(db, collectionName, query, data, cb) {
  const collection = db.collection(collectionName);
  collection.updateOne(query, data, cb);
}

function remove(db, collectionName, query, cb) {
  const collection = db.collection(collectionName);
  collection.deleteOne(query, cb);
}


// mongodb and server initialization
client.connect(err => {
  console.log("connected to mongodb");
  const db = client.db(dbName);

  app.get("/events", (req, res) => {
    select(db, "events", {}, (err, docs) => {
      if(err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(docs);
      }
    });
  });

  app.post("/events", (req, res) => {
    insert(db, "events", {
      ...req.body,
      people: [],
      comments: []
    }, err => {
      if(err) {
        res.status(500).send(err);
      } else {
        console.log("inserted event");
        res.status(201).send();
      }
    });
  });

  app.get("/events/:id", (req, res) => {
    selectOne(db, "events", { _id: ObjectId(req.params.id) }, (err, event) => {
      if(err) {
        res.status(500).send(err);
      } else {
        console.log("fetched event");
        res.status(200).send(event);
      }
    });
  });

  app.put("/events/:id", (req, res) => {
    update(db, "events",
    { _id: ObjectId(req.params.id) },
    { $set: req.body },
    err => {
      if(err) {
        res.status(500).send(err);
      } else {
        res.status(204).send();
      }
    });
  });

  app.delete("/events/:id", (req, res) => {
    remove(db, "events", { _id: ObjectId(req.params.id) }, err => {
      if(err) {
        res.status(500).send(err);
      } else {
        console.log("event removed");
        res.status(200).send();
      }
    });
  });

  app.post("/events/:id/comment", (req, res) => {
    const query = { _id: ObjectId(req.params.id) };

    selectOne(db, "events", query, (err, event) => {
      if(err) {
        res.status(500).send(err);
      } else {
        const comments = event.comments.concat(req.body);
        update(db, "events", query, { $set: { comments } }, err2 => {
          if(err2) {
            res.status(500).send(err2);
          } else {
            res.status(204).send();
          }
        });
      }
    });
  });

  app.get("/events/:id/join", (req, res) => {
    const { userid } = req.query;
    const query = { _id: ObjectId(req.params.id) };
    const userQuery = { _id: ObjectId(userid) };

    selectOne(db, "events", query, (err, event) => {
      if(err) {
        res.status(500).send(err);
      } else {
        selectOne(db, "users", userQuery, (err2, user) => {
          const { firstName: name, location } = user;
          const eventPeople = event.people;
          const people = eventPeople.concat({
            name, location, id: userid
          });

          update(db, "events", query, { $set: { people } }, err3 => {
            if(err3) {
              res.status(500).send(err3);
            } else {
              res.status(204).send();
            }
          });
        });
      }
    });
  });

  app.get("/events/:id/cancel", (req, res) => {
    const { userid } = req.query;
    const query = { _id: ObjectId(req.params.id) };
    const userQuery = { _id: ObjectId(userid) };

    selectOne(db, "events", query, (err, event) => {
      if(err) {
        res.status(500).send(err);
      } else {
        selectOne(db, "users", userQuery, (err2, user) => {
          const people = event.people.filter(person => person.id !== userid);
          update(db, "events", query, { $set: { people } }, err3 => {
            if(err3) {
              res.status(500).send();
            } else {
              res.status(204).send();
            }
          });
        });
      }
    });
  });

  app.post("/users", (req, res) => {
    insert(db, "users", req.body, err => {
      if(err) {
        res.status(500).send(err);
      } else {
        console.log("inserted user");
        res.status(201).send();
      }
    });
  });

  app.post("/login", (req, res) => {
    const { email, password } = req.body;

    selectOne(db, "users", { $and: [ { email }, { password } ] }, (err, user) => {
      if(err) {
        res.send(500).send(err);
      } else if(user) {
        console.log("login successful");
        res.status(200).send({
          name: user.firstName,
          state: user.state,
          userid: user._id
        });
      } else {
        res.status(401).send();
      }
    });
  });

  app.get('/', function(req, res) {
    res.status(200).send('working!!');
  });

  app.listen(process.env.PORT, () => {
     console.log("Example app listening at port 8081");
  })
});
