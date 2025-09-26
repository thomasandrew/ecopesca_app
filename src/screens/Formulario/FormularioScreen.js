// src/screens/Formulario/FormularioScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api } from "../../api";

/* ===================== TEMA ===================== */
const COLORS = {
  bg: "#F7F7F7",
  text: "#102A43",
  subtext: "#6B7C93",
  primary: "#6F95FF",
  label: "#0D5A9E",
  inputBorder: "#DFE7F1",
  inputBg: "#FFFFFF",
  error: "#E25454",
  link: "#2B6CB0",
};

/* ===================== MAPA ===================== */
const MAP_SOURCE = require("../../../assets/foto_areas.jpg");
const { width: SCREEN_W } = Dimensions.get("window");
const PADDING_X = 24; // igual ao padding horizontal da tela
const MAP_META = Image.resolveAssetSource(MAP_SOURCE);
const MAP_RATIO = (MAP_META?.width || 1) / (MAP_META?.height || 1);
const MAP_W = SCREEN_W - PADDING_X * 2;
const MAP_MAX_H = 220; // limite dentro do dropdown
const MAP_H = Math.min(MAP_W / MAP_RATIO, MAP_MAX_H);

/* ===================== DROPDOWN CUSTOM ===================== */
function Dropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Selecione...",
  renderHeader, // (close) => ReactNode
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={ddStyles.block}>
      {!!label && <Text style={ddStyles.label}>{label}</Text>}

      <TouchableOpacity
        style={ddStyles.input}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={[ddStyles.value, !value && { color: "#9AA6B2" }]}>
          {value || placeholder}
        </Text>
        <Text style={ddStyles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={ddStyles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={ddStyles.sheet}>
            <View style={ddStyles.sheetHeader}>
              <Text style={ddStyles.sheetTitle}>{label || "Selecionar"}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={ddStyles.close}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => String(item)}
              ListHeaderComponent={
                renderHeader ? (
                  <View style={ddStyles.headerBox}>
                    {renderHeader(() => setOpen(false))}
                  </View>
                ) : null
              }
              ItemSeparatorComponent={() => <View style={ddStyles.sep} />}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    style={[ddStyles.item, selected && ddStyles.itemSelected]}
                    onPress={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        ddStyles.itemText,
                        selected && ddStyles.itemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const ddStyles = StyleSheet.create({
  block: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    padding: 10,
    marginTop: 10,
  },
  label: { color: COLORS.label, fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: { fontSize: 16, color: COLORS.text },
  chevron: { fontSize: 18, color: COLORS.link, marginLeft: 8 },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "75%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 12,
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: COLORS.label },
  close: { color: COLORS.link, fontWeight: "700" },

  headerBox: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  item: { paddingVertical: 14, paddingHorizontal: 16 },
  itemSelected: { backgroundColor: "#F0F5FF" },
  itemText: { fontSize: 16, color: COLORS.text },
  itemTextSelected: { fontWeight: "700" },
  sep: { height: 1, backgroundColor: "#EEF2F6" },
});

/* ===================== DADOS FIXOS ===================== */
const AREAS = Array.from({ length: 10 }, (_, i) => `Área ${i + 1}`);
const DIAS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];
const TURNOS = ["Manhã", "Tarde", "Noite"];
const EQUIPAMENTOS = [
  "Heavy",
  "Light",
  "Medium",
  "Ultralight",
  "Ultra Light e Medium",
];
const ISCAs = [
  "Camarão",
  "Camarão morto",
  "Camarão vivo",
  "Jig",
  "Mexilhão",
  "Microjig",
  "Plug",
  "Plug de meia água",
  "Shad",
  "Stick",
  "Stick de Superfície",
];
const CLIMA = [
  "Céu claro",
  "Céu entre nuvens",
  "Céu limpo",
  "Chuva leve",
  "Nublado",
  "Sol entre nuvens",
];
const VENTO = [
  "Sem vento",
  "Brisa",
  "Brisa Leve",
  "Fraco",
  "Moderado",
  "Forte",
  "Vento médio",
];

/* ===================== TELA FORMULÁRIO ===================== */
export default function FormularioScreen() {
  const [nome, setNome] = useState("");
  const [nomePopular, setNomePopular] = useState("");
  const [cm, setCm] = useState("");

  const [area, setArea] = useState();
  const [data, setData] = useState(new Date());
  const [mostrarData, setMostrarData] = useState(false);
  const [dia, setDia] = useState(DIAS[0]);
  const [turno, setTurno] = useState(TURNOS[0]);
  const [equip, setEquip] = useState(EQUIPAMENTOS[0]);
  const [isca, setIsca] = useState(ISCAs[0]);
  const [cond, setCond] = useState(CLIMA[0]);
  const [vento, setVento] = useState(VENTO[0]);

  // modal tela cheia do mapa
  const [mapFull, setMapFull] = useState(false);

  const nomeErro = nome.length > 0 && nome.trim().length < 2;
  const areaErro = !area;
  const cmInvalido = cm.length > 0 && (isNaN(Number(cm)) || Number(cm) <= 0);

  const onSubmit = async () => {
    if (areaErro || nomeErro || !nome || cmInvalido) {
      Alert.alert(
        "Validação",
        "Verifique: Nome (mín. 2), Área e CM (número positivo)."
      );
      return;
    }

    try {
      const payload = {
        nome,
        nomePopular,
        tamanho_cm: cm ? Number(cm) : null,
        area,
        data: data.toISOString().slice(0, 10),
        dia,
        turno,
        equipamento: equip,
        isca,
        condicoes: cond,
        vento,
      };

      const res = await api("/registros", {
        method: "POST",
        body: payload,
        auth: true,
      });

      Alert.alert("Enviado!", `Registro #${res.id} salvo com sucesso.`);
      // opcional: limpar campos
      // setNome(""); setNomePopular(""); setCm(""); setArea(undefined);
    } catch (e) {
      Alert.alert("Erro", String(e.message || e));
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.title}>Formulário</Text>
        <Text style={styles.subtitle}>Registre as informações</Text>

        {/* Nome */}
        <View style={[styles.block, nomeErro && styles.blockError]}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome"
            placeholderTextColor="#9AA6B2"
            value={nome}
            onChangeText={setNome}
          />
        </View>
        {nomeErro && <Text style={styles.error}>Mínimo de 2 caracteres.</Text>}

        {/* Nome popular */}
        <View style={styles.block}>
          <Text style={styles.label}>Nome popular</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Robalo, Tainha..."
            placeholderTextColor="#9AA6B2"
            value={nomePopular}
            onChangeText={setNomePopular}
          />
        </View>

        {/* Tamanho em cm */}
        <View style={[styles.block, cmInvalido && styles.blockError]}>
          <Text style={styles.label}>CM (tamanho)</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              placeholderTextColor="#9AA6B2"
              keyboardType="decimal-pad"
              value={cm}
              onChangeText={setCm}
            />
            <Text
              style={{
                color: COLORS.subtext,
                marginLeft: 8,
                fontWeight: "700",
              }}
            >
              cm
            </Text>
          </View>
        </View>
        {cmInvalido && (
          <Text style={styles.error}>Informe um valor numérico válido.</Text>
        )}

        {/* Dropdown de Área com foto no topo (tocar -> fecha dropdown e abre fullscreen) */}
        <Dropdown
          label="Área"
          value={area}
          onChange={setArea}
          options={AREAS}
          placeholder="Selecione..."
          renderHeader={(close) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                close(); // fecha o dropdown primeiro
                setTimeout(() => setMapFull(true), 0); // abre fullscreen por cima
              }}
            >
              <Image
                source={MAP_SOURCE}
                style={{
                  width: MAP_W,
                  height: MAP_H,
                  alignSelf: "center",
                  borderRadius: 12,
                }}
                resizeMode="contain"
              />
              <Text
                style={{
                  textAlign: "center",
                  color: COLORS.link,
                  marginTop: 6,
                  fontWeight: "700",
                }}
              >
                Tocar para ver em tela cheia
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Data */}
        <View style={styles.block}>
          <Text style={styles.label}>Data</Text>
          <TouchableOpacity
            onPress={() => setMostrarData(true)}
            style={[styles.input, styles.dateBtn]}
            activeOpacity={0.8}
          >
            <Text style={{ color: COLORS.text }}>
              {data.toLocaleDateString()}
            </Text>
            <Text style={{ color: COLORS.link, fontWeight: "700" }}>
              Alterar
            </Text>
          </TouchableOpacity>
          {mostrarData && (
            <DateTimePicker
              value={data}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, d) => {
                setMostrarData(false);
                if (d) setData(d);
              }}
            />
          )}
        </View>

        {/* Demais dropdowns */}
        <Dropdown label="Dia" value={dia} onChange={setDia} options={DIAS} />
        <Dropdown
          label="Turno"
          value={turno}
          onChange={setTurno}
          options={TURNOS}
        />
        <Dropdown
          label="Equipamento"
          value={equip}
          onChange={setEquip}
          options={EQUIPAMENTOS}
        />
        <Dropdown
          label="Isca"
          value={isca}
          onChange={setIsca}
          options={ISCAs}
        />
        <Dropdown
          label="Condições climáticas"
          value={cond}
          onChange={setCond}
          options={CLIMA}
        />
        <Dropdown
          label="Vento"
          value={vento}
          onChange={setVento}
          options={VENTO}
        />

        <TouchableOpacity
          style={styles.cta}
          onPress={onSubmit}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>Enviar</Text>
        </TouchableOpacity>
      </View>

      {/* ===== Modal tela cheia com pinch-to-zoom ===== */}
      <Modal
        visible={mapFull}
        transparent
        animationType="fade"
        onRequestClose={() => setMapFull(false)}
      >
        <Pressable style={styles.mapModalBg} onPress={() => setMapFull(false)}>
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={MAP_SOURCE}
              style={styles.mapModalImage}
              resizeMode="contain"
            />
          </ScrollView>

          <TouchableOpacity
            style={styles.mapCloseBtn}
            onPress={() => setMapFull(false)}
          >
            <Text style={styles.mapCloseText}>Fechar</Text>
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

/* ===================== ESTILOS DA TELA ===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: PADDING_X,
    paddingTop: 80,
  },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.label },
  subtitle: { color: COLORS.subtext, marginTop: 4, marginBottom: 14 },

  block: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  blockError: { borderColor: COLORS.error },
  label: { color: COLORS.label, fontWeight: "700", marginBottom: 6 },
  input: { color: COLORS.text, paddingVertical: 8, fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center" },

  dateBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  error: { color: COLORS.error, marginTop: 6 },
  cta: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 24,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // modal fullscreen do mapa
  mapModalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  mapModalImage: { width: "95%", height: "90%" },
  mapCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  mapCloseText: { color: "#fff", fontWeight: "800", letterSpacing: 0.3 },
});
