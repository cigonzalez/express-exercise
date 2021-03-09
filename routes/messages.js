var express = require("express");
var router = express.Router();

const Joi = require("joi");

const Message = require("../models/message");

const ws = require("../wslib");

/* GET message listing. */
router.get("/", function (req, res, next) {
  Message.findAll().then((result) => {
    res.send(result);
  });
});

router.get("/:ts", function (req, res, next) {
  Message.findOne({
    where: {
      ts: req.params.ts,
    },
  }).then((result) => {
    if (result === null)
      return res
        .status(400)
        .send("The message with the given ts was not found.");
    res.send(result);
  });
});

router.post("/", function (req, res, next) {
  const { error } = validateMessage(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const message = {
    message: req.body.message,
    author: req.body.author,
    ts: req.body.ts,
  };

  Message.create(message).then((result) => {
    res.send(result);
  });
  ws.sendMessages()
});

router.put("/:ts", function (req, res, next) {
  const message = {
    message: req.body.message,
    author: req.body.author,
    ts: req.params.ts,
  };

  const { error } = validateMessage(message);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  Message.update(req.body, {
    where: { ts: req.params.ts },
  }).then((result) => {
    if (result[0] === 0)
      return res
        .status(400)
        .send("The message with the given ts was not found.");
    res.status(200).send("Message updated");
  });
  ws.sendMessages()
});

router.delete("/:ts", function (req, res, next) {
  Message.destroy({ where: { ts: req.params.ts } }).then((result) => {
    if (result === 0)
      return res
        .status(400)
        .send("The message with the given ts was not found.");
    res.status(204).send();
  });
  ws.sendMessages()
});

function validateMessage(message) {
  const schema = Joi.object({
    message: Joi.string().min(5).required(),
    author: Joi.string()
      .pattern(/^[a-zA-Z]+(\s[a-zA-Z]+)+$/)
      .required(),
    ts: Joi.number().required(),
  });

  return schema.validate(message);
}

module.exports = router;
