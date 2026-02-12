import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import React from "react";
import { ImageBackground, Text, View } from "react-native";

interface TabIconProps {
  focused: boolean;
  icon: number;
  title: string;
}

const TabIcon = ({ focused, icon, title }: TabIconProps) => {
  if (focused) {
    return (
      <ImageBackground
        source={images.highlight}
        className="flex flex-row w-full flex-1 min-w-[120px] min-h-16 mt-4 justify-center items-center rounded-full overflow-hidden"
      >
        <Image
          source={icon}
          tintColor="#FFFFFF"
          style={{ width: 24, height: 24 }}
        />
        <Text className="text-white text-lg font-semibold ml-2">
          {title}
        </Text>
      </ImageBackground>
    );
  }

  return (
    <View className="size-full justify-center items-center mt-4 rounded-full">
      <Image source={icon} tintColor="#A8B5DB" style={{ width: 24, height: 24 }} />
    </View>
  );
};

const _layout = () => {
  return (
    <Tabs
        screenOptions={{
            tabBarShowLabel: false,
            tabBarItemStyle: {
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center'
            },
            tabBarStyle: {
                borderRadius: 50,
                marginHorizontal: 20,
                marginBottom: 36,
                height: 52,
                position: 'absolute',
                overflow: 'hidden',
                borderWidth: 2,
                shadowColor: '#000',
                shadowOffset: { width: 8, height: 8},
                shadowOpacity: 0.95,
                shadowRadius: 10,
                elevation: 50,
            }
        }}   
    
    >
        <Tabs.Screen
            name="index"
            options={{
                title: "Actors",
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <TabIcon focused={focused} icon={icons.actor} title="Actors" />
                )
            }}
        />
        <Tabs.Screen
            name="camera"
            options={{
                title: "Camera",
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <TabIcon focused={focused} icon={icons.camera} title="Camera" />
                )
            }}
        />
        <Tabs.Screen
            name="settings"
            options={{
                title: "Settings",
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <TabIcon focused={focused} icon={icons.settings} title="Settings" />
                )
            }}
        />
    </Tabs>
  )
}

export default _layout
