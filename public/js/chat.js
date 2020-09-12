const socket = io();

const $messageForm = document.querySelector('#chat-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

const chatTemplate = document.querySelector('#chat-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;


const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    //new Message
    const $newMessage = $messages.lastElementChild;

    //height of new message
    const messageStyles = getComputedStyle($newMessage);
    const messageMargin = parseInt(messageStyles.marginBottom)
    const messageHeight = $newMessage.offsetHeight + messageMargin;

    //visible Height
    const visibleHeight = $messages.offsetHeight

    //container Height
    const containerHeight = $messages.scrollHeight;

    //how far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    //if scrollbar is at the bottom of the container before the new message then after new message scroll down
    if(containerHeight - messageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
        console.log(containerHeight - messageHeight)
        console.log('scrollOffset', scrollOffset)
    }

}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(chatTemplate, {
        username: message.username,
        chatMessage: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html) 
    autoscroll();
})

socket.on('locationMessage', (location) => {
    console.log(location)
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        locationurl: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll();
})

socket.on('roomData', ({room, userList}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        userList
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) =>{
    e.preventDefault();
    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error) {
            return console.log(error)
        }

        console.log('Message Delivered')
    })
})

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute('disabled', 'disabled');

    if(!navigator.geolocation) {
        return alert('Browser does not support geolocation!')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const myposition = {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }
        socket.emit('sendLocation', myposition, (locationsharedmessage) => {
            console.log(locationsharedmessage);
            $locationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error);
        location.href = '/'
    }
})