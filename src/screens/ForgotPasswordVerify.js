// src/screens/ForgotPasswordVerify.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { api } from "../api"; // ajuste o caminho se o seu api.js estiver noutro lugar

export default function ForgotPasswordVerify({ route, navigation }) {
  const email = route?.params?.email || "";

  const [code, setCode] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);

  const [cooldown, setCooldown] = useState(0); // segundos para reenviar

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const codeOk = /^\d{6}$/.test(code.trim());
  const passErr = useMemo(() => {
    if (!pass1 || !pass2) return "Informe e confirme a nova senha.";
    if (pass1.length < 6) return "Senha precisa ter 6+ caracteres.";
    if (pass1 !== pass2) return "As senhas não coincidem.";
    return "";
  }, [pass1, pass2]);

  const canSubmit = !!email && codeOk && !passErr;

  const handleReset = async () => {
    if (!canSubmit || loading) return;
    try {
      setLoading(true);
      // Confirmar troca de senha (o endpoint já valida código + expiração)
      await api("/reset/confirm", {
        method: "POST",
        body: {
          email: email.trim(),
          code: code.trim(),
          newPassword: pass1,
        },
      });

      Alert.alert("Pronto!", "Senha alterada com sucesso.");
      navigation.navigate("Login");
    } catch (e) {
      Alert.alert("Erro", String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!email || cooldown > 0 || loading) return;
    try {
      setLoading(true);
      await api("/reset/request", { method: "POST", body: { email } });
      setCooldown(60);
      Alert.alert("Enviado", "Novo código enviado (se o e-mail existir).");
    } catch (e) {
      Alert.alert("Erro", String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <View style={s.wrap}>
        <Text style={s.title}>Verificar código</Text>
        <Text style={s.sub}>
          E-mail não informado. Volte e preencha o e-mail.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPasswordRequest")}
          style={s.btn}
        >
          <Text style={s.btnText}>Informar e-mail</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Verificar código</Text>
      <Text style={s.sub}>Enviamos um código para {email}.</Text>

      <Text style={s.label}>Código de 6 dígitos</Text>
      <TextInput
        style={s.input}
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        placeholder="000000"
      />

      <Text style={s.label}>Nova senha</Text>
      <TextInput
        style={s.input}
        secureTextEntry
        value={pass1}
        onChangeText={setPass1}
        placeholder="mínimo 6 caracteres"
      />

      <Text style={s.label}>Confirmar senha</Text>
      <TextInput
        style={s.input}
        secureTextEntry
        value={pass2}
        onChangeText={setPass2}
        placeholder="repita a senha"
      />
      {!!passErr && <Text style={s.err}>{passErr}</Text>}

      <TouchableOpacity
        onPress={resendCode}
        style={s.linkBtn}
        disabled={cooldown > 0 || loading}
      >
        <Text style={s.link}>
          {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleReset}
        disabled={!canSubmit || loading}
        style={[s.btn, (!canSubmit || loading) && s.btnOff]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnText}>Alterar senha</Text>
        )}
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
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  err: { color: "#ef4444", marginBottom: 8 },
  linkBtn: { alignSelf: "flex-start", marginBottom: 16, opacity: 1 },
  link: { color: "#2563eb", fontWeight: "700" },
  btn: {
    backgroundColor: "#22c55e",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnOff: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "800" },
});
