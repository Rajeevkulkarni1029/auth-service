require('dotenv').config()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../../models/userModel')

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) { return res.status(400).json({ message: 'Invalid email or password' }) }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) { return res.status(400).json({ message: 'Invalid email or password' }) }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' })

    res.cookie('jwtToken', token, { httpOnly: true })

    res.json({ message: 'Login successful', token: token })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

module.exports = {
  login
}