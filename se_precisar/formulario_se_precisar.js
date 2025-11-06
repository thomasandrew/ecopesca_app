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
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
// usar API legacy p/ garantir base64
import * as FileSystem from "expo-file-system/legacy";
import Svg, { Rect, Text as SvgText, Circle } from "react-native-svg";
import Constants from "expo-constants";
import { api } from "../../api";

/* ========= CONFIG ROBOFLOW ========= */
const ROBOFLOW_API_KEY =
  Constants?.expoConfig?.extra?.ROBOFLOW_API_KEY ?? "SUA_API_KEY_AQUI";
const ROBOFLOW_MODEL = "ecopesca_app-zpwxc"; // <- confira no Deploy
const ROBOFLOW_VERSION = "2";
const ROBOFLOW_CLASS = "fish";

/* ========= TEMA ========= */
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

const MAP_SOURCE = require("../../../assets/foto_areas.jpg");
const { width: SCREEN_W } = Dimensions.get("window");
const PADDING_X = 24;
const MAP_META = Image.resolveAssetSource(MAP_SOURCE);
const MAP_RATIO = (MAP_META?.width || 1) / (MAP_META?.height || 1);
const MAP_W = SCREEN_W - PADDING_X * 2;
const MAP_MAX_H = 220;
const MAP_H = Math.min(MAP_W / MAP_RATIO, MAP_MAX_H);

/* ========= Dropdown simples ========= */
function Dropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Selecione...",
  renderHeader,
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

/* ========= Dados ========= */
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

/* ========= Helpers de medição ========= */
const getMaiorDeteccao = (preds = []) =>
  preds.reduce(
    (best, p) =>
      (best?.width || 0) * (best?.height || 0) > p.width * p.height ? best : p,
    preds[0]
  );

const estimarComprimentoCM = (pred, calibPts, realDistCm, scaleX, scaleY) => {
  if (!pred || !calibPts?.[0] || !calibPts?.[1] || !realDistCm) return null;

  // 1) diagonal da caixa do peixe (em pixels da inferência)
  const fishPx = Math.hypot(pred.width, pred.height);

  // 2) distância entre os dois toques em pixels da inferência
  const [p1, p2] = calibPts; // pontos no preview
  const ix1 = p1.x / scaleX;
  const iy1 = p1.y / scaleY;
  const ix2 = p2.x / scaleX;
  const iy2 = p2.y / scaleY;
  const rulerPx = Math.hypot(ix2 - ix1, iy2 - iy1);
  if (!rulerPx) return null;

  // 3) converter px->cm
  const cmPerPx = realDistCm / rulerPx;
  return +(fishPx * cmPerPx).toFixed(1);
};

/* ========= TELA ========= */
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

  // inferência
  const [fotoCm, setFotoCm] = useState(null);
  const [deteccoes, setDeteccoes] = useState([]);
  const [inferW, setInferW] = useState(null);
  const [inferH, setInferH] = useState(null);
  const [showDetModal, setShowDetModal] = useState(false);

  // calibração
  const [calibPts, setCalibPts] = useState([]); // [{x,y},{x,y}] no preview
  const [realDistCm, setRealDistCm] = useState("10");

  // mapa fullscreen
  const [mapFull, setMapFull] = useState(false);

  const nomeErro = nome.length > 0 && nome.trim().length < 2;
  const areaErro = !area;
  const cmInvalido = cm.length > 0 && (isNaN(Number(cm)) || Number(cm) <= 0);

  /* ====== câmera + inferência ====== */
  const abrirCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão",
        "Precisamos de acesso à câmera para tirar a foto."
      );
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });
    if (res.canceled) return;

    try {
      const original = res.assets[0];
      const resized = await ImageManipulator.manipulateAsync(
        original.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      setFotoCm(resized.uri);

      const base64 = await FileSystem.readAsStringAsync(resized.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const endpoint =
        `https://detect.roboflow.com/${ROBOFLOW_MODEL}/${ROBOFLOW_VERSION}` +
        `?api_key=${ROBOFLOW_API_KEY}` +
        `&format=json` +
        `&confidence=0.6` +
        `&overlap=0.5` +
        `&classes=${encodeURIComponent(ROBOFLOW_CLASS)}`;

      const inferRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: base64,
      });

      const raw = await inferRes.text();
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }

      if (!inferRes.ok) {
        const detalhe =
          parsed?.error || raw?.slice(0, 200) || "Erro desconhecido";
        throw new Error(`HTTP ${inferRes.status} – ${detalhe}`);
      }

      const imgW = parsed?.image?.width ?? original.width ?? 0;
      const imgH = parsed?.image?.height ?? original.height ?? 0;
      setInferW(imgW);
      setInferH(imgH);
      setDeteccoes(
        Array.isArray(parsed?.predictions) ? parsed.predictions : []
      );
      setCalibPts([]); // zera calibração pra nova foto
      setShowDetModal(true);
    } catch (e) {
      Alert.alert(
        "Detecção",
        `Não foi possível detectar peixes.\n${String(e?.message || e)}`
      );
    }
  };

  /* ====== envio ====== */
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
        foto_cm_uri: fotoCm || null,
        deteccoes,
      };
      const res = await api("/registros", {
        method: "POST",
        body: payload,
        auth: true,
      });
      Alert.alert("Enviado!", `Registro #${res.id} salvo com sucesso.`);
    } catch (e) {
      Alert.alert("Erro", String(e.message || e));
    }
  };

  /* ====== medidas de preview ====== */
  const previewW = SCREEN_W - PADDING_X * 2;
  const previewH = Math.round((previewW * 3) / 4); // 4:3
  const scaleX = inferW ? previewW / inferW : 1;
  const scaleY = inferH ? previewH / inferH : 1;

  /* ====== calibração (toques) ====== */
  const handlePreviewPress = (e) => {
    const { locationX, locationY } = e.nativeEvent; // coords dentro do container
    setCalibPts((old) => {
      if (old.length >= 2) return [{ x: locationX, y: locationY }]; // recomeça
      return [...old, { x: locationX, y: locationY }];
    });
  };

  const aplicarCalibracao = () => {
    if (!deteccoes?.length) {
      Alert.alert("Calibração", "Nenhuma detecção encontrada.");
      return;
    }
    if (calibPts.length < 2) {
      Alert.alert(
        "Calibração",
        "Toque duas vezes na régua (ex.: 0 cm e 10 cm)."
      );
      return;
    }
    const valorReal = Number(realDistCm);
    if (!valorReal || valorReal <= 0) {
      Alert.alert("Calibração", "Informe a distância real em cm (ex.: 10).");
      return;
    }
    const peixe = getMaiorDeteccao(deteccoes);
    const cmEstimado = estimarComprimentoCM(
      peixe,
      calibPts,
      valorReal,
      scaleX,
      scaleY
    );
    if (cmEstimado == null) {
      Alert.alert("Calibração", "Não foi possível calcular. Tente novamente.");
      return;
    }
    setCm(String(cmEstimado));
    Alert.alert("Calibração", `Comprimento estimado: ${cmEstimado} cm`);
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

        {/* CM + câmera */}
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
            <TouchableOpacity
              onPress={abrirCamera}
              style={styles.camBtn}
              activeOpacity={0.8}
            >
              {fotoCm ? (
                <Image source={{ uri: fotoCm }} style={styles.camThumb} />
              ) : (
                <Text style={styles.camIcon}>📷</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {cmInvalido && (
          <Text style={styles.error}>Informe um valor numérico válido.</Text>
        )}

        {/* Área com imagem */}
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
                close();
                setTimeout(() => setMapFull(true), 0);
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

      {/* ===== Modal Detecção + Calibração ===== */}
      <Modal
        visible={showDetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetModal(false)}
      >
        <View style={styles.detModalBg}>
          <View style={styles.detSheet}>
            <View style={styles.detHeader}>
              <Text style={styles.detTitle}>Detecção de Peixes</Text>
              <TouchableOpacity onPress={() => setShowDetModal(false)}>
                <Text style={styles.closeLink}>Fechar</Text>
              </TouchableOpacity>
            </View>

            {fotoCm ? (
              <View style={{ alignItems: "center", marginTop: 8 }}>
                {/* container que recebe os toques (coords relativas a preview) */}
                <Pressable
                  onPressOut={handlePreviewPress}
                  style={{
                    width: previewW,
                    height: previewH,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={{ uri: fotoCm }}
                    style={{
                      width: previewW,
                      height: previewH,
                      borderRadius: 10,
                      position: "absolute",
                    }}
                    resizeMode="contain"
                  />
                  <Svg width={previewW} height={previewH}>
                    {/* caixas de detecção */}
                    {deteccoes.map((p, idx) => {
                      const x = (p.x - p.width / 2) * scaleX;
                      const y = (p.y - p.height / 2) * scaleY;
                      const w = p.width * scaleX;
                      const h = p.height * scaleY;
                      return (
                        <React.Fragment key={idx}>
                          <Rect
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            stroke="#22c55e"
                            strokeWidth={2}
                            fill="transparent"
                            rx={6}
                          />
                          <SvgText
                            x={x + 6}
                            y={y + 18}
                            fill="#22c55e"
                            fontSize="14"
                            fontWeight="700"
                          >
                            {p.class} {(p.confidence * 100).toFixed(0)}%
                          </SvgText>
                        </React.Fragment>
                      );
                    })}
                    {/* pontos de calibração */}
                    {calibPts.map((p, i) => (
                      <Circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={6}
                        fill={i === 0 ? "#2563eb" : "#1d4ed8"}
                      />
                    ))}
                  </Svg>
                </Pressable>

                <Text style={{ color: COLORS.subtext, marginTop: 10 }}>
                  {deteccoes.length
                    ? `${deteccoes.length} detecção(ões)`
                    : "Nenhuma detecção encontrada"}
                </Text>

                {/* barra de calibração */}
                <View style={{ width: previewW, marginTop: 12 }}>
                  <Text style={{ color: COLORS.subtext, marginBottom: 6 }}>
                    Toque duas vezes na régua (por exemplo 0 cm e 10 cm). Ajuste
                    o valor se não for 10.
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: COLORS.text, marginRight: 8 }}>
                      Distância real:
                    </Text>
                    <TextInput
                      value={String(realDistCm)}
                      onChangeText={setRealDistCm}
                      keyboardType="decimal-pad"
                      style={{
                        width: 90,
                        backgroundColor: "#fff",
                        borderColor: "#dbe5f1",
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        color: COLORS.text,
                      }}
                    />
                    <Text style={{ color: COLORS.text, marginLeft: 6 }}>
                      cm
                    </Text>
                    <TouchableOpacity
                      onPress={aplicarCalibracao}
                      style={{
                        marginLeft: "auto",
                        backgroundColor: "#22c55e",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "800" }}>
                        Calibrar e preencher
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ===== Modal mapa fullscreen ===== */}
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

/* ========= Estilos ========= */
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

  camBtn: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#E8ECF8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dbe5f1",
  },
  camIcon: { fontSize: 18, color: "#223E7C", fontWeight: "700" },
  camThumb: { width: 38, height: 38, borderRadius: 7 },

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

  // modal detecção
  detModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  detSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  detHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  detTitle: { fontSize: 16, fontWeight: "800", color: COLORS.label },
  closeLink: { color: COLORS.link, fontWeight: "700" },

  // modal mapa
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
