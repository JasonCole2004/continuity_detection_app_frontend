import SearchBar from "@/components/SearchBar";
import TutorialModal from "@/components/TutorialModal";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { Talent } from "@/interfaces/Talent";
import { apiFetch, ApiError, toAbsoluteApiUrl } from "@/services/api";
import { getAccessToken, clearAuthSession } from "@/services/auth";
import { Image as ExpoImage } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { useHCStyles } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ImageBackground, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const s = useHCStyles();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [tutorialVisible, setTutorialVisible] = useState(false);

  const filteredTalents = talents
    .filter((talent) => {
      const q = search.toLowerCase().trim();
      return talent.name.toLowerCase().includes(q) || String(talent.id).includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const fetchTalents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/actors");
      const data = await response.json();
      setTalents(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearAuthSession();
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchTalents();
    }, [fetchTalents])
  );

  useEffect(() => {
    getAccessToken().then((t) => setAccessToken(t ?? ""));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("hasSeenTutorial").then((seen) => {
      if (!seen) setTutorialVisible(true);
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTalents();
    setRefreshing(false);
  }, [fetchTalents]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#023E8A" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-red-500 text-base mb-4">{error}</Text>
        <TouchableOpacity onPress={fetchTalents} className="bg-darkBlue px-6 py-3 rounded-full">
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const closeTutorial = async () => {
    await AsyncStorage.setItem("hasSeenTutorial", "true");
    setTutorialVisible(false);
  };

  return (
    <View className="flex-1 bg-white" style={s.bg}>
      <TutorialModal visible={tutorialVisible} onClose={closeTutorial} />
      <ImageBackground
        source={images.backgroundImage}
        className="w-full justify-end pb-2 px-5"
        style={{ height: 120 }}
        resizeMode="cover"
      >
        <Text style={{ fontStyle: 'italic', fontSize: 40, fontWeight: 'bold', color: '#fff' }}>
          Talent List
        </Text>
      </ImageBackground>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#023E8A" colors={["#023E8A"]} />
        }
      >
        <View className="flex-1 mt-2 mb-2">
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        {filteredTalents.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-gray-400 text-base">No talent found</Text>
          </View>
        ) : (
          filteredTalents.map((talent) => (
            <TouchableOpacity
              key={talent.id}
              onPress={() => router.push(`/talent/${talent.id}`)}
              className="bg-lightGray p-4 rounded-2xl mb-3 flex-row items-center gap-3" style={s.card}
              activeOpacity={0.7}
            >
              {talent.profile_photo_url ? (
                <ExpoImage
                  source={{
                    uri: toAbsoluteApiUrl(talent.profile_photo_url),
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                  }}
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                  cachePolicy="none"
                />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#d1d5db", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 18, color: "#9ca3af" }}>?</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-lg font-semibold text-primary" style={s.text}>{talent.name}</Text>
                <Text className="text-sm text-gray-400" style={s.subtext}>ID #{talent.id}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.push("/talent/new_profile")}
        className="absolute bottom-28 right-5 bg-darkBlue rounded-full items-center justify-center shadow-lg"
        style={{ width: 56, height: 56 }}
        activeOpacity={0.85}
      >
        <Image source={icons.add_user} style={{ width: 36, height: 36, tintColor: "#fff" }} />
      </TouchableOpacity>
    </View>
  );
}
