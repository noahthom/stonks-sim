const mongoose = require('mongoose')



const stockSchema = new mongoose.Schema({
    ticker: {
        type: String,
        required: true
    },
    boughtAt: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})



const Stock = mongoose.model('Stock', stockSchema)

module.exports = Stock