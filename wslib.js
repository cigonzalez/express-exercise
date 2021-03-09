const WebSocket = require("ws");
const Message = require("./models/message");

const Joi = require("joi");

const clients = [];

const wsConnection = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    clients.push(ws);
    sendMessages();

    ws.on("message", (message) => {
      message = JSON.parse(message);
      const { error } = validateMessage(message);

      if (error) {
        return console.log(error.details[0].message);
      }

      Message.create(message).then((result) => {
        sendMessages();
      });
    });
  });

  const sendMessages = () => {
    clients.forEach((client) => {
      Message.findAll().then((result) => {
        client.send(JSON.stringify(result));
      });
    });
  };

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
};

exports.wsConnection = wsConnection;
