import React, { useEffect, useRef } from "react";
import { Animated, Text } from "react-native";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide?: () => void;
}

export default function Toast({ message, visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onHide?.());
  }, [visible, message]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        opacity,
        position: "absolute",
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: "#16a34a",
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: "center" as const,
        zIndex: 999,
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "600" as const, fontSize: 15 }}>{message}</Text>
    </Animated.View>
  );
}
