import SearchBar from "@/components/SearchBar";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { Talent } from "@/interfaces/Talent";
import { apiFetch, ApiError } from "@/services/api";
import { clearAuthSession } from "@/services/auth";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredTalents = talents.filter((talent) =>
    talent.name.toLowerCase().includes(search.toLowerCase())
  );

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

  useEffect(() => {
    fetchTalents();
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

  return (
    <View className="flex-1 bg-white">
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
              className="bg-lightGray p-4 rounded-2xl mb-3"
              activeOpacity={0.7}
            >
              <Text className="text-lg font-semibold text-primary">
                {talent.name}  <Text className="text-base text-gray-400">ID number #{talent.id}</Text>
              </Text>
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
