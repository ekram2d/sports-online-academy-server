const express = require('express')
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)

const port = process.env.PORT || 5001

// middleware
app.use(cors());
app.use(express.json());

const verfyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log(authorization);
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
  
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
    const enrolldatabase = client.db('scools').collection('enroll')





    //jwt token send

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })


    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded?.email;
      const query = { email: email }
      const user = await userssdatabase.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      next();
    }
    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded?.email;
      const query = { email: email }
      const user = await userssdatabase.findOne(query);
      if (user?.role !== 'instructor') {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      next();
    }


    //coure related class data
    app.get('/data', async (req, res) => {

      //const result = await collection.find().sort({ price: 1 }).toArray();
      const result = await menudatabase.find().sort({ availableSeats: 1 }).toArray();
      res.send(result);
    })
    //class added method
    app.post('/data', verfyJWT, verifyInstructor, async (req, res) => {
      const newClass = req.body;
      console.log(newClass);
      const result = await menudatabase.insertOne(newClass);

      res.send(result);
    })

    // instratuctor class 
    app.get('/allclass', verfyJWT, verifyInstructor, async (req, res) => {
      const useremail = req.query.email;

      // if (!useremail) {
      //   res.send([]);
      // }
      // const decodedEmail = req.decoded.email;
      // if (useremail != decodedEmail) {

      //   return res.status(403).send({ error: true, message: 'porviden access' })
      // }
      const query = { email: useremail }
      // console.log(query)

      const result = await menudatabase.find(query).toArray();
      // console.log('quuum',result)  
      res.send(result);


    })













    // class carts insert 

    app.get('/carts', verfyJWT, async (req, res) => {
      const useremail = req.query.email;

      if (!useremail) {
        res.send([]);
      }
      const decodedEmail = req.decoded?.email;
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



    app.get('/users', verfyJWT, verifyAdmin, async (req, res) => {

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
    app.get('/users/instructor/:email', verfyJWT, async (req, res) => {
      const email = req.params.email;
      // console.log(email)
      if (req.decoded?.email !== email) {
        return res.send({ instructor: false })
      }
      // console.log(email)
      const query = { email: email }
      const user = await userssdatabase.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      // console.log(result);
      return res.send(result)

    })
    app.get('/users/admin/:email', verfyJWT, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      if (req.decoded.email !== email) {
        return res.send({ admin: false })
      }
      const query = { email: email }
      const user = await userssdatabase.findOne(query);
      const result = { admin: user?.role === 'admin' }
      // console.log(result);
      return res.send(result)

    })

    app.patch('/feedback/admin/:id', verfyJWT, verifyAdmin, async (req, res) => {

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      // console.log(filter)
      const updateDoc = {
        $set: {
          Feedback: req.body.field1
        },
      };
      // console.log(req.body.field1);
      const result = await menudatabase.updateOne(filter, updateDoc);
      // console.log(result);
      res.send(result);

    })
    app.patch('/status/admin/:id', verfyJWT, verifyAdmin, async (req, res) => {

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      // console.log(filter)
      const updateDoc = {
        $set: {
          status: req.body.field1
        },
      };
      // console.log(req.body.field1);
      const result = await menudatabase.updateOne(filter, updateDoc);
      // console.log(result);
      res.send(result);

    })

    app.patch('/users/admin/:id', verfyJWT, async (req, res) => {

      const id = req.params.id;
      console.log("id",id)
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

    // /update/instructor/${userId}

    // update by instructor 

    app.patch('/update/instructor/:id', verfyJWT, verifyInstructor, async (req, res) => {

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          className: req.body.field1,
          price: req.body.field2,
          availableSeats: req.body.field3
        },
      };

      const result = await menudatabase.updateOne(filter, updateDoc);
      // console.log(id);
      // console.log(result)

      res.send(result);

    })


    // enroll related

    app.get('/enroll/data/:email', verfyJWT, async (req, res) => {
      const email = req.params.email;
      // console.log(email);

      try {
        const query = { userEmail: email }

        const result = await enrolldatabase.find(query).sort({ data: -1 }).toArray();
        res.send(result)
      } catch (error) {
        console.error('Error retrieving enrollments:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    app.post('/enroll', verfyJWT, async (req, res) => {
      // console.log(req.body);
      try {
        const enrollData = req.body; // Assuming the request body contains the enrollment data
        enrollData.availableSeats = parseInt(enrollData.availableSeats) - 1
        // Insert the enr console. console.log('ki');og('ki');ollData into the enrolldatabase collection
        const result = await enrolldatabase.insertOne(enrollData);
        // console.log(enrollData.availableSeats);
        // Send the inserted data as the respons    e 
        res.send(result);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    app.delete('/enroll/delete/:id', verfyJWT, async (req, res) => {
      const id = req.params.id;
      // console.log("id",id,req.body.id1);
      //try {
      const resultavailbleseats = await menudatabase.findOne({ _id: new ObjectId(id) });
      resultavailbleseats.availableSeats -= 1;

      // // Update the document in the MongoDB collection
      const resultupdate = await menudatabase.updateOne({ _id: new ObjectId(id) }, { $set: { availableSeats: parseInt(resultavailbleseats.availableSeats) } });
      // console.log("seats",resultupdate);
      // res.send(resultupdate);
      //  const result1=await cartsdatabase.findOne()
      // const result=await cartsdatabase.findOne({_id:new ObjectId(req.body.id1)})
      //     console.log(result);
      // res.send(result)
      const deleteresult = await cartsdatabase.deleteOne({ _id: new ObjectId(req.body.id1) })
      // console.log('de',deleteresult);
      // res.send(deleteresult);
      //   if (result.deletedCount === 1) {
      //     res.send({ message: 'Enrollment deleted successfully' });
      //   } else {
      //     res.status(404).send({ error: 'Enrollment not found' });
      //   }
      // } catch (error) {
      //   console.error('Error deleting enrollment:', error);
      //   res.status(500).send('Internal Server Error');
      //}
      res.send(deleteresult)
    });

    app.get("/enroll/data/:className/:email", verfyJWT, verifyInstructor, async (req, res) => {
      const className = req.params.className;
      const email = req.params.email;

      try {
        const enrollments = await enrolldatabase.find({
          className: className,
          email: email,
        }).toArray();

        res.send(enrollments);
      } catch (error) {
        console.error("Error retrieving enrollments:", error);
        res.status(500).send("Internal Server Error");
      }
    });



    // payment related 

    app.post('/create-payment-intent', verfyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      // console.log(amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
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