import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Info, Camera, Calendar, Phone, CheckCircle2, Loader2, X, Plus, Trash2, MessageCircle } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from "firebase/firestore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ROOMS_DATA, ROOM_NAMES } from "./InteractiveMap";
import { format } from "date-fns";
import { ru, kk } from "date-fns/locale";

const GREEN = "#1b4332";
const GREEN2 = "#2d6a4f";
const SAGE = "#c8ddd2";

interface CleaningRequest {
  id?: string;
  roomId: string;
  roomName: string;
  tenantUid: string;
  tenantName: string;
  phone: string;
  cleaningType: "regular" | "deep";
  area: number;
  basePrice: number;
  extraServices: string[];
  extraPrice: string;
  totalPrice: number;
  photos: string[];
  specialAreas: string;
  scheduledDate: any;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: any;
}

export function CleaningService({ user, userProfile, lang }: { user: any, userProfile: any, lang: 'ru' | 'kk' }) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [cleaningType, setCleaningType] = useState<"regular" | "deep">("regular");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [specialAreas, setSpecialAreas] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState<CleaningRequest[]>([]);

  const t = {
    ru: {
      title: "Заказать клининг",
      selectRoom: "Выберите комнату",
      cleaningType: "Тип уборки",
      regular: "Поддерживающая (от 400₸/м²)",
      deep: "Генеральная (от 800₸/м²)",
      date: "Дата уборки",
      phone: "Рабочий номер телефона",
      specialAreas: "Особые места (где нужна тщательная уборка)",
      photos: "Фото комнаты / проблемных мест",
      extra: "Дополнительные услуги (цена договорная)",
      extraOptions: ["Мытье окон", "Химчистка мебели", "Уборка после ремонта", "Особый подход"],
      priceNote: "Внимание: окончательная цена может измениться в зависимости от степени загрязнения.",
      total: "Предварительная стоимость",
      submit: "Отправить заказ",
      myRequests: "Мои заказы",
      status: "Статус",
      pending: "Ожидает подтверждения",
      approved: "Одобрено",
      rejected: "Отклонено",
      completed: "Завершено",
      noRequests: "У вас пока нет заказов на клининг.",
      area: "Площадь",
      m2: "м²"
    },
    kk: {
      title: "Клинингке тапсырыс беру",
      selectRoom: "Бөлмені таңдаңыз",
      cleaningType: "Тазалау түрі",
      regular: "Қолдау (400₸/м² бастап)",
      deep: "Бас (800₸/м² бастап)",
      date: "Тазалау күні",
      phone: "Жұмыс телефоны",
      specialAreas: "Ерекше орындар (мұқият тазалау қажет жерлер)",
      photos: "Бөлме / проблемалы жерлердің фотосы",
      extra: "Қосымша қызметтер (бағасы келісімді)",
      extraOptions: ["Терезе жуу", "Жиһазды химиялық тазалау", "Жөндеуден кейін тазалау", "Ерекше тәсіл"],
      priceNote: "Назар аударыңыз: соңғы баға ластану дәрежесіне байланысты өзгеруі мүмкін.",
      total: "Алдын ала құны",
      submit: "Тапсырысты жіберу",
      myRequests: "Менің тапсырыстарым",
      status: "Мәртебесі",
      pending: "Растауды күтуде",
      approved: "Мақұлданды",
      rejected: "Қабылданбады",
      completed: "Аяқталды",
      noRequests: "Сізде әлі клинингке тапсырыстар жоқ.",
      area: "Ауданы",
      m2: "м²"
    }
  }[lang];

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "cleaning_requests"), 
      where("tenantUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMyRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CleaningRequest)));
    });
    return () => unsub();
  }, [user]);

  const selectedRoom = ROOMS_DATA.find(r => r.id === selectedRoomId);
  const basePricePerM2 = cleaningType === "regular" ? 400 : 800;
  const totalPrice = selectedRoom ? selectedRoom.area * basePricePerM2 : 0;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const toggleExtra = (service: string) => {
    setExtraServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handleSubmit = async () => {
    if (!selectedRoom || !scheduledDate || !phone) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "cleaning_requests"), {
        roomId: selectedRoom.id,
        roomName: ROOM_NAMES[selectedRoom.id]?.[lang] || selectedRoom.name,
        tenantUid: user.uid,
        tenantName: userProfile?.fullName || user.displayName || "User",
        phone,
        cleaningType,
        area: selectedRoom.area,
        basePrice: totalPrice,
        extraServices,
        extraPrice: "Договорная",
        totalPrice,
        photos,
        specialAreas,
        scheduledDate,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setSelectedRoomId("");
      setPhotos([]);
      setExtraServices([]);
      setSpecialAreas("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "cleaning_requests");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        {/* FORM */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "1.5rem", boxShadow: "0 10px 30px rgba(27,67,50,0.05)" }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: GREEN, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={24} color={GREEN3} /> {t.title}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {/* Room Selection */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: GREEN2, marginBottom: 6, display: "block" }}>{t.selectRoom}</label>
              <select 
                value={selectedRoomId} 
                onChange={(e) => setSelectedRoomId(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e0e0e0", background: "#f9f9f9", fontSize: 14 }}
              >
                <option value="">---</option>
                {ROOMS_DATA.map(r => (
                  <option key={r.id} value={r.id}>{ROOM_NAMES[r.id]?.[lang] || r.name} ({r.area} {t.m2})</option>
                ))}
              </select>
            </div>

            {/* Cleaning Type */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: GREEN2, marginBottom: 8, display: "block" }}>{t.cleaningType}</label>
              <div style={{ display: "flex", gap: 10 }}>
                {(["regular", "deep"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setCleaningType(type)}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${cleaningType === type ? GREEN : "#e0e0e0"}`,
                      background: cleaningType === type ? GREEN : "#fff",
                      color: cleaningType === type ? "#fff" : GREEN,
                      fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "0.2s"
                    }}
                  >
                    {type === "regular" ? t.regular : t.deep}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: GREEN2, marginBottom: 6, display: "block" }}>{t.date}</label>
              <div style={{ position: "relative" }}>
                <DatePicker
                  selected={scheduledDate}
                  onChange={(date) => setScheduledDate(date)}
                  dateFormat="dd.MM.yyyy"
                  locale={lang === 'kk' ? kk : ru}
                  minDate={new Date()}
                  customInput={
                    <input style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e0e0e0", background: "#f9f9f9", fontSize: 14 }} />
                  }
                />
                <Calendar size={18} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: GREEN2, pointerEvents: "none" }} />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: GREEN2, marginBottom: 6, display: "block" }}>{t.phone}</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (___) ___-__-__"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e0e0e0", background: "#f9f9f9", fontSize: 14 }}
              />
            </div>

            {/* Special Areas */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: GREEN2, marginBottom: 6, display: "block" }}>{t.specialAreas}</label>
              <textarea 
                value={specialAreas} 
                onChange={(e) => setSpecialAreas(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e0e0e0", background: "#f9f9f9", fontSize: 14, minHeight: 80, resize: "vertical" }}
              />
            </div>

            {/* Photos */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: GREEN2, marginBottom: 8, display: "block" }}>{t.photos}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                    <img src={p} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ position: "absolute", top: -5, right: -5, background: "#ff4d4d", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label style={{ width: 80, height: 80, borderRadius: 12, border: "2px dashed #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#999" }}>
                  <Plus size={24} />
                  <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            {/* Extra Services */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: GREEN2, marginBottom: 8, display: "block" }}>{t.extra}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {t.extraOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => toggleExtra(opt)}
                    style={{
                      padding: "6px 14px", borderRadius: 100, border: `1px solid ${extraServices.includes(opt) ? GREEN : "#e0e0e0"}`,
                      background: extraServices.includes(opt) ? GREEN : "transparent",
                      color: extraServices.includes(opt) ? "#fff" : GREEN2,
                      fontSize: 12, cursor: "pointer", transition: "0.2s"
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Note */}
            <div style={{ padding: "12px", background: "rgba(27,67,50,0.05)", borderRadius: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Info size={16} color={GREEN2} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: GREEN2, lineHeight: 1.5 }}>{t.priceNote}</p>
            </div>

            {/* Total Price */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderTop: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 14, color: GREEN2 }}>{t.total}</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{totalPrice.toLocaleString()} ₸</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !selectedRoomId || !phone}
              style={{
                width: "100%", padding: "16px", borderRadius: 16, border: "none",
                background: GREEN, color: "#fff", fontSize: 16, fontWeight: 600,
                cursor: (loading || !selectedRoomId || !phone) ? "not-allowed" : "pointer",
                opacity: (loading || !selectedRoomId || !phone) ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10
              }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : success ? <CheckCircle2 size={20} /> : t.submit}
            </button>
          </div>
        </div>

        {/* MY REQUESTS */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "1.5rem", boxShadow: "0 10px 30px rgba(27,67,50,0.05)" }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: GREEN, marginBottom: "1.5rem" }}>{t.myRequests}</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {myRequests.length === 0 ? (
              <p style={{ fontSize: 14, color: "#999", textAlign: "center", padding: "2rem 0" }}>{t.noRequests}</p>
            ) : (
              myRequests.map(req => (
                <div key={req.id} style={{ padding: "1rem", borderRadius: 16, border: "1px solid #f0f0f0", background: "#fcfcfc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: GREEN }}>{req.roomName}</div>
                      <div style={{ fontSize: 12, color: "#999" }}>{format(req.scheduledDate?.toDate?.() || new Date(req.scheduledDate), "dd.MM.yyyy")}</div>
                    </div>
                    <div style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 100, fontWeight: 600,
                      background: req.status === 'pending' ? "#fff4e6" : req.status === 'approved' ? "#ebfbee" : req.status === 'rejected' ? "#fff5f5" : "#f1f3f5",
                      color: req.status === 'pending' ? "#d9480f" : req.status === 'approved' ? "#2b8a3e" : req.status === 'rejected' ? "#c92a2a" : "#495057"
                    }}>
                      {t[req.status]}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: GREEN2 }}>{req.totalPrice.toLocaleString()} ₸</div>
                    {req.status === 'approved' && (
                      <button style={{ background: "none", border: "none", color: GREEN, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500 }}>
                        <MessageCircle size={16} /> Чат
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const GREEN3 = "#40916c";
