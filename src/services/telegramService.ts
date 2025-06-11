import axios from "axios";
import { config } from "../config/config";

const mkTelegramService = () => {
  const BASE_URL = "https://gatewayapi.telegram.org/";

  const checkSendAbility = async (phoneNumber: string) => {
    const response = await axios.post(
      `${BASE_URL}/checkSendAbility`,
      {
        phone_number: phoneNumber,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.telegram.apiKey}`,
        },
      }
    );
    console.log("checkSendAbility", response.data);
    if (!response.data.ok) {
      throw new Error("Telegram API error: " + response.data.error);
    }
    return response.data;
  };

  const sendVerificationMessage = async (
    phoneNumber: string,
    requestId: string | undefined,
    code: string
  ) => {
    const response = await axios.post(
      `${BASE_URL}/sendVerificationMessage`,
      {
        phone_number: phoneNumber,
        request_id: requestId,
        code,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.telegram.apiKey}`,
        },
      }
    );
    console.log("sendVerificationMessage", response.data);
    if (!response.data.ok) {
      throw new Error("Telegram API error: " + response.data.error);
    }

    return response.data;
  };

  return {
    checkSendAbility,
    sendVerificationMessage,
  };
};

export const telegramService = mkTelegramService();
