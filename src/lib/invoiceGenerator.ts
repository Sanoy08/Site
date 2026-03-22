import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ★ FIX: Image Compressor to drastically reduce PDF size
const loadAndCompressImage = (src: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Max width সেট করে দেওয়া হলো, যাতে বড় ইমেজ ছোট হয়ে যায়
      const MAX_WIDTH = 400;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // PNG এর ট্রান্সপারেন্ট ব্যাকগ্রাউন্ড যেন কালো না হয়ে যায়, তাই সাদা ফিল করা হলো
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // JPEG হিসেবে 70% কোয়ালিটিতে কনভার্ট করা হচ্ছে (সাইজ কমানোর জন্য)
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
        console.warn(`Could not load image: ${src}`);
        resolve(null); 
    };
    img.src = src;
  });
};

// Formatter for price
const formatRs = (amount: number) => {
    return `Rs. ${Number(amount).toFixed(2)}`;
};

export const generateInvoice = async (order: any) => {
  try {
      const doc = new jsPDF({
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 40;

      // Exact Colors
      const oliveDark = "#4A5D23"; 
      const oliveTopBar = "#C3CD49"; 
      const greyBar = "#EAEAEA"; 
      const rowHighlight = "#EAF0CD"; 
      const textDark = "#333333";

      // ------------------------------------------
      // 1️⃣ LOAD & COMPRESS IMAGES (Logo + Signature)
      // ------------------------------------------
      const [logo, signature] = await Promise.all([
          loadAndCompressImage("/LOGO.png"),
          loadAndCompressImage("/signature.png") 
      ]);

      // ------------------------------------------
      // 2️⃣ TOP BANNER
      // ------------------------------------------
      doc.setFillColor(oliveTopBar);
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setTextColor("#ffffff");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("BILL OF SUPPLY", margin, 25);

      // Outlined Box inside Banner
      doc.setDrawColor("#ffffff");
      doc.setLineWidth(1);
      doc.roundedRect(margin + 115, 10, 160, 20, 4, 4);
      doc.setFontSize(10);
      doc.text("ORIGINAL FOR RECIPIENT", margin + 125, 24);

      // ------------------------------------------
      // 3️⃣ LOGO & COMPANY INFO
      // ------------------------------------------
      if (logo) {
          // Image format changed to JPEG for better compression
          doc.addImage(logo, "JPEG", margin, 45, 80, 80, "logo", "FAST");
      }

      const textX = logo ? margin + 90 : margin;
      
      doc.setTextColor(oliveDark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("BUMBA'S KITCHEN", textX, 85);

      doc.setTextColor(textDark);
      doc.setFontSize(12);
      doc.text("Mobile: 8240690254", textX, 105);

      // ------------------------------------------
      // 4️⃣ RECEIPT DETAILS BAR
      // ------------------------------------------
      let y = 140;
      
      doc.setDrawColor(oliveDark);
      doc.setLineWidth(1.5);
      doc.line(margin, y, pageWidth - margin, y);

      doc.setFillColor(greyBar);
      doc.rect(margin, y + 2, pageWidth - margin * 2, 22, "F");

      doc.line(margin, y + 26, pageWidth - margin, y + 26);

      doc.setTextColor(textDark);
      doc.setFontSize(10);
      
      doc.setFont("helvetica", "bold");
      doc.text("Receipt No", margin + 10, y + 17);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${order.OrderNumber}`, margin + 80, y + 17);

      doc.setFont("helvetica", "bold");
      doc.text("Date", pageWidth - margin - 120, y + 17);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${new Date(order.Timestamp).toLocaleDateString("en-GB")}`, pageWidth - margin - 80, y + 17);

      // ------------------------------------------
      // 5️⃣ BILL TO SECTION
      // ------------------------------------------
      y += 50;
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

      // ------------------------------------------
      // 6️⃣ TABLE SECTION
      // ------------------------------------------
      const tableData = order.Items.map((item: any, i: number) => [
        (i + 1).toString(),
        item.name,
        item.quantity.toString(),
        formatRs(item.price),
        formatRs(item.quantity * item.price),
      ]);

      const minRows = 6;
      while (tableData.length < minRows) {
          tableData.push(["", "", "", "", ""]);
      }

      autoTable(doc, {
        startY: y,
        margin: { bottom: 230 }, 
        head: [["SL.", "Description", "Qty", "Price", "Amount"]],
        body: tableData,
        theme: "plain",
        headStyles: {
          fillColor: oliveDark,
          textColor: "#ffffff",
          fontSize: 11,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: {
          fontSize: 10,
          textColor: textDark,
          cellPadding: 8,
        },
        alternateRowStyles: {
          fillColor: rowHighlight,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 40 },
          1: { halign: "left", cellWidth: 220 },
          2: { halign: "center", cellWidth: 60 },
          3: { halign: "center", cellWidth: 90 },
          4: { halign: "center", cellWidth: 100 },
        },
      });

      // ------------------------------------------
      // 7️⃣ BOTTOM SECTION (Fixed at the bottom)
      // ------------------------------------------
      const summaryY = pageHeight - 210; 
      const summaryX = pageWidth - margin - 220;

      // Left Side: Terms
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(textDark);
      doc.text("Terms and Conditions", margin, summaryY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor("#555555");
      doc.text("1. Goods once sold will not be taken back or exchanged", margin, summaryY + 15);
      doc.text("2. All disputes are subject to jurisdiction only", margin, summaryY + 28);

      // Right Side: Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(textDark);

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

      // Grand Total Box
      doc.setFillColor(oliveDark);
      doc.rect(summaryX - 15, summaryY + 50, 250, 25, "F");
      
      doc.setTextColor("#ffffff");
      doc.setFontSize(12);
      doc.text("Grand Total", summaryX, summaryY + 67);
      doc.text(formatRs(finalPrice), pageWidth - margin, summaryY + 67, { align: "right" });

      // ------------------------------------------
      // 8️⃣ FOOTER (Thank You & Signature)
      // ------------------------------------------
      const footerY = pageHeight - 50;

      // Left Footer
      doc.setFont("times", "bolditalic");
      doc.setFontSize(18);
      doc.setTextColor("#000000");
      doc.text("Thank You & Order Again", margin, footerY - 5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(textDark);
      doc.text("HEALTHY FOOD RESTAURANT", margin, footerY + 10);

      // Facebook
      doc.setFillColor(oliveDark);
      doc.circle(margin + 8, footerY + 25, 8, "F");
      doc.setTextColor("#ffffff");
      doc.setFontSize(12);
      doc.text("f", margin + 6, footerY + 29); 
      
      doc.setTextColor(textDark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Bumba's Kitchen", margin + 22, footerY + 29);

      // Right Footer (Signature Image)
      if (signature) {
          // Format changed to JPEG
          doc.addImage(signature, "JPEG", pageWidth - margin - 120, footerY - 60, 110, 55, "sign", "FAST");
      } else {
          doc.setFont("times", "italic");
          doc.setFontSize(28);
          doc.setTextColor("#333333");
          doc.text("Bumba", pageWidth - margin - 60, footerY - 20, { align: "center" });
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor("#000000");
      doc.text("AUTHORISED SIGNATORY FOR", pageWidth - margin, footerY + 10, { align: "right" });
      
      doc.setFont("helvetica", "normal");
      doc.text("Bumba's Kitchen", pageWidth - margin, footerY + 25, { align: "right" });

      doc.save(`Invoice_${order.OrderNumber}.pdf`);
      
  } catch (error) {
      console.error("PDF Generation Error:", error);
      throw error;
  }
};