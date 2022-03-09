const express = require('express')
require('./db/mongoose')
const router = require('./routers/router')
const { response } = require('express')

const app = express()

const port = 3000



app.use(express.json())
app.use(router)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})
