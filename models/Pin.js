const mongoose = require('mongoose');

const PinSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    enum: ['red', 'orange', 'yellow', 'green'], // İzin verilen renkler
    default: 'red'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pin', PinSchema);