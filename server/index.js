// Copyright (c) 2022 Panshak Solomon

import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import pdf from 'html-pdf'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { MongoClient, ServerApiVersion } from 'mongodb';
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ROUTES
import invoiceRoutes from './routes/invoices.js'
import clientRoutes from './routes/clients.js'
import userRoutes from './routes/userRoutes.js'
import profile from './routes/profile.js'

// TEMPLATES
import pdfTemplate from './documents/index.js'
import emailTemplate from './documents/email.js'

const app = express()

// MIDDLEWARE
app.use(express.json({ limit: "30mb", extended: true }))
app.use(express.urlencoded({ limit: "30mb", extended: true }))
app.use(cors())

// ROUTE USAGE
app.use('/invoices', invoiceRoutes)
app.use('/clients', clientRoutes)
app.use('/users', userRoutes)

app.use('/profiles', profile)

// NODEMAILER SETUP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // or your SMTP host
  port: 587,
  auth: {
    user: 'your-email@gmail.com', // replace with real email
    pass: 'your-app-password' // replace with app password
  },
  tls: {
    rejectUnauthorized: false
  }
})

const pdfOptions = { format: 'A4' }

// ROUTE TO SEND PDF INVOICE
app.post('/send-pdf', (req, res) => {
  const { email, company } = req.body

  pdf.create(pdfTemplate(req.body), pdfOptions).toFile('invoice.pdf', (err) => {
    if (err) return res.status(500).send(Promise.reject())

    transporter.sendMail({
      from: `Accountill <hello@accountill.com>`,
      to: email,
      replyTo: company.email,
      subject: `Invoice from ${company.businessName || company.name}`,
      text: `Invoice from ${company.businessName || company.name}`,
      html: emailTemplate(req.body),
      attachments: [{
        filename: 'invoice.pdf',
        path: `${__dirname}/invoice.pdf`
      }]
    })

    res.send(Promise.resolve())
  })
})

// ROUTE TO CREATE PDF ONLY
app.post('/create-pdf', (req, res) => {
  pdf.create(pdfTemplate(req.body), pdfOptions).toFile('invoice.pdf', (err) => {
    if (err) return res.status(500).send(Promise.reject())
    res.send(Promise.resolve())
  })
})

// ROUTE TO FETCH PDF
app.get('/fetch-pdf', (req, res) => {
  res.sendFile(`${__dirname}/invoice.pdf`)
})

// DEFAULT ROUTE
app.get('/', (req, res) => {
  res.send('SERVER IS RUNNING')
})

// ✅ DIRECT MONGODB CONNECTION STRING

const PORT = 3000

// DB CONNECTION & SERVER START
// mongoose.connect(DB_URL)
//   .then(() => app.listen(PORT, () => console.log(`✅ Server running on port: ${PORT}`)))
//   .catch((error) => console.log('❌ MongoDB connection error:', error))

const uri = "mongodb+srv://antasjain2004:RxVY8RIUc4UJXTMC@cluster0.62tbdcs.mongodb.net/myDB?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    socketTimeoutMS: 30000 // Increase socket timeout if needed
  }

});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. Connected to MongoDB!");
    app.listen(PORT, () => console.log(`🚀 Server running on port: ${PORT}`));
  } catch (err) {
    console.error("❌ Connection failed:", err);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
