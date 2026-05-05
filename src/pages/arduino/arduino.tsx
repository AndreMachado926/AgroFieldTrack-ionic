import React, { useEffect, useRef, useState } from 'react';
import { IonContent, IonPage, IonTitle, IonToolbar, IonHeader, IonButtons, IonButton, IonIcon, IonText } from '@ionic/react';
import { io, Socket } from 'socket.io-client';
import { arrowBackOutline } from 'ionicons/icons';
const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

const ArduinoPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnected(false);
    });

    socket.on('sensorData', (data: any) => {
      const timestamp = new Date().toLocaleString();
      const logEntry = `${timestamp}: ${JSON.stringify(data)}`;
      setLogs(prevLogs => [...prevLogs, logEntry]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

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
        <div style={{ padding: '16px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', minHeight: '100%', overflowY: 'auto' }}>
          <IonText style={{ color: connected ? '#2ecc71' : '#e74c3c', marginBottom: '12px', display: 'block' }}>
            {connected ? 'Conectado. Acompanhando novos resultados...' : 'Desconectado. Tentando reconectar...'}
          </IonText>
          {logs.length === 0 ? (
            <p>Waiting for sensor data...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArduinoPage;