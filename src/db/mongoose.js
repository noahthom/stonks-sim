const mongoose = require('mongoose')

const connectionURL_mongoose = 'mongodb://127.0.0.1:27017/stonk-db'

mongoose.connect(connectionURL_mongoose)