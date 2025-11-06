// src/screens/ForgotPasswordRequest.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { api } from "../api";

export default function ForgotPasswordRequest({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSend = async () => {
    if (!valid || loading) return;
    try {
      setLoading(true);
      const resp = await api("/reset/request", {
        method: "POST",
        body: { email: email.trim() },
      });
      if (resp?.devCode) {
        Alert.alert("Código (DEV)", `Use este código para testar: ${resp.devCode}`);
      } else {
        Alert.alert("Verificação", "Se o e-mail existir, enviamos um código.");
      }
      navigation.navigate("ForgotPasswordVerify", { email: email.trim() });
    } catch (e) {
      Alert.alert("Erro", String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Recuperar senha</Text>
      <Text style={s.sub}>Informe seu e-mail para receber um código.</Text>

      <Text style={s.label}>E-mail</Text>
      <TextInput
        style={s.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        onPress={handleSend}
        disabled={!valid || loading}
        style={[s.btn, (!valid || loading) && s.btnOff]}
      >
        <Text style={s.btnText}>{loading ? "Enviando..." : "Enviar código"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: "#F7F7F7" },
  title: { fontSize: 24, fontWeight: "800", color: "#0D5B9D" },
  sub: { color: "#6B7C93", marginTop: 6, marginBottom: 16 },
  label: { fontWeight: "700", color: "#0D5B9D", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    marginBottom: 16,
  },
  btn: { backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnOff: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "800" },
});
