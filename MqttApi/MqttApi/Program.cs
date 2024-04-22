using System.Text;
using Newtonsoft.Json;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

namespace MqttApi
{
    internal abstract class Program
    {
        private static MqttClient? _mqttClient;

        private static void Main(string[] args)
        {
            _mqttClient = new MqttClient("test.mosquitto.org");
            _mqttClient.MqttMsgPublishReceived += MqttClientOnMqttMsgPublishReceived;
            _mqttClient.Subscribe(["devices"], [MqttMsgBase.QOS_LEVEL_AT_LEAST_ONCE]);
            _mqttClient.Connect("mqtt-api-1");

            Console.ReadLine();
        }

        private static void MqttClientOnMqttMsgPublishReceived(object sender, MqttMsgPublishEventArgs e)
        {
            var message = Encoding.UTF8.GetString(e.Message);
            var topic = e.Topic;

            dynamic jsonObject = JsonConvert.DeserializeObject(message)!;

            switch (topic)
            {
                case "devices":
                    switch ((string)jsonObject.device)
                    {
                        case "microwave":
                            for (var i = (int)jsonObject.message; i >= 0; i--)
                            {
                                if (i < (int)jsonObject.message) Thread.Sleep(1000);

                                if (!_mqttClient!.IsConnected) continue;
                                var response = new { secondsLeft = i };
                                var jsonResponse = JsonConvert.SerializeObject(response);
                                Console.WriteLine(response.secondsLeft);
                                _mqttClient.Publish("devices/microwave/response", Encoding.UTF8.GetBytes(jsonResponse));
                            }
                            
                            break;
                        default:
                            Console.WriteLine("Unknown device.");
                            
                            break;
                    }

                    break;
            }
        }
    }
}
