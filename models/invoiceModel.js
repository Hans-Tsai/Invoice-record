const mongoose = require('mongoose')
const Schema = mongoose.Schema

// 先定義出invoice schema
const InvoiceSchema = new Schema({
  invoice_type: {
    type: String,
    required: [true, 'The invoice type is required.']
  }
})

// 再建立invoice model
const Invoice = mongoose.model('invoice', InvoiceSchema)

module.exports = Invoice