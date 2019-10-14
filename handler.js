const crypto = require('crypto');
const {PubSub} = require('@google-cloud/pubsub');
const topicName = process.env.TOPIC_NAME || "layer-events";

const handleEvent = async (data) => {

  log("data:", data);

  const pubsub = new PubSub();

  const dataBuffer = Buffer.from(data);

  const messageId = await pubsub.topic(topicName).publish(dataBuffer);
  console.log(`Message ${messageId} published.`);

}

module.exports.handleEvent = handleEvent;

const verify = async (req, res) => res.send(req.query.verification_challenge)

module.exports.layer = async (req, res) => {
  if (req.method === 'GET') {
    log("received GET request")
    return verify(req, res)
  }
  else {
    log('received non GET request:')

    const data = req.rawBody;
    // - validate the payload
    // - parse the layer webhook event
    // - figure out the corresponding stream channel
    // - convert the message
    // - write the message to Stream

    // Validate the layer webhook data
    // https://docs.layer.com/reference/webhooks/payloads#validating-payload-integrity

    const signature = req.headers['layer-webhook-signature'];

    if (!process.env.WEBHOOK_SECRET) {
      log('WEBHOOK_SECRET is not defined!');
    }

    const hmac = crypto.createHmac('sha1', process.env.WEBHOOK_SECRET);

    hmac.update(req.body);

    const correctSignature = hmac.digest('hex');

    if (signature !== correctSignature) {
      return res.status(403).json({
        error:
          'Signature was not correct, check your webhook secret and verify the serverless handler uses the same',
      })
    }

    try {
      await handleEvent(data);
    }
    catch (error) {
      log_error(error);
      // TODO: configure stackdriver alert since its important to fix/handle
      // all possible errors and not return a 500 once we deploy to prod
      // since returning a 500 will eventually disable the webhook on layer side
      // and interrupt a syncing process
      res.status(500).json({ error : error.message });
    };

    log("respond with 204");
    res.status(204).send('')
  }
}
