import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../api";

const COLORS = {
  bg: "#F4F7FB",
  text: "#102A43",
  subtext: "#6B7C93",
  primary: "#6F95FF",
  label: "#0D5A9E",
  inputBorder: "#DFE7F1",
  inputBg: "#FFFFFF",
  error: "#E25454",
  link: "#2B6CB0",
};

export default function CadastrarScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [avatar, setAvatar] = useState(null);

  const nameOk = name.trim().length >= 2;
  const emailOk = /\S+@\S+\.\S+/.test(email);
  const pwdOk = pwd.length >= 6;
  const match = pwd && pwd2 && pwd === pwd2;

  const disabled = !(nameOk && emailOk && pwdOk && match);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão",
        "Precisamos da sua permissão para acessar as fotos."
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled) setAvatar(res.assets[0].uri);
  };

  const handleSignUp = async () => {
    try {
      const body = {
        name: name.trim(),
        email: email.trim(),
        password: pwd,
        avatarUrl: avatar || null, // opcional
      };
      await api("/auth/register", { method: "POST", body });
      Alert.alert("Cadastro", "Conta criada com sucesso! Faça login.");
      navigation.navigate("Login");
    } catch (e) {
      Alert.alert("Erro", String(e.message || e));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Cadastrar-se</Text>
        <Text style={styles.subtitle}>Crie sua conta</Text>

        <TouchableOpacity
          onPress={pickImage}
          style={styles.avatarWrap}
          activeOpacity={0.8}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.center]}>
              <Text style={styles.link}>Foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <View
          style={[styles.inputWrap, !nameOk && !!name && styles.inputWrapError]}
        >
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        <View
          style={[
            styles.inputWrap,
            !emailOk && !!email && styles.inputWrapError,
          ]}
        >
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>

        <View
          style={[styles.inputWrap, !pwdOk && !!pwd && styles.inputWrapError]}
        >
          <Text style={styles.label}>Senha</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={pwd}
              onChangeText={setPwd}
              secureTextEntry={!showPwd}
              placeholder="mín. 6"
              returnKeyType="next"
            />
            <TouchableOpacity
              onPress={() => setShowPwd((s) => !s)}
              style={styles.showBtn}
            >
              <Text style={styles.showText}>
                {showPwd ? "Ocultar" : "Mostrar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[styles.inputWrap, !match && !!pwd2 && styles.inputWrapError]}
        >
          <Text style={styles.label}>Confirmar senha</Text>
          <TextInput
            style={styles.input}
            value={pwd2}
            onChangeText={setPwd2}
            secureTextEntry
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          disabled={disabled}
          style={[styles.cta, disabled && { opacity: 0.6 }]}
          onPress={handleSignUp}
        >
          <Text style={styles.ctaText}>Cadastrar</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        <Text style={styles.footer}>
          Já tem conta?{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("Login")}
          >
            Entrar
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 32,
  },
  title: { fontSize: 32, fontWeight: "800", color: COLORS.label, marginTop: 8 },
  subtitle: { color: COLORS.subtext, marginTop: 6, marginBottom: 14 },
  avatarWrap: { alignSelf: "center", marginBottom: 4 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
  },
  center: { alignItems: "center", justifyContent: "center" },
  label: { color: COLORS.label, fontWeight: "700", marginBottom: 6 },
  inputWrap: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  inputWrapError: { borderColor: COLORS.error },
  input: { color: COLORS.text, paddingVertical: 8, fontSize: 16 },
  showBtn: {
    backgroundColor: "#E8ECF8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  showText: { color: "#223E7C", fontWeight: "700" },
  cta: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 18,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  divider: {
    height: 1,
    backgroundColor: COLORS.inputBorder,
    marginVertical: 24,
  },
  footer: { textAlign: "center", color: COLORS.subtext },
  link: { color: COLORS.link, fontWeight: "700" },
});
