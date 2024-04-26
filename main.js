require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const app = express()

app.use(express.json())

const userRoutes = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once('open', () => {
  console.log('Connected to MongoDB')
})

app.use('/v1/users', userRoutes)
app.use('/v1', authRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error')
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`)
})
