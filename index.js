const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const ObjectId = require("mongodb").ObjectID;
const port = 5000;
require('dotenv').config();

const app = express();

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors());

app.use(express.static('services'));
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.neh82.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const servicesCollection = client.db("creativeAgency").collection("services");
    const adminCollection = client.db("creativeAgency").collection("admin");
    const feedbacksCollection = client.db("creativeAgency").collection("feedbacks");
    const ordersCollection = client.db("creativeAgency").collection("orders");

    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const title = req.body.title;
        const description = req.body.description;
        const filePath = `${__dirname}/services/${file.name}`;
        file.mv(filePath, err => {
            if (err) {
                console.log(err);
                return res.status(500).send({ msg: "Failed to upload Image" })
            }
            res.send({ name: file.name, path: `/${file.name}` });

            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');

            const image = {
                contentType: file.mimetype,
                size: file.size,
                img: Buffer.from(encImg, 'base64')
            };
            servicesCollection.insertOne({ title, description, image })
                .then(result => {
                    res.send(result.insertedCount > 0)
                });
        });

    });


    app.get('/services', (req, res) => {
        servicesCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            });
    });


    app.post('/addFeedback', (req, res) => {
        const feedback = req.body;

        feedbacksCollection.insertOne(feedback)
            .then(result => {
                res.send(result.insertedCount > 0)
            });
    });

    app.get('/feedbacks', (req, res) => {
        feedbacksCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });


    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({ email: email })
            .toArray((err, admin) => {
                res.send(admin.length > 0);
            })
    })

    app.post('/addOrder', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const orderName = req.body.orderName;
        const projectDetails = req.body.projectDetails;
        const price = req.body.price;
        const status = req.body.status;
        const filePath = `${__dirname}/orders/${file.name}`;


        file.mv(filePath, err => {
            if (err) {
                console.log(err);
                return res.status(500).send({ msg: "Failed to upload Image" })
            }
            res.send({ name: file.name, path: `/${file.name}` });

            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');

            const image = {
                contentType: file.mimetype,
                size: file.size,
                img: Buffer.from(encImg, 'base64')
            };

            ordersCollection.insertOne({ name, email, orderName, projectDetails, price, image, status })
                .then(result => {
                    res.send(result.insertedCount > 0)
                });
        });

    });

    app.get('/orders/:email', (req, res) => {
        const email = req.params.email
        adminCollection.find({ email: email })
            .toArray((err, admin) => {
                if (admin.length > 0) {
                    ordersCollection.find({})
                        .toArray((err, documents) => {
                            res.send(documents);
                        })
                }
                else {
                    ordersCollection.find({ email: email })
                        .toArray((err, documents) => {
                            res.send(documents);
                        })
                }

            })
    });



    app.patch("/updateStatus/:id", (req, res) => {
        ordersCollection.updateOne(
            {
                _id: ObjectId(req.params.id),
            },
            {
                $set: {
                    status: req.body.status,
                },
            }
        )
            .then((result) => {
                res.send(result.modifiedCount > 0);
            });
    });


    app.post('/makeAdmin', (req, res) => {
        const email = req.body.email;

        adminCollection.insertOne({ email: email })
            .then(result => {
                res.send(result.insertedCount > 0)
            });
    })
});




app.get('/', (req, res) => {
    res.send('Hello creative agency')
})

app.listen(process.env.PORT || port)