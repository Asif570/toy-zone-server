const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
app.use(express.json(), cors());
const PORT = process.env.PORT || 5000;
app.get("/", (_req, res) => {
  res.send("server is running");
});
const URI =
  "mongodb+srv://islamasif570:oyyrmAGeslwRU6X9@cluster0.zedao6i.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const DB = async () => {
  try {
    const DB = await client.db("toyzone");
    const coll = await DB.collection("cartoy");
    const catColl = await DB.collection("catogeryCollection");
    const authColl = await DB.collection("userCollection");
    const pinedBlogsColl = await DB.collection("pinnedBlogs");
    const galleryPhotoColl = await DB.collection("galleryPhotoCollection");
    await client.connect();
    await DB.command({ ping: 1 });
    console.log("pinged");

    // creating apis
    app.post("/pinblog", async (req, res) => {
      const { email, blog } = req.body;
      const hasUser = await pinedBlogsColl.findOne({ email: email });
      if (hasUser) {
        await pinedBlogsColl.updateOne(
          { email: email },
          {
            $set: {
              blogs: blog,
            },
          }
        );
        res.send("200");
        return;
      }

      await pinedBlogsColl.insertOne({
        email: email,
        blogs: blog,
      });
      res.send("201");
    });
    app.get("/pinblog", async (req, res) => {
      const { auth } = req.headers;
      if (!auth) {
        res.send({ data: "No data" });
        return;
      }
      const ides = await pinedBlogsColl.findOne({ email: auth });

      res.send(ides);
    });
    app.get("/byseller", async (req, res) => {
      const sellers = await authColl.find().toArray();
      const allitems = await coll.find().toArray();

      let result = sellers.map((seller) => {
        const data = allitems.filter((item) => item.email == seller.email);

        return { [seller.userName]: data };
      });
      res.send(result);
    });
    app.get("/adduser", async (req, res) => {
      const { auth, username } = req.headers;
      const token = jwt.sign({ email: auth }, process.env.JWT_SECKRET);
      const result1 = await authColl.findOne({ email: auth });
      if (result1) {
        res.status(200).send({ token: token });
      } else {
        const result2 = await authColl.insertOne({
          email: auth,
          userName: username,
        });
        res.status(200).send({ token: token });
      }
    });
    app.get("/users", async (_req, res) => {
      const result = await authColl.find().toArray();
      res.send(result);
    });
    app.get("/galleryPhotos", async (_req, res) => {
      const result = await galleryPhotoColl.find().toArray();
      res.send(result);
    });
    app.post("/addcatogery", async (req, res) => {
      const { name } = req.body;

      const result = await catColl.insertOne({
        name: name,
      });
      res.send(result);
    });
    app.get("/catogery", async (_req, res) => {
      const result1 = await catColl.find().toArray();
      const alldata = await coll.find().toArray();
      let result = {};
      result1.map((item) => {
        const ar1 = alldata.filter((data) => {
          return data.catogery == item.name;
        });

        return (result = { ...result, [item.name]: ar1.length });
      });

      res.send(result);
    });
    app.post("/addtoy", async (req, res) => {
      let {
        name,
        brand,
        model,
        color,
        price,
        image,
        features,
        catogery,
        sellerName,
        email,
        sellerImage,
        inStoke,
      } = req.body;
      price = parseInt(price);
      const result = await coll.insertOne({
        name,
        brand,
        model,
        color,
        price,
        image,
        features,
        catogery,
        sellerName,
        email,
        sellerImage,
        inStoke,
      });

      res.send(result);
    });
    app.get("/mytoys", async (req, res) => {
      const { limit = 20, skip = 0 } = req.query;
      const { auth } = req.headers;

      const result = await coll
        .find({
          email: { $regex: auth, $options: "i" },
        })
        .limit(parseInt(limit, 10))
        .skip(parseInt(skip, 10))
        .toArray();
      res.send(result);
    });
    app.get("/toySearch", async (req, res) => {
      const { name } = req.query;
      const result = await coll
        .find({
          name: {
            $regex: name,
            $options: "i",
          },
        })
        .toArray();
      console.log(result);
      res.send(result);
    });
    app.get("/toys", async (req, res) => {
      const {
        catogery = "",
        color = "",
        brand = "",
        name = "",
        limit = 5,
        skip = 0,
        min = 0,
        max = 999,
      } = req.query;

      const result = await coll
        .find({
          catogery: { $regex: catogery, $options: "i" },
          color: { $regex: color, $options: "i" },
          brand: { $regex: brand, $options: "i" },
          name: { $regex: name, $options: "i" },
          price: { $gt: parseInt(min), $lt: parseInt(max) },
        })
        .limit(parseInt(limit, 10))
        .skip(parseInt(skip, 10))
        .toArray();
      res.send(result);
    });

    app.get("/toycount", async (_req, res) => {
      const result = await coll.find().toArray();
      res.send({ result: result.length });
    });

    app.patch("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;

      const result = await coll.updateOne(
        { _id: new ObjectId(id) },
        { $set: data }
      );
      res.send(result);
    });
    app.delete("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const result = await coll.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const result = await coll.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
  } catch (error) {
    console.log(error);
  }
};
DB();
app.listen(PORT, () => {
  console.log("Running");
});
