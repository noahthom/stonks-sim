const express = require('express')
const User = require('../models/user-model')
const Stock = require('../models/stock-model')
const auth = require('../middleware/auth')
const finnhub = require('finnhub')

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = "c7j1ibqad3if6ueh9r5g"
const finnhubClient = new finnhub.DefaultApi()

const router = new express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try{
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.username, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    }catch(e){
        console.log(e)
        res.status(500).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => token.token != req.token)
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth , async (req, res) => {
    try{
        req.user.tokens.splice(0, req.user.tokens.length)
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    const stocks = await Stock.find({owner: req.user._id})
    res.send([req.user, stocks])

})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'username']
    const isValidParam = updates.every((update) =>allowedUpdates.includes(update))

    if(!isValidParam){
        return res.status(400).send({error: "The parameters entered do not exist!"})
    }

    try{
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    }catch(e){
        res.status(400).send()
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.remove()
        res.send(req.user)
    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/buy', auth, async (req, res) => {
    finnhubClient.quote(req.body.ticker, async (error, data, response) => {

        if(data.c === 0 || req.body.quantity <= 0){ //api error or zero/negative quantity
            return res.status(401).send()
        }else if(req.user.totalCash < req.body.quantity * data.c){ //bankruptcy
            return res.status(400).send()
        }
        const stock = await Stock.findOne({owner: req.user._id, ticker: req.body.ticker})
        if(stock){ //if stock is already owned
            stock.quantity += req.body.quantity
            stock.price = data.c
            req.user.totalCash -= data.c * req.body.quantity
            try{
                await stock.save()
                await req.user.save()
                res.status(200).send()
            }catch(e){
                res.status(400).send()
                console.log(e)
            }
        }else{ // new stock
            const stock = new Stock({
                ticker: req.body.ticker,
                boughtAt: data.c,
                price: data.c,
                quantity: req.body.quantity,
                owner: req.user._id
            })
            req.user.totalCash -= stock.price * stock.quantity
            try{
                await stock.save()
                await req.user.save()
                res.status(200).send()
            }catch(e){
                res.status(400).send()
                console.log(e)
            }
        }
    })
})

router.post('/users/sell', auth, async (req, res) => {

    const stock = await Stock.findOne({owner: req.user._id, ticker: req.body.ticker})

    if((!stock) || req.body.quantity <= 0 || req.body.quantity > stock.quantity){
        return res.status(400).send()
    }

    if(req.body.quantity === stock.quantity){
        req.user.totalCash += stock.price * stock.quantity
        await Stock.findOneAndDelete({owner: req.user._id, ticker: req.body.ticker})
        await req.user.save()
        return res.status(200).send()
    }else if(req.body.quantity < stock.quantity){
        req.user.totalCash += stock.price * req.body.quantity
        stock.quantity -= req.body.quantity
        await stock.save()
        await req.user.save()
        return res.status(200).send()
    }


})

module.exports = router