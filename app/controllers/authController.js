import 'dotenv/config'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../../models/userModel.js'

const signup = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, password, contactNumber, location, dateOfBirth } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' })
    }

    const newUser = new User({
      firstName, middleName, lastName, email, password,
      contactNumber, location, dateOfBirth,
      twoFactorEnabled: false, emailVerified: false
    })

    await newUser.save()

    const token = jwt.sign({ userId: newUser._id }, process.env.SECRET_KEY, { expiresIn: '1h' })

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        twoFactorEnabled: newUser.twoFactorEnabled
      }
    })
  } catch (error) {
    console.error('Error in signup:', error)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' })
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user) { return res.status(400).json({ message: 'Invalid email or password' }) }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) { return res.status(400).json({ message: 'Invalid email or password' }) }

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '10m' })
      return res.json({ message: 'Two-factor authentication required', tempToken })
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' })
    res.cookie('jwtToken', token, { httpOnly: true })
    res.json({ message: 'Login successful', token })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const setupTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) { return res.status(404).json({ message: 'User not found' }) }

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${user.email} (${process.env.APP_NAME || 'User Management System'})`
    })

    user.twoFactorSecret = secret.base32
    await user.save()

    QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
      if (err) { return res.status(500).json({ message: 'Error generating QR code' }) }
      res.json({
        qrCodeUrl: dataUrl,
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url,
        message: 'Scan this QR code with your authenticator app'
      })
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
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (!user.twoFactorSecret) { return res.status(400).json({ message: 'Two-factor authentication not set up' }) }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    })

    if (!verified) { return res.status(400).json({ message: 'Invalid token' }) }

    user.twoFactorEnabled = true
    await user.save()

    const finalToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' })
    res.json({ message: 'Two-factor authentication enabled successfully', token: finalToken })
  } catch (error) {
    console.error('Error verifying two-factor authentication:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const disableTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) { return res.status(404).json({ message: 'User not found' }) }

    user.twoFactorEnabled = false
    user.twoFactorSecret = undefined
    await user.save()

    res.json({ message: 'Two-factor authentication disabled successfully' })
  } catch (error) {
    console.error('Error disabling two-factor authentication:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body
    const user = await User.findOne({ email })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }

    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) { return res.status(400).json({ message: 'Old password is incorrect' }) }

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const resetPassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword, resetToken, requireOldPassword = true } = req.body

    const user = await User.findOne({ email })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }

    if (requireOldPassword && oldPassword) {
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
      if (!isOldPasswordValid) { return res.status(400).json({ message: 'Old password is incorrect' }) }
    }

    if (resetToken && resetToken !== process.env.ADMIN_RESET_TOKEN) {
      return res.status(400).json({ message: 'Invalid reset token' })
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' })
    }

    user.password = newPassword
    await user.save()

    res.json({
      message: 'Password reset successfully',
      resetMethod: requireOldPassword ? 'with_old_password' : 'admin_reset'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const adminResetPassword = async (req, res) => {
  try {
    const { email, newPassword, adminToken } = req.body

    if (adminToken !== process.env.ADMIN_RESET_TOKEN) {
      return res.status(403).json({ message: 'Invalid admin token' })
    }

    const user = await User.findOne({ email })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' })
    }

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password reset successfully by admin', resetMethod: 'admin_reset' })
  } catch (error) {
    console.error('Error in admin password reset:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const generateResetToken = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }

    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.SECRET_KEY,
      { expiresIn: '1h' }
    )

    res.json({
      message: 'Reset token generated successfully',
      resetToken,
      expiresIn: '1 hour',
      note: 'In production, this token should be sent via email'
    })
  } catch (error) {
    console.error('Error generating reset token:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const resetPasswordWithToken = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' })
    }

    let decoded
    try {
      decoded = jwt.verify(resetToken, process.env.SECRET_KEY)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ message: 'Invalid token type' })
    }

    const user = await User.findById(decoded.userId)
    if (!user) { return res.status(404).json({ message: 'User not found' }) }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' })
    }

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password reset successfully using reset token', resetMethod: 'token_reset' })
  } catch (error) {
    console.error('Error resetting password with token:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const signupWithTwoFactor = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, password, contactNumber, location, dateOfBirth } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) { return res.status(400).json({ message: 'User with this email already exists' }) }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) { return res.status(400).json({ message: 'Please enter a valid email address' }) }

    if (password.length < 8) { return res.status(400).json({ message: 'Password must be at least 8 characters long' }) }

    const newUser = new User({
      firstName, middleName, lastName, email, password,
      contactNumber, location, dateOfBirth,
      twoFactorEnabled: false, emailVerified: false
    })

    await newUser.save()

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${newUser.email} (${process.env.APP_NAME || 'User Management System'})`
    })

    newUser.twoFactorSecret = secret.base32
    await newUser.save()

    let qrCodeUrl = ''
    try {
      qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)
    } catch (err) {
      console.error('Error generating QR code:', err)
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.SECRET_KEY, { expiresIn: '1h' })

    res.status(201).json({
      message: 'User created successfully with 2FA setup',
      token,
      twoFactorSecret: secret.base32,
      qrCodeUrl,
      otpauthUrl: secret.otpauth_url,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        twoFactorEnabled: false
      }
    })
  } catch (error) {
    console.error('Error in signup with 2FA:', error)
    if (error.code === 11000) { return res.status(400).json({ message: 'Email already exists' }) }
    res.status(500).json({ message: 'Internal server error' })
  }
}

const verifySignupTwoFactor = async (req, res) => {
  try {
    const { email, token } = req.body
    const user = await User.findOne({ email })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (!user.twoFactorSecret) { return res.status(400).json({ message: 'Two-factor authentication not set up' }) }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    })

    if (!verified) { return res.status(400).json({ message: 'Invalid token' }) }

    user.twoFactorEnabled = true
    await user.save()

    const finalToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' })
    res.json({ message: 'Two-factor authentication enabled successfully', token: finalToken })
  } catch (error) {
    console.error('Error verifying signup 2FA:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const completeLoginWithTwoFactor = async (req, res) => {
  try {
    const { tempToken, twoFactorToken } = req.body

    if (!tempToken || !twoFactorToken) {
      return res.status(400).json({ message: 'Temporary token and 2FA token are required' })
    }

    let decoded
    try {
      decoded = jwt.verify(tempToken, process.env.SECRET_KEY)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired temporary token' })
    }

    const user = await User.findById(decoded.userId)
    if (!user) { return res.status(404).json({ message: 'User not found' }) }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Two-factor authentication not properly configured' })
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorToken,
      window: 2
    })

    if (!verified) { return res.status(400).json({ message: 'Invalid two-factor authentication token' }) }

    const finalToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' })
    res.cookie('jwtToken', finalToken, { httpOnly: true })

    res.json({
      message: 'Login successful with two-factor authentication',
      token: finalToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        twoFactorEnabled: user.twoFactorEnabled
      }
    })
  } catch (error) {
    console.error('Error completing login with 2FA:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export {
  signup,
  login,
  setupTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  changePassword,
  resetPassword,
  adminResetPassword,
  generateResetToken,
  resetPasswordWithToken,
  signupWithTwoFactor,
  verifySignupTwoFactor,
  completeLoginWithTwoFactor
}
