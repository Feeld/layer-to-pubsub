const crypto = require('crypto');
const {PubSub} = require('@google-cloud/pubsub');
const topicName = process.env.TOPIC_NAME || "layer-events-test";
const { log, error: log_error } = require("./logger")()

const { WEBHOOK_SECRET } = process.env

const pubsub = new PubSub();
const topic = pubsub.topic(topicName)

if (!WEBHOOK_SECRET) {
  throw new Error("WEBHOOK_SECRET env var not set")
}

const handleEvent = async (rawBody) => {
  if (log.enabled) {
    log("event:", rawBody.toString());
  }
  const messageId = await topic.publish(rawBody);
  log(`Message ${messageId} published.`);
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

    const rawBody = req.rawBody;
    // - validate the payload
    // - parse the layer webhook event
    // - figure out the corresponding stream channel
    // - convert the message
    // - write the message to Stream

    // Validate the layer webhook data
    // https://docs.layer.com/reference/webhooks/payloads#validating-payload-integrity

    const signature = req.headers['layer-webhook-signature'];

    const hmac = crypto.createHmac('sha1', WEBHOOK_SECRET);

    hmac.update(req.body);

    const correctSignature = hmac.digest('hex');

    if (signature !== correctSignature) {
      return res.status(403).json({
        error:
          'Signature was not correct, check your webhook secret and verify the serverless handler uses the same',
      })
    }

    try {
      await handleEvent(rawBody);
    }
    catch (error) {
      log_error(error);
      // TODO: configure stackdriver alert since its important to fix/handle
      // all possible errors and not return a 500 once we deploy to prod
      // since returning a 500 will eventually disable the webhook on layer side
      // and interrupt a syncing process
      return res.status(500).send('');
    };

    log("respond with 204");
    res.status(204).send('')
  }
}
