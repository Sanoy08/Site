// src/app/api/admin/download-invoice/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb'; // connectToDatabase এর বদলে clientPromise
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

// ডাটাবেস নাম (আপনার প্রোজেক্টের ডিফল্ট অনুযায়ী)
const DB_NAME = 'BumbasKitchenDB';

const formatRs = (amount: number) => `Rs. ${Number(amount).toFixed(2)}`;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = await params; // URL থেকে Order ID নেওয়া হলো
        
        // ১. ডাটাবেস কানেকশন (clientPromise ব্যবহার করে)
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        
        // ২. অর্ডারের তথ্য নিয়ে আসা
        const order = await db.collection('orders').findOne({ OrderNumber: id });

        if (!order) {
            return new NextResponse('Order not found', { status: 404 });
        }

        // --- PDF জেনারেশন শুরু ---
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 40;

        const oliveDark = "#4A5D23"; 
        const oliveTopBar = "#C3CD49"; 
        const greyBar = "#EAEAEA"; 
        const rowHighlight = "#EAF0CD"; 
        const textDark = "#333333";

        // ইমেজ লোড করার ফাংশন
        const fetchImg = async (path: string) => {
            try {
                // সরাসরি আপনার মেইন সাইট থেকে ইমেজ টানবে যাতে এরর না আসে
                const url = `https://www.bumbaskitchen.app${path}`;
                const res = await fetch(url);
                if (!res.ok) return null;
                const buf = await res.arrayBuffer();
                return Buffer.from(buf).toString('base64');
            } catch { return null; }
        };

        const [logo, signature] = await Promise.all([
            fetchImg('/LOGO.png'),
            fetchImg('/signature.png')
        ]);

        // ১. BILL OF SUPPLY ব্যানার
        doc.setFillColor(oliveTopBar);
        doc.rect(0, 0, pageWidth, 40, "F");
        doc.setTextColor("#ffffff");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("BILL OF SUPPLY", margin, 25);

        doc.setDrawColor("#ffffff");
        doc.setLineWidth(1);
        doc.roundedRect(margin + 115, 10, 160, 20, 4, 4);
        doc.setFontSize(10);
        doc.text("ORIGINAL FOR RECIPIENT", margin + 125, 24);

        // ২. লোগো এবং কোম্পানির নাম
        if (logo) {
            doc.addImage(logo, "PNG", margin, 45, 80, 80, "logo", "FAST");
        }
        const textX = logo ? margin + 90 : margin;
        doc.setTextColor(oliveDark);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("BUMBA'S KITCHEN", textX, 85);
        doc.setTextColor(textDark);
        doc.setFontSize(12);
        doc.text("Mobile: 8240690254", textX, 105);

        // ৩. রিসিপ্ট ডিটেইলস (Receipt No, Date, Status)
        let y = 140;
        doc.setDrawColor(oliveDark);
        doc.setLineWidth(1.5);
        doc.line(margin, y, pageWidth - margin, y);
        doc.setFillColor(greyBar);
        doc.rect(margin, y + 2, pageWidth - margin * 2, 40, "F");
        doc.line(margin, y + 44, pageWidth - margin, y + 44);

        doc.setTextColor(textDark);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Receipt No", margin + 10, y + 17);
        doc.setFont("helvetica", "normal");
        doc.text(`: ${order.OrderNumber}`, margin + 85, y + 17);

        doc.setFont("helvetica", "bold");
        doc.text("Date", pageWidth - margin - 150, y + 17);
        doc.setFont("helvetica", "normal");
        doc.text(`: ${new Date(order.Timestamp).toLocaleDateString("en-GB")}`, pageWidth - margin - 110, y + 17);

        doc.setFont("helvetica", "bold");
        doc.text("Order Status", margin + 10, y + 33);
        doc.setFont("helvetica", "normal");
        doc.text(`: ${order.Status || 'Processing'}`, margin + 85, y + 33);

        doc.setFont("helvetica", "bold");
        doc.text("Payment", pageWidth - margin - 150, y + 33);
        doc.setFont("helvetica", "normal");
        const paymentMode = order.OrderType?.toLowerCase() === 'online' || order.OrderType?.toLowerCase() === 'prepaid' ? 'Paid Online' : 'Cash on Delivery';
        doc.text(`: ${paymentMode}`, pageWidth - margin - 110, y + 33);

        // ৪. কাস্টমার ডিটেইলস (Bill to)
        y += 65; 
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(oliveDark);
        doc.text("Bill to", margin, y);
        y += 15;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(textDark);
        doc.text("Name", margin, y);
        doc.text(`: ${order.Name}`, margin + 60, y);
        y += 15;
        const addr = order.DeliveryAddress || order.Address || "No Address Provided";
        const addrLines = doc.splitTextToSize(`: ${addr}`, 400);
        doc.text("Address", margin, y);
        doc.text(addrLines, margin + 60, y);
        y += (addrLines.length * 15) + 10;

        // ৫. টেবিল (Items)
        const tableData = (order.Items || []).map((item: any, i: number) => [
          (i + 1).toString(), item.name, item.quantity.toString(), formatRs(item.price), formatRs(item.quantity * item.price)
        ]);
        while (tableData.length < 6) { tableData.push(["", "", "", "", ""]); }

        autoTable(doc, {
          startY: y,
          margin: { bottom: 230 }, 
          head: [["SL.", "Description", "Qty", "Price", "Amount"]],
          body: tableData,
          theme: "plain",
          headStyles: { fillColor: oliveDark, textColor: "#ffffff", fontSize: 11, fontStyle: "bold", halign: "center" },
          bodyStyles: { fontSize: 10, textColor: textDark, cellPadding: 8 },
          alternateRowStyles: { fillColor: rowHighlight },
          columnStyles: { 0: { halign: "center", cellWidth: 40 }, 1: { halign: "left", cellWidth: 220 }, 2: { halign: "center", cellWidth: 60 }, 3: { halign: "center", cellWidth: 90 }, 4: { halign: "center", cellWidth: 100 } },
        });

        // ৬. টার্মস এবং গ্র্যান্ড টোটাল
        const summaryY = pageHeight - 210; 
        const summaryX = pageWidth - margin - 220;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Terms and Conditions", margin, summaryY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("1. Goods once sold will not be taken back or exchanged", margin, summaryY + 15);
        doc.text("2. All disputes are subject to jurisdiction only", margin, summaryY + 28);

        // কিউআর কোড
        try {
            const orderLink = `https://www.bumbaskitchen.app/account/orders?id=${order.OrderNumber}`;
            const qrBase64 = await QRCode.toDataURL(orderLink, { type: 'image/jpeg', quality: 0.8, margin: 1 });
            doc.addImage(qrBase64, "JPEG", margin, summaryY + 45, 60, 60, "qr", "FAST");
        } catch (err) {}

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        const subtotal = order.Subtotal || order.FinalPrice || 0;
        const discount = order.Discount || 0;
        const received = order.ReceivedAmount || 0;
        const finalPrice = order.FinalPrice || 0;

        doc.text("Sub Total", summaryX, summaryY);
        doc.text(formatRs(subtotal), pageWidth - margin, summaryY, { align: "right" });
        doc.text("Discount", summaryX, summaryY + 20);
        doc.text(formatRs(discount), pageWidth - margin, summaryY + 20, { align: "right" });
        doc.text("Received Amount", summaryX, summaryY + 40);
        doc.text(formatRs(received), pageWidth - margin, summaryY + 40, { align: "right" });

        doc.setFillColor(oliveDark);
        doc.rect(summaryX - 15, summaryY + 50, 250, 25, "F");
        doc.setTextColor("#ffffff");
        doc.setFontSize(12);
        doc.text("Grand Total", summaryX, summaryY + 67);
        doc.text(formatRs(finalPrice), pageWidth - margin, summaryY + 67, { align: "right" });

        // ৭. ফুটার এবং সিগনেচার
        const footerY = pageHeight - 50;
        doc.setFont("times", "bolditalic");
        doc.setFontSize(18);
        doc.setTextColor("#000000");
        doc.text("Thank You & Order Again", margin, footerY - 5);
        if (signature) {
            doc.addImage(signature, "PNG", pageWidth - margin - 120, footerY - 70, 110, 55, "sign", "FAST");
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("AUTHORISED SIGNATORY FOR", pageWidth - margin, footerY + 10, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text("Bumba's Kitchen", pageWidth - margin, footerY + 25, { align: "right" });

        // ৮. পিডিএফ বাফার রেসপন্স
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Invoice_${order.OrderNumber}.pdf"`,
            },
        });

    } catch (error) {
        console.error("Server API PDF Error:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
