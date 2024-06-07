const express =require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
//onst bodyparser = require(bodyParser);
const path = require("path");
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require("body-parser");
const cors = require('cors');
const createError = require('http-errors');
const app = express();
const myserver = http.createServer(app);
const io = socketIo(myserver);


const liveUsers = {};



mongoose.connect("mongodb+srv://deepakyadav13012001:xiRYZw1Fuw4FMsnm@userdb.ij2fjbq.mongodb.net/?retryWrites=true&w=majority&appName=UserDb")
.then(()=>{
    console.log("your Atlas db connected");
})
.catch((error)=>{
    console.log("error===", error)
})

const serverRouter = require('./routes/server');
const User = require('./routes/models/user');


app.use(logger('dev'));
app.use(cors()); // Enable CORS
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use('/server', (req, res, next) => {
  req.liveUsers = liveUsers;
  req.io = io;
  next();
},);


// CREATING USER API AND STORED IN DB
// app.post("/create", async function (req,res){
//   try{
//         const newUser = new User(req.body); 
//         const savedUser = await newUser.save();
//         res.status(201).json(savedUser);
//       } catch (error) {
//         res.status(400).json({ error: error.message });
//       }
// })

// GET REQUEST TO FETCH USER
// app.get('/fetchData', async (req, res)=>{
//     try {
//         const users = await User.find({})
//     console.log("fetched users", users);
//     res.status(200).json(users);

//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });

        
//     }
// })

//STATIC FILES
app.use(express.static(path.join(__dirname, 'views')));



app.use((req, res, next) => {
    if (req.url.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
    next();
  });

 



//SERVE HTML FILE
app.get("/", (req, res)=>{
    res.sendFile(path.join(__dirname, 'views', 'index.html'));

    
})

app.use('/server', serverRouter);



  //app.use('/socket', socketRouter);
  
  // View engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');


  app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
  });



  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
  
    socket.on('join-live-user', async ({ email, name, socketId }) => {
      try {
        const user = await User.findOneAndUpdate(
          { email },
          { socketId: socket.id },
          { new: true } 
        );
  
        if (user) {
          liveUsers[socket.id] = user;
          io.emit('update-live-users', Object.values(liveUsers));
          console.log(`${name} joined with socket ID: ${socket.id}`);
        }
      } catch (error) {
        console.error('Error updating user socket ID:', error);
      }
    });
  
    socket.on('disconnect', async () => {
      try {
        const user = await User.findOneAndUpdate(
          { socketId: socket.id },
          { socketId: null }
        );
  
        if (user) {
          delete liveUsers[socket.id];
          io.emit('update-live-users', Object.values(liveUsers));
          console.log(`User with socket ID ${socket.id} disconnected`);
        }
      } catch (error) {
        console.error('Error handling user disconnect:', error);
      }
    });
  });
  
  
  app.post('/checkUser', async (req, res) => {
    const { email, socketId } = req.body;
    try {
      const user = await User.findOne({ email });
      if (user) {
        user.socketId = socketId;
        await user.save();
        liveUsers[socketId] = user;
        io.emit('new-user', liveUsers); // Broadcast updated live users list to all clients
        res.json({ exists: true, user });
      } else {
        res.json({ exists: false });
      }
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  
  
  // Catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });

  
 
  
  
  


myserver.listen(4100, ()=>{
    console.log("server connected")
})

module.exports = app;


