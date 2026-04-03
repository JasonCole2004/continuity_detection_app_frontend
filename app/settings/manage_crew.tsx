import { apiFetch, ApiError } from "@/services/api";
import { useHCStyles } from "@/contexts/ThemeContext";
import { clearAuthSession } from "@/services/auth";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type CrewMember = {
  id: number;
  name: string;
  access_code: string;
  has_password: boolean;
  is_active: boolean;
  created_at: string;
};

export default function ManageCrew() {
  const router = useRouter();
  const s = useHCStyles();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add crew form
  const [addName, setAddName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [newName, setNewName] = useState<string | null>(null);

  const fetchCrew = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/admin/crew");
      const data = await response.json();
      setCrew(Array.isArray(data) ? data : []);
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
    fetchCrew();
  }, [fetchCrew]);

  const handleAddCrew = async () => {
    setAddError(null);
    if (!addName.trim()) { setAddError("Name is required."); return; }
    try {
      setAddLoading(true);
      const formData = new FormData();
      formData.append("name", addName.trim());
      const response = await apiFetch("/api/admin/crew", { method: "POST", body: formData });
      const data = await response.json();
      setNewCode(data.access_code ?? null);
      setNewName(data.name ?? null);
      setAddName("");
      fetchCrew();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearAuthSession();
        router.replace("/login");
        return;
      }
      setAddError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeactivate = (member: CrewMember) => {
    Alert.alert(
      "Deactivate Crew Member",
      `Remove ${member.name}'s access? They will no longer be able to log in.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await apiFetch(`/api/admin/crew/${member.id}`, { method: "DELETE" });
              fetchCrew();
            } catch (err) {
              if (err instanceof ApiError && err.status === 401) {
                await clearAuthSession();
                router.replace("/login");
                return;
              }
              Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong");
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white" style={s.bg}>
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-6 px-5">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        <Text className="text-3xl font-bold text-primary mb-6" style={s.text}>Manage Crew</Text>

        {/* ── Add crew member ── */}
        <View className="bg-lightGray p-4 rounded-2xl mb-6" style={s.card}>
          <Text className="text-base font-semibold text-primary mb-3" style={s.text}>Add Crew Member</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 mb-3"
            placeholder="Full name"
            placeholderTextColor={s.subtext.color ?? "#9ca3af"}
            value={addName}
            onChangeText={setAddName}
            style={[{ height: 48, fontSize: 16 }, s.input]}
          />
          {addError ? <Text className="text-red-600 text-sm mb-2">{addError}</Text> : null}
          <TouchableOpacity
            className="bg-darkBlue py-3 rounded-full items-center"
            activeOpacity={0.85}
            onPress={handleAddCrew}
            disabled={addLoading}
          >
            {addLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Add</Text>}
          </TouchableOpacity>
        </View>

        {/* ── New code banner ── */}
        {newCode ? (
          <View className="bg-green-50 border border-green-300 rounded-2xl p-4 mb-6">
            <Text className="text-green-800 font-semibold text-base mb-1">
              {newName} has been added!
            </Text>
            <Text className="text-green-700 text-sm mb-2">
              Give them this access code — it won't be shown again:
            </Text>
            <Text className="text-2xl font-bold text-green-900 tracking-widest text-center py-2">
              {newCode}
            </Text>
            <TouchableOpacity
              className="mt-2 items-center"
              activeOpacity={0.85}
              onPress={() => { setNewCode(null); setNewName(null); }}
            >
              <Text className="text-green-700 text-sm underline">Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Crew list ── */}
        {loading ? (
          <ActivityIndicator color="#023E8A" className="mt-8" />
        ) : error ? (
          <Text className="text-red-500 text-base">{error}</Text>
        ) : crew.filter((m) => m.is_active).length === 0 ? (
          <Text className="text-gray-400 text-base" style={s.subtext}>No crew members yet.</Text>
        ) : (
          crew.filter((member) => member.is_active).map((member) => (
            <View key={member.id} className="bg-lightGray p-4 rounded-2xl mb-3 flex-row items-center justify-between" style={s.card}>
              <View className="flex-1 mr-3">
                <Text className="text-base font-semibold text-primary" style={s.text}>{member.name}</Text>
                <Text className="text-sm text-gray-500" style={s.subtext}>{member.access_code}</Text>
                {!member.has_password && (
                  <Text className="text-xs text-amber-600 mt-1">Never logged in</Text>
                )}
              </View>
              <TouchableOpacity
                className="bg-red-600 px-3 py-2 rounded-xl"
                activeOpacity={0.8}
                onPress={() => handleDeactivate(member)}
              >
                <Text className="text-white text-sm font-semibold">Deactivate</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
