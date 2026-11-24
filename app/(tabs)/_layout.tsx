import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="orcamentos"
        options={{
          title: "Orçamentos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="document-text-outline"
              color={typeof color === "string" ? color : undefined}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: "Catálogo",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="pricetags-outline"
              color={typeof color === "string" ? color : undefined}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              color={typeof color === "string" ? color : undefined}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
