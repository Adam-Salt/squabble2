// const io = require('socket.io-client');
import io from 'socket.io-client';

const socket = io();
const notice = {};
const state = {
  windowActive: true
}

window.onfocus = () => state.windowActive = true;
window.onblur = () => state.windowActive = false;

if (document.readyState !== 'loading'){
  start();
} else {
  document.addEventListener('DOMContentLoaded', start);
}

function start(){
  configChat();
  configNotifications();
}

function configChat(){
  const feed = document.querySelector('.chatroom__feed');
  // socket configuration
  socket.on('user', data => {
    // sync chatroom users info
    document.getElementById('user-count').innerHTML = data.allUsers.length;
    let allUsernames = data.allUsers.map(item => item.name);
    let chatroomUsersDiv = document.getElementById('chatroom-users');
    // for each child elem in the chatroom-users div, check the dataset.username
    Array.from(chatroomUsersDiv.children).forEach((elem,ind,arr) => {
      // if elem's dataset.username is not in the socket data, remove it
      if (!allUsernames.includes(elem.dataset.username)) {
        elem.remove();
      }
    });
    let chatroomUsers = Array.from(chatroomUsersDiv.children).map(elem => elem.dataset.username);
    // for each user in the socket data, check the user data {name,avatar}
    data.allUsers.forEach(user => {
      // if user.name does not have an element in the chatroom-users div, create one
      if (!chatroomUsers.includes(user.name)) {
        let div = document.createElement('div');
        div.dataset.username = user.name;
        div.title = user.name;
        div.className = 'chatroom__info__users__avatar avatar-icon avatar-icon--md';
        div.onclick = () => {
          window.open(`/profile/${user.name}`, '_blank');
        }
        div.innerHTML = `<img src="/assets/avatars/${user.avatar}.svg">`;
        chatroomUsersDiv.append(div);
      }
    })
    // chatroom feed update
    // let autoScroll = shouldAutoScroll(feed);
    let text = `${data.name} has ${data.connected ? 'joined' : 'left'} the room.`;
    addPost(text, 'notice');
    // if (autoScroll) scrollToBottom(feed);
  });
  socket.on('chat message', data => {
    // let autoScroll = shouldAutoScroll(feed);
    addPost(data, 'message');
    // if (autoScroll) scrollToBottom(feed);
  });

  // ajax form submission
  var form = document.querySelector('#chatroom-form');
  form.onsubmit = (e)=>{
    e.preventDefault();
    var input = document.querySelector('.chatroom__form__input');
    var message = input.value;
    if (message.trim() === '') return false;
    else {
      socket.emit('chat message', message);
      input.value = '';
    }
  }

}

function addPost(data, type='message'){
  let feed = document.querySelector('.chatroom__feed');
  var autoScroll = shouldAutoScroll(feed);
  // additional classes if type=notice
  var noticeClass = type === 'message'
  ? ''
  : data.includes('join')
  ? ' chatroom__post--notice--joined'
  : ' chatroom__post--notice--left';
  let className = `chatroom__post chatroom__post--${type}${noticeClass}`;

  let post = document.createElement('li');
  post.className = className;

  let text = document.createElement('div');
  // additional classes if type=message
  let messageClass = type === 'notice'
    ? ''
    : data.name == document.getElementById('socket-user').innerHTML.trim()
      ? ' chatroom__post__text--self'
      : ' chatroom__post__text--other';
  text.className = `chatroom__post__text${messageClass}`;
  text.innerHTML = type === 'message' ? data.message : data;
  post.append(text);

  let avatar = document.createElement('div');
  avatar.className = "chatroom__post__avatar";
  // circle = server or user avatar
  let avatarCircle = document.createElement('div');
  avatarCircle.className = type === 'message'
    ? "chatroom__post__avatar__circle avatar-icon"
    : "chatroom__post__avatar__circle";
  let circleContent = type === 'message'
    ? `<img class='' src='${data.avatar}'></img>`
    : data.includes('join')
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  avatarCircle.innerHTML = circleContent;
  avatarCircle.title = type === 'message'
    ? data.name
    : 'Server Notice';
  avatar.append(avatarCircle);
  if (type === 'message') {
    avatarCircle.onclick = () => {
      window.open(`/profile/${data.name}`, '_blank');
    }
  }
  // append to parent elements
  post.append(avatar);
  feed.append(post);
  // autoscroll to the bottom of the feed, if already viewing newest messages
  if (autoScroll || messageClass.includes('self')) scrollToBottom(feed);
  // send browser notification
  if (type === 'message' && document.hidden) {
    sendNotice('newMessage', {
      name: data.name,
      text: data.message
    });
  }
  return;

  function shouldAutoScroll(elem){
    return elem.scrollTop >= (elem.scrollHeight - elem.offsetHeight);
  }
  function scrollToBottom(elem){
    elem.scrollTop = elem.scrollHeight;
  }
  function sendNotice(type, data = {}){
    if (notice.hasOwnProperty(type)) notice[type](data);
  }
}

function configNotifications() {
  if (!("Notification" in window)) console.warn("This browser does not support notifications");
  else if (Notification.permission === 'granted') {
    createNotifications();
  }
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      createNotifications();
    })
  }
  function createNotifications(){
    notice.newMessage = (data) => new Notification(`Fruibowl: New message from ${data.name}`, {
      body: data.text,
      icon: '/favicon.ico'
    });
  }
}
