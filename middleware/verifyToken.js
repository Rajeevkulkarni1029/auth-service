require('dotenv').config()
const jwt = require('jsonwebtoken')

const verifyToken = async (req, res, next) => {
  const token = req?.headers?.cookie?.split('=')[1]

  if (!token) { return res.status(401).json({ message: 'Authorization token is missing' }) }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY)
    req.user = decoded
    next()
  } catch (error) {
    console.error('Error verifying token:', error)
    return res.status(401).json({ message: 'Invalid token' })
  }
}

module.exports = verifyToken