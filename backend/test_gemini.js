const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config({ path: 'D:/last-mile-delivery-tracker/backend/.env' });

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      tools: [{ functionDeclarations: [
        {
          name: "quote_charge",
          description: "Calculates the delivery charge between two pincodes for a specific package.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              pickup_pincode: { type: SchemaType.STRING },
              drop_pincode: { type: SchemaType.STRING },
              length_cm: { type: SchemaType.NUMBER },
              width_cm: { type: SchemaType.NUMBER },
              height_cm: { type: SchemaType.NUMBER },
              actual_weight_kg: { type: SchemaType.NUMBER },
              order_type: { type: SchemaType.STRING },
              payment_type: { type: SchemaType.STRING }
            },
            required: ["pickup_pincode", "drop_pincode", "length_cm", "width_cm", "height_cm", "actual_weight_kg"]
          }
        }
      ] }],
    });
    
    const chatSession = model.startChat({ history: [] });
    let result = await chatSession.sendMessage("hello");
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Crash:", err.stack);
  }
}
test();
