const mongoose = require('mongoose')
const isFuture = require('date-fns/isFuture')
const validator = require('validator')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Stock = require('../models/stock-model')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    // dob: { //maybe add middleware to format to dd/mm/yyyy
    //     type: Date, //call .markModified('dob') before saving
    //     required: true,
    //     validate(date){
    //         if(isFuture(date)){
    //             throw new Error('Date of birth cannot be set in the future!')
    //         }
    //     }
    // },
    username:{
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(val){
            if(!validator.isEmail(val)){
                throw new Error('Enter a valid email!')
            }
        }
    },
    totalCash: {
        type: Number, 
        default: 200000
    },
    assetValue: {
        type: Number,
        default: 0
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
        trim: true,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

userSchema.virtual('stocks', {
    ref: 'Stock',
    localField: '_id',
    foreignField: 'owner'
})

//generate auth token, store as part of user field 'tokens', and return it as well
userSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({ _id: this._id.toString() }, 'thisismysecret')
    this.tokens = this.tokens.concat({ token: token})
    await this.save()
    return token
}

//hash password and store it in user document
userSchema.pre('save', async function (next) {

    if(this.isModified('password')){
        this.password = await bcryptjs.hash(this.password, 8)
    }

    var total = 0
    const stock = await Stock.find({owner: this._id})
    stock.forEach((stock) => {
        total += stock.price * stock.quantity
    })
    this.assetValue = total
    
    next()
})

//method for User that lets you find user by username and password
userSchema.statics.findByCredentials = async (username, password) => {
    const user  = await User.findOne({username})
    if(!user){
        throw new Error('Unable to login, username does not exist')
    }

    const isMatch = await bcryptjs.compare(password, user.password)
    if(!isMatch){
        throw new Error('Unable to login, incorrect password')
    }

    return user
}

userSchema.pre('remove', async function (next) {
    await Stock.deleteMany({owner: this._id})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User