const User = require('../../models/userModel')

const index = async (req, res) => {
  try {
    const users = await User.find()
    res.json(users)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

const show = async (req, res) => {
  const userId = req.params.id
  try {
    const user = await User.findOne({ id: userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
};

const create = async (req, res) => {
  try {
    const cleanedContactNumber = req.body.contactNumber.replace(/\D/g, '')
    req.body.contactNumber = cleanedContactNumber ? Number(cleanedContactNumber) : null
    const newUser = new User(req.body)
    const savedUser = await newUser.save()
    res.status(201).json(savedUser)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

const update = async (req, res) => {
  const userId = req.params.id
  try {
    const updatedUser = await User.findOneAndUpdate({ id: userId }, req.body, { new: true })
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(updatedUser)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

const destroy = async (req, res) => {
  const userId = req.params.id
  try {
    const deletedUser = await User.findOneAndDelete(userId)
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

module.exports = {
  index,
  show,
  create,
  update,
  destroy
}
