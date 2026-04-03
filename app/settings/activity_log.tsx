import { apiFetch, ApiError } from "@/services/api";
import { useHCStyles } from "@/contexts/ThemeContext";
import { clearAuthSession } from "@/services/auth";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

type ActivityEvent = {
  type: "login" | "photo";
  who: string;
  detail: string;
  timestamp: string;
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function EventIcon({ type }: { type: string }) {
  return (
    <View
      className="w-9 h-9 rounded-full items-center justify-center mr-3 mt-0.5"
      style={{ backgroundColor: type === "photo" ? "#EFF6FF" : "#F0FDF4" }}
    >
      <Text style={{ fontSize: 18 }}>{type === "photo" ? "📷" : "👤"}</Text>
    </View>
  );
}

export default function ActivityLog() {
  const router = useRouter();
  const s = useHCStyles();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/admin/activity");
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
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
    fetchLog();
  }, [fetchLog]);

  return (
    <View className="flex-1 bg-white" style={s.bg}>
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-6 px-5">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        <Text className="text-3xl font-bold text-primary mb-6" style={s.text}>Activity Log</Text>

        {loading ? (
          <ActivityIndicator color="#023E8A" className="mt-8" />
        ) : error ? (
          <Text className="text-red-500 text-base">{error}</Text>
        ) : events.length === 0 ? (
          <Text className="text-gray-400 text-base" style={s.subtext}>No activity yet.</Text>
        ) : (
          events.map((e, i) => (
            <View key={i} className="flex-row items-start mb-4 border-b border-gray-100 pb-4">
              <EventIcon type={e.type} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-primary" style={s.text}>{e.who}</Text>
                <Text className="text-sm text-gray-500 mt-0.5" style={s.subtext}>{e.detail}</Text>
              </View>
              <Text className="text-xs text-gray-400 ml-3 mt-0.5" style={s.subtext}>{formatTime(e.timestamp)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
