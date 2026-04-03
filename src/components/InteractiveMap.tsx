import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Info, CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck, CreditCard, MessageSquare, Wrench, Sparkles, Edit3, Save, ChevronDown, ChevronUp, Calendar as CalendarIcon, Clock, User, Phone, Search, Filter, Trash2, Check, X, MessageCircle, Send, Image, UserPlus, Bell } from "lucide-react";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, onSnapshot, query, addDoc, serverTimestamp, doc, updateDoc, where, getDocs, setDoc, deleteDoc, orderBy } from "firebase/firestore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays, format, isWithinInterval, startOfDay, subMonths } from "date-fns";
import { ru, kk } from "date-fns/locale";
import { CleaningService } from "./CleaningService";

const GREEN = "#1b4332";
const GREEN2 = "#2d6a4f";
const SAGE = "#c8ddd2";

interface Room {
  id: string;
  name: string;
  area: number;
  price: number;
  status: "available" | "occupied" | "maintenance";
  type: "rentable" | "common";
  floor: 1 | 2;
  path: string; // SVG path data
}

export const ROOMS_DATA: Room[] = [
  // Floor 1
  { id: "1-1", name: "Холл", area: 19.2, price: 0, status: "available", type: "common", floor: 1, path: "M 400 362 L 982 368 L 978 630 L 397 630 Z" },
  { id: "1-3", name: "Гостиная", area: 38.8, price: 131920, status: "available", type: "rentable", floor: 1, path: "M 15 16 L 980 20 L 981 368 L 20 357 Z" },
  { id: "1-4", name: "Санузел", area: 4.2, price: 0, status: "available", type: "common", floor: 1, path: "M 212 357 L 401 357 L 403 521 L 212 519 Z" },
  { id: "1-5", name: "Топочная", area: 5.1, price: 0, status: "available", type: "common", floor: 1, path: "M 17 356 L 216 357 L 212 518 L 18 519 Z" },
  { id: "1-6", name: "Коридор", area: 7.1, price: 0, status: "available", type: "common", floor: 1, path: "M 18 515 L 401 519 L 400 629 L 17 629 Z" },
  { id: "1-7", name: "Кухня", area: 28.2, price: 0, status: "available", type: "common", floor: 1, path: "M 18 624 L 404 626 L 400 980 L 20 980 Z" },
  { id: "1-8", name: "Зал", area: 37.7, price: 128180, status: "available", type: "rentable", floor: 1, path: "M 400 630 L 980 630 L 980 980 L 400 980 Z" },
  
  // Floor 2
  { id: "2-9", name: "Зал 2", area: 62.5, price: 212500, status: "available", type: "rentable", floor: 2, path: "M 400 289 L 981 292 L 980 980 L 398 979 Z" },
  { id: "2-10", name: "Кабинет", area: 40.1, price: 136340, status: "available", type: "rentable", floor: 2, path: "M 19 21 L 980 20 L 981 293 L 25 290 Z" },
  { id: "2-14", name: "Парная", area: 5.1, price: 0, status: "available", type: "common", floor: 2, path: "M 25 285 L 199 284 L 199 620 L 19 619 Z" },
  { id: "2-15", name: "Санузел 2", area: 6.5, price: 0, status: "available", type: "common", floor: 2, path: "M 195 287 L 402 286 L 402 506 L 193 511 Z" },
  { id: "2-16", name: "Санузел 3", area: 5.8, price: 0, status: "available", type: "common", floor: 2, path: "M 196 506 L 399 505 L 398 619 L 199 619 Z" },
  { id: "2-18", name: "Спальня", area: 20.7, price: 70380, status: "available", type: "rentable", floor: 2, path: "M 18 616 L 402 618 L 399 983 L 19 984 Z" },
  { id: "2-19", name: "Гардероб", area: 8.5, price: 0, status: "available", type: "common", floor: 2, path: "M 410 300 L 550 300 L 550 450 L 410 450 Z" },
  { id: "2-20", name: "Коридор", area: 12.2, price: 0, status: "available", type: "common", floor: 2, path: "M 410 460 L 550 460 L 550 600 L 410 600 Z" },
];

export const ROOM_NAMES: Record<string, Record<string, string>> = {
  "1-1": { ru: "Холл", kk: "Холл" },
  "1-3": { ru: "Гостиная", kk: "Қонақ бөлмесі" },
  "1-4": { ru: "Санузел", kk: "Жуынатын бөлме" },
  "1-5": { ru: "Топочная", kk: "Қазандық" },
  "1-6": { ru: "Коридор", kk: "Дәліз" },
  "1-7": { ru: "Кухня", kk: "Ас үй" },
  "1-8": { ru: "Зал", kk: "Зал" },
  "2-9": { ru: "Зал 2", kk: "Зал 2" },
  "2-10": { ru: "Кабинет", kk: "Кабинет" },
  "2-14": { ru: "Парная", kk: "Бу бөлмесі" },
  "2-15": { ru: "Санузел 2", kk: "Жуынатын бөлме 2" },
  "2-16": { ru: "Санузел 3", kk: "Жуынатын бөлме 3" },
  "2-18": { ru: "Спальня", kk: "Жатын бөлме" },
  "2-19": { ru: "Гардероб", kk: "Киім бөлмесі" },
  "2-20": { ru: "Коридор", kk: "Дәліз" },
};

const MAP_TRANSLATIONS = {
  ru: {
    mapTitle: "Цифровой двойник SUIINBAI 126",
    mapSub: "Выберите комнату на плане для бронирования или просмотра деталей",
    sync: "Синхронизировать",
    save: "Сохранить",
    edit: "Редактировать",
    floorLabel: "Этаж",
    pathEditorFor: "Редактор пути для",
    logJson: "Вывести JSON в консоль",
    floor1: "1 этаж",
    floor2: "2 этаж",
    area: "Площадь",
    price: "Цена",
    status: "Статус",
    available: "Свободно",
    occupied: "Занято",
    maintenance: "Ремонт",
    bookNow: "Забронировать сейчас",
    selectDates: "Выберите даты",
    startDate: "Дата начала",
    endDate: "Дата окончания",
    common: "Общая зона",
  rentable: "Сдается",
    m2: "м²",
    tgMonth: "₸ / мес",
    selectRoom: "Выберите помещение на плане, чтобы увидеть подробную информацию",
    occupiedDates: "Эти даты уже заняты!",
    bookingError: "Произошла ошибка при бронировании",
    syncSuccess: "Данные успешно синхронизированы!",
    syncError: "Ошибка при синхронизации",
    schedule: "График бронирований",
    adminBooking: "Создать бронь (Админ)",
    tenantEmail: "Email жильца",
    totalPrice: "Общая сумма",
    bookWholeFloor: "Забронировать весь этаж",
    bookWholeBuilding: "Забронировать всё здание",
    floorPrice: "Цена за этаж",
    buildingPrice: "Цена за всё здание"
  },
  kk: {
    mapTitle: "SUIINBAI 126 цифрлық егізі",
    mapSub: "Брондау немесе мәліметтерді көру үшін жоспардағы бөлмені таңдаңыз",
    sync: "Синхрондау",
    save: "Сақтау",
    edit: "Өңдеу",
    floorLabel: "Қабат",
    pathEditorFor: "Жол редакторы:",
    logJson: "JSON-ды консольге шығару",
    floor1: "1-қабат",
    floor2: "2-қабат",
    area: "Ауданы",
    price: "Бағасы",
    status: "Мәртебесі",
    available: "Бос",
    occupied: "Бос емес",
    maintenance: "Жөндеу",
    bookNow: "Қазір брондау",
    selectDates: "Күндерді таңдаңыз",
    startDate: "Басталу күні",
    endDate: "Аяқталу күні",
    common: "Ортақ аймақ",
    rentable: "Жалға беріледі",
    m2: "м²",
    tgMonth: "₸ / айына",
    selectRoom: "Толық ақпаратты көру үшін жоспардағы бөлмені таңдаңыз",
    occupiedDates: "Бұл күндер бос емес!",
    bookingError: "Брондау кезінде қате кетті",
    syncSuccess: "Деректер сәтті синхрондалды!",
    syncError: "Синхрондау қатесі",
    schedule: "Брондау кестесі",
    adminBooking: "Брондау жасау (Админ)",
    tenantEmail: "Тұрғынның Email-і",
    totalPrice: "Жалпы сома",
    bookWholeFloor: "Бүкіл қабатты брондау",
    bookWholeBuilding: "Бүкіл ғимаратты брондау",
    floorPrice: "Қабаттың бағасы",
    buildingPrice: "Бүкіл ғимараттың бағасы"
  }
};

const CABINET_TRANSLATIONS = {
  ru: {
    title: "Кабинет Арендатора",
    welcome: "Добро пожаловать домой",
    yourRental: "Ваша Аренда",
    room: "Помещение",
    status: "Статус",
    period: "Период",
    total: "Сумма к оплате",
    pay: "Оплатить аренду",
    statusActive: "Активно",
    statusPending: "Ожидает подтверждения",
    noBookings: "У вас пока нет активных бронирований.",
    chat: "Чат жильцов",
    chatDesc: "Общение с соседями",
    service: "Сервис",
    serviceDesc: "Заявка на ремонт",
    cleaning: "Клининг",
    cleaningDesc: "Заказать уборку",
    payment: "Оплата",
    paymentDesc: "Счета и чеки",
    marketplace: "Маркетплейс",
    marketplaceDesc: "Услуги жильцов",
    addService: "Добавить услугу",
    serviceName: "Название услуги / Ваше имя",
    servicePhone: "Номер телефона",
    serviceAddress: "Адрес (необязательно)",
    serviceActivity: "Вид деятельности",
    servicePhoto: "Ссылка на фото (необязательно)",
    call: "Позвонить",
    reviews: "Отзывы",
    addReview: "Оставить отзыв",
    rating: "Оценка",
    comment: "Комментарий",
    save: "Сохранить",
    cancel: "Отмена",
    search: "Поиск...",
    allServices: "Все услуги",
    myServices: "Мои услуги",
    moderation: "Модерация",
    pending: "На проверке",
    approved: "Одобрено",
    rejected: "Отклонено",
    approve: "Одобрить",
    reject: "Отклонить",
    delete: "Удалить",
    edit: "Редактировать",
    noServicesFound: "Услуги не найдены",
    moderationNote: "Ваше объявление будет проверено администратором перед публикацией.",
    profile: "Профиль",
    editProfile: "Редактировать профиль",
    fullName: "ФИО",
    dob: "Дата рождения",
    phone: "Телефон",
    iin: "ИИН",
    activity: "Вид деятельности",
    chatTitle: "Чат жильцов",
    typeMessage: "Введите сообщение...",
    send: "Отправить",
    noAccessChat: "У вас нет доступа к чату. Обратитесь к администратору.",
    addMember: "Добавить в чат",
    members: "Участники",
    allUsers: "Все пользователи",
    notifications: "Уведомления",
    noNotifications: "У вас нет новых уведомлений",
    cleaningReminder: "Пора заказать уборку!",
    cleaningReminderDesc: "Каждое воскресенье мы напоминаем о чистоте. Нажмите, чтобы заказать клининг."
  },
  kk: {
    title: "Жалға алушы кабинеті",
    welcome: "Үйіңізге қош келдіңіз",
    yourRental: "Сіздің жалдауыңыз",
    room: "Бөлме",
    status: "Мәртебесі",
    period: "Кезең",
    total: "Төленетін сома",
    pay: "Жалдау ақысын төлеу",
    statusActive: "Белсенді",
    statusPending: "Растауды күтуде",
    noBookings: "Сізде әлі белсенді брондаулар жоқ.",
    chat: "Тұрғындар чаты",
    chatDesc: "Көршілермен араласу",
    service: "Сервис",
    serviceDesc: "Жөндеуге өтінім",
    cleaning: "Клининг",
    cleaningDesc: "Тазалауға тапсырыс беру",
    payment: "Төлем",
    paymentDesc: "Шоттар мен чектер",
    marketplace: "Маркетплейс",
    marketplaceDesc: "Тұрғындар қызметі",
    addService: "Қызмет қосу",
    serviceName: "Қызмет атауы / Сіздің атыңыз",
    servicePhone: "Телефон нөмірі",
    serviceAddress: "Мекен-жайы (міндетті емес)",
    serviceActivity: "Қызмет түрі",
    servicePhoto: "Фото сілтемесі (міндетті емес)",
    call: "Қоңырау шалу",
    reviews: "Пікірлер",
    addReview: "Пікір қалдыру",
    rating: "Бағалау",
    comment: "Түсініктеме",
    save: "Сақтау",
    cancel: "Болдырмау",
    search: "Іздеу...",
    allServices: "Барлық қызметтер",
    myServices: "Менің қызметтерім",
    moderation: "Модерация",
    pending: "Тексерілуде",
    approved: "Мақұлданды",
    rejected: "Қабылданбады",
    approve: "Мақұлдау",
    reject: "Қабылдамау",
    delete: "Жою",
    edit: "Өңдеу",
    noServicesFound: "Қызметтер табылмады",
    moderationNote: "Сіздің хабарландыруыңыз жарияланбас бұрын әкімшімен тексеріледі.",
    profile: "Профиль",
    editProfile: "Профильді өңдеу",
    fullName: "Аты-жөні",
    dob: "Туған күні",
    phone: "Телефон",
    iin: "ЖСН",
    activity: "Қызмет түрі",
    chatTitle: "Тұрғындар чаты",
    typeMessage: "Хабарлама жазыңыз...",
    send: "Жіберу",
    noAccessChat: "Сізде чатқа кіру мүмкіндігі жоқ. Әкімшіге хабарласыңыз.",
    addMember: "Чатқа қосу",
    members: "Қатысушылар",
    allUsers: "Барлық пайдаланушылар",
    notifications: "Хабарландырулар",
    noNotifications: "Сізде жаңа хабарландырулар жоқ",
    cleaningReminder: "Тазалауға тапсырыс беру уақыты келді!",
    cleaningReminderDesc: "Әр жексенбіде біз тазалық туралы еске саламыз. Клинингке тапсырыс беру үшін басыңыз."
  }
};

export function InteractiveMap({ user, userProfile, lang = 'ru', onBookingSuccess, openRegistration }: { 
  user: any, 
  userProfile: any,
  lang?: 'ru' | 'kk', 
  onBookingSuccess: () => void,
  openRegistration?: () => void
}) {
  const t = MAP_TRANSLATIONS[lang];
  const dateLocale = lang === 'kk' ? kk : ru;
  const [floor, setFloor] = useState<1 | 2>(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [roomsStatus, setRoomsStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 30));
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [allActiveBookings, setAllActiveBookings] = useState<any[]>([]);
  const [adminTenantEmail, setAdminTenantEmail] = useState("");
  const [bookingType, setBookingType] = useState<"room" | "floor" | "building">("room");

  const FLOOR_PRICE = 476000;
  const BUILDING_PRICE = 1020000;

  const handleRoomClick = (room: Room) => {
    if (isEditMode) {
      setEditingPath(room.id);
      return;
    }
    
    if (room.type === "common") {
      setSelectedRoom(room);
      setSelectedRoomIds([room.id]);
      return;
    }

    // Toggle selection for multi-room booking
    setSelectedRoomIds(prev => {
      if (prev.includes(room.id)) {
        const next = prev.filter(id => id !== room.id);
        if (next.length > 0) {
          const lastRoom = editableRooms.find(r => r.id === next[next.length - 1]);
          setSelectedRoom(lastRoom || null);
        } else {
          setSelectedRoom(null);
        }
        return next;
      } else {
        setSelectedRoom(room);
        return [...prev, room.id];
      }
    });
    
    setBookingError(null);
    setBookingType("room");
  };

  useEffect(() => {
    const unsubRooms = onSnapshot(collection(db, "rooms"), (snap) => {
      if (snap.empty) {
        ROOMS_DATA.forEach(async (room) => {
          try {
            await setDoc(doc(db, "rooms", room.id), { ...room, createdAt: serverTimestamp() });
          } catch (e) {
            console.error("Error populating rooms:", e);
          }
        });
      }
      const status: Record<string, any> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        status[data.id || doc.id] = { ...data, firestoreId: doc.id };
      });
      setRoomsStatus(status);
    });

    // Populate sample staff if empty
    const unsubStaff = onSnapshot(collection(db, "staff"), (snap) => {
      if (snap.empty && user?.email === "pzhumash@gmail.com") {
        const sampleStaff = [
          { name: "Алихан Сериков", role: "security", status: "active", phone: "+7 (701) 123-45-67", email: "alihan@example.com" },
          { name: "Гульнара Ахметова", role: "cleaner", status: "active", phone: "+7 (702) 987-65-43", email: "gulnara@example.com" },
          { name: "Виктор Петров", role: "technician", status: "active", phone: "+7 (705) 555-44-33", email: "viktor@example.com" }
        ];
        sampleStaff.forEach(s => addDoc(collection(db, "staff"), s).catch(e => console.error("Error adding staff:", e)));
      }
    });

    // Populate sample maintenance if empty
    const unsubMaint = onSnapshot(collection(db, "maintenance"), (snap) => {
      if (snap.empty && user?.email === "pzhumash@gmail.com") {
        const sampleMaint = [
          { roomId: "1-3", roomName: "Гостиная", description: "Замена ламп освещения", status: "scheduled", scheduledDate: addDays(new Date(), 5), cost: 15000 },
          { roomId: "2-15", roomName: "Санузел 2", description: "Профилактика сантехники", status: "completed", scheduledDate: subMonths(new Date(), 1), cost: 8000 }
        ];
        sampleMaint.forEach(m => addDoc(collection(db, "maintenance"), m).catch(e => console.error("Error adding maintenance:", e)));
      }
    });

    // Fetch all active bookings for map status
    const qAll = query(collection(db, "bookings"), where("status", "==", "active"));
    const unsubAllBookings = onSnapshot(qAll, (snap) => {
      const bookings = snap.docs.map(doc => ({
        ...doc.data(),
        startDate: (doc.data().startDate as any)?.toDate?.() || new Date(doc.data().startDate),
        endDate: (doc.data().endDate as any)?.toDate?.() || new Date(doc.data().endDate)
      }));
      setAllActiveBookings(bookings);
    });

    return () => {
      unsubRooms();
      unsubStaff();
      unsubMaint();
      unsubAllBookings();
    };
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      const q = query(collection(db, "bookings"), where("roomId", "==", selectedRoom.id), where("status", "in", ["active", "pending"]));
      const unsubBookings = onSnapshot(q, (snap) => {
        const bookings = snap.docs.map(doc => ({
          ...doc.data(),
          startDate: (doc.data().startDate as any)?.toDate?.() || new Date(doc.data().startDate),
          endDate: (doc.data().endDate as any)?.toDate?.() || new Date(doc.data().endDate)
        }));
        setRoomBookings(bookings);
      });
      return () => unsubBookings();
    } else {
      setRoomBookings([]);
    }
  }, [selectedRoom]);

  const isDateDisabled = (date: Date) => {
    return roomBookings.some(b => 
      b.startDate && b.endDate && 
      isWithinInterval(date, { start: startOfDay(b.startDate), end: startOfDay(b.endDate) })
    );
  };

  const handleBook = async (room: Room) => {
    if (!user || !startDate || !endDate) return;

    // Enforce registration
    const isProfileComplete = userProfile && userProfile.fullName && userProfile.phone && userProfile.iin && userProfile.dob;
    if (!isProfileComplete && !isAdmin) {
      setBookingError(lang === 'kk' ? "Брондау үшін тіркеуді аяқтаңыз" : "Для бронирования необходимо завершить регистрацию");
      if (openRegistration) {
        setTimeout(() => openRegistration(), 2000);
      }
      return;
    }
    
    // Admin can specify tenant email
    const finalTenantEmail = isAdmin && adminTenantEmail ? adminTenantEmail : user.email;
    
    setLoading(true);
    setBookingError(null);
    try {
      let roomsToBook: Room[] = [];
      if (bookingType === "room") {
        roomsToBook = editableRooms.filter(r => selectedRoomIds.includes(r.id));
      } else if (bookingType === "floor") {
        roomsToBook = editableRooms.filter(r => r.floor === floor && r.type === "rentable");
      } else if (bookingType === "building") {
        roomsToBook = editableRooms.filter(r => r.type === "rentable");
      }

      if (roomsToBook.length === 0) return;

      // Check for overlaps for all rooms
      for (const r of roomsToBook) {
        const q = query(collection(db, "bookings"), where("roomId", "==", r.id), where("status", "in", ["active", "pending", "pending_review"]));
        const snap = await getDocs(q);
        const overlaps = snap.docs.some(doc => {
          const b = doc.data();
          const bStart = b.startDate?.toDate?.() || new Date(b.startDate);
          const bEnd = b.endDate?.toDate?.() || new Date(b.endDate);
          return (startDate! < bEnd && endDate! > bStart);
        });
        if (overlaps) {
          throw new Error(`${t.occupiedDates} (${r.name})`);
        }
      }

      // Create bookings
      const months = Math.max(1, Math.ceil((endDate!.getTime() - startDate!.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
      
      let totalBookingPrice = 0;
      if (bookingType === "floor") {
        totalBookingPrice = FLOOR_PRICE;
      } else if (bookingType === "building") {
        totalBookingPrice = BUILDING_PRICE;
      } else {
        totalBookingPrice = roomsToBook.reduce((sum, r) => sum + r.price, 0);
      }
      
      const pricePerRoom = totalBookingPrice / roomsToBook.length;

      for (const r of roomsToBook) {
        const totalPrice = pricePerRoom * months;

        await addDoc(collection(db, "bookings"), {
          roomId: r.id,
          roomName: r.name,
          floor: r.floor,
          tenantEmail: finalTenantEmail,
          tenantUid: isAdmin && adminTenantEmail ? "admin-created" : user.uid,
          startDate,
          endDate,
          totalPrice,
          originalPrice: totalPrice, // Store original price for negotiation
          status: isAdmin ? "active" : "pending_review", // New status for negotiation flow
          createdAt: serverTimestamp(),
          bookingType,
          paymentDeadline: addDays(new Date(), 3), // Default 3 days to pay
          paymentStatus: "pending"
        });

        if (isAdmin) {
          const roomState = roomsStatus[r.id];
          if (roomState && roomState.firestoreId) {
            const roomRef = doc(db, "rooms", roomState.firestoreId);
            await updateDoc(roomRef, {
              status: "occupied",
              currentTenantEmail: finalTenantEmail,
              updatedAt: serverTimestamp()
            });
          }
        }
      }

      if (onBookingSuccess) onBookingSuccess();
      setSelectedRoom(null);
      setSelectedRoomIds([]);
      setBookingType("room");
      setAdminTenantEmail("");
    } catch (err: any) {
      console.error("Booking error:", err);
      setBookingError(err.message || t.bookingError);
    } finally {
      setLoading(false);
    }
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [isPathEditorVisible, setIsPathEditorVisible] = useState(true);
  const [editableRooms, setEditableRooms] = useState(ROOMS_DATA);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const isAdmin = user?.email === "pzhumash@gmail.com";
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateRoomPath = (id: string, newPath: string) => {
    setEditableRooms(prev => prev.map(r => r.id === id ? { ...r, path: newPath } : r));
  };

  const getPointsFromPath = (path: string) => {
    const coords = path.match(/-?\d+/g)?.map(Number) || [];
    const points: { x: number, y: number }[] = [];
    for (let i = 0; i < coords.length; i += 2) {
      if (coords[i] !== undefined && coords[i+1] !== undefined) {
        points.push({ x: coords[i], y: coords[i+1] });
      }
    }
    return points;
  };

  const updatePoint = (roomIndex: number, pointIndex: number, x: number, y: number) => {
    const room = editableRooms[roomIndex];
    const points = getPointsFromPath(room.path);
    points[pointIndex] = { x: Math.round(x), y: Math.round(y) };
    
    let newPath = "";
    points.forEach((p, i) => {
      newPath += `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
    });
    newPath += "Z";
    
    const newRooms = [...editableRooms];
    newRooms[roomIndex] = { ...room, path: newPath };
    setEditableRooms(newRooms);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent, roomIndex: number, pointIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;

    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const x = (clientX - CTM.e) / CTM.a;
      const y = (clientY - CTM.f) / CTM.d;
      
      updatePoint(roomIndex, pointIndex, x, y);
    };

    const upHandler = () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', upHandler);
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
    window.addEventListener('touchmove', moveHandler);
    window.addEventListener('touchend', upHandler);
  };


  const handleSyncRooms = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      // Use editableRooms instead of ROOMS_DATA to persist edits
      for (const room of editableRooms) {
        await setDoc(doc(db, "rooms", room.id), {
          ...room,
          updatedAt: serverTimestamp()
        });
      }
      console.log(t.syncSuccess);
    } catch (error) {
      console.error("Sync error:", error);
      console.error(t.syncError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: GREEN, marginBottom: 8 }}>{t.mapTitle}</h2>
          <p style={{ color: "#5a8a70", fontSize: 14 }}>{t.mapSub}</p>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {isAdmin && (
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                type="button"
                onClick={handleSyncRooms}
                disabled={loading}
                style={{
                  background: "rgba(27,67,50,0.1)",
                  color: GREEN,
                  border: "none", padding: "10px 20px", borderRadius: 12,
                  display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18}/>}
                {t.sync}
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (!isEditMode) {
                    // Initialize editableRooms from current Firestore status when entering edit mode
                    setEditableRooms(ROOMS_DATA.map(r => ({
                      ...r,
                      path: roomsStatus[r.id]?.path || r.path
                    })));
                  }
                  setIsEditMode(!isEditMode);
                }}
                style={{
                  background: isEditMode ? GREEN : "rgba(27,67,50,0.1)",
                  color: isEditMode ? "#fff" : GREEN,
                  border: "none", padding: "10px 20px", borderRadius: 12,
                  display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600
                }}
              >
                {isEditMode ? <Save size={18}/> : <Edit3 size={18}/>}
                {isEditMode ? t.save : t.edit}
              </button>
            </div>
          )}
          <div style={{ display: "flex", background: "rgba(27,67,50,0.1)", borderRadius: 100, padding: 4 }}>
            {[1, 2].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFloor(f as 1 | 2)}
                style={{
                  border: "none",
                  padding: "8px 24px",
                  borderRadius: 100,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: floor === f ? GREEN : "transparent",
                  color: floor === f ? "#fff" : GREEN,
                  transition: "all 0.3s"
                }}
              >
                {f} {t.floorLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 350px", gap: 40, alignItems: "start" }}>
        {/* SVG Map */}
        <div style={{ 
          background: "#fff", 
          borderRadius: 32, 
          padding: 40, 
          boxShadow: "0 20px 50px rgba(27,67,50,0.1)",
          position: "relative",
          aspectRatio: "1/1",
          overflow: "hidden"
        }}>
          <svg 
            ref={svgRef}
            viewBox="0 0 1000 1000" 
            style={{ width: "100%", height: "100%", touchAction: "none" }}
          >
            {/* Clean Background */}
            <rect width="1000" height="1000" fill="#fff" />

            {/* External Walls */}
            <rect x="20" y="20" width="960" height="960" fill="none" stroke={GREEN} strokeWidth="8" rx="2" />
            
            {editableRooms.filter(r => r.floor === floor).map((room, idx) => {
              const statusFromDb = roomsStatus[room.id]?.status || room.status;
              
              // Check if currently booked
              const activeBooking = allActiveBookings.find(b => b.roomId === room.id);
              const isCurrentlyBooked = activeBooking && isWithinInterval(new Date(), {
                start: activeBooking.startDate?.toDate?.() || new Date(activeBooking.startDate),
                end: activeBooking.endDate?.toDate?.() || new Date(activeBooking.endDate)
              });

              const status = isCurrentlyBooked ? "occupied" : statusFromDb;
              const isSelected = selectedRoomIds.includes(room.id);
              
              // Use Firestore path if not in edit mode
              const currentPath = isEditMode ? room.path : (roomsStatus[room.id]?.path || room.path);
              
              let fillColor = "rgba(200, 221, 210, 0.15)"; // common
              if (room.type === "rentable") {
                if (status === "available") fillColor = "rgba(64, 145, 108, 0.1)";
                if (status === "occupied") fillColor = "rgba(230, 57, 70, 0.08)";
                if (status === "maintenance") fillColor = "rgba(255, 183, 3, 0.08)";
              }
              if (isSelected) fillColor = "rgba(27, 67, 50, 0.85)";

              // Calculate center for text
              const points = getPointsFromPath(currentPath);
              const minX = Math.min(...points.map(p => p.x));
              const maxX = Math.max(...points.map(p => p.x));
              const minY = Math.min(...points.map(p => p.y));
              const maxY = Math.max(...points.map(p => p.y));
              const centerX = (minX + maxX) / 2;
              const centerY = (minY + maxY) / 2;

              return (
                <g key={room.id} onClick={() => !isEditMode && handleRoomClick(room)} style={{ cursor: isEditMode ? "default" : "pointer" }}>
                  <motion.path
                    d={currentPath}
                    fill={fillColor}
                    stroke={isSelected ? "#fff" : GREEN}
                    strokeWidth={isSelected ? 4 : 2}
                    initial={false}
                    animate={{ fill: fillColor }}
                    whileHover={{ fill: isSelected ? "rgba(27, 67, 50, 0.9)" : "rgba(64, 145, 108, 0.25)" }}
                    transition={{ duration: 0.3 }}
                    onClick={() => isEditMode && handleRoomClick(room)}
                  />
                  
                  <text
                    x={centerX}
                    y={centerY - (status === "occupied" ? 10 : 0)}
                    textAnchor="middle"
                    fill={isSelected ? "#fff" : GREEN}
                    style={{ fontSize: 14, fontWeight: 800, pointerEvents: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}
                  >
                    {ROOM_NAMES[room.id]?.[lang] || room.name}
                  </text>

                  {status === "occupied" && (
                    <g style={{ pointerEvents: "none" }}>
                      <text
                        x={centerX}
                        y={centerY + 10}
                        textAnchor="middle"
                        fill={isSelected ? "#fff" : "#e63946"}
                        style={{ fontSize: 10, fontWeight: 700 }}
                      >
                        {lang === 'ru' ? "ЗАНЯТО" : "БОС ЕМЕС"}
                      </text>
                      {activeBooking && (
                        <text
                          x={centerX}
                          y={centerY + 22}
                          textAnchor="middle"
                          fill={isSelected ? "rgba(255,255,255,0.8)" : "#666"}
                          style={{ fontSize: 8, fontWeight: 500 }}
                        >
                          {format(activeBooking.startDate?.toDate?.() || new Date(activeBooking.startDate), "dd.MM")} - {format(activeBooking.endDate?.toDate?.() || new Date(activeBooking.endDate), "dd.MM")}
                        </text>
                      )}
                    </g>
                  )}

                  {/* Drag Handles in Edit Mode */}
                  {isEditMode && isSelected && points.map((p, pIdx) => (
                    <circle
                      key={pIdx}
                      cx={p.x}
                      cy={p.y}
                      r="12"
                      fill="#fff"
                      stroke={GREEN}
                      strokeWidth="3"
                      style={{ cursor: "move", touchAction: "none" }}
                      onMouseDown={(e) => handleDrag(e, editableRooms.indexOf(room), pIdx)}
                      onTouchStart={(e) => handleDrag(e, editableRooms.indexOf(room), pIdx)}
                    />
                  ))}
                </g>
              );
            })}

            {/* Architectural Details (Subtle) */}
            <g stroke={GREEN} strokeWidth="2" opacity="0.3" fill="none">
              {/* Stairs */}
              {floor === 1 && (
                <g transform="translate(680, 420)">
                  <rect width="80" height="140" />
                  {[0, 20, 40, 60, 80, 100, 120].map(y => (
                    <line key={y} x1="0" y1={y} x2="80" y2={y} strokeWidth="1" />
                  ))}
                </g>
              )}
            </g>
          </svg>

          {isEditMode && selectedRoom && (
            <div style={{ 
              position: "absolute", bottom: 20, left: 20, right: 20, 
              background: "rgba(255,255,255,0.95)", padding: isPathEditorVisible ? 16 : 8, borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)", zIndex: 10,
              transition: "all 0.3s"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isPathEditorVisible ? 8 : 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700 }}>{t.pathEditorFor}: {ROOM_NAMES[selectedRoom.id]?.[lang] || selectedRoom.name}</p>
                <button 
                  type="button"
                  onClick={() => setIsPathEditorVisible(!isPathEditorVisible)}
                  style={{ background: "none", border: "none", color: GREEN, cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {isPathEditorVisible ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}
                </button>
              </div>
              
              {isPathEditorVisible && (
                <>
                  <textarea 
                    value={editableRooms.find(r => r.id === selectedRoom.id)?.path || ""}
                    onChange={(e) => updateRoomPath(selectedRoom.id, e.target.value)}
                    style={{ width: "100%", height: 60, fontSize: 10, padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
                  />
                  <button 
                    type="button"
                    onClick={() => console.log("New ROOMS_DATA:", JSON.stringify(editableRooms, null, 2))}
                    style={{ marginTop: 8, background: GREEN, color: "#fff", border: "none", padding: "4px 12px", borderRadius: 4, fontSize: 10 }}
                  >
                    {t.logJson}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Details Panel */}
        <AnimatePresence mode="wait">
          {selectedRoom ? (
            <motion.div
              key={selectedRoom.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                background: "#fff",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                border: "1px solid rgba(27,67,50,0.1)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(27,67,50,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}>
                  <Home size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: GREEN }}>
                    {selectedRoomIds.length > 1 
                      ? (lang === 'ru' ? `Выбрано: ${selectedRoomIds.length}` : `Таңдалды: ${selectedRoomIds.length}`)
                      : (ROOM_NAMES[selectedRoom.id]?.[lang] || selectedRoom.name)}
                  </h3>
                  <span style={{ fontSize: 12, color: "#5a8a70" }}>
                    {selectedRoomIds.length > 1 
                      ? (lang === 'ru' ? `${selectedRoom.floor} этаж` : `${selectedRoom.floor} қабат`)
                      : `${selectedRoom.floor} этаж • ${selectedRoom.area} м²`}
                  </span>
                </div>
              </div>

              {selectedRoom.type === "rentable" && (
                <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                  <button 
                    onClick={() => setBookingType("room")}
                    style={{ 
                      flex: 1, padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                      background: bookingType === "room" ? GREEN : "rgba(27,67,50,0.05)",
                      color: bookingType === "room" ? "#fff" : GREEN,
                      border: "none", cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    {lang === 'ru' ? "Комната" : "Бөлме"}
                  </button>
                  <button 
                    onClick={() => setBookingType("floor")}
                    style={{ 
                      flex: 1, padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                      background: bookingType === "floor" ? GREEN : "rgba(27,67,50,0.05)",
                      color: bookingType === "floor" ? "#fff" : GREEN,
                      border: "none", cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    {t.bookWholeFloor}
                  </button>
                  <button 
                    onClick={() => setBookingType("building")}
                    style={{ 
                      flex: 1, padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                      background: bookingType === "building" ? GREEN : "rgba(27,67,50,0.05)",
                      color: bookingType === "building" ? "#fff" : GREEN,
                      border: "none", cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    {t.bookWholeBuilding}
                  </button>
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "#666" }}>Статус:</span>
                  <span style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: selectedRoom.type === "common" ? "#666" : (roomsStatus[selectedRoom.id]?.status === "available" ? "#2d6a4f" : "#e63946") 
                  }}>
                    {selectedRoom.type === "common" ? t.common : (roomsStatus[selectedRoom.id]?.status === "available" ? t.available : t.occupied)}
                  </span>
                </div>
                
                {roomsStatus[selectedRoom.id]?.currentTenantEmail && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: "#666" }}>Жилец:</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: GREEN }}>{roomsStatus[selectedRoom.id].currentTenantEmail}</span>
                  </div>
                )}

                {selectedRoom.type === "rentable" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 14, color: "#666" }}>Ставка:</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: GREEN }}>3 400 ₸/м²</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 14, color: "#666" }}>Итого:</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: GREEN }}>
                          {(() => {
                            const months = Math.max(1, Math.ceil(((endDate?.getTime() || 0) - (startDate?.getTime() || 0)) / (1000 * 60 * 60 * 24 * 30.44)));
                            let basePrice = selectedRoom.price;
                            if (bookingType === "floor") {
                              basePrice = FLOOR_PRICE;
                            } else if (bookingType === "building") {
                              basePrice = BUILDING_PRICE;
                            } else if (selectedRoomIds.length > 1) {
                              basePrice = editableRooms.filter(r => selectedRoomIds.includes(r.id)).reduce((sum, r) => sum + r.price, 0);
                            }
                            return (basePrice * months).toLocaleString();
                          })()} ₸
                        </span>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: GREEN, marginBottom: 12 }}>{t.schedule}</h4>
                      
                      <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
                        <DatePicker
                          selected={startDate}
                          onChange={(dates) => {
                            const [start, end] = dates as [Date | null, Date | null];
                            setStartDate(start);
                            setEndDate(end);
                          }}
                          startDate={startDate}
                          endDate={endDate}
                          selectsRange
                          inline
                          minDate={new Date()}
                          highlightDates={roomBookings.map(b => ({
                            "booked-date": [b.startDate, b.endDate]
                          }))}
                          dayClassName={(date) => 
                            isDateDisabled(date) ? "booked-day" : undefined
                          }
                          locale={dateLocale}
                        />
                        
                        <div style={{ marginTop: 16, display: "flex", gap: 16, fontSize: 12, color: "#666" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#e63946" }} />
                            <span>{lang === 'ru' ? "Забронировано" : "Брондалған"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#2d6a4f" }} />
                            <span>{lang === 'ru' ? "Доступно" : "Қолжетімді"}</span>
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div style={{ marginBottom: 16, padding: 16, background: "rgba(27,67,50,0.05)", borderRadius: 16 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: GREEN, marginBottom: 8 }}>{t.adminBooking}</label>
                          <input 
                            type="email" 
                            placeholder={t.tenantEmail}
                            value={adminTenantEmail}
                            onChange={(e) => setAdminTenantEmail(e.target.value)}
                            style={{ 
                              width: "100%", padding: "10px 14px", borderRadius: 10, 
                              border: "1px solid rgba(27,67,50,0.1)", fontSize: 13, outline: "none" 
                            }}
                          />
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: "#999", marginBottom: 4 }}>{t.startDate}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: GREEN }}>{startDate ? format(startDate, "dd.MM.yyyy") : "—"}</div>
                        </div>
                        <span style={{ color: "#999" }}>—</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: "#999", marginBottom: 4 }}>{t.endDate}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: GREEN }}>{endDate ? format(endDate, "dd.MM.yyyy") : "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {bookingError && (
                <div style={{ 
                  padding: "12px", 
                  borderRadius: 12, 
                  background: "rgba(230,57,70,0.1)", 
                  color: "#e63946", 
                  fontSize: 13, 
                  marginBottom: 16,
                  textAlign: "center"
                }}>
                  {bookingError}
                </div>
              )}

              {selectedRoom.type === "rentable" && roomsStatus[selectedRoom.id]?.status !== "occupied" ? (
                <button
                  type="button"
                  onClick={() => handleBook(selectedRoom)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: GREEN,
                    color: "#fff",
                    border: "none",
                    padding: "16px",
                    borderRadius: 100,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.3s"
                  }}
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                  Забронировать сейчас
                </button>
              ) : (
                <div style={{ 
                  padding: "16px", 
                  borderRadius: 16, 
                  background: "rgba(27,67,50,0.05)", 
                  color: "#5a8a70", 
                  fontSize: 13, 
                  textAlign: "center",
                  lineHeight: 1.5
                }}>
                  {selectedRoom.type === "common" 
                    ? "Эта зона доступна для всех жильцов дома SUIINBAI 126." 
                    : (
                      <div>
                        <p style={{ fontWeight: 600, color: "#e63946", marginBottom: 8 }}>
                          {lang === 'ru' ? "Помещение в аренде" : "Бөлме жалға берілген"}
                        </p>
                        <p>{lang === 'ru' ? "Свяжитесь с службой поддержки для уточнения деталей." : "Толығырақ ақпарат алу үшін қолдау қызметіне хабарласыңыз."}</p>
                      </div>
                    )}
                </div>
              )}
            </motion.div>
          ) : (
            <div style={{ 
              textAlign: "center", 
              padding: "40px 20px", 
              border: "2px dashed rgba(27,67,50,0.1)", 
              borderRadius: 24,
              color: "#5a8a70"
            }}>
              <Info size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p style={{ fontSize: 14 }}>{t.selectRoom}</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function TenantDashboard({ user, lang = 'ru', notifications = [] }: { user: any, lang?: 'ru' | 'kk', notifications?: any[] }) {
  const t = CABINET_TRANSLATIONS[lang];
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [bookings, setBookings] = useState<any[]>([]);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCleaning, setShowCleaning] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "", phone: "", address: "", activity: "", photoUrl: "" });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [userProfile, setUserProfile] = useState<any>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserProfile(snap.data());
    });
    return () => unsub();
  }, [user]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [marketplaceTab, setMarketplaceTab] = useState<"all" | "my" | "moderation">("all");
  const isAdmin = user?.email === "pzhumash@gmail.com";

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "bookings"), where("tenantUid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "services_marketplace"), (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedService) {
      const q = query(collection(db, "service_reviews"), where("serviceId", "==", selectedService.id));
      const unsub = onSnapshot(q, (snap) => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, [selectedService]);

  const handleAddService = async () => {
    if (!serviceForm.name || !serviceForm.phone) return;
    try {
      if (editingServiceId) {
        await updateDoc(doc(db, "services_marketplace", editingServiceId), {
          ...serviceForm,
          status: "pending", // Re-moderate on edit
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "services_marketplace"), {
          ...serviceForm,
          authorUid: user.uid,
          authorEmail: user.email,
          status: "pending",
          createdAt: serverTimestamp()
        });
      }
      setIsAddingService(false);
      setEditingServiceId(null);
      setServiceForm({ name: "", phone: "", address: "", activity: "", photoUrl: "" });
    } catch (e) {
      handleFirestoreError(e, editingServiceId ? OperationType.UPDATE : OperationType.CREATE, "services_marketplace");
    }
  };

  const handleEditService = (service: any) => {
    setServiceForm({
      name: service.name,
      phone: service.phone,
      address: service.address || "",
      activity: service.activity || "",
      photoUrl: service.photoUrl || ""
    });
    setEditingServiceId(service.id);
    setIsAddingService(true);
    setSelectedService(null);
  };

  const handleUpdateServiceStatus = async (serviceId: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "services_marketplace", serviceId), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "services_marketplace");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm(lang === 'kk' ? "Жоюды растайсыз ба?" : "Вы уверены, что хотите удалить?")) return;
    try {
      await deleteDoc(doc(db, "services_marketplace", serviceId));
      if (selectedService?.id === serviceId) setSelectedService(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, "services_marketplace");
    }
  };

  const handleAddReview = async () => {
    if (!selectedService || !reviewForm.comment) return;
    try {
      await addDoc(collection(db, "service_reviews"), {
        serviceId: selectedService.id,
        authorUid: user.uid,
        authorName: user.displayName || "User",
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        createdAt: serverTimestamp()
      });
      setReviewForm({ rating: 5, comment: "" });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "service_reviews");
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.activity.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (marketplaceTab === "my") return s.authorUid === user.uid && matchesSearch;
    if (marketplaceTab === "moderation") return isAdmin && s.status === "pending" && matchesSearch;
    return s.status === "approved" && matchesSearch;
  });

  const activeBooking = bookings.find(b => b.status === "active" || b.status === "pending");

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Marketplace Modal */}
      <AnimatePresence>
        {showMarketplace && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMarketplace(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: "relative", background: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{t.marketplace}</h3>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setIsAddingService(true)} style={{ background: GREEN, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}>{t.addService}</button>
                  <button onClick={() => setShowMarketplace(false)} style={{ border: "none", background: "none", color: "#999", cursor: "pointer" }}><XCircle size={24}/></button>
                </div>
              </div>

              {!isAddingService && !selectedService && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: 250 }}>
                      <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                      <input 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        placeholder={t.search} 
                        style={{ width: "100%", padding: "12px 12px 12px 44px", borderRadius: 16, border: "1px solid #eee", fontSize: 14 }} 
                      />
                    </div>
                    <div style={{ display: "flex", background: "#f5f5f5", padding: 4, borderRadius: 16 }}>
                      <button onClick={() => setMarketplaceTab("all")} style={{ padding: "8px 16px", borderRadius: 12, border: "none", background: marketplaceTab === "all" ? "#fff" : "transparent", fontWeight: 600, cursor: "pointer", color: marketplaceTab === "all" ? GREEN : "#666", boxShadow: marketplaceTab === "all" ? "0 2px 8px rgba(0,0,0,0.05)" : "none" }}>{t.allServices}</button>
                      <button onClick={() => setMarketplaceTab("my")} style={{ padding: "8px 16px", borderRadius: 12, border: "none", background: marketplaceTab === "my" ? "#fff" : "transparent", fontWeight: 600, cursor: "pointer", color: marketplaceTab === "my" ? GREEN : "#666", boxShadow: marketplaceTab === "my" ? "0 2px 8px rgba(0,0,0,0.05)" : "none" }}>{t.myServices}</button>
                      {isAdmin && (
                        <button onClick={() => setMarketplaceTab("moderation")} style={{ padding: "8px 16px", borderRadius: 12, border: "none", background: marketplaceTab === "moderation" ? "#fff" : "transparent", fontWeight: 600, cursor: "pointer", color: marketplaceTab === "moderation" ? GREEN : "#666", boxShadow: marketplaceTab === "moderation" ? "0 2px 8px rgba(0,0,0,0.05)" : "none" }}>{t.moderation}</button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isAddingService ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h4 style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{editingServiceId ? t.edit : t.addService}</h4>
                  <div style={{ background: "rgba(27,67,50,0.05)", padding: 16, borderRadius: 16, fontSize: 13, color: GREEN, display: "flex", alignItems: "center", gap: 10 }}>
                    <Info size={18} /> {t.moderationNote}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{t.serviceName} *</label>
                      <input value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} style={{ padding: "12px", borderRadius: 12, border: "1px solid #eee" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{t.servicePhone} *</label>
                      <input value={serviceForm.phone} onChange={e => setServiceForm({...serviceForm, phone: e.target.value})} style={{ padding: "12px", borderRadius: 12, border: "1px solid #eee" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{t.serviceActivity}</label>
                    <input value={serviceForm.activity} onChange={e => setServiceForm({...serviceForm, activity: e.target.value})} style={{ padding: "12px", borderRadius: 12, border: "1px solid #eee" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{t.serviceAddress}</label>
                    <input value={serviceForm.address} onChange={e => setServiceForm({...serviceForm, address: e.target.value})} style={{ padding: "12px", borderRadius: 12, border: "1px solid #eee" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{t.servicePhoto} (URL)</label>
                    <input value={serviceForm.photoUrl} onChange={e => setServiceForm({...serviceForm, photoUrl: e.target.value})} style={{ padding: "12px", borderRadius: 12, border: "1px solid #eee" }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <button onClick={handleAddService} style={{ flex: 1, background: GREEN, color: "#fff", border: "none", padding: "14px", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}>{t.save}</button>
                    <button onClick={() => { setIsAddingService(false); setEditingServiceId(null); setServiceForm({ name: "", phone: "", address: "", activity: "", photoUrl: "" }); }} style={{ flex: 1, background: "#f5f5f5", color: "#666", border: "none", padding: "14px", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}>{t.cancel}</button>
                  </div>
                </div>
              ) : selectedService ? (
                <div>
                  <button onClick={() => setSelectedService(null)} style={{ background: "none", border: "none", color: GREEN, cursor: "pointer", marginBottom: 16, fontSize: 14, fontWeight: 600 }}>← Назад к списку</button>
                  <div style={{ display: "flex", gap: 24, marginBottom: 32, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                    <div style={{ width: isMobile ? "100%" : 160, height: 160, borderRadius: 24, background: "rgba(27,67,50,0.05)", overflow: "hidden" }}>
                      {selectedService.photoUrl ? (
                        <img src={selectedService.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}><User size={64}/></div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h4 style={{ fontSize: 28, fontWeight: 700, color: GREEN, marginBottom: 4 }}>{selectedService.name}</h4>
                          <div style={{ fontSize: 18, color: "#5a8a70", marginBottom: 12 }}>{selectedService.activity}</div>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          {selectedService.authorUid === user.uid && (
                            <>
                              <button onClick={() => handleEditService(selectedService)} style={{ color: GREEN, background: "none", border: "none", cursor: "pointer" }}><Edit3 size={20}/></button>
                              <button onClick={() => handleDeleteService(selectedService.id)} style={{ color: "#e63946", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={20}/></button>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <a href={`tel:${selectedService.phone}`} style={{ textDecoration: "none", background: GREEN, color: "#fff", padding: "12px 24px", borderRadius: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                          <Phone size={18}/> {t.call}
                        </a>
                        {marketplaceTab === "moderation" && (
                          <>
                            <button onClick={() => handleUpdateServiceStatus(selectedService.id, "approved")} style={{ background: "#2d6a4f", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><Check size={18}/> {t.approve}</button>
                            <button onClick={() => handleUpdateServiceStatus(selectedService.id, "rejected")} style={{ background: "#e63946", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><X size={18}/> {t.reject}</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid #eee", paddingTop: 24 }}>
                    <h5 style={{ fontSize: 18, fontWeight: 700, color: GREEN, marginBottom: 16 }}>{t.reviews} ({reviews.length})</h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                      {reviews.length > 0 ? reviews.map(r => (
                        <div key={r.id} style={{ padding: 16, borderRadius: 16, background: "#fcfdfc", border: "1px solid #f0f3f1" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <div style={{ fontWeight: 600, color: GREEN }}>{r.authorName}</div>
                            <div style={{ color: "#f39c12", fontWeight: 700 }}>★ {r.rating}</div>
                          </div>
                          <div style={{ fontSize: 14, color: "#666" }}>{r.comment}</div>
                        </div>
                      )) : <div style={{ textAlign: "center", padding: 20, color: "#999" }}>Пока нет отзывов</div>}
                    </div>

                    <div style={{ background: "rgba(27,67,50,0.02)", padding: 20, borderRadius: 20 }}>
                      <h6 style={{ fontSize: 14, fontWeight: 700, color: GREEN, marginBottom: 12 }}>{t.addReview}</h6>
                      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                        {[1,2,3,4,5].map(star => (
                          <button key={star} onClick={() => setReviewForm({...reviewForm, rating: star})} style={{ background: "none", border: "none", cursor: "pointer", color: reviewForm.rating >= star ? "#f39c12" : "#ddd", fontSize: 20 }}>★</button>
                        ))}
                      </div>
                      <textarea value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} placeholder={t.comment} rows={3} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #eee", marginBottom: 12 }} />
                      <button onClick={handleAddReview} style={{ background: GREEN, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}>{t.save}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
                  {filteredServices.length > 0 ? filteredServices.map(s => (
                    <div key={s.id} onClick={() => setSelectedService(s)} style={{ padding: 20, borderRadius: 24, border: "1px solid #eee", cursor: "pointer", transition: "all 0.2s", position: "relative" }} onMouseEnter={e => e.currentTarget.style.borderColor = GREEN} onMouseLeave={e => e.currentTarget.style.borderColor = "#eee"}>
                      {marketplaceTab === "my" && (
                        <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: s.status === "approved" ? "#2d6a4f" : s.status === "pending" ? "#f39c12" : "#e63946", color: "#fff" }}>
                          {t[s.status]}
                        </div>
                      )}
                      <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: 16, background: "rgba(27,67,50,0.05)", marginBottom: 16, overflow: "hidden" }}>
                        {s.photoUrl ? (
                          <img src={s.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}><User size={32}/></div>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, color: GREEN, marginBottom: 4 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "#5a8a70", marginBottom: 8 }}>{s.activity}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: GREEN }}>{s.phone}</div>
                    </div>
                  )) : (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0", color: "#999" }}>
                      <Search size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
                      <p>{t.noServicesFound}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cleaning Modal */}
      <AnimatePresence>
        {showCleaning && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCleaning(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: "relative", background: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{t.cleaning}</h3>
                <button onClick={() => setShowCleaning(false)} style={{ border: "none", background: "none", color: "#999", cursor: "pointer" }}><XCircle size={24}/></button>
              </div>
              <CleaningService user={user} userProfile={userProfile} lang={lang} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifications(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: "relative", background: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 500, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{t.notifications}</h3>
                <button onClick={() => setShowNotifications(false)} style={{ border: "none", background: "none", color: "#999", cursor: "pointer" }}><XCircle size={24}/></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>{t.noNotifications}</div>
                ) : (
                  notifications.map((n: any) => (
                    <div 
                      key={n.id} 
                      onClick={async () => {
                        if (!n.isRead) {
                          await updateDoc(doc(db, "notifications", n.id), { isRead: true });
                        }
                        if (n.link === "cleaning") setShowCleaning(true);
                        setShowNotifications(false);
                      }}
                      style={{ 
                        padding: 16, borderRadius: 16, background: n.isRead ? "rgba(0,0,0,0.02)" : "rgba(27,67,50,0.05)",
                        border: n.isRead ? "1px solid #eee" : `1px solid ${GREEN}33`,
                        cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      <div style={{ fontWeight: 700, color: GREEN, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                        {n.title}
                        {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e63946" }} />}
                      </div>
                      <div style={{ fontSize: 13, color: "#666", lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: "#999", marginTop: 8 }}>
                        {n.createdAt?.toDate ? format(n.createdAt.toDate(), "dd.MM.yyyy HH:mm") : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Residents Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <ResidentsChat 
            user={user} 
            userProfile={userProfile}
            isAdmin={isAdmin} 
            t={t} 
            onClose={() => setShowChat(false)} 
            lang={lang}
          />
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && userProfile && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfile(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: "relative", background: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 450, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{t.profile}</h3>
                <button onClick={() => setShowProfile(false)} style={{ border: "none", background: "none", color: "#999", cursor: "pointer" }}><XCircle size={24}/></button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{t.fullName}</label>
                  <div style={{ padding: 12, borderRadius: 12, background: "#f5f5f5", color: "#999" }}>{userProfile.fullName}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{t.phone}</label>
                  <input value={userProfile.phone} onChange={e => setUserProfile({...userProfile, phone: e.target.value})} style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{t.activity}</label>
                  <textarea value={userProfile.activity} onChange={e => setUserProfile({...userProfile, activity: e.target.value})} style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", minHeight: 100, resize: "none" }} />
                </div>
                <button 
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, "users", user.uid), { 
                        phone: userProfile.phone, 
                        activity: userProfile.activity 
                      });
                      setShowProfile(false);
                    } catch (e) {
                      handleFirestoreError(e, OperationType.UPDATE, "users");
                    }
                  }} 
                  style={{ background: GREEN, color: "#fff", border: "none", padding: 14, borderRadius: 12, fontWeight: 600, marginTop: 10 }}
                >
                  {t.save}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <ShieldCheck size={32} />
        </div>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: GREEN }}>{t.title}</h1>
          <p style={{ color: "#5a8a70" }}>{t.welcome}, {user?.displayName || (lang === 'kk' ? "Жалға алушы" : "Арендатор")}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32 }}>
        {/* Your Rental */}
        <div style={{ background: "#fff", borderRadius: 32, padding: 40, boxShadow: "0 20px 50px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <Home size={20} color={GREEN} /> {t.yourRental}
          </h3>
          {activeBooking ? (
            <div>
              <div style={{ background: "rgba(27,67,50,0.05)", padding: 24, borderRadius: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: "#5a8a70", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{t.room}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{ROOM_NAMES[activeBooking.roomId]?.[lang] || activeBooking.roomName}</div>
                <div style={{ fontSize: 14, color: activeBooking.status === "active" ? "#2d6a4f" : "#f39c12", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  {activeBooking.status === "active" ? <CheckCircle2 size={16} /> : <Clock size={16} />} 
                  {t.status}: {activeBooking.status === "active" ? t.statusActive : t.statusPending}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 16 }}>
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>{t.period}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {format(activeBooking.startDate?.toDate?.() || new Date(activeBooking.startDate), "dd.MM.yy")} — {format(activeBooking.endDate?.toDate?.() || new Date(activeBooking.endDate), "dd.MM.yy")}
                  </div>
                </div>
                <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 16 }}>
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>{t.total}</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{activeBooking.totalPrice?.toLocaleString()} ₸</div>
                </div>
              </div>
              <button style={{ width: "100%", background: GREEN, color: "#fff", border: "none", padding: "14px", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}>
                {t.pay}
              </button>
            </div>
          ) : (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#999" }}>
              {t.noBookings}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { icon: <MessageCircle />, title: t.chat, desc: t.chatDesc, action: () => setShowChat(true) },
            { icon: <Sparkles />, title: t.cleaning, desc: t.cleaningReminder, action: () => setShowCleaning(true) },
            { icon: <div style={{ position: "relative" }}>
                <Bell />
                {unreadCount > 0 && <div style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "#e63946", border: "2px solid #fff" }} />}
              </div>, title: t.notifications, desc: t.noNotifications, action: () => setShowNotifications(true) },
            { icon: <User />, title: t.profile, desc: t.editProfile, action: () => setShowProfile(true) },
            { icon: <Sparkles />, title: t.marketplace, desc: t.serviceDesc, action: () => setShowMarketplace(true) },
            { icon: <CreditCard />, title: t.payment, desc: t.paymentDesc, action: () => {} }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              onClick={item.action}
              style={{ 
                background: "#fff", 
                padding: 24, 
                borderRadius: 24, 
                boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
                cursor: "pointer",
                border: "1px solid transparent"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GREEN}
              onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(27,67,50,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN, marginBottom: 16 }}>
                {item.icon}
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#5a8a70" }}>{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResidentsChat({ user, userProfile: initialProfile, isAdmin, t, onClose, lang }: { user: any, userProfile: any, isAdmin: boolean, t: any, onClose: () => void, lang: 'ru' | 'kk' }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(initialProfile);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialProfile) setUserProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserProfile(snap.data());
    });
    const q = query(collection(db, "chat_messages"), orderBy("createdAt", "asc"));
    const unsubMessages = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (e) => handleFirestoreError(e, OperationType.LIST, "chat_messages"));

    if (isAdmin) {
      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        setAllUsers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
      return () => { unsubProfile(); unsubMessages(); unsubUsers(); };
    }

    return () => { unsubProfile(); unsubMessages(); };
  }, [user, isAdmin]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (photoUrl?: string) => {
    if (!newMessage.trim() && !photoUrl) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, "chat_messages"), {
        text: newMessage,
        photoUrl: photoUrl || null,
        authorUid: user.uid,
        authorName: userProfile?.fullName || user.displayName || "User",
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "chat_messages");
    } finally {
      setIsSending(false);
    }
  };

  const handlePhotoUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event: any) => {
        const base64 = event.target.result;
        handleSendMessage(base64);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const toggleChatMember = async (userId: string, isMember: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), { isChatMember: isMember });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "users");
    }
  };

  const isMember = userProfile?.isChatMember || isAdmin;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: "relative", background: "#fff", borderRadius: 24, width: "100%", maxWidth: 600, height: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 50px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: GREEN, color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MessageCircle size={24} />
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{t.chatTitle}</h3>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{messages.length} сообщений</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {isAdmin && (
              <button onClick={() => setShowMembers(!showMembers)} style={{ border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <UserPlus size={16} /> {t.members}
              </button>
            )}
            <button onClick={onClose} style={{ border: "none", background: "none", color: "#fff", cursor: "pointer" }}><X size={24}/></button>
          </div>
        </div>

        <div style={{ flex: 1, position: "relative", display: "flex" }}>
          {/* Messages Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8faf9" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.map((msg, i) => {
                const isOwn = msg.authorUid === user.uid;
                return (
                  <div key={msg.id} style={{ alignSelf: isOwn ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                    <div style={{ fontSize: 11, color: "#999", marginBottom: 4, marginLeft: isOwn ? 0 : 4, textAlign: isOwn ? "right" : "left" }}>
                      {msg.authorName}
                    </div>
                    <div style={{ 
                      padding: msg.photoUrl ? "8px" : "12px 16px", 
                      borderRadius: isOwn ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                      background: isOwn ? GREEN : "#fff",
                      color: isOwn ? "#fff" : GREEN,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      border: isOwn ? "none" : "1px solid #eee"
                    }}>
                      {msg.photoUrl && (
                        <img src={msg.photoUrl} alt="chat" style={{ maxWidth: "100%", borderRadius: 12, marginBottom: msg.text ? 8 : 0 }} referrerPolicy="no-referrer" />
                      )}
                      {msg.text && <div style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.text}</div>}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            {isMember ? (
              <div style={{ padding: 20, background: "#fff", borderTop: "1px solid #eee", display: "flex", gap: 12, alignItems: "center" }}>
                <button onClick={handlePhotoUpload} style={{ border: "none", background: "rgba(27,67,50,0.05)", color: GREEN, width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Image size={20} />
                </button>
                <input 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && handleSendMessage()}
                  placeholder={t.typeMessage}
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #eee", outline: "none", fontSize: 14 }}
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isSending || (!newMessage.trim())}
                  style={{ border: "none", background: GREEN, color: "#fff", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: (isSending || !newMessage.trim()) ? 0.5 : 1 }}
                >
                  <Send size={20} />
                </button>
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "#999", fontSize: 14, background: "#fff", borderTop: "1px solid #eee" }}>
                {t.noAccessChat}
              </div>
            )}
          </div>

          {/* Members Sidebar (Admin Only) */}
          <AnimatePresence>
            {showMembers && isAdmin && (
              <motion.div 
                initial={{ x: "100%" }} 
                animate={{ x: 0 }} 
                exit={{ x: "100%" }}
                style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", flexDirection: "column" }}
              >
                <div style={{ padding: 20, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontWeight: 700, color: GREEN }}>{t.allUsers}</h4>
                  <button onClick={() => setShowMembers(false)} style={{ border: "none", background: "none", color: "#999", cursor: "pointer" }}><X size={20}/></button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
                  {allUsers.map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderBottom: "1px solid #f5f5f5" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(27,67,50,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}>
                        <User size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{u.fullName}</div>
                        <div style={{ fontSize: 11, color: "#999" }}>{u.email} • {u.activity}</div>
                      </div>
                      <button 
                        onClick={() => toggleChatMember(u.id, !u.isChatMember)}
                        style={{ 
                          border: "none", 
                          padding: "6px 12px", 
                          borderRadius: 8, 
                          fontSize: 12, 
                          fontWeight: 600, 
                          cursor: "pointer",
                          background: u.isChatMember ? "rgba(230,57,70,0.1)" : "rgba(45,106,79,0.1)",
                          color: u.isChatMember ? "#e63946" : GREEN2
                        }}
                      >
                        {u.isChatMember ? "Удалить" : "Добавить"}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default InteractiveMap;
