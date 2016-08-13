// A placeholder image if the user does not have one
const PLACEHOLDER = 'https://placeimg.com/60/60/people';

// An anonymous user if the message does not have that information
const dummyUser = {
  avatar: PLACEHOLDER,
  email: 'Anonymous'
}

// Establish a Socket.io connection
const socket = io()

// Initialize our Feathers client application through Socket.io
// with hooks and authentication.
const app = feathers()
  .configure(feathers.socketio(socket))
  .configure(feathers.hooks())
  // Use localStorage to store our login token
  .configure(feathers.authentication({
    storage: window.localStorage
  }))

  // Get the Feathers services we want to use
  const userService = app.service('users');
  const messageService = app.service('messages');

var vm = new Vue({
    el: 'body',
    data: {
    user: {
      authenticated: false
    }
  },
  created() {
    app.authenticate().then(() => {
      this.user.authenticated = true;
      // console.log(app.get('user')._id);
    })
    // On errors we just redirect back to the login page
    .catch(error => {
      if (error.code === 401) window.location.href = '/login.html'
    });
  }
});

Vue.component('chat-app', {
  template: '#chat-app-template'
});

Vue.component('user-list', {
  template: '#user-list-template',

  data() {
    return {
      dummyUser: dummyUser,
      users: []
    }
  },

  ready() {
    // Find all users
    userService.find().then(page => {
      this.users = page.data
    })

    // We will also see when new users get created in real-time
    userService.on('created', user => {
      this.users.push(user)
    })
  },

  methods: {
    logout() {
      app.logout().then(() => {
        vm.user.authenticated = false
        window.location.href = '/index.html'
      })
    }
  }
});

Vue.component('message-list', {
  template: '#message-list-template',

  data () {
    return {
      placeholder: PLACEHOLDER,
      messages: []
    }
  },

  ready () {
    // Find the latest 10 messages. They will come with the newest first
    // which is why we have to reverse before adding them
    messageService.find({
      query: {
        $sort: {createdAt: -1},
        $limit: 25
      }
    }).then(page => {
      page.data.reverse()
      this.messages = page.data
      this.scrollToBottom()
    })

    // Listen to created events and add the new message in real-time
    messageService.on('created', message => {
      this.messages.push(message)
      this.newMessage = ''
      this.scrollToBottom()

      // console.log(this.user,message);

      if(message.sentBy._id==app.get('user')._id)
        return;

      if (Notification.permission !== "granted")
        Notification.requestPermission();
      else {
        var notification = new Notification('Notification title', {
          icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
          body: message.text,
        });
      }

      playSound();

    })
  },

  methods: {
    scrollToBottom: () => {
      vm.$nextTick(() => {
        const node = vm.$el.getElementsByClassName('chat')[0]
        node.scrollTop = node.scrollHeight
      })
    }
  }
});

Vue.component('message', {
  props: ['message', 'index'],
  template: '#message-template',
  filters: {
    moment: date => {
      return moment(date).format('MMM Do, hh:mm:ss')
    }
  }
});

Vue.component('compose-message', {
  template: '#compose-message-template',

  data () {
    return {
      newMessage: ''
    }
  },

  methods: {
    addMessage () {
      // Create a new message and then clear the input field
      messageService.create({text: this.newMessage}).then(this.newMessage = '')
    }
  }
});

// request permission on page load
document.addEventListener('DOMContentLoaded', function () {
  if (!Notification) {
    alert('Desktop notifications not available in your browser. Try Chromium.');
    return;
  }

  if (Notification.permission !== "granted")
    Notification.requestPermission();
});

function playSound() {
  document.getElementById('the-bell').play();
}
