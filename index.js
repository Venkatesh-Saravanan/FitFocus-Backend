
const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const feature = require('./Features.json');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// MIDDLEWARE
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2vutuar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const userDB = client.db('Fitness-Tracker-Project').collection('user');
    const TainerDB = client.db('Fitness-Tracker-Project').collection('trainer');
    const RequestToBeTainerDB = client.db('Fitness-Tracker-Project').collection('RequestToBeTainer');
    const NewsLatterDB = client.db('Fitness-Tracker-Project').collection('NewsLatter');
    const NewClassDB = client.db('Fitness-Tracker-Project').collection('classes');
    const PaymentDB = client.db('Fitness-Tracker-Project').collection('paymentHistory');
    const forumPosttDB = client.db('Fitness-Tracker-Project').collection('ForumPost');
    const ReviewDB = client.db('Fitness-Tracker-Project').collection('Review');


    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })
 
    // middlewares 
    const verifyToken = (req, res, next) => {
     
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userDB.findOne(query);
      const isAdmin = user?.role == 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    
 

    app.get('/users/admin/:email', verifyAdmin, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
 
      const query = { email: email };
      const user = await userDB.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role == 'admin';
      }
      res.send({ admin });
    })

    app.get("/users",verifyToken, async (req, res) => {
      const find = userDB.find()
      const result = await find.toArray()
      res.send(result)
    })
 
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const quary = { email: email }
      const result = await userDB.findOne(quary)
      res.send(result)
    })



    app.get("/trainers", async (req, res) => {
      const find = TainerDB.find()
      const result = await find.toArray()
      res.send(result)
    })

    app.get("/trainers/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) }
      const result = await TainerDB.findOne(quary)
      res.send(result)
    })

    app.get("/trainer/:status1", async (req, res) => {
      const status1 = req.params.status1;
      const quary = { status: status1 }
      const result = await TainerDB.find(quary).toArray()
      res.send(result)
    })

    app.get("/alltrainer/:email",verifyToken, async (req, res) => {
      const email = req.params.email;
      const quary = { user_email: email }
      const result = await TainerDB.findOne(quary)
      res.send(result)
    })

    //public route ditected
    app.get('/trainers/classes/:className',async (req, res) => {

      const className = req.params.className;
      const trainers = await TainerDB.find({
        'classes.value': className
      }).toArray();
      res.send(trainers);

    });
    // get classes
    app.get("/NewClass", async (req, res) => {
      const find = NewClassDB.find()
      const result = await find.sort({ totalBook: -1 }).toArray()
      res.send(result)
    })

    app.get("/NewClass/:className", async (req, res) => {
      const className = req.params.className;
      const quary = { className: className }
      const result = await NewClassDB.findOne(quary)
      res.send(result)
    })


    app.get("/newsLatter",verifyToken, async (req, res) => {
      const find = NewsLatterDB.find()
      const result = await find.toArray()
      res.send(result)
    })
    // payment
    app.get("/payment",verifyToken,  async (req, res) => {
      const find = PaymentDB.find()
      const result = await find.sort({ _id: -1 }).toArray()
      res.send(result)
    })
    app.get("/payment/:class", async (req, res) => {
      const Findclass = req.params.class;

      const quary = { class: Findclass }
      const result = await PaymentDB.find(quary).toArray()
      res.send(result)
    })

    app.get("/payment/mail/:email", async (req, res) => {
      const email = req.params.email;

      const quary = { email: email }
      const result = await PaymentDB.find(quary).toArray()
      res.send(result)
    })

    app.get("/ckeckbooking/:email/:slotTime",verifyToken, async (req, res) => {
      const { email, slotTime } = req.params;
      const query = { trainerEmail: email, selectedSlot: slotTime };
      const result = await PaymentDB.find(query).toArray()
      res.send(result)
    })

    // get forumPost
    app.get("/forumPost", async (req, res) => {
      const find = forumPosttDB.find()
      const result = await find.sort({ _id: -1 }).toArray()
      res.send(result)
    })
    app.get("/review", async (req, res) => {
      const find = ReviewDB.find()
      const result = await find.sort({ _id: -1 }).toArray()
      res.send(result)
    })

    app.post("/users", async (req, res) => {
      const user = req.body;
      const quary = { email: user.email }
      const existingSubscriber = await userDB.findOne(quary)
      if (existingSubscriber) {
        return res.send({ message: '0' })
      }
      else {
        const result = await userDB.insertOne(user)
        res.send(result)
      }

    })


    app.post("/trainers",verifyToken, async (req, res) => {
      const trainer = req.body;
      const quary = { user_email: trainer.user_email }
      const existingtrainer = await TainerDB.findOne(quary)
      if (existingtrainer) {
        return res.send({ message: '0' })
      }
      const result = await TainerDB.insertOne(trainer)
      res.send(result)
    })

    //newslatter subscriber

    app.post("/newsLatter", async (req, res) => {
      const subscriber = req.body;
      const quary = { user_email: subscriber.user_email }
      const existingSubscriber = await NewsLatterDB.findOne(quary)
      if (existingSubscriber) {
        return res.send({ message: '0' })
      }
      else {
        const result = await NewsLatterDB.insertOne(subscriber)
        res.send(result)
      }

    })

    // add new class
    app.post("/NewClass", async (req, res) => {
      const newClass = req.body;
      const result = await NewClassDB.insertOne(newClass)
      res.send(result)
    })


    // add review
    app.post("/review", verifyToken, async (req, res) => {
      const review = req.body;
      const result = await ReviewDB.insertOne(review)
      res.send(result)
    })

    // add forum post
    app.post("/forumPost", async (req, res) => {
      const newClass = req.body;
      const result = await forumPosttDB.insertOne(newClass)
      res.send(result)
    })
    // Payment
    app.post("/payment",verifyToken, async (req, res) => {
      const Payment = req.body

      const result = await PaymentDB.insertOne(Payment)
      res.send(result)


    })


    app.post("/RequestToBeTrainer", async (req, res) => {
      const requestToBeTrainer = req.body;
      const result = await RequestToBeTainerDB.insertOne(requestToBeTrainer)
      res.send(result)
    })


    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      
   
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });

       app.put("/trainers/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const trainerData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: trainerData.status,
          SlotTime: trainerData.SlotTime,
          classes: trainerData.Classes,
          AvailableDaysAWeek: trainerData.AvailableDaysAWeek,
          FeedBack: trainerData.FeedBack,

        }
      };
      const result = await TainerDB.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const UserData = req.body;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          name: UserData.name,
          photoURL: UserData.photoURL,
        }
      };
      const result = await userDB.updateOne(filter, updateDoc);
      res.send(result);
    });
   
    app.put("/users/:email",verifyToken, async (req, res) => {
      const email = req.params.email;
      const userData = req.body;
      const filter = { email: email };
      const options = { upset: true };
      const updateDoc = {
        $set: {
          role: userData.role,
        }
      };
      const result = await userDB.updateOne(filter, updateDoc, options);
      res.send(result);
    })


    app.put("/NewClass/:className", async (req, res) => {
      const className = req.params.className;
      const totalBook = req.body.totalBook || 0;
      const filter = { className: className };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          totalBook: totalBook + 1,
        },
      };

      const result = await NewClassDB.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.put("/forumPost/:id", async (req, res) => {
      const id = req.params.id;
      const userData = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          totalUpvote: userData.totalUpvote,
          message: userData.message,
        },
      };
      const result = await forumPosttDB.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    app.delete("/trainers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await TainerDB.deleteOne(query);
      res.send(result)
    })


    app.delete("/trainers/:id/:slot", async (req, res) => {
      const id = req.params.id;
      const slot = req.params.slot;
    
      const query = { _id: new ObjectId(id) };
    
      try {
        const trainer = await TainerDB.findOne(query);
        
        if (!trainer) {
          return res.status(404).json({ message: "Trainer not found" });
        }

        const updatedSlots = trainer.SlotTime.filter(s => s !== slot);

        const update = { $set: { SlotTime: updatedSlots } };
        const result = await TainerDB.updateOne(query, update);

        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: "Slot not found or already deleted" });
        }

        res.json({ message: "Slot deleted successfully" });
      } catch (error) {
        console.error("Error deleting slot:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

  
  } finally {

  }
}
run().catch(console.dir);

app.get('/features', async (req, res) => {
  res.send(feature)
})

app.get("/", (req, res) => {
  res.send('<h1>Server is running</h1>');
})

app.listen(port, () =>
  console.log('Server was running in port ', port)
)