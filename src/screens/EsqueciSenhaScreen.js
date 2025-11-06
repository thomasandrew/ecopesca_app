// src/screens/EsqueciSenhaScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { api } from "../api"; // ajuste o caminho se necessário

export default function EsqueciSenhaScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: email, 2: código, 3: nova senha
  const [loading, setLoading] = useState(false);

  // passo 1
  const [email, setEmail] = useState("");
  const emailOk = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );

  // passo 2
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0); // segundos para reenviar

  // passo 3
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // ===== Ações =====
  const sendCode = async () => {
    if (!emailOk || loading) return;
    try {
      setLoading(true);
      const resp = await api("/reset/request", {
        method: "POST",
        body: { email: email.trim() },
      });

      if (resp?.devCode) {
        Alert.alert("Código (DEV)", `Use para testar: ${resp.devCode}`);
      } else {
        Alert.alert("Verificação", "Se o e-mail existir, enviamos um código.");
      }

      setStep(2);
      setCooldown(60); // 60s para poder reenviar
    } catch (e) {
      Alert.alert("Erro", String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || loading) return;
    try {
      setLoading(true);
      await api("/reset/verify", {
        method: "POST",
        body: { email: email.trim(), code: code.trim() },
      });
      setStep(3);
    } catch (e) {
      Alert.alert("Código inválido", String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0 || loading) return;
    try {
      setLoading(true);
      await api("/reset/request", {
        method: "POST",
        body: { email: email.trim() },
      });
      setCooldown(60);
      Alert.alert("Enviado", "Novo código enviado (se o e-mail existir).");
    } catch (e) {
      Alert.alert("Erro", String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!pass1 || pass1.length < 6) {
      Alert.alert("Senha", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (pass1 !== pass2) {
      Alert.alert("Senha", "As senhas não coincidem.");
      return;
    }
    try {
      setLoading(true);
      await api("/reset/confirm", {
        method: "POST",
        body: { email: email.trim(), code: code.trim(), newPassword: pass1 },
      });
      Alert.alert("Sucesso", "Senha alterada. Faça login novamente.");
      navigation.navigate("Login");
    } catch (e) {
      Alert.alert("Erro", String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Recuperar senha</Text>

      {step === 1 && (
        <>
          <Text style={s.tip}>
            Informe seu e-mail para receber um código de verificação.
          </Text>
          <Text style={s.label}>E-mail</Text>
          <TextInput
            style={s.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="seuemail@exemplo.com"
          />
          <TouchableOpacity
            style={[s.btn, (!emailOk || loading) && s.btnOff]}
            disabled={!emailOk || loading}
            onPress={sendCode}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Enviar código</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={s.tip}>
            Digite o código que enviamos para {email}.
          </Text>
          <Text style={s.label}>Código de 6 dígitos</Text>
          <TextInput
            style={s.input}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            placeholder="000000"
          />
          <TouchableOpacity
            style={[s.btn, (!code || loading) && s.btnOff]}
            disabled={!code || loading}
            onPress={verifyCode}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Validar código</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.linkBtn}
            onPress={resendCode}
            disabled={cooldown > 0 || loading}
          >
            <Text style={s.link}>
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.linkBtn} onPress={() => setStep(1)}>
            <Text style={s.link}>Trocar e-mail</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={s.tip}>
            Código válido para {email}. Defina sua nova senha.
          </Text>
          <Text style={s.label}>Nova senha</Text>
          <TextInput
            style={s.input}
            secureTextEntry
            value={pass1}
            onChangeText={setPass1}
            placeholder="mínimo 6 caracteres"
          />
          <Text style={s.label}>Confirmar nova senha</Text>
          <TextInput
            style={s.input}
            secureTextEntry
            value={pass2}
            onChangeText={setPass2}
            placeholder="repita a senha"
          />
          <TouchableOpacity
            style={[s.btn, loading && s.btnOff]}
            onPress={resetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Salvar nova senha</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: "#F7F7F7" },
  title: { fontSize: 22, fontWeight: "800", color: "#0D5A9E", marginBottom: 16 },
  label: { color: "#0D5A9E", fontWeight: "700", marginTop: 10 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DFE7F1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 6,
  },
  tip: { color: "#6B7C93", marginBottom: 8 },
  btn: {
    backgroundColor: "#6F95FF",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 18,
  },
  btnOff: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "800" },
  linkBtn: { marginTop: 12, alignItems: "center" },
  link: { color: "#2B6CB0", fontWeight: "700" },
});
