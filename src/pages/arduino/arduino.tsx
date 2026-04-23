import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonTitle, IonToolbar, IonHeader, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { io, Socket } from 'socket.io-client';
import { arrowBackOutline } from 'ionicons/icons';

const ArduinoPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to the backend Socket.IO server
    const newSocket = io('http://localhost:3000'); // Adjust URL if needed
    setSocket(newSocket);

    // Listen for sensorData event
    newSocket.on('sensorData', (data: any) => {
      const timestamp = new Date().toLocaleString();
      const logEntry = `${timestamp}: ${JSON.stringify(data)}`;
      setLogs(prevLogs => [...prevLogs, logEntry]);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <IonPage style={{ backgroundColor: 'black', color: 'white' }}>
      <IonHeader>
        <IonToolbar style={{ '--background': 'black', '--color': 'white' }}>
          <IonButtons slot="start">
            <IonButton fill="clear" href="/#/lista">
              <IonIcon icon={arrowBackOutline} style={{ color: 'white' }} />
            </IonButton>
          </IonButtons>
          <IonTitle>Arduino Logs</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ backgroundColor: 'black', color: 'white' }}>
        <div style={{ padding: '16px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {logs.length === 0 ? (
            <p>Waiting for sensor data...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArduinoPage;