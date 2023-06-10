const express = require('express')
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 5001

// middleware
app.use(cors());
app.use(express.json());

const verfyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;


  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unathorization access' })
  }

  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unathorization access' })
    }
    req.decoded = decoded;
   
  })

  next();
}









const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wlwsqet.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //     await client.connect();
    // Send a ping to confirm a successful connection

    const menudatabase = client.db('scools').collection('menu');
    const cartsdatabase = client.db('scools').collection('carts')
    const userssdatabase = client.db('scools').collection('users')





    //jwt token send

    app.post('/jwt', (req, res) => {

      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({ token })
    })

    app.get('/data', async (req, res) => {

      //const result = await collection.find().sort({ price: 1 }).toArray();
      const result = await menudatabase.find().sort({ availableSeats: 1 }).toArray();
      res.send(result);
    })



    // class carts insert 

    app.get('/carts', verfyJWT, async (req, res) => {
      const useremail = req.query.email;

      if (!useremail) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (useremail != decodedEmail) {

        return res.status(403).send({ error: true, message: 'porviden access' })
      }
      const query = { userEmail: useremail }

      const result = await cartsdatabase.find(query).toArray();
      // console.log('qu',result)
      res.send(result);


    })
    app.post('/carts', async (req, res) => {

      const item = req.body;
      // console.log(item);
      const result = await cartsdatabase.insertOne(item);
      res.send(result);
    })



    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsdatabase.deleteOne(query);
      res.send(result);
    })



    // users collection 



    app.get('/users', async (req, res) => {

      const result = await userssdatabase.find().toArray();
      res.send(result);
    })
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userssdatabase.findOne(query);
      // console.log('exit',existingUser);
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await userssdatabase.insertOne(user);
      res.send(result);
    })
    app.get('/users/instructor/:email', verfyJWT,async (req, res) => {
      const email = req.params.email;
      console.log(email)
      if (req.decoded.email !== email) {
        return res.send({ instructor: false })
      }
      console.log(email)
      const query = { email: email }
      const user = await userssdatabase.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      console.log(result);
      return res.send(result)

    })
    app.get('/users/admin/:email', verfyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
       return res.send({ admin: false })
      }
      const query = { email: email }
      const user = await userssdatabase.findOne(query);
      const result = { admin: user?.role === 'admin' }
      console.log(result);
      return res.send(result)

    })
  

    app.patch('/users/admin/:id', async (req, res) => {

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: req.body.field1
        },
      };
      // console.log(req.body.field1);
      const result = await userssdatabase.updateOne(filter, updateDoc);
      res.send(result);

    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //     await client.close();
  }
}
run().catch(console.dir);




















app.get('/', (req, res) => {
  res.send('summer schools camp is starting ')
})
app.listen(port, () => {


  console.log(`summer server is starting in port : ${port}`);
})