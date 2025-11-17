// src/screens/Formulario/FormularioScreen.js
import React, { useState, useEffect } from "react";
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
import * as FileSystem from "expo-file-system/legacy";
import Constants from "expo-constants";
import { api } from "../../api";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
// ✅ Safe areas sem depreciação
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/* ========= CONFIG ROBOFLOW =========
 * Modelo 1 (Peixes): "fish-types2", versão 2
 * Modelo 2 (Bola/Círculo): "circle-finder-d4tvd", versão 1, classe "Circles"
 */
const ROBOFLOW_COMMON = {
  API_KEY:
    Constants.expoConfig?.extra?.ROBOFLOW_API_KEY || "Toq1XAi5qwg69JrseuR5",
  // Confiança mais baixa para facilitar os testes de detecção
  CONFIDENCE: 0.3,
};

const ROBOFLOW_FISH = {
  MODEL_SLUG:
    Constants.expoConfig?.extra?.ROBOFLOW_FISH_MODEL || "fish-types2",
  VERSION: Number(Constants.expoConfig?.extra?.ROBOFLOW_FISH_VERSION) || 2,
};

// ✅ Novo modelo da bola (Roboflow Universe - Circle Finder)
const ROBOFLOW_BALL = {
  MODEL_SLUG:
    Constants.expoConfig?.extra?.ROBOFLOW_BALL_MODEL || "circle-finder-d4tvd",
  VERSION: Number(Constants.expoConfig?.extra?.ROBOFLOW_BALL_VERSION) || 1,
  // nome da classe no dataset: Circles
  CLASS_NAME: "Circles",
};

// diâmetro real da bola usada como referência (cm) — AJUSTE para seu objeto real
// padrão: bola de golfe oficial (FishTechy usa isso): 4.268 cm
const REFERENCE_BALL_DIAMETER_CM =
  Number(Constants.expoConfig?.extra?.REFERENCE_BALL_DIAMETER_CM) || 4.268;

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
  box: "rgba(46, 204, 64, 0.25)",
  boxBorder: "#2ecc40",
  boxBall: "rgba(255, 165, 0, 0.25)",
  boxBallBorder: "#ff9800",
};

/* ===================== MAPA ===================== */
const MAP_SOURCE = require("../../../assets/foto_areas.jpg");
const { width: SCREEN_W } = Dimensions.get("window");
const PADDING_X = 24;
const MAP_META = Image.resolveAssetSource(MAP_SOURCE);
const MAP_RATIO = (MAP_META?.width || 1) / (MAP_META?.height || 1);
const MAP_W = SCREEN_W - PADDING_X * 2;
const MAP_MAX_H = 220;
const MAP_H = Math.min(MAP_W / MAP_RATIO, MAP_MAX_H);

/* ===================== DROPDOWN CUSTOM ===================== */
function Dropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Selecione...",
  renderHeader,
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets(); // << usa safe area do Android/iOS

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
          <Pressable
            style={[
              ddStyles.sheet,
              {
                // deixa o sheet acima da barra de navegação / gesto
                paddingBottom: 12 + insets.bottom,
                maxHeight: "72%",
              },
            ]}
          >
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
              // padding extra no fim, para a última opção não ficar atrás da barra
              contentContainerStyle={{
                paddingBottom: 24 + insets.bottom,
              }}
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

/* ===================== HELPERS (permissões & compat) ===================== */
// compat: MediaType novo (SDKs recentes) ou MediaTypeOptions (antigos)
const getImagesMediaTypes = () => {
  if (ImagePicker?.MediaType) return [ImagePicker.MediaType.Images];
  return ImagePicker.MediaTypeOptions?.Images ?? undefined;
};

async function ensurePermission(kind) {
  if (kind === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão de Câmera",
        "A câmera está bloqueada. Abra as Configurações do aparelho e permita o acesso."
      );
      return false;
    }
    return true;
  }
  if (kind === "library") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão de Fotos",
        "O app não tem acesso às fotos. Abra as Configurações do aparelho e permita o acesso."
      );
      return false;
    }
    return true;
  }
  return false;
}

/* ===================== AUXILIARES ===================== */
function combinePredictions(predFish = [], predBall = []) {
  return [
    ...predFish.map((p) => ({ ...p, __src: "fish" })),
    ...predBall.map((p) => ({ ...p, __src: "ball" })),
  ];
}
function longestSide(pxW, pxH) {
  return Math.max(pxW, pxH);
}
function estimateFishSizeCm(predFish = [], predBall = []) {
  if (!predFish.length || !predBall.length) return null;
  const bestBall =
    predBall.slice().sort((a, b) => b.confidence - a.confidence)[0] || null;
  if (!bestBall) return null;

  const ballPx = longestSide(bestBall.width, bestBall.height);
  if (!ballPx || REFERENCE_BALL_DIAMETER_CM <= 0) return null;

  const pxPerCm = ballPx / REFERENCE_BALL_DIAMETER_CM;
  const bestFish =
    predFish
      .slice()
      .sort(
        (a, b) =>
          longestSide(b.width, b.height) - longestSide(a.width, a.height)
      )[0] || null;
  if (!bestFish) return null;

  const fishPx = longestSide(bestFish.width, bestFish.height);
  return fishPx / pxPerCm;
}

/* ===================== PREVIEW ===================== */
function PreviewFoto({
  uri,
  predicoes,
  onLayoutSize,
  imgSizeOriginal,
  larguraDesejada,
}) {
  const [scaledH, setScaledH] = useState(0);

  useEffect(() => {
    if (!uri) return;
    Image.getSize(
      uri,
      (w, h) => {
        if (onLayoutSize) onLayoutSize({ w, h });
        const escala = larguraDesejada / w;
        setScaledH(h * escala);
      },
      (err) => console.log("Erro getSize:", err)
    );
  }, [uri, larguraDesejada]);

  const renderBoxes = () => {
    if (
      !predicoes ||
      predicoes.length === 0 ||
      !imgSizeOriginal?.w ||
      !imgSizeOriginal?.h
    )
      return null;

    const escala = larguraDesejada / imgSizeOriginal.w;

    return predicoes.map((p, idx) => {
      const left = (p.x - p.width / 2) * escala;
      const top = (p.y - p.height / 2) * escala;
      const boxW = p.width * escala;
      const boxH = p.height * escala;
      const isBall =
        p.__src === "ball" || p.class === ROBOFLOW_BALL.CLASS_NAME;

      return (
        <React.Fragment key={idx}>
          <Rect
            x={left}
            y={top}
            width={boxW}
            height={boxH}
            stroke={isBall ? COLORS.boxBallBorder : COLORS.boxBorder}
            strokeWidth={2}
            fill={isBall ? COLORS.boxBall : COLORS.box}
            rx={4}
            ry={4}
          />
          <SvgText
            x={left + 4}
            y={top + 16}
            fill={isBall ? COLORS.boxBallBorder : COLORS.boxBorder}
            fontWeight="bold"
            fontSize="12"
          >
            {`${p.class} ${Math.round(p.confidence * 100)}%`}
          </SvgText>
        </React.Fragment>
      );
    });
  };

  if (!uri) return null;

  return (
    <View style={{ marginTop: 10 }}>
      <View
        style={{
          width: larguraDesejada,
          height: scaledH,
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%", position: "absolute" }}
          resizeMode="cover"
        />
        <Svg
          width={larguraDesejada}
          height={scaledH}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {renderBoxes()}
        </Svg>
      </View>

      {(!predicoes || predicoes.length === 0) && (
        <Text
          style={{
            color: COLORS.subtext,
            marginTop: 10,
            fontSize: 16,
            fontWeight: "500",
          }}
        >
          Nada detectado.
        </Text>
      )}
    </View>
  );
}

/* ===================== TELA ===================== */
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

  const [fotoUri, setFotoUri] = useState(null);
  const [fotoOrigem, setFotoOrigem] = useState(null);

  const [predicoes, setPredicoes] = useState([]);
  const [imgSizeOriginal, setImgSizeOriginal] = useState(null);

  const [mapFull, setMapFull] = useState(false);

  const nomeErro = nome.length > 0 && nome.trim().length < 2;
  const areaErro = !area;
  const cmInvalido = cm.length > 0 && (isNaN(Number(cm)) || Number(cm) <= 0);

  // chama 2 modelos em paralelo
  const runRoboflowBoth = async (base64) => {
    const qs = (slug, ver) =>
      `https://serverless.roboflow.com/${slug}/${ver}?api_key=${ROBOFLOW_COMMON.API_KEY}&confidence=${ROBOFLOW_COMMON.CONFIDENCE}`;
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };

    const [fishRes, ballRes] = await Promise.all([
      fetch(qs(ROBOFLOW_FISH.MODEL_SLUG, ROBOFLOW_FISH.VERSION), {
        method: "POST",
        headers,
        body: base64,
      }),
      fetch(qs(ROBOFLOW_BALL.MODEL_SLUG, ROBOFLOW_BALL.VERSION), {
        method: "POST",
        headers,
        body: base64,
      }),
    ]);

    const fishJson = await fishRes.json().catch(() => ({}));
    const ballJson = await ballRes.json().catch(() => ({}));

    // logs para depurar a resposta dos modelos
    console.log("FISH JSON =>", fishJson);
    console.log("BALL JSON =>", ballJson);

    const fishPred =
      (Array.isArray(fishJson?.predictions) ? fishJson.predictions : []).filter(
        (p) => p.confidence >= ROBOFLOW_COMMON.CONFIDENCE
      );

    // ⬇️ usa somente classe "Circles" do modelo Circle Finder
    const ballPred =
      (Array.isArray(ballJson?.predictions) ? ballJson.predictions : []).filter(
        (p) =>
          p.confidence >= ROBOFLOW_COMMON.CONFIDENCE &&
          p.class === ROBOFLOW_BALL.CLASS_NAME
      );

    const fishLabeled = fishPred.map((p) => ({ ...p, __src: "fish" }));
    const ballLabeled = ballPred.map((p) => ({ ...p, __src: "ball" }));
    return { fish: fishLabeled, ball: ballLabeled };
  };

  const rodarDeteccao = async (uri) => {
    try {
      const imageBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const { fish, ball } = await runRoboflowBoth(imageBase64);

      const autoCm = estimateFishSizeCm(fish, ball);
      if (autoCm && (!cm || Number(cm) === 0)) {
        setCm(String(Math.round(autoCm * 100) / 100));
      }

      setPredicoes(combinePredictions(fish, ball));
    } catch (err) {
      console.log("Erro Roboflow:", err);
      Alert.alert("Erro Roboflow", String(err));
      setPredicoes([]);
    }
  };

  // === abrir câmera ===
  const abrirCamera = async () => {
    try {
      if (Platform.OS === "web") {
        Alert.alert(
          "Não suportado",
          "A câmera não abre no web preview. Teste no celular (Expo Go)."
        );
        return;
      }

      const ok = await ensurePermission("camera");
      if (!ok) return;

      // ✅ com edição + aspecto mais vertical para cortar lados e topo/fundo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: getImagesMediaTypes(),
        quality: 0.8,
        exif: false,
        allowsEditing: true,
        aspect: [3, 4], // retângulo em pé (bom para peixe)
      });

      if (!result?.canceled) {
        const uri = result.assets?.[0]?.uri;
        if (!uri) throw new Error("Sem URI da foto.");
        setFotoUri(uri);
        setFotoOrigem("camera");
        setPredicoes([]);
        await rodarDeteccao(uri);
      }
    } catch (e) {
      console.log("abrirCamera error:", e);
      Alert.alert("Câmera", String(e?.message || e));
    }
  };

  // === abrir galeria ===
  const abrirGaleria = async () => {
    try {
      const ok = await ensurePermission("library");
      if (!ok) return;

      // ✅ com edição + aspecto vertical
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: getImagesMediaTypes(),
        quality: 0.9,
        allowsEditing: true,
        aspect: [3, 4], // mesmo aspecto da câmera
        exif: false,
        selectionLimit: 1,
      });

      if (!result?.canceled) {
        const uri = result.assets?.[0]?.uri;
        if (!uri) throw new Error("Sem URI da imagem selecionada.");
        setFotoUri(uri);
        setFotoOrigem("galeria");
        setPredicoes([]);
        await rodarDeteccao(uri);
      }
    } catch (e) {
      console.log("abrirGaleria error:", e);
      Alert.alert("Galeria", String(e?.message || e));
    }
  };

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
        foto_uri: fotoUri || null,
        foto_origem: fotoOrigem || null,
        deteccoes: predicoes,
        referencia_bola_cm: REFERENCE_BALL_DIAMETER_CM,
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

  return (
    // ✅ SafeAreaView da lib react-native-safe-area-context (sem warning)
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
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
          {nomeErro && (
            <Text style={styles.error}>Mínimo de 2 caracteres.</Text>
          )}

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

          {/* Tamanho + botões */}
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

              {/* Galeria */}
              <TouchableOpacity
                onPress={abrirGaleria}
                activeOpacity={0.9}
                style={styles.camBtn}
              >
                <Text style={styles.camIcon}>🖼️</Text>
              </TouchableOpacity>

              {/* Câmera */}
              <TouchableOpacity
                onPress={abrirCamera}
                activeOpacity={0.9}
                style={[styles.camBtn, { marginLeft: 8 }]}
              >
                <Text style={styles.camIcon}>📷</Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            {fotoUri ? (
              <PreviewFoto
                uri={fotoUri}
                predicoes={predicoes}
                imgSizeOriginal={imgSizeOriginal}
                onLayoutSize={(size) => setImgSizeOriginal(size)}
                larguraDesejada={SCREEN_W - PADDING_X * 2 - 20}
              />
            ) : null}

            <Text style={{ marginTop: 8, color: COLORS.subtext }}>
              Referência: bola/círculo = {REFERENCE_BALL_DIAMETER_CM} cm.
            </Text>
          </View>
          {cmInvalido && (
            <Text style={styles.error}>Informe um valor numérico válido.</Text>
          )}

          {/* Área com mapa */}
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
          <Dropdown label="Isca" value={isca} onChange={setIsca} options={ISCAs} />
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
          <Pressable
            style={styles.mapModalBg}
            onPress={() => setMapFull(false)}
          >
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
    </SafeAreaView>
  );
}

/* ===================== ESTILOS ===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: PADDING_X,
    paddingTop: 16, // padding reduzido pois SafeAreaView já cuida do topo
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
    backgroundColor: "#F2F6FF",
    borderWidth: 1,
    borderColor: "#D9E4FF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  camIcon: { fontSize: 16, color: COLORS.link, fontWeight: "800" },

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
