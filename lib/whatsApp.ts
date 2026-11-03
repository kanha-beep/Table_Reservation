type ConfirmationDetails = {
  phone: string;
  name: string;
  startTime: Date;
  guests: number;
  tableName: string;
};

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function sendReservationConfirmation(details: ConfirmationDetails) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  if (!token || !phoneNumberId || !templateName) return { sent: false, reason: "WhatsApp is not configured" };

  const recipient = normalizePhone(details.phone);
  if (recipient.length < 8) return { sent: false, reason: "Invalid customer phone number" };
  const date = details.startTime.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
  const time = details.startTime.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipient,
      type: "template",
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US" },
        components: [{ type: "body", parameters: [
          { type: "text", text: details.name },
          { type: "text", text: date },
          { type: "text", text: time },
          { type: "text", text: String(details.guests) },
          { type: "text", text: details.tableName }
        ] }]
      }
    })
  });
  if (!response.ok) throw new Error(`WhatsApp API request failed (${response.status}).`);
  return { sent: true };
}
