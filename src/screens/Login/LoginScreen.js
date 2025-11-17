import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { api } from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const emailError = useMemo(() => {
    if (!email) return "Informe seu e-mail";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    return ok ? "" : "E-mail inválido";
  }, [email]);

  const passError = useMemo(() => {
    if (!password) return "Informe sua senha";
    return password.length < 6 ? "Mínimo de 6 caracteres" : "";
  }, [password]);

  const formValid = !emailError && !passError;

  const handleLogin = async () => {
    if (!formValid || loading) return;
    try {
      setLoading(true);
      const data = await api("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });

      await AsyncStorage.setItem("@token", data.token);
      await AsyncStorage.setItem("@user", JSON.stringify(data.user));

      if (remember) {
        await AsyncStorage.setItem(
          "@session",
          JSON.stringify({ email: data.user.email })
        );
      }

      Alert.alert("Sucesso", `Bem-vindo, ${data.user.name || data.user.email}!`);
      navigation.navigate("Formulario");
    } catch (e) {
      Alert.alert("Erro", String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* LOGO PRINCIPAL + LOGO MEROS EM DIAGONAL */}
            <View style={styles.logoWrap}>
              <Image
                source={require("../../../assets/pescaLogo.jpg")}
                resizeMode="contain"
                style={styles.img}
              />

              {/* Logo Meros em diagonal (acima e à direita) */}
              <Image
                source={require("../../../assets/merosLogo.png")}
                resizeMode="contain"
                style={styles.merosImg}
              />
            </View>

            <Text style={styles.title}>Entrar</Text>
            <Text style={styles.subtitle}>Acesse sua conta</Text>

            <View className="field" style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, emailError ? styles.inputError : null]}
                returnKeyType="next"
              />
              {!!emailError && <Text style={styles.error}>{emailError}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  style={[
                    styles.input,
                    passError ? styles.inputError : null,
                    { flex: 1 },
                  ]}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setShowPass((v) => !v)}
                  style={styles.showBtn}
                >
                  <Text style={styles.showBtnText}>
                    {showPass ? "Ocultar" : "Mostrar"}
                  </Text>
                </TouchableOpacity>
              </View>
              {!!passError && <Text style={styles.error}>{passError}</Text>}
            </View>

            <View style={styles.row}>
              <View style={styles.remember}>
                <Switch value={remember} onValueChange={setRemember} />
                <Text style={styles.rememberText}>Lembrar-me</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Recuperar senha", "Link enviado (exemplo).")
                }
              >
                <Text style={styles.forgot}>Esqueci minha senha</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={!formValid || loading}
              style={[
                styles.button,
                (!formValid || loading) && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity onPress={() => navigation.navigate("Cadastrar")}>
              <Text style={styles.secondary}>
                Não tem conta? <Text style={styles.link}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7F7" },
  flex1: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "center",
  },
  container: {
    flexGrow: 1,
    gap: 12,
  },

  // área das logos
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    paddingTop: 24,
  },
  img: {
    width: 180,
    height: 130,
  },
  merosImg: {
    position: "absolute",
    top: -10,
    right: 40,
    width: 150,
    height: 60,
  },

  title: { color: "#0D5B9D", fontSize: 32, fontWeight: "700" },
  subtitle: { color: "#2980b9", fontSize: 16 },
  field: { marginTop: 10 },
  label: { color: "#2980b9", marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputError: { borderColor: "#ef4444" },
  error: { color: "#ef4444", marginTop: 6 },
  passRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  showBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  showBtnText: { fontWeight: "600", color: "#0f172a" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  remember: { flexDirection: "row", alignItems: "center", gap: 8 },
  rememberText: { color: "#010101" },
  forgot: { color: "#93c5fd", fontWeight: "600" },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#1f2937", marginVertical: 16 },
  secondary: { color: "#010101", textAlign: "center" },
  link: { color: "#60a5fa", fontWeight: "700" },
});
