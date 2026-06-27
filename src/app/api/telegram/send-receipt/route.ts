import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { order, settings } = await request.json();
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId || botToken === "YOUR_BOT_TOKEN_HERE" || chatId === "YOUR_CHAT_ID_HERE") {
      return NextResponse.json(
        { error: 'Telegram Bot Token or Chat ID is not configured.' },
        { status: 500 }
      );
    }

    // Format the message
    const storeName = settings?.storeName || 'My POS Store';
    let message = `🧾 *NEW RECEIPT PRINTED*\n`;
    message += `🏪 ${storeName}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*Order #*: \`${order.orderNumber}\`\n`;
    message += `*Date*: ${new Date(order.createdAt).toLocaleString()}\n`;
    message += `*Cashier*: ${order.user?.name || 'Cashier'}\n`;
    
    if (order.customer) {
      message += `*Customer*: ${order.customer.name} (${order.customer.phone || 'N/A'})\n`;
    }
    
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*ITEMS:*\n`;
    order.items?.forEach((item: any) => {
      message += `• ${item.product?.name} x${item.quantity} = $${Number(item.subtotal).toFixed(2)}\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*Subtotal*: $${Number(order.subtotal).toFixed(2)}\n`;
    if (Number(order.discount) > 0) {
      message += `*Discount*: -$${Number(order.discount).toFixed(2)}\n`;
    }
    message += `*Tax*: $${Number(order.tax).toFixed(2)}\n`;
    message += `*TOTAL*: $${Number(order.total).toFixed(2)}\n`;
    message += `*Payment*: ${order.paymentMethod.replace('_', ' ')}\n`;

    // Send to Telegram
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send message to Telegram' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending receipt to Telegram:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
