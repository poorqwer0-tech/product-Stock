import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// ฟังก์ชันสำหรับเรียก AI
export async function askSigmaAI(promptText, mode = "cyberpunk") {
    const generateAILogic = httpsCallable(functions, 'generateAILogic');
    
    try {
        const response = await generateAILogic({ prompt: promptText, mode: mode });
        return response.data.result;
    } catch (error) {
        console.error("AI Error:", error);
        return "❌ เกิดข้อผิดพลาดในการประมวลผล AI";
    }
}