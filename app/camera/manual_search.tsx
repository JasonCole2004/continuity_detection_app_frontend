import SearchBar from "@/components/SearchBar";
import { Actor } from "@/interfaces/Actor";
import { apiFetch, ApiError } from "@/services/api";
import { clearAuthSession } from "@/services/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ManualActorSearch() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredActors = actors.filter((actor) =>
    actor.name.toLowerCase().includes(search.toLowerCase())
  );

  const fetchActors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/actors");
      const data = await response.json();
      setActors(data);
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
    fetchActors();
  }, [fetchActors]);

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
        <TouchableOpacity onPress={fetchActors} className="bg-darkBlue px-6 py-3 rounded-full">
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-5">
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-semibold text-primary mb-4">Search Actor</Text>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-1 mt-2 mb-2">
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        {filteredActors.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-gray-400 text-base">No actors found</Text>
          </View>
        ) : (
          filteredActors.map((actor) => (
            <TouchableOpacity
              key={actor.id}
              onPress={() =>
                router.push({
                  pathname: "/camera/continuity_check",
                  params: {
                    actorId: String(actor.id),
                    actorName: String(actor.name),
                    photoUri: String(photoUri ?? ""),
                  },
                })
              }
              className="bg-lightGray p-4 rounded-2xl mb-3"
              activeOpacity={0.7}
            >
              <Text className="text-lg font-semibold text-primary">
                {actor.name}  <Text className="text-base text-gray-400">ID number #{actor.id}</Text>
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
