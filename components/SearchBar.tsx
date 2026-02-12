import { icons } from "@/constants/icons";
import { Image } from "expo-image";
import React from "react";
import { TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

const SearchBar = ({ value, onChangeText }: SearchBarProps) => {
  return (
    <View className="flex-row items-center bg-dark-200 rounded-full px-2 py-4">
      <Image
        source={icons.search}
        style={{ width: 24, height: 24 }}
        tintColor="#BFBFBF"
      />
      <TextInput
        placeholder="Search"
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#BFBFBF"
        className="flex-1 ml-4"
        style={{ fontSize: 18, color: "#000", padding: 0 }}
      />
    </View>
  )
}


export default SearchBar
