

const finnhub = require('finnhub')
const Stock = require('../models/stock-model')
const User = require('../models/user-model')
const mongoose = require('mongoose')

const connectionURL_mongoose = 'mongodb://127.0.0.1:27017/stonk-db'

mongoose.connect(connectionURL_mongoose)

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = "c7j1ibqad3if6ueh9r5g"
const finnhubClient = new finnhub.DefaultApi()

const updateFn = async () => {
    const stocks = await Stock.find({})
    stocks.forEach((stock) => {
        finnhubClient.quote(stock.ticker, async (error, data, response) => {
            stock.price = data.c
            await stock.save()
        })
    })
    const users = await User.find({})
    users.forEach(async (user) => {
        await user.save()
    })

}

updateFn()