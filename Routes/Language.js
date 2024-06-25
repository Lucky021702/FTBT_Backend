const express = require("express");
const router = express.Router();
const Language = require("../models/Language")

router.get('/language', async (req, res) => {
    try {
      const languages = await Language.find({});
      res.json(languages);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Error fetching languages', error });
    }
  });

  module.exports = router