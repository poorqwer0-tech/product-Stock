const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();

// ใส่ API Key หรือตั้งผ่าน Firebase Config
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");

exports.generateAILogic = functions.https.onCall(async (data, context) => {
    // 🔒 1. ตรวจสอบว่าผู้ใช้ล็อกอินหรือไม่
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "กรุณาเข้าสู่ระบบก่อนใช้งาน AI");
    }

    const userPrompt = data.prompt;
    const mode = data.mode || "cyberpunk"; // เช่น โหมดเขียนโค้ด, สรุปข้อมูล

    try {
        // 🤖 2. เรียกใช้ Gemini Model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        let systemInstruction = "คุณคือ AI ผู้ช่วยประจำ Sigma Lens Hub สไตล์ Cyberpunk";
        if (mode === "link-summary") {
            systemInstruction = "ช่วยเขียนคำอธิบายสั้นๆ (Bio/Description) สำหรับปุ่มลิงก์สไตล์ Cyberpunk";
        }

        const result = await model.generateContent(`${systemInstruction}\n\nโจทย์: ${userPrompt}`);
        const aiResponse = result.response.text();

        // 💾 3. บันทึก Log การใช้งานลง Firestore
        await db.collection("ai_logs").add({
            userId: context.auth.uid,
            prompt: userPrompt,
            response: aiResponse,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, result: aiResponse };

    } catch (error) {
        throw new functions.https.HttpsError("internal", error.message);
    }
});