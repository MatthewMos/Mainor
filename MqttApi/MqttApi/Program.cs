using System.Text;
using Newtonsoft.Json;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

namespace MqttApi;

internal abstract class Program
{
    private static MqttClient? _mqttClient;

    static void Main(string[] args)
    {
        _mqttClient = new MqttClient("test.mosquitto.org");
        _mqttClient.MqttMsgPublishReceived += MqttClientOnMqttMsgPublishReceived;
        _mqttClient.Subscribe(new string[] { "devices" }, new byte[] { MqttMsgBase.QOS_LEVEL_AT_LEAST_ONCE });
        _mqttClient.Connect("mqtt-api-1");

        // Поддержание приложения открытым
        Console.ReadLine();
    }

    static void MqttClientOnMqttMsgPublishReceived(object sender, MqttMsgPublishEventArgs e)
    {
        var message = Encoding.UTF8.GetString(e.Message);
        // Console.WriteLine(message);

        dynamic jsonObject = JsonConvert.DeserializeObject(message)!;

        if (jsonObject.device != null)
        {
            switch ((string)jsonObject.device)
            {
                case "microwave":
                    Console.WriteLine((string)jsonObject.message);
                    if (_mqttClient!.IsConnected)
                    {
                        
                    }
                    break;
                default:
                    Console.WriteLine("Unknown device.");
                    break;
            }
        }
    }
}