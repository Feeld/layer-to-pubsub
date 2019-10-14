const {PubSub} = require('@google-cloud/pubsub');

const topicName = process.env.TOPIC_NAME || "layer-events-test";

const pubsub = new PubSub();

pubsub.createTopic(topicName).then(([topic]) =>{
  console.log(`topic ${topicName} created`)
})

