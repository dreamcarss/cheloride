const mqtt = require("mqtt");
const MQTT_URI = "mqtts://uf1116d5.ala.eu-central-1.emqxsl.com:8883"; 
const MQTT_UNAME = "client";
const MQTT_PASS = "Cheloride@1412";

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const client = mqtt.connect(MQTT_URI, {
  clientId: clientId,
  username: MQTT_UNAME,
  password: MQTT_PASS,
  clean: true,
  reconnectPeriod: 1000, 
  connectTimeout: 30 * 1000, 
});

client.on("connect", () => {
  console.log("MQTT connected");
  client.subscribe("data", (err) => {
    if (err) {
      console.error("Subscription error:", err);
    } else {
      console.log("Subscribed to 'data' topic");
    }
  });
});
module.exports = client;
