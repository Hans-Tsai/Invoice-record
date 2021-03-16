const express = require('express')
const router = express.Router()
const Invoice = require('../models/invoiceModel')

router.get('/invoice', (req, res, next) => {
  Invoice.find({}, 'invoice_type')
    .then(data => res.json(data))
    .catch(next)
})

router.post('/invoice', (req, res, next) => {
  if(req.body.invoice_type) {
    Invoice.create(req.body)
    .then(data => res.json(data))
    .catch(next)
  } else {
    res.json({
      error: "The input field should not be empty!"
    })
  }
})

router.patch('/invoice/:id', (req, res, next) => {
  Invoice.findByIdAndUpdate(id = req.params.id, req.body, { useFindAndModify: false })
    .then(data => {
      if(!data) {
        res.status(404).send({
          message: `Cannot update Invoice with id = ${id}. Maybe Invoice was not found!`})
      } else {
        res.send({ message: `Invoice which id = ${id} was updated successfully.`})
      }
    })
})

router.delete('/invoice/:id', (req, res, next) => {
  Invoice.findOneAndDelete({ "_id": req.params.id })
    .then(data => res.json(data))
    .catch(next)
})

module.exports = router