import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ตรวจสอบสถานะผู้ใช้เพื่อเปิด/ปิด หน้า Login[cite: 8, 10]
onAuthStateChanged(auth, (user) => {
    const loginScreen = document.getElementById('login-screen');
    const adminDashboard = document.getElementById('admin-dashboard');

    if (user) {
        if (loginScreen) loginScreen.classList.add('hidden');
        if (adminDashboard) adminDashboard.classList.remove('hidden');
        document.getElementById('current-user').innerText = user.email;
        loadLinksList();
    } else {
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (adminDashboard) adminDashboard.classList.add('hidden');
    }
});

// ฟอร์มเข้าสู่ระบบ / สมัครสมาชิกใน admin.html
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('username').value; // ใช้อีเมล
        const passwordInput = document.getElementById('password').value;

        try {
            // ลองเข้าสู่ระบบ
            await signInWithEmailAndPassword(auth, emailInput, passwordInput);
            alert("เข้าสู่ระบบสำเร็จ!");
        } catch (error) {
            // หากไม่พบบัญชี ลองสร้างบัญชีใหม่ให้อัตโนมัติ (หรือจะแยกปุ่มสมัครได้)
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                try {
                    await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
                    alert("สร้างบัญชีใหม่และเข้าสู่ระบบสำเร็จ!");
                } catch (regError) {
                    if (regError.code === 'auth/email-already-in-use') {
                        alert("❌ อีเมลนี้ถูกใช้งานแล้ว แต่รหัสผ่านไม่ถูกต้อง");
                    } else {
                        alert("❌ ข้อผิดพลาด: " + regError.message);
                    }
                }
            } else {
                alert("❌ เข้าสู่ระบบไม่สำเร็จ: " + error.message);
            }
        }
    });
}

// ปุ่ม ออกจากระบบ[cite: 8, 10]
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => alert("ออกจากระบบเรียบร้อย"));
    });
}

// ระบบเพิ่มลิงก์ใหม่ลง Firestore DB[cite: 8, 10]
const addLinkForm = document.getElementById('add-link-form');
if (addLinkForm) {
    addLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('form-title').value;
        const url = document.getElementById('form-url').value;
        const category = document.getElementById('form-category').value;
        const icon = document.getElementById('form-icon').value;
        const description = document.getElementById('form-description').value;

        try {
            await addDoc(collection(db, "links"), {
                title, url, category, icon_url: icon, description,
                clicks: 0,
                created_at: new Date().toISOString()
            });
            alert("เพิ่มลิงก์เรียบร้อย!");
            addLinkForm.reset();
            loadLinksList();
        } catch (err) {
            alert("เกิดข้อผิดพลาด: " + err.message);
        }
    });
}

// ดึงรายการลิงก์มาแสดงในตาราง Admin[cite: 8, 10]
async function loadLinksList() {
    const listBody = document.getElementById('links-list');
    if (!listBody) return;
    listBody.innerHTML = '';

    const querySnapshot = await getDocs(collection(db, "links"));
    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${data.icon_url || '🔗'}</td>
            <td><strong>${data.title}</strong></td>
            <td><a href="${data.url}" target="_blank" style="color:#00d9ff">${data.url}</a></td>
            <td>${data.category || '-'}</td>
            <td>${data.clicks || 0}</td>
            <td>${data.created_at ? data.created_at.split('T')[0] : '-'}</td>
            <td><button onclick="deleteLink('${id}')" style="background:#ff4757;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;">ลบ</button></td>
        `;
        listBody.appendChild(tr);
    });
}

window.deleteLink = async (id) => {
    if (confirm("ยืนยันการลบลิงก์นี้?")) {
        await deleteDoc(doc(db, "links", id));
        loadLinksList();
    }
};