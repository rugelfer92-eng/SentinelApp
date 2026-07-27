import { useState } from "react";
import { useBluetooth } from "../bluetooth/BluetoothContext";

export const useRelayControl = () => {
  const { relayState, sendMessage, isConnected } = useBluetooth();

  const [isChanging, setIsChanging] = useState(false);

  const toggleRelay = async () => {
    if (!isConnected) {
      console.log("⚠️ No hay conexión con el ESP32");
      return;
    }

    setIsChanging(true);

    await sendMessage({
      type: "relay",
      state: !relayState,
    });

    setTimeout(() => setIsChanging(false), 1500);
  };

  return {
    isRelayOn: relayState,
    toggleRelay,
    isConnected,
    isChanging,
  };
};
