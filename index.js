const express = require('express');
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Shopping Cart Server Running');
})


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bioniru.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    const roomsCollection = client.db("todoDB").collection("rooms");
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.get('/rooms', async(req, res) => {
        const result = await roomsCollection.find().toArray();
        res.send(result);
    })
    app.get('/hotel-rooms', async(req, res) => {
        const { checkInDate, checkOutDate } = req.query;
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        console.log('link',start, end);
        // console.log('split',startDate, endDate);
        const availableRooms = await roomsCollection
      .aggregate([
        {
          $addFields: {
            startDate: {
              $toDate: {
                $arrayElemAt: [{ $split: ['$dateRange', ' - '] }, 0],
              },
            },
            endDate: {
              $toDate: {
                $arrayElemAt: [{ $split: ['$dateRange', ' - '] }, 1],
              },
            },
          },
        },
        {
          $match: {
            startDate: { $lte: end },
            endDate: { $gte: start },
          },
        },
      ])
      .toArray()
          res.send(availableRooms);
    })

    app.get('/search', async (req, res) => {
        try {
          const { bedrooms, beds, minPrice, maxPrice } = req.query;
      
          const query = {
            bedrooms: { $gte: parseInt(bedrooms) },
            beds: { $gte: parseInt(beds) },
            price: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
          };
      
          const rooms = await roomsCollection.find(query).toArray();
          res.send(rooms);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Server error' });
        }
      })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, (req, res) => {
    console.log(`Server Running on Port: ${port}`)
})