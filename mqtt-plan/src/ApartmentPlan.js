import React, { useEffect, useRef, useState } from 'react';
import mqtt from 'mqtt';
import { Box, Button } from '@mui/material';
import {
    Kitchen,
    Microwave,
    DoorFront,
    SensorDoor,
    Sensors,
} from "@mui/icons-material";

const ApartmentPlan = () => {
    const walls = [
        { position: { x: 0, y: 0, width: 800, height: 10 } },
        { position: { x: 800, y: 0, width: 10, height: 600 } },
        { position: { x: 0, y: 0, width: 10, height: 600 } },
        { position: { x: 0, y: 600, width: 810, height: 10 } },
        { position: { x: 0, y: 200, width: 300, height: 10 } },
        { position: { x: 300, y: 200, width: 10, height: 400 } },
        { position: { x: 400, y: 400, width: 400, height: 10 } },
        { position: { x: 400, y: 400, width: 10, height: 200 } },
    ];

    const [client, setClient] = useState(null);
    const [isOpen, setOpen] = useState(false);
    const [microwaveTime, setMicrowaveTime] = useState(0);

    const sensorDoorRef = useRef(null);
    const doorFrontRef = useRef(null);
    const microwaveRef = useRef(null);
    const microwaveTimerRef = useRef(null);

    const mqttConnect = () => {
        setClient(mqtt.connect('ws://test.mosquitto.org:8080/mqtt', { clientId: 'smart_house_client' }));
    };

    const mqttSub = () => {
        if (client) {
            client.subscribe('house_sensors_doors', (error) => {
                if (error) {
                    console.log('Subscribe to topics error', error);
                }
            });
            client.subscribe('lockers', (error) => {
                if (error) {
                    console.log('Subscribe to topics error', error);
                }
            });
            client.subscribe('devices', (error) => {
                if (error) {
                    console.log('Subscribe to topics error', error);
                }
            });
        }
    };

    const handleClick = (event) => {
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        const sensorX = 405;
        const sensorY = 385;
        const distance = Math.sqrt((mouseX - sensorX) ** 2 + (mouseY - sensorY) ** 2);

        if (distance <= 80 && mouseY >= sensorY + 10) {
            client.publish('sensors_doors', 'kitchen');
        }
    };

    useEffect(() => {
        if (client) {
            client.on('connect', () => {
                console.log('Connected');
            });
            client.on('error', (err) => {
                console.error('Connection error: ', err);
                client.end();
            });
            client.on('reconnect', () => {
                console.log('Reconnecting');
            });
            client.on('message', (topic, message) => {
                switch (topic) {
                    case 'house_sensors_doors': {
                        switch (message.toString()) {
                            case 'kitchen': {
                                sensorDoorRef.current.style.color = 'green';
                                setTimeout(() => {
                                    sensorDoorRef.current.style.color = 'inherit';
                                }, 3000);
                                break;
                            }
                            default:
                                console.log('Device cannot be found')
                                break;
                        }
                        break;
                    }
                    case 'lockers': {
                        switch (message.toString()) {
                            case 'mainEntrance': {
                                setOpen(current => !current);
                                break;
                            }
                            default:
                                console.log('Device cannot be found')
                                break;
                        }
                        break;
                    }
                    case 'devices': {
                        const data = JSON.parse(message.toString());
                        const device = data.device;
                        const deviceTime = data.string;
                        switch (device) {
                            case 'microwave': {
                                setMicrowaveTime(deviceTime);
                                microwaveRef.current.style.color = 'yellow';
                                startMicrowaveTimer();
                                break;
                            }
                            default:
                                console.log('Device cannot be found')
                                break;
                        }
                        break;
                    }
                    default:
                        break;
                }
            });
        }
    }, [client]);

    useEffect(() => {
        doorFrontRef.current.style.color = isOpen ? 'green' : 'inherit';
    }, [isOpen]);

    const startMicrowaveTimer = () => {
        if (microwaveTimerRef.current) clearInterval(microwaveTimerRef.current);

        microwaveTimerRef.current = setInterval(() => {
            setMicrowaveTime(prevTime => {
                if (prevTime <= 0) {
                    clearInterval(microwaveTimerRef.current);
                    client.publish('devices_client', 'microwave');
                    microwaveRef.current.style.color = 'inherit';
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
    };

    return (
        <>
            <Box sx={{ padding: "100px" }}>
                <svg width="850" height="650" onClick={handleClick}>
                    {walls.map((wall, index) => (
                        <rect
                            key={index}
                            x={wall.position.x}
                            y={wall.position.y}
                            width={wall.position.width}
                            height={wall.position.height}
                            fill="grey"
                        />
                    ))}
                    <Kitchen x={5} y={-90} width={60} />
                    <Microwave ref={microwaveRef} x={60} y={-95} width={60} />
                    <Microwave x={120} y={-95} width={60} />
                    <DoorFront ref={doorFrontRef} x={325} y={270} width={60} />
                    <SensorDoor ref={sensorDoorRef} x={275} y={0} width={60} />
                    <Sensors x={285} y={-40} width={40} />
                </svg>
            </Box>
            <Button onClick={mqttConnect}>Connect</Button>
            <Button onClick={mqttSub}>Subscribe</Button>
            <Box>
                <p>Microwave Time: {Math.floor(microwaveTime / 60)}:{microwaveTime % 60}</p>
            </Box>
        </>
    );
};

export default ApartmentPlan;
