import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { DollarSign, Check, X, User, Loader2, TrendingUp, Users, Calendar, Wrench, AlertCircle, Clock, Plus, Trash2, Edit2, Filter, Download, Search, Building2, Briefcase, Wallet, Phone, Sparkles, CheckCircle2 } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDocs, where, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, startOfYear, endOfYear, addDays, isAfter } from "date-fns";

const GREEN = "#1b4332";
const GREEN2 = "#2d6a4f";
const SAGE = "#c8ddd2";

const ADMIN_TRANSLATIONS = {
  ru: {
    title: "SUIINBAI 126 | CRM & ERP",
    dashboard: "Дашборд",
    bookings: "Бронирования",
    rooms: "Помещения",
    staff: "Персонал",
    maintenance: "Обслуживание",
    expenses: "Расходы",
    totalRevenue: "Общая выручка",
    occupancyRate: "Заполняемость",
    activeBookings: "Активные брони",
    roi: "Окупаемость (ROI)",
    revenueChart: "Динамика выручки (₸)",
    pendingBookings: "Заявки на бронирование",
    approve: "Одобрить",
    reject: "Отклонить",
    add: "Добавить",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    room: "Помещение",
    tenant: "Жилец",
    dates: "Даты",
    amount: "Сумма",
    status: "Статус",
    name: "Имя",
    role: "Роль",
    phone: "Телефон",
    category: "Категория",
    description: "Описание",
    date: "Дата",
    noData: "Нет данных для отображения",
    noPending: "Нет новых заявок",
    actions: "Действия",
    statusPending: "Ожидает",
    statusActive: "Активно",
    statusRejected: "Отклонено",
    statusCompleted: "Завершено",
    cleaning: "Клининг",
    users: "Пользователи",
    type: "Тип",
    total: "Итого",
    changeRole: "Сменить роль",
    deleteUser: "Удалить пользователя",
    confirmDelete: "Вы уверены, что хотите удалить?",
    noCleaning: "Нет заявок на клининг",
    noUsers: "Пользователи не найдены",
    regular: "Поддерживающая",
    deep: "Генеральная",
    scheduled: "Запланировано",
    completed: "Завершено",
    approved: "Одобрено",
    rejected: "Отклонено",
    price: "Цена",
    extraServices: "Доп. услуги",
    specialAreas: "Особые места",
    photos: "Фотографии",
    savePrice: "Сохранить цену",
    typeRentable: "Аренда",
    typeCommon: "Общее",
    statusAvailable: "Свободно",
    statusOccupied: "Занято",
    statusMaintenance: "Ремонт",
    expUtility: "Коммунальные",
    expMaint: "Ремонт",
    expStaff: "Зарплаты",
    expMarketing: "Маркетинг",
    expOther: "Прочее"
  },
  kk: {
    title: "SUIINBAI 126 | CRM & ERP",
    dashboard: "Дашборд",
    bookings: "Брондау",
    rooms: "Бөлмелер",
    staff: "Персонал",
    maintenance: "Қызмет көрсету",
    expenses: "Шығындар",
    totalRevenue: "Жалпы табыс",
    occupancyRate: "Толу деңгейі",
    activeBookings: "Белсенді брондаулар",
    roi: "Өзін-өзі ақтау (ROI)",
    revenueChart: "Табыс динамикасы (₸)",
    pendingBookings: "Брондауға өтінімдер",
    approve: "Мақұлдау",
    reject: "Бас тарту",
    add: "Қосу",
    save: "Сақтау",
    cancel: "Болдырмау",
    delete: "Өшіру",
    room: "Бөлме",
    tenant: "Тұрғын",
    dates: "Күндер",
    amount: "Сомасы",
    status: "Мәртебесі",
    name: "Аты",
    role: "Рөл",
    phone: "Телефон",
    category: "Санат",
    description: "Сипаттама",
    date: "Күні",
    noData: "Көрсетілетін деректер жоқ",
    noPending: "Жаңа өтінімдер жоқ",
    actions: "Әрекеттер",
    statusPending: "Күтуде",
    statusActive: "Белсенді",
    statusRejected: "Бас тартылды",
    statusCompleted: "Аяқталды",
    cleaning: "Клининг",
    users: "Пайдаланушылар",
    type: "Түрі",
    total: "Барлығы",
    changeRole: "Рөлді өзгерту",
    deleteUser: "Пайдаланушыны жою",
    confirmDelete: "Сенімдісіз бе?",
    noCleaning: "Тазалауға өтінімдер жоқ",
    noUsers: "Пайдаланушылар табылмады",
    regular: "Күнделікті",
    deep: "Бас тазалау",
    scheduled: "Жоспарланған",
    completed: "Аяқталды",
    approved: "Мақұлданды",
    rejected: "Бас тартылды",
    price: "Бағасы",
    extraServices: "Қосымша қызметтер",
    specialAreas: "Ерекше орындар",
    photos: "Фотосуреттер",
    savePrice: "Бағаны сақтау",
    typeRentable: "Жалға беру",
    typeCommon: "Ортақ",
    statusAvailable: "Бос",
    statusOccupied: "Бос емес",
    statusMaintenance: "Жөндеу",
    expUtility: "Коммуналдық",
    expMaint: "Жөндеу",
    expStaff: "Жалақы",
    expMarketing: "Маркетинг",
    expOther: "Басқа"
  }
};

type Tab = "dashboard" | "bookings" | "rooms" | "staff" | "maintenance" | "expenses" | "cleaning" | "users";

export function AdminERP({ lang = 'ru' }: { lang?: 'ru' | 'kk' }) {
  const t = ADMIN_TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [cleaningRequests, setCleaningRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [negotiationBooking, setNegotiationBooking] = useState<any>(null);
  const [negotiationPrice, setNegotiationPrice] = useState(0);
  const [negotiationDeadline, setNegotiationDeadline] = useState(addDays(new Date(), 3));
  const [negotiationComment, setNegotiationComment] = useState("");

  // Form States
  const [roomForm, setRoomForm] = useState({ name: "", area: 0, price: 0, status: "available", type: "rentable" });
  const [staffForm, setStaffForm] = useState({ name: "", role: "cleaner", status: "active", phone: "", email: "" });
  const [expenseForm, setExpenseForm] = useState({ category: "utility", amount: 0, description: "", date: format(new Date(), "yyyy-MM-dd") });
  const [maintForm, setMaintForm] = useState({ roomId: "", description: "", status: "scheduled", scheduledDate: format(new Date(), "yyyy-MM-dd"), cost: 0 });

  useEffect(() => {
    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      setBookings(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    const unsubRooms = onSnapshot(collection(db, "rooms"), (snap) => {
      setRooms(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    const unsubMaint = onSnapshot(collection(db, "maintenance"), (snap) => {
      setMaintenance(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    const unsubStaff = onSnapshot(collection(db, "staff"), (snap) => {
      setStaff(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    const unsubExpenses = onSnapshot(collection(db, "expenses"), (snap) => {
      setExpenses(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    const unsubCleaning = onSnapshot(collection(db, "cleaning_requests"), (snap) => {
      setCleaningRequests(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    return () => {
      unsubBookings(); unsubRooms(); unsubMaint(); unsubStaff(); unsubExpenses(); unsubCleaning(); unsubUsers();
    };
  }, []);

  // Analytics Calculations
  const totalRevenue = bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netIncome = totalRevenue - totalExpenses;
  const activeBookingsCount = bookings.filter(b => b.status === "active").length;
  const occupancyRate = rooms.length > 0 ? (activeBookingsCount / rooms.filter(r => r.type === "rentable").length) * 100 : 0;
  const roi = ((netIncome / 150000000) * 100).toFixed(2); // Assuming 150M KZT property value

  // Charts Data
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(monthDate);
    const rev = bookings
      .filter(b => {
        const d = b.startDate?.toDate?.() || new Date(b.startDate);
        return isWithinInterval(d, { start: mStart, end: mEnd });
      })
      .reduce((acc, b) => acc + (b.totalPrice || 0), 0);
    const exp = expenses
      .filter(e => {
        const d = e.date?.toDate?.() || new Date(e.date);
        return isWithinInterval(d, { start: mStart, end: mEnd });
      })
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    
    return { name: format(monthDate, "MMM"), revenue: rev, expense: exp, profit: rev - exp };
  });

  const handleApprove = async (booking: any) => {
    setNegotiationBooking(booking);
    setNegotiationPrice(booking.totalPrice);
    setNegotiationDeadline(addDays(new Date(), 3));
    setNegotiationComment("");
  };

  const finalizeApproval = async () => {
    if (!negotiationBooking) return;
    setLoading(negotiationBooking.id);
    try {
      await updateDoc(doc(db, "bookings", negotiationBooking.id), { 
        status: "active", 
        totalPrice: negotiationPrice,
        paymentDeadline: negotiationDeadline,
        adminComment: negotiationComment,
        updatedAt: serverTimestamp() 
      });
      
      const roomRef = doc(db, "rooms", negotiationBooking.roomId);
      await updateDoc(roomRef, { 
        status: "occupied", 
        currentTenantUid: negotiationBooking.tenantUid, 
        currentTenantEmail: negotiationBooking.tenantEmail,
        updatedAt: serverTimestamp() 
      });
      setNegotiationBooking(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "bookings");
    } finally {
      setLoading(null);
    }
  };

  const handleAction = async (collectionName: string, action: "add" | "delete" | "update", data?: any, id?: string) => {
    setLoading("action");
    try {
      if (action === "add") await addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp() });
      if (action === "delete" && id) await deleteDoc(doc(db, collectionName, id));
      if (action === "update" && id) await updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionName);
    } finally {
      setLoading(null);
    }
  };

  const renderDashboard = () => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
        <StatCard icon={<TrendingUp size={24} />} label={t.totalRevenue} value={`${totalRevenue.toLocaleString()} ₸`} trend="+12.5%" />
        <StatCard icon={<Users size={24} />} label={t.occupancyRate} value={`${occupancyRate.toFixed(1)}%`} trend="Стабильно" />
        <StatCard icon={<Calendar size={24} />} label={t.activeBookings} value={activeBookingsCount.toString()} trend="+2 за неделю" />
        <StatCard icon={<DollarSign size={24} />} label={t.roi} value={`${roi}%`} trend="Выше рынка" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(450px, 1fr))", gap: 24, marginBottom: 32 }}>
        <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: GREEN, marginBottom: 20 }}>{t.revenueChart}</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#999", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#999", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} />
                <Area type="monotone" dataKey="revenue" stroke={GREEN} fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" stroke="#e63946" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: GREEN, marginBottom: 20 }}>{t.pendingBookings}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bookings.filter(b => b.status === "pending" || b.status === "pending_review").map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, borderRadius: 20, background: "#fcfdfc", border: "1px solid #f0f3f1" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(27,67,50,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}>
                  <User size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: GREEN }}>{b.roomName}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{b.tenantEmail}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: b.status === "pending_review" ? "#f39c12" : GREEN }}>
                    {b.status === "pending_review" ? "НА ПРОВЕРКЕ" : "НОВАЯ"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleAction("bookings", "update", { status: "rejected" }, b.id)} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "rgba(230,57,70,0.1)", color: "#e63946", cursor: "pointer" }}><X size={18} /></button>
                  <button onClick={() => handleApprove(b)} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: GREEN, color: "#fff", cursor: "pointer" }}><Check size={18} /></button>
                </div>
              </div>
            ))}
            {bookings.filter(b => b.status === "pending" || b.status === "pending_review").length === 0 && <div style={{ textAlign: "center", color: "#999", padding: 40 }}>{t.noPending}</div>}
          </div>
        </div>
      </div>
    </>
  );

  const renderRooms = () => (
    <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{t.rooms}</h3>
        <button onClick={() => setIsAdding(true)} style={{ background: GREEN, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Plus size={18} /> {t.add}
        </button>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {rooms.map(room => (
          <div key={room.id} style={{ padding: 20, borderRadius: 20, border: "1px solid #eee", background: room.status === "occupied" ? "rgba(27,67,50,0.02)" : "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(27,67,50,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}>
                <Building2 size={24} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: room.status === "available" ? "rgba(45,106,79,0.1)" : "rgba(0,0,0,0.05)", color: room.status === "available" ? GREEN2 : "#666" }}>
                {room.status.toUpperCase()}
              </span>
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: GREEN, marginBottom: 4 }}>{room.name}</h4>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>{room.area} m² • {room.type === "rentable" ? t.typeRentable : t.typeCommon}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: GREEN2 }}>{room.price.toLocaleString()} ₸</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleAction("rooms", "delete", undefined, room.id)} style={{ border: "none", background: "none", color: "#e63946", cursor: "pointer" }}><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <Modal onClose={() => setIsAdding(false)} title={t.add + " " + t.room}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label={t.name} value={roomForm.name} onChange={v => setRoomForm({...roomForm, name: v})} />
              <div style={{ display: "flex", gap: 16 }}>
                <Input label="Area (m²)" type="number" value={roomForm.area.toString()} onChange={v => setRoomForm({...roomForm, area: Number(v)})} />
                <Input label="Price (₸)" type="number" value={roomForm.price.toString()} onChange={v => setRoomForm({...roomForm, price: Number(v)})} />
              </div>
              <Select label={t.status} value={roomForm.status} options={[{v:"available", l:t.statusAvailable}, {v:"occupied", l:t.statusOccupied}, {v:"maintenance", l:t.statusMaintenance}]} onChange={v => setRoomForm({...roomForm, status: v})} />
              <Select label="Type" value={roomForm.type} options={[{v:"rentable", l:t.typeRentable}, {v:"common", l:t.typeCommon}]} onChange={v => setRoomForm({...roomForm, type: v})} />
              <button onClick={() => handleAction("rooms", "add", roomForm)} style={{ background: GREEN, color: "#fff", border: "none", padding: 14, borderRadius: 12, fontWeight: 600, marginTop: 10 }}>{t.save}</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );

  const renderExpenses = () => (
    <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{t.expenses}</h3>
        <button onClick={() => setIsAdding(true)} style={{ background: GREEN, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Plus size={18} /> {t.add}
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <th style={{ textAlign: "left", padding: 16, color: "#999", fontSize: 12 }}>{t.category}</th>
              <th style={{ textAlign: "left", padding: 16, color: "#999", fontSize: 12 }}>{t.description}</th>
              <th style={{ textAlign: "left", padding: 16, color: "#999", fontSize: 12 }}>{t.date}</th>
              <th style={{ textAlign: "right", padding: 16, color: "#999", fontSize: 12 }}>{t.amount}</th>
              <th style={{ textAlign: "right", padding: 16, color: "#999", fontSize: 12 }}>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => (
              <tr key={exp.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                <td style={{ padding: 16 }}><span style={{ padding: "4px 10px", borderRadius: 100, background: "rgba(0,0,0,0.05)", fontSize: 12 }}>{exp.category}</span></td>
                <td style={{ padding: 16, fontSize: 14, color: GREEN }}>{exp.description}</td>
                <td style={{ padding: 16, fontSize: 14, color: "#666" }}>{exp.date}</td>
                <td style={{ padding: 16, fontSize: 14, fontWeight: 700, color: "#e63946", textAlign: "right" }}>-{exp.amount.toLocaleString()} ₸</td>
                <td style={{ padding: 16, textAlign: "right" }}>
                  <button onClick={() => handleAction("expenses", "delete", undefined, exp.id)} style={{ border: "none", background: "none", color: "#999", cursor: "pointer" }}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isAdding && (
          <Modal onClose={() => setIsAdding(false)} title={t.add + " " + t.expenses}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Select label={t.category} value={expenseForm.category} options={[{v:"utility", l:t.expUtility}, {v:"maintenance", l:t.expMaint}, {v:"staff", l:t.expStaff}, {v:"marketing", l:t.expMarketing}, {v:"other", l:t.expOther}]} onChange={v => setExpenseForm({...expenseForm, category: v})} />
              <Input label={t.amount} type="number" value={expenseForm.amount.toString()} onChange={v => setExpenseForm({...expenseForm, amount: Number(v)})} />
              <Input label={t.description} value={expenseForm.description} onChange={v => setExpenseForm({...expenseForm, description: v})} />
              <Input label={t.date} type="date" value={expenseForm.date} onChange={v => setExpenseForm({...expenseForm, date: v})} />
              <button onClick={() => handleAction("expenses", "add", expenseForm)} style={{ background: GREEN, color: "#fff", border: "none", padding: 14, borderRadius: 12, fontWeight: 600, marginTop: 10 }}>{t.save}</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? 12 : 24, background: "#f8faf9", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: GREEN, marginBottom: 8 }}>{t.title}</h1>
          <p style={{ color: "#666", fontSize: 13 }}>{lang === 'kk' ? "Нақты уақыттағы терең талдау және нысанды басқару" : "Глубокая аналитика и управление объектом в реальном времени"}</p>
        </div>
        <div style={{ display: "flex", gap: 8, background: "#fff", padding: 4, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", overflowX: "auto", maxWidth: "100%", width: isMobile ? "100%" : "auto" }}>
          {(["dashboard", "bookings", "rooms", "staff", "maintenance", "expenses", "cleaning", "users"] as Tab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                border: "none", padding: isMobile ? "8px 12px" : "10px 16px", borderRadius: 10, fontSize: isMobile ? 11 : 13, fontWeight: 600, cursor: "pointer",
                background: activeTab === tab ? GREEN : "transparent",
                color: activeTab === tab ? "#fff" : "#666",
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
            >
              {t[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "rooms" && renderRooms()}
        {activeTab === "expenses" && renderExpenses()}
        {activeTab === "cleaning" && (
          <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN, marginBottom: 24 }}>{t.cleaning}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {cleaningRequests.map(req => (
                <div key={req.id} style={{ padding: 20, borderRadius: 20, border: "1px solid #eee", background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: GREEN }}>{req.roomName}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{req.tenantEmail} • {req.cleaningDate}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: req.status === "completed" ? "rgba(45,106,79,0.1)" : "rgba(0,0,0,0.05)", color: req.status === "completed" ? GREEN2 : "#666" }}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
                    {req.cleaningType === "regular" ? "Поддерживающая" : "Генеральная"} • {req.area} м² • {req.totalPrice.toLocaleString()} ₸
                  </div>
                  {req.specialInstructions && (
                    <div style={{ fontSize: 13, background: "#f9f9f9", padding: 12, borderRadius: 12, marginBottom: 12 }}>
                      <strong>Особые места:</strong> {req.specialInstructions}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    {req.status === "pending" && (
                      <>
                        <button onClick={() => handleAction("cleaning_requests", "update", { status: "approved" }, req.id)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: GREEN, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Одобрить</button>
                        <button onClick={() => handleAction("cleaning_requests", "update", { status: "rejected" }, req.id)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "rgba(230,57,70,0.1)", color: "#e63946", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Отклонить</button>
                      </>
                    )}
                    {req.status === "approved" && (
                      <button onClick={() => handleAction("cleaning_requests", "update", { status: "completed" }, req.id)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: GREEN2, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Завершить</button>
                    )}
                  </div>
                </div>
              ))}
              {cleaningRequests.length === 0 && <div style={{ textAlign: "center", color: "#999", padding: 40 }}>Нет заявок на клининг</div>}
            </div>
          </div>
        )}
        {activeTab === "users" && (
          <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN, marginBottom: 24 }}>{t.users}</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <th style={{ textAlign: "left", padding: 16, color: "#999", fontSize: 12 }}>{t.name}</th>
                    <th style={{ textAlign: "left", padding: 16, color: "#999", fontSize: 12 }}>Email</th>
                    <th style={{ textAlign: "left", padding: 16, color: "#999", fontSize: 12 }}>{t.role}</th>
                    <th style={{ textAlign: "right", padding: 16, color: "#999", fontSize: 12 }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                      <td style={{ padding: 16, fontSize: 14, fontWeight: 600, color: GREEN }}>{u.fullName}</td>
                      <td style={{ padding: 16, fontSize: 14, color: "#666" }}>{u.email}</td>
                      <td style={{ padding: 16 }}>
                        <select 
                          value={u.role || "tenant"} 
                          onChange={(e) => handleAction("users", "update", { role: e.target.value }, u.id)}
                          style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #eee", fontSize: 12 }}
                        >
                          <option value="tenant">Tenant</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: 16, textAlign: "right" }}>
                        <button onClick={() => handleAction("users", "delete", undefined, u.id)} style={{ border: "none", background: "none", color: "#e63946", cursor: "pointer" }}><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "bookings" && (
          <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN, marginBottom: 24 }}>{t.bookings}</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <th style={{ textAlign: "left", padding: 16, color: "#999", fontSize: 12 }}>{t.room}</th>
                    <th style={{ textAlign: "left", padding: 16, color: "#999", fontSize: 12 }}>{t.tenant}</th>
                    <th style={{ textAlign: "left", padding: 16, color: "#999", fontSize: 12 }}>{t.dates}</th>
                    <th style={{ textAlign: "left", padding: 16, color: "#999", fontSize: 12 }}>{t.status}</th>
                    <th style={{ textAlign: "right", padding: 16, color: "#999", fontSize: 12 }}>{t.amount}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                      <td style={{ padding: 16, fontSize: 14, fontWeight: 600, color: GREEN }}>{b.roomName}</td>
                      <td style={{ padding: 16, fontSize: 14, color: "#666" }}>{b.tenantEmail}</td>
                      <td style={{ padding: 16, fontSize: 14, color: "#666" }}>
                        <div>{format(b.startDate?.toDate?.() || new Date(b.startDate), "dd.MM.yy")} - {format(b.endDate?.toDate?.() || new Date(b.endDate), "dd.MM.yy")}</div>
                        {b.paymentDeadline && (
                          <div style={{ fontSize: 11, color: isAfter(new Date(), b.paymentDeadline?.toDate?.() || new Date(b.paymentDeadline)) ? "#e63946" : "#999", marginTop: 4 }}>
                            Срок: {format(b.paymentDeadline?.toDate?.() || new Date(b.paymentDeadline), "dd.MM.yy")}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: b.status === "active" ? "rgba(45,106,79,0.1)" : "rgba(0,0,0,0.05)", color: b.status === "active" ? GREEN2 : "#666", width: "fit-content" }}>
                            {b.status.toUpperCase()}
                          </span>
                          <span style={{ padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: b.paymentStatus === "paid" ? "rgba(45,106,79,0.1)" : "rgba(230,57,70,0.1)", color: b.paymentStatus === "paid" ? GREEN2 : "#e63946", width: "fit-content" }}>
                            {b.paymentStatus === "paid" ? "ОПЛАЧЕНО" : "НЕ ОПЛАЧЕНО"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: 16, fontSize: 14, fontWeight: 700, color: GREEN, textAlign: "right" }}>
                        <div>{b.totalPrice?.toLocaleString()} ₸</div>
                        {b.originalPrice && b.originalPrice !== b.totalPrice && (
                          <div style={{ fontSize: 11, color: "#999", textDecoration: "line-through" }}>{b.originalPrice.toLocaleString()} ₸</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "staff" && (
          <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{t.staff}</h3>
              <button onClick={() => setIsAdding(true)} style={{ background: GREEN, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <Plus size={18} /> {t.add}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {staff.map(s => (
                <div key={s.id} style={{ padding: 20, borderRadius: 20, border: "1px solid #eee", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(27,67,50,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}>
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: GREEN }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "#999" }}>{s.role}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}><Phone size={12} style={{ marginRight: 6 }}/> {s.phone}</div>
                  <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}><AlertCircle size={12} style={{ marginRight: 6 }}/> {s.status}</div>
                  <button onClick={() => handleAction("staff", "delete", undefined, s.id)} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #fee2e2", background: "#fff", color: "#e63946", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.delete}</button>
                </div>
              ))}
            </div>
            <AnimatePresence>
              {isAdding && (
                <Modal onClose={() => setIsAdding(false)} title={t.add + " " + t.staff}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Input label={t.name} value={staffForm.name} onChange={v => setStaffForm({...staffForm, name: v})} />
                    <Select label={t.role} value={staffForm.role} options={[{v:"cleaner", l:"Cleaner"}, {v:"security", l:"Security"}, {v:"manager", l:"Manager"}, {v:"technician", l:"Technician"}]} onChange={v => setStaffForm({...staffForm, role: v})} />
                    <Input label={t.phone} value={staffForm.phone} onChange={v => setStaffForm({...staffForm, phone: v})} />
                    <Input label="Email" value={staffForm.email} onChange={v => setStaffForm({...staffForm, email: v})} />
                    <button onClick={() => handleAction("staff", "add", staffForm)} style={{ background: GREEN, color: "#fff", border: "none", padding: 14, borderRadius: 12, fontWeight: 600, marginTop: 10 }}>{t.save}</button>
                  </div>
                </Modal>
              )}
            </AnimatePresence>
          </div>
        )}
        {activeTab === "maintenance" && (
          <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{t.maintenance}</h3>
              <button onClick={() => setIsAdding(true)} style={{ background: GREEN, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <Plus size={18} /> {t.add}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {maintenance.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, borderRadius: 20, background: "#fcfdfc", border: "1px solid #f0f3f1" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(230,57,70,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#e63946" }}>
                    <Wrench size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: GREEN }}>{m.roomName || "Room " + m.roomId}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{m.description}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>{m.scheduledDate}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>{m.status}</div>
                  </div>
                  <button onClick={() => handleAction("maintenance", "delete", undefined, m.id)} style={{ border: "none", background: "none", color: "#999", cursor: "pointer" }}><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
            <AnimatePresence>
              {isAdding && (
                <Modal onClose={() => setIsAdding(false)} title={t.add + " " + t.maintenance}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Select label={t.room} value={maintForm.roomId} options={rooms.map(r => ({v:r.id, l:r.name}))} onChange={v => setMaintForm({...maintForm, roomId: v})} />
                    <Input label={t.description} value={maintForm.description} onChange={v => setMaintForm({...maintForm, description: v})} />
                    <Input label={t.date} type="date" value={maintForm.scheduledDate} onChange={v => setMaintForm({...maintForm, scheduledDate: v})} />
                    <Input label="Cost (₸)" type="number" value={maintForm.cost.toString()} onChange={v => setMaintForm({...maintForm, cost: Number(v)})} />
                    <button onClick={() => {
                      const room = rooms.find(r => r.id === maintForm.roomId);
                      handleAction("maintenance", "add", { ...maintForm, roomName: room?.name });
                    }} style={{ background: GREEN, color: "#fff", border: "none", padding: 14, borderRadius: 12, fontWeight: 600, marginTop: 10 }}>{t.save}</button>
                  </div>
                </Modal>
              )}
            </AnimatePresence>
          </div>
        )}
        {activeTab === "cleaning" && (
          <div style={{ background: "#fff", borderRadius: 32, padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{t.cleaning}</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {cleaningRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>{t.noCleaning}</div>
              ) : (
                cleaningRequests.map(req => (
                  <div key={req.id} style={{ padding: 24, borderRadius: 24, border: "1px solid #eee", display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(27,67,50,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}>
                          <Sparkles size={24} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 18, color: GREEN }}>{req.roomName}</div>
                          <div style={{ fontSize: 14, color: "#666" }}>{req.tenantName} • {req.phone}</div>
                          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                            {t[req.cleaningType]} • {req.area} м²
                          </div>
                          <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginTop: 4 }}>
                            {req.scheduledDate?.toDate ? format(req.scheduledDate.toDate(), "dd.MM.yyyy HH:mm") : ""}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: req.status === "completed" ? "rgba(45,106,79,0.1)" : req.status === "pending" ? "rgba(243,156,18,0.1)" : "rgba(230,57,70,0.1)", color: req.status === "completed" ? GREEN2 : req.status === "pending" ? "#f39c12" : "#e63946" }}>
                          {t[req.status] || req.status}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {req.status === "pending" && (
                            <>
                              <button onClick={() => handleAction("cleaning_requests", "update", { status: "approved" }, req.id)} style={{ padding: 8, borderRadius: 10, border: "none", background: "rgba(45,106,79,0.1)", color: GREEN2, cursor: "pointer" }}><Check size={18}/></button>
                              <button onClick={() => handleAction("cleaning_requests", "update", { status: "rejected" }, req.id)} style={{ padding: 8, borderRadius: 10, border: "none", background: "rgba(230,57,70,0.1)", color: "#e63946", cursor: "pointer" }}><X size={18}/></button>
                            </>
                          )}
                          {req.status === "approved" && (
                            <button onClick={() => handleAction("cleaning_requests", "update", { status: "completed" }, req.id)} style={{ padding: 8, borderRadius: 10, border: "none", background: GREEN, color: "#fff", cursor: "pointer" }}><CheckCircle2 size={18}/></button>
                          )}
                          <button onClick={() => { if(confirm(t.confirmDelete)) handleAction("cleaning_requests", "delete", null, req.id)}} style={{ padding: 8, borderRadius: 10, border: "none", background: "rgba(0,0,0,0.05)", color: "#666", cursor: "pointer" }}><Trash2 size={18}/></button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: 20, background: "#fcfdfc", borderRadius: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#999", marginBottom: 8 }}>{t.extraServices}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {req.extraServices?.length > 0 ? req.extraServices.map((s: string) => (
                            <span key={s} style={{ fontSize: 11, padding: "4px 8px", background: "rgba(27,67,50,0.05)", color: GREEN, borderRadius: 6 }}>{s}</span>
                          )) : <span style={{ fontSize: 11, color: "#ccc" }}>—</span>}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#999", marginTop: 16, marginBottom: 8 }}>{t.specialAreas}</div>
                        <div style={{ fontSize: 13, color: GREEN }}>{req.specialAreas || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#999", marginBottom: 8 }}>{t.price}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input 
                            type="number" 
                            defaultValue={req.totalPrice} 
                            onBlur={(e) => {
                              const newPrice = Number(e.target.value);
                              if (newPrice !== req.totalPrice) {
                                handleAction("cleaning_requests", "update", { totalPrice: newPrice }, req.id);
                              }
                            }}
                            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #eee", width: 120, fontSize: 14, fontWeight: 700, color: GREEN }}
                          />
                          <span style={{ fontWeight: 700, color: GREEN }}>₸</span>
                        </div>
                        {req.photos?.length > 0 && (
                          <>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#999", marginTop: 16, marginBottom: 8 }}>{t.photos} ({req.photos.length})</div>
                            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                              {req.photos.map((p: string, idx: number) => (
                                <img 
                                  key={idx} 
                                  src={p} 
                                  alt="Cleaning" 
                                  referrerPolicy="no-referrer"
                                  style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", cursor: "pointer", border: "1px solid #eee" }}
                                  onClick={() => window.open(p, '_blank')}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div style={{ background: "#fff", borderRadius: 32, padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{t.users}</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {users.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>{t.noUsers}</div>
              ) : (
                users.map(u => (
                  <div key={u.id} style={{ padding: 24, borderRadius: 24, border: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(27,67,50,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}>
                        <User size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: GREEN }}>{u.fullName || u.displayName || "No Name"}</div>
                        <div style={{ fontSize: 14, color: "#666" }}>{u.email} • {u.phone || "No Phone"}</div>
                        <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                          {t.role}: <span style={{ fontWeight: 700, color: GREEN2 }}>{u.role || "user"}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <Select 
                        label="" 
                        value={u.role || "user"} 
                        options={[
                          {v: "user", l: "User"},
                          {v: "tenant", l: "Tenant"},
                          {v: "admin", l: "Admin"}
                        ]} 
                        onChange={(newRole) => handleAction("users", "update", { role: newRole }, u.id)} 
                      />
                      <button onClick={() => { if(confirm(t.confirmDelete)) handleAction("users", "delete", null, u.id)}} style={{ padding: 12, borderRadius: 12, border: "none", background: "rgba(230,57,70,0.1)", color: "#e63946", cursor: "pointer" }}><Trash2 size={20}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {negotiationBooking && (
          <Modal title="Согласование бронирования" onClose={() => setNegotiationBooking(null)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ padding: 16, borderRadius: 16, background: "rgba(27,67,50,0.05)", border: "1px solid rgba(27,67,50,0.1)" }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Объект:</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: GREEN }}>{negotiationBooking.roomName}</div>
                <div style={{ fontSize: 13, color: "#666" }}>{negotiationBooking.tenantEmail}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>Итоговая цена (₸):</label>
                <input 
                  type="number" 
                  value={negotiationPrice} 
                  onChange={e => setNegotiationPrice(Number(e.target.value))} 
                  style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #eee", fontSize: 16, fontWeight: 700, outline: "none", color: GREEN }} 
                />
                <p style={{ fontSize: 11, color: "#999" }}>Оригинальная цена: {negotiationBooking.totalPrice.toLocaleString()} ₸</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>Срок оплаты:</label>
                <input 
                  type="date" 
                  value={format(negotiationDeadline, "yyyy-MM-dd")} 
                  onChange={e => setNegotiationDeadline(new Date(e.target.value))} 
                  style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #eee", fontSize: 14, outline: "none" }} 
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>Комментарий для арендатора:</label>
                <textarea 
                  value={negotiationComment} 
                  onChange={e => setNegotiationComment(e.target.value)} 
                  placeholder="Причина изменения цены или дополнительные условия..."
                  style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #eee", fontSize: 14, outline: "none", minHeight: 100, resize: "none" }} 
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button 
                  onClick={() => setNegotiationBooking(null)} 
                  style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid #eee", background: "#fff", color: "#666", fontWeight: 600, cursor: "pointer" }}
                >
                  Отмена
                </button>
                <button 
                  onClick={finalizeApproval} 
                  disabled={loading === negotiationBooking.id}
                  style={{ flex: 2, padding: "14px", borderRadius: 14, border: "none", background: GREEN, color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {loading === negotiationBooking.id ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                  Подтвердить и отправить
                </button>
              </div>
            </div>
          </Modal>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value, trend }: { icon: any, label: string, value: string, trend: string }) {
  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid rgba(27,67,50,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(27,67,50,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: trend.startsWith("+") ? GREEN2 : "#666", background: trend.startsWith("+") ? "rgba(45,106,79,0.1)" : "rgba(0,0,0,0.05)", padding: "4px 8px", borderRadius: 100 }}>
          {trend}
        </span>
      </div>
      <div style={{ fontSize: 14, color: "#999", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{value}</div>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: "relative", background: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 450, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", color: "#999", cursor: "pointer" }}><X size={24}/></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #eee", fontSize: 14, outline: "none" }} />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string, value: string, options: {v: string, l: string}[], onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #eee", fontSize: 14, outline: "none", background: "#fff" }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
