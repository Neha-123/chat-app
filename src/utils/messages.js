const generateMessage = (text, username) => {
    return {
        username,
        text,
        createdAt : new Date()
    }
}

const generateLocationMessages = (url, username) => {
    return {
        username,
        url,
        createdAt : new Date()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessages
}