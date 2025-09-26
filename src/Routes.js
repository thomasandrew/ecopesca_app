import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "./screens/Login/LoginScreen";
import CadastrarScreen from "./screens/Cadastrar/CadastrarScreen";
import FormularioScreen from "./screens/Formulario/FormularioScreen";

const Stack = createStackNavigator();

export default function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastrar" component={CadastrarScreen} />
        <Stack.Screen name="Formulario" component={FormularioScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}