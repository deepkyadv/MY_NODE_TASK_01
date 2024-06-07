const express = require('express');
const router = express.Router();
const User = require('./models/user');

router.post('/create', async function (req, res) {
  const { firstName, lastName, email, mobileNo, address, loginId, password } = req.body;
  const socketId = req.io.sockets.sockets.keys().next().value; // Assign socketId if available

  if (!socketId) {
    return res.status(400).send('Socket ID not available');
  }

  try {
    const user = new User({ 
      firstName, 
      lastName, 
      email, 
      mobileNo,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country
      },
      loginId,
      password,
      socketId 
    });
    await user.save();
    req.liveUsers[user.socketId] = user;
    req.io.emit('new-user', user);
    res.status(201).send('User created successfully');
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).send(err.message);
  }
});


//GET REQUEST TO FETCH USER
router.get('/fetchData', async (req, res)=>{
    try {
        const users = await User.find({})
    console.log("fetched users", users);
    res.status(200).json(users);

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });

        
    }
})

module.exports = router;
