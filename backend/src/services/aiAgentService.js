const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { query } = require('../config/db');
const { calculateQuote } = require('./rateEngine');
const Order = require('../models/Order');

async function quoteCharge(args) {
  try {
    const quote = await calculateQuote({
      pickupPincode: args.pickup_pincode,
      dropPincode: args.drop_pincode,
      length: args.length_cm,
      width: args.width_cm,
      height: args.height_cm,
      actualWeight: args.actual_weight_kg,
      orderType: args.order_type || 'B2C',
      paymentType: args.payment_type || 'Prepaid'
    });
    return { success: true, quote };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function getOrderStatus(args, user) {
  try {
    const order = await Order.getOrderById(args.order_id);
    if (!order) return { success: false, error: 'Order not found' };
    
    // Auth check
    if (user.role === 'customer' && order.customer_id !== user.id) {
      return { success: false, error: 'Not authorized to view this order' };
    }
    
    const { rows: history } = await query(`SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`, [order.id]);
    
    return { success: true, status: order.status, history };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function rescheduleDelivery(args, user) {
  try {
    const order = await Order.getOrderById(args.order_id);
    if (!order) return { success: false, error: 'Order not found' };
    
    if (order.customer_id !== user.id && user.role !== 'admin') {
      return { success: false, error: 'Not authorized' };
    }
    if (order.status !== 'Failed') {
      return { success: false, error: 'Only failed orders can be rescheduled' };
    }
    
    await query(
      `UPDATE orders SET status = 'Pending', assigned_agent_id = NULL, updated_at = now() WHERE id = $1`,
      [order.id]
    );
    await Order.addStatusHistory(order.id, 'Pending', user.id, 'Rescheduled via Aria');
    
    return { success: true, message: 'Order rescheduled successfully' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function agentWorkloadSummary(user) {
  if (user.role !== 'admin') return { success: false, error: 'Not authorized' };
  try {
    const { rows } = await query(`
      SELECT u.full_name, u.current_zone_id, 
        COUNT(o.id) as active_orders
      FROM users u
      LEFT JOIN orders o ON o.assigned_agent_id = u.id AND o.status NOT IN ('Delivered', 'Failed')
      WHERE u.role = 'delivery_agent'
      GROUP BY u.id, u.full_name, u.current_zone_id
    `);
    return { success: true, summary: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

const functionDeclarations = [
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
  },
  {
    name: "get_order_status",
    description: "Looks up the live status and tracking timeline for an order.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        order_id: { type: SchemaType.STRING }
      },
      required: ["order_id"]
    }
  },
  {
    name: "reschedule_delivery",
    description: "Reschedules a failed delivery and resets its status so it can be re-assigned.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        order_id: { type: SchemaType.STRING }
      },
      required: ["order_id"]
    }
  },
  {
    name: "agent_workload_summary",
    description: "Summarizes current agent workloads and zone performance. Admin only.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  }
];

async function handleChat(messages, user) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('xxx')) {
    // Offline Mock Mode
    const lastMsg = messages[messages.length - 1].content.toLowerCase();
    let text = "I am operating in **Offline Mock Mode** since you don't have a Gemini API key set in your backend `.env` file! ";
    
    if (lastMsg.includes('quote') || lastMsg.includes('cost') || lastMsg.includes('ship')) {
      return { content: [{ type: 'text', text: text + 'However, if I were online, I would use my `quote_charge` tool to query the PostgreSQL rate engine and tell you that your 5kg package would cost ₹150 to ship based on your B2C Rate Card!' }] };
    }
    
    if (lastMsg.includes('status') || lastMsg.includes('track') || lastMsg.includes('where')) {
      return { content: [{ type: 'text', text: text + 'If I were online, I would use my `get_order_status` tool to read the database and tell you that your order is currently **In Transit**!' }] };
    }
    
    return { content: [{ type: 'text', text: text + 'Try asking me to calculate a quote or track an order to see how I would respond!' }] };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    tools: [{ functionDeclarations }],
    systemInstruction: "You are Aria, a helpful delivery assistant. Use tools to perform actions or look up data."
  });

  const geminiHistory = [];
  // Gemini requires the history to start with a 'user' role.
  // We can just skip the initial assistant greeting if it's the first message.
  let startIndex = 0;
  if (messages.length > 1 && messages[0].role === 'assistant') {
    startIndex = 1;
  }
  
  for (let i = startIndex; i < messages.length - 1; i++) {
    const msg = messages[i];
    geminiHistory.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }
  
  const lastUserMessage = messages[messages.length - 1].content;
  const chatSession = model.startChat({ history: geminiHistory });
  
  let result = await chatSession.sendMessage(lastUserMessage);
  let functionCalls = result.response.functionCalls();
  
  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0];
    let apiResponse = {};
    
    if (call.name === 'quote_charge') apiResponse = await quoteCharge(call.args);
    else if (call.name === 'get_order_status') apiResponse = await getOrderStatus(call.args, user);
    else if (call.name === 'reschedule_delivery') apiResponse = await rescheduleDelivery(call.args, user);
    else if (call.name === 'agent_workload_summary') apiResponse = await agentWorkloadSummary(user);
    
    result = await chatSession.sendMessage([{
      functionResponse: {
        name: call.name,
        response: apiResponse
      }
    }]);
  }
  
  return { content: [{ type: 'text', text: result.response.text() }] };
}

module.exports = { handleChat };
