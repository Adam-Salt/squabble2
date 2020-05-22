// main dependencies
const express = require('express')
const cookieParser = require('cookie-parser')
const createError = require('http-errors')
const helmet = require('helmet')
const mongoose = require('mongoose')
// auth, session
const passport = require('passport')
const session = require('express-session')
const sessionStore = new session.MemoryStore();
// app
const app = express();
// server, socket
const http = require('http').Server(app)
const io = require('socket.io')(http)
const passportSocketIO = require('passport.socketio');
// dev dependencies
const path = require('path')
// server files
const configAuth = require(path.join(__dirname, 'server', 'auth'));
const configSocket = require(path.join(__dirname, 'server', 'socket'));
// routes
const indexRouter = require(path.join(__dirname, 'server', 'routes', 'index'))

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use((req,res,next)=>{
  next(createError(404));
})
// error handler
app.use((err,req,res,next)=>{
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err: {};
  // render the error page
  res.status(err.status || 500);
  res.render('error', {
    error: {
      status: err.status,
      message: err.message
    }
  });
})

// database connection -- only allow requests when connection success
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useFindAndModify: false
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async ()=>{
  console.log('MongoDB connection successful');

  // configure routes, authentication
  await configAuth();

  // async/await for all setup to complete before listening
  var port = process.env.PORT || 3000;
  await http.listen(port);
  console.log(`Server listening on port ${port}...`);

  // run socket configuration after successful server startup
  io.use(passportSocketIO.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SECRET,
    store: sessionStore
  }));
  configSocket(io);
});
