"use client";

import React from "react";
import { X, Printer } from "lucide-react";

interface ReceiptProps {
  order: any;
  settings: any;
  onClose: () => void;
}

export default function Receipt({ order, settings, onClose }: ReceiptProps) {
  if (!order) return null;

  const handlePrint = () => {
    // Send to telegram asynchronously
    fetch('/api/telegram/send-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, settings })
    }).catch(err => console.error("Failed to send telegram receipt", err));

    // Open print dialog
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Printer size={18} />
            Simulate Receipt
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 flex justify-center">
          {/* Thermal Receipt Container */}
          <div
            id="print-receipt-section"
            className="w-full max-w-[80mm] p-4 bg-white text-slate-900 shadow-md font-mono text-xs border border-slate-200"
          >
            {/* Store Details */}
            <div className="text-center space-y-1 mb-4 border-b border-dashed border-slate-300 pb-3">
              <h2 className="text-sm font-bold uppercase">{settings?.storeName || "My POS Store"}</h2>
              <p className="text-[10px] text-slate-500">{settings?.storeAddress || "123 Store Street"}</p>
              <p className="text-[10px] text-slate-500">TEL: {settings?.storePhone || "000-000-000"}</p>
            </div>

            {/* Order Meta Info */}
            <div className="space-y-0.5 mb-3 text-[10px] text-slate-600">
              <p>ORDER: {order.orderNumber}</p>
              <p>DATE: {new Date(order.createdAt).toLocaleString()}</p>
              <p>CASHIER: {order.user?.name || "Cashier"}</p>
              {order.customer && (
                <div className="border-t border-dashed border-slate-200 mt-1 pt-1">
                  <p>CUST: {order.customer.name}</p>
                  <p>PHONE: {order.customer.phone || "N/A"}</p>
                  <p>POINTS ACCUM: {order.customer.points} pts</p>
                </div>
              )}
            </div>

            {/* Product items table */}
            <div className="border-t border-b border-dashed border-slate-300 py-2 mb-3">
              <div className="grid grid-cols-12 font-bold mb-1 border-b border-slate-200 pb-1 text-[10px]">
                <span className="col-span-6">ITEM</span>
                <span className="col-span-2 text-center">QTY</span>
                <span className="col-span-4 text-right">TOTAL</span>
              </div>
              <div className="space-y-1.5">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="grid grid-cols-12 text-[10px]">
                    <div className="col-span-6 truncate">
                      <p className="truncate font-semibold">{item.product?.name}</p>
                      <p className="text-[8px] text-slate-400">@{Number(item.price).toFixed(2)}</p>
                    </div>
                    <span className="col-span-2 text-center font-medium">{item.quantity}</span>
                    <span className="col-span-4 text-right font-medium">${Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Receipt Summary */}
            <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-3 mb-3">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>DISCOUNT:</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>TAX ({Number(order.tax) === 0 ? 0 : (settings?.taxRate || 10)}%):</span>
                <span>${Number(order.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-0.5 text-[9px] text-slate-600 mb-4">
              <p>PAY METHOD: {order.paymentMethod}</p>
              <p>AMOUNT PAID: ${Number(order.amountPaid).toFixed(2)}</p>
              <p>CASH CHANGE: ${Number(order.change).toFixed(2)}</p>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-200">
              <p>{settings?.receiptHeader || "Thank you for shopping!"}</p>
              <p className="font-semibold text-[8px] mt-1">{settings?.receiptFooter || "Please come again"}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer size={16} />
            Print (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
