import SearchBar from "@/components/SearchBar";
import { useHCStyles } from "@/contexts/ThemeContext";
import { Talent } from "@/interfaces/Talent";
import { apiFetch, ApiError, toAbsoluteApiUrl } from "@/services/api";
import { clearAuthSession, getAccessToken } from "@/services/auth";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ManualTalentSearch() {
  const router = useRouter();
  const s = useHCStyles();
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const filteredTalents = talents.filter((talent) => {
    const q = search.toLowerCase().trim();
    return talent.name.toLowerCase().includes(q) || String(talent.id).includes(q);
  });

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

  useEffect(() => {
    getAccessToken().then((t) => setAccessToken(t ?? ""));
  }, []);

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
    <View className="flex-1 bg-white px-5" style={s.bg}>
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-semibold text-primary mb-4" style={s.text}>Search Talent</Text>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-1 mt-2 mb-2">
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        {filteredTalents.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-gray-400 text-base" style={s.subtext}>No talent found</Text>
          </View>
        ) : (
          filteredTalents.map((talent) => (
            <TouchableOpacity
              key={talent.id}
              onPress={() =>
                router.push({
                  pathname: "/camera/continuity_check",
                  params: {
                    talentId: String(talent.id),
                    talentName: String(talent.name),
                    photoUri: String(photoUri ?? ""),
                  },
                })
              }
              className="bg-lightGray p-4 rounded-2xl mb-3 flex-row items-center gap-3"
              style={s.card}
              activeOpacity={0.7}
            >
              {talent.profile_photo_url ? (
                <ExpoImage
                  source={{
                    uri: toAbsoluteApiUrl(talent.profile_photo_url),
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                  }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  cachePolicy="none"
                />
              ) : (
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#d1d5db", alignItems: "center", justifyContent: "center" }}>
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
    </View>
  );
}
