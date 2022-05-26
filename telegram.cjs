const { default: axios } = require('axios')

require('dotenv').config()


module.exports.arch = async function arch(message) {
    const ARCHIVERSE_TELEGRAM = process.env.ARCHIVERSE_TELEGRAM
    const ROOM_ID = -676091265
    let url = `https://api.telegram.org/bot${ARCHIVERSE_TELEGRAM}/sendMessage?chat_id=${ROOM_ID}&text=${message}`
    axios.get(url)  
}

module.exports.post = async function post(message) {
    const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY
    const ROOM_ID = -1001552429837
    let url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage?chat_id=${ROOM_ID}&text=${message}`
    axios.get(url)
}
