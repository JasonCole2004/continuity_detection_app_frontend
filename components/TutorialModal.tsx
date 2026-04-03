import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

const VIDEO_ID = "i7hbWVkBrVQ";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function TutorialModal({ visible, onClose }: Props) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden" }}>
          <View style={{ padding: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#023E8A" }}>App Tutorial</Text>
            <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>A quick walkthrough to get you started.</Text>
          </View>
          <YoutubePlayer height={220} videoId={VIDEO_ID} />
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            style={{ margin: 16, backgroundColor: "#023E8A", borderRadius: 99, paddingVertical: 14, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
