const User = require(process.cwd() + '/models/User')

module.exports = function(io) {
  // socket state
  var allUsers = [];

  io.on('connection', socket => {
    socket.user = socket.request.user;
    console.log(`Connection to user '${socket.user.username}'`);
    allUsers.push({
      name: socket.request.user.username,
      avatar: socket.request.user.favorite_fruit
    });
    io.emit('user', {
      name: socket.request.user.username,
      connected: true,
      allUsers
    });

    // configure socket response behavior
    socket.on('disconnect', () => {
      var index = allUsers.findIndex(user => user.name == socket.request.user.username);
      allUsers.splice(index, 1);
      io.emit('user', {
        name: socket.request.user.username,
        connected: false,
        allUsers
      });
    });

    socket.on('chat message', message => {
      const user = socket.request.user;
      console.log(`Message received from ${user.username}: ${message}`)
      User.updateOne(
        { _id: user._id },
        { $inc: { messages_sent: 1 }},
        (err, doc) => {
          if (err) console.log(err);
          io.emit('chat message', {
            name: user.username,
            message,
            avatar: avatarFor(user.favorite_fruit)
          });
        }
      );
    });

  });

  //helper
  function avatarFor(fruit){
    switch(fruit){
      case 'apple':
        return 'https://cdn.glitch.com/9e24a3f0-3807-455d-af3b-8b70ccd9ef9e%2Fapple.svg?1554359005369';
      case 'grapes':
        return 'https://cdn.glitch.com/9e24a3f0-3807-455d-af3b-8b70ccd9ef9e%2Fgrapes.svg?1554359005406';
      case 'lemon':
        return 'https://cdn.glitch.com/9e24a3f0-3807-455d-af3b-8b70ccd9ef9e%2Flemon.svg?1554330258701';
      case 'mango':
        return 'https://cdn.glitch.com/9e24a3f0-3807-455d-af3b-8b70ccd9ef9e%2Fmango.svg?1554330258786';
      case 'orange':
        return 'https://cdn.glitch.com/9e24a3f0-3807-455d-af3b-8b70ccd9ef9e%2Forange.svg?1554330258954';
      case 'pear':
        return 'https://cdn.glitch.com/9e24a3f0-3807-455d-af3b-8b70ccd9ef9e%2Fpear.svg?1554330258987';
      case 'pineapple':
        return 'https://cdn.glitch.com/9e24a3f0-3807-455d-af3b-8b70ccd9ef9e%2Fpineapple.svg?1554359175596';
      case 'pomegranate':
        return 'https://cdn.glitch.com/9e24a3f0-3807-455d-af3b-8b70ccd9ef9e%2Fpomegranate.svg?1554330259172';
      case 'strawberry':
        return 'https://cdn.glitch.com/9e24a3f0-3807-455d-af3b-8b70ccd9ef9e%2Fstrawberry.svg?1554330259151';
      case 'watermelon':
        return 'https://cdn.glitch.com/9e24a3f0-3807-455d-af3b-8b70ccd9ef9e%2Fwatermelon.svg?1554330259353';
      default:
        return '';
    }
  }
}
