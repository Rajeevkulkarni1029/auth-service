require('dotenv').config()
const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../../models/userModel')

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user) { return res.status(400).json({ message: 'Invalid email or password' }) }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) { return res.status(400).json({ message: 'Invalid email or password' }) }

    if (user.twoFactorEnabled) {
      // Generate a temporary JWT token for 2FA verification
      const tempToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '10m' })
      return res.json({ message: 'Two-factor authentication required', tempToken })
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' })

    res.cookie('jwtToken', token, { httpOnly: true })

    res.json({ message: 'Login successful', token: token })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const setupTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const secret = speakeasy.generateSecret({ length: 20 })

    user.twoFactorSecret = secret.base32
    await user.save()

    QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
      if (err) {
        return res.status(500).json({ message: 'Error generating QR code' })
      }
      res.json({ qrCodeUrl: dataUrl, secret: secret.base32 })
    })
  } catch (error) {
    console.error('Error setting up two-factor authentication:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const verifyTwoFactor = async (req, res) => {
  try {
    const { token } = req.body
    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    })

    if (!verified) {
      return res.status(400).json({ message: 'Invalid token' })
    }

    user.twoFactorEnabled = true
    await user.save()

    res.json({ message: 'Two-factor authentication enabled successfully' })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const changePassword = async (req, res) => {
  try {
    console.log(req.body)
    const { email, oldPassword, newPassword } = req.body

    const user = await User.findOne({ email })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) { return res.status(400).json({ message: 'Old password is incorrect' }) }

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

module.exports = {
  login,
  setupTwoFactor,
  verifyTwoFactor,
  changePassword
}