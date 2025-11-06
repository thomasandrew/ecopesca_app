import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "./screens/Login/LoginScreen";
import CadastrarScreen from "./screens/Cadastrar/CadastrarScreen";
import FormularioScreen from "./screens/Formulario/FormularioScreen";
import ForgotPasswordRequest from "./screens/ForgotPasswordRequest";
import ForgotPasswordVerify from "./screens/ForgotPasswordVerify";

const Stack = createStackNavigator();

export default function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastrar" component={CadastrarScreen} />
        <Stack.Screen name="Formulario" component={FormularioScreen} />
        <Stack.Screen name="ForgotPasswordRequest" component={ForgotPasswordRequest} />
        <Stack.Screen name="ForgotPasswordVerify" component={ForgotPasswordVerify} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}