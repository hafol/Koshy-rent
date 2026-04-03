/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, ReactNode, CSSProperties } from "react";
import { Home, Building2, BedDouble, MapPin, Wifi, Car, UtensilsCrossed, ShieldCheck, ChevronDown, ChevronUp, ArrowRight, Phone, MessageCircle, Clock, Star, Sparkles, Trees, Coffee, Menu, X, Languages, Layout, LogIn, LogOut, Plus, Trash2, Image as ImageIcon, Loader2, Map as MapIcon, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, setDoc, updateDoc, where, getDocs } from "firebase/firestore";
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from "./firebase";
import { InteractiveMap, TenantDashboard } from "./components/InteractiveMap";
import { AdminERP } from "./components/AdminERP";

const SAGE = "#c8ddd2";
const GREEN = "#1b4332";
const GREEN2 = "#2d6a4f";
const GREEN3 = "#40916c";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode, delay?: number, className?: string, key?: any }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(36px)",
      transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`
    }}>
      {children}
    </div>
  );
}

function GlassCard({ children, style = {}, hover = true, featured = false }: { children: ReactNode, style?: CSSProperties, hover?: boolean, featured?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: featured
          ? `linear-gradient(135deg, rgba(27,67,50,0.95), rgba(45,106,79,0.9))`
          : `rgba(255,255,255,${hov ? "0.65" : "0.45"})`,
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        border: `1px solid rgba(255,255,255,${featured ? "0.18" : "0.7"})`,
        borderRadius: 20,
        transform: hov && hover ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov && hover
          ? "0 24px 64px rgba(27,67,50,0.18), 0 8px 24px rgba(27,67,50,0.1)"
          : "0 4px 24px rgba(27,67,50,0.08)",
        transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        ...style
      }}
    >
      {children}
    </div>
  );
}

function PillBadge({ children, green = false }: { children: ReactNode, green?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: green ? "rgba(27,67,50,0.12)" : "rgba(255,255,255,0.5)",
      backdropFilter: "blur(16px)",
      border: `1px solid ${green ? "rgba(27,67,50,0.2)" : "rgba(255,255,255,0.8)"}`,
      color: green ? GREEN : "#2d4a3e",
      fontSize: 12, fontWeight: 500, letterSpacing: "0.04em",
      padding: "5px 12px", borderRadius: 100,
    }}>
      {children}
    </span>
  );
}

function GreenBtn({ children, onClick, outline = false, style = {} }: { children: ReactNode, onClick?: () => void, outline?: boolean, style?: CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: outline
          ? hov ? "rgba(27,67,50,0.08)" : "rgba(255,255,255,0.55)"
          : hov ? GREEN2 : GREEN,
        backdropFilter: "blur(12px)",
        color: outline ? GREEN : "#fff",
        border: outline ? `1.5px solid rgba(27,67,50,0.35)` : "1.5px solid transparent",
        borderRadius: 100, padding: "12px 26px",
        fontSize: 14, fontWeight: 500, letterSpacing: "0.03em",
        cursor: "pointer",
        transform: hov ? "translateY(-2px) scale(1.02)" : "scale(1)",
        boxShadow: hov && !outline ? "0 12px 32px rgba(27,67,50,0.35)" : "none",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        ...style
      }}
    >
      {children}
    </button>
  );
}

const MARQUEE_ITEMS = [
  { icon: <Wifi size={13}/>, key: "wifi" },
  { icon: <Layout size={13}/>, key: "parking" },
  { icon: <UtensilsCrossed size={13}/>, key: "kitchen" },
  { icon: <ShieldCheck size={13}/>, key: "security" },
  { icon: <MapPin size={13}/>, key: "location" },
  { icon: <Coffee size={13}/>, key: "cafe" },
  { icon: <Trees size={13}/>, key: "quiet" },
  { icon: <Building2 size={13}/>, key: "rooms" },
];

function Marquee({ lang, t, onHide }: { lang: 'ru' | 'kk', t: any, onHide: () => void }) {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ position: "relative", overflow: "hidden", background: GREEN, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <style>{`
        @keyframes marqueeAnim { from { transform: translateX(0) } to { transform: translateX(-33.333%) } }
        .mq-track { display: flex; width: max-content; animation: marqueeAnim 30s linear infinite; }
        .mq-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="mq-track">
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 7,
            color: "rgba(255,255,255,0.7)", fontSize: 12,
            letterSpacing: "0.08em", textTransform: "uppercase",
            fontWeight: 400, whiteSpace: "nowrap", padding: "0 28px"
          }}>
            <span style={{ color: "rgba(200,221,210,0.8)" }}>{item.icon}</span>
            {t.marquee[item.key]}
          </div>
        ))}
      </div>
      <button 
        onClick={onHide}
        style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
          width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", cursor: "pointer", zIndex: 10
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

const TRANSLATIONS = {
  ru: {
    nav: { rental: "Аренда", features: "Объект", gallery: "Галерея", contact: "Контакт", btn: "Оставить заявку" },
    hero: { badge: "Свободно к аренде · г. Қосшы", title: "Ваш бизнес рядом с Астаной", sub: "Двухэтажный коттедж 300 м², 8 комнат в г. Қосшы — 20 минут от столицы. Аренда целиком, поэтажно или по комнатам.", btn1: "Смотреть варианты", btn2: "Галерея объекта", scroll: "прокрутить", interested: "Уже интересуются", stats: ["300 м²", "8 комнат", "2 этажа", "20 мин от Астаны"] },
    marquee: {
      wifi: "Высокоскоростной Wi-Fi",
      parking: "Гибкая планировка",
      kitchen: "Готовая кухня",
      security: "Безопасность",
      location: "20 мин до Астаны",
      cafe: "Под кафе / ресторан",
      quiet: "Тихий район",
      rooms: "2 этажа · 8 комнат"
    },
    rental: { 
      tag: "варианты аренды", 
      title: "Гибкие условия", 
      desc: "Выберите формат — от отдельной комнаты до всего здания. Все варианты включают Wi-Fi и удобный доступ.",
      options: [
        {
          tag: "Популярный выбор",
          label: "Вариант А",
          title: "Всё здание",
          price: "1 020 000",
          sub: "₸ / месяц",
          desc: "Полный доступ к 2-этажному коттеджу 300 м². Идеально под кафе, офис, учебный центр или корпоративный объект.",
          features: ["3400 ₸ / м²", "8 комнат", "2 этажа", "Wi-Fi"],
          featured: true,
        },
        {
          tag: "Флекс-вариант",
          label: "Вариант Б",
          title: "Этаж целиком",
          price: "476 000",
          sub: "₸ / месяц",
          desc: "Аренда 1-го или 2-го этажа. Отдельный вход, полное распоряжение пространством от 140 м².",
          features: ["3400 ₸ / м²", "4 комнаты", "Санузел", "Отдельный вход"],
          featured: false,
        },
        {
          tag: "Стартовый",
          label: "Вариант В",
          title: "Комната",
          price: "131 920",
          sub: "₸ / месяц",
          desc: "Отдельная комната (3400 ₸ / м²). Общие зоны — в совместном пользовании. Коммунальные услуги включены.",
          features: ["3400 ₸ / м²", "Wi-Fi включён", "Коммуналка"],
          featured: false,
        },
      ]
    },
    features: { 
      tag: "об объекте", 
      title: "Пространство с коммерческим потенциалом",
      items: [
        { title: "300 м²", desc: "Двухэтажный коттедж с просторными комнатами и высокими потолками" },
        { title: "20 мин от Астаны", desc: "г. Қосшы, Акмолинская обл. — спокойный район рядом со столицей" },
        { title: "Готовая кухня", desc: "Оборудована для коммерческого использования — под кафе или корпоративное питание" },
        { title: "Гибкая планировка", desc: "Возможность адаптировать пространство под любой вид коммерческой деятельности" },
        { title: "Потенциал под кафе", desc: "Планировка и инфраструктура изначально рассматривались под заведение" },
        { title: "Безопасность", desc: "Закрытая территория, надёжные двери, возможность видеонаблюдения" },
      ]
    },
    gallery: { tag: "галерея", title: "Посмотрите на пространство", add: "Добавить фото", items: ["Главный зал", "Кухня", "Комната 1", "2-й этаж", "Территория", "Вид"] },
    contact: { 
      tag: "связаться", 
      title: "Обсудим вашу аренду", 
      desc: "Оставьте заявку — мы ответим в течение часа и организуем показ в удобное время.", 
      labels: { 
        name: "Ваше имя", 
        phone: "Телефон / WhatsApp", 
        option: "Вариант аренды", 
        message: "Сообщение", 
        btn: "Отправить заявку",
        address: "Адрес",
        phoneLabel: "Телефон",
        schedule: "Режим работы",
        whatsapp: "Написать в WhatsApp",
        selectPlaceholder: "Выберите вариант"
      }, 
      placeholders: {
        name: "Иван Иванов",
        message: "Расскажите о вашем бизнесе..."
      },
      options: [
        "Всё здание — 1 020 000 ₸/мес",
        "Этаж — от 476 000 ₸/мес",
        "Комната — от 70 380 ₸/мес",
        "Обсудить индивидуально"
      ],
      success: "Заявка отправлена!", 
      successSub: "Мы свяжемся с вами в течение часа.",
      info: {
        address: "г. Қосшы, ул. Сүйінбай 126 · 20 мин от Астаны",
        schedule: "Пн–Пт 9:00–19:00 · Показ по договоренности"
      }
    },
    common: { 
      language: "Язык", 
      near: "рядом", 
      astana: "с Астаной", 
      heroTitlePrefix: "Ваш бизнес",
      rotatingPhrases: [
        "рядом с Астаной",
        "в центре перспектив",
        "в новом масштабе",
        "под ваш выбор",
        "для вашего успеха",
        "в новом формате",
        "в хорошей среде"
      ]
    },
    footer: { terms: "Условия", privacy: "Конфиденциальность" },
    auth: { login: "Войти", logout: "Выйти" },
    map: {
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
      selectRoom: "Выберите помещение на плане, чтобы увидеть подробную информацию"
    },
    cabinet: {
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
      profile: "Профиль",
      editProfile: "Редактировать профиль",
      fullName: "ФИО",
      dob: "Дата рождения",
      phone: "Телефон",
      iin: "ИИН",
      activity: "Вид деятельности",
      save: "Сохранить",
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
    registration: {
      title: "Завершение регистрации",
      desc: "Пожалуйста, заполните данные для доступа к кабинету",
      fullName: "Полное имя (ФИО)",
      dob: "Дата рождения",
      phone: "Номер телефона",
      iin: "ИИН",
      activity: "Вид деятельности (чем планируете заниматься)",
      submit: "Завершить регистрацию",
      skip: "Пропустить"
    }
  },
  kk: {
    nav: { rental: "Жалға алу", features: "Нысан", gallery: "Галерея", contact: "Контакт", btn: "Өтінім қалдыру" },
    hero: { badge: "Жалға алуға бос · Қосшы қ.", title: "Сіздің бизнесіңіз Астананың жанында", sub: "Қосшы қаласындағы 300 м² екі қабатты коттедж, 8 бөлме — елордадан 20 минуттық жерде. Толықтай, қабат бойынша немесе бөлмелеп жалға беріледі.", btn1: "Нұсқаларды көру", btn2: "Нысан галереясы", scroll: "төмен айналдыру", interested: "Қызығушылық танытуда", stats: ["300 м²", "8 бөлме", "2 қабат", "Астанадан 20 мин"] },
    marquee: {
      wifi: "Жоғары жылдамдықты Wi-Fi",
      parking: "Икемді жоспарлау",
      kitchen: "Дайын ас үй",
      security: "Қауіпсіздік",
      location: "Астанаға 20 мин",
      cafe: "Кафе / мейрамхана үшін",
      quiet: "Тыныш аудан",
      rooms: "2 қабат · 8 бөлме"
    },
    rental: { 
      tag: "жалға алу нұсқалары", 
      title: "Икемді шарттар", 
      desc: "Форматты таңдаңыз — жеке бөлмеден бүкіл ғимаратқа дейін. Барлық нұсқаларға Wi-Fi мен ыңғайлы қолжетімділік кіреді.",
      options: [
        {
          tag: "Танымал таңдау",
          label: "А нұсқасы",
          title: "Бүкіл ғимарат",
          price: "1 020 000",
          sub: "₸ / айына",
          desc: "300 м² екі қабатты коттеджге толық қолжетімділік. Кафе, кеңсе, оқу орталығы немесе корпоративтік нысан үшін өте қолайлы.",
          features: ["3400 ₸ / м²", "8 бөлме", "2 қабат", "Wi-Fi"],
          featured: true,
        },
        {
          tag: "Флекс-нұсқа",
          label: "Б нұсқасы",
          title: "Толық қабат",
          price: "476 000",
          sub: "₸ / айына",
          desc: "1-ші немесе 2-ші қабатты жалға алу. Жеке кіреберіс, 140 м²-ден бастап кеңістікті толық пайдалану.",
          features: ["3400 ₸ / м²", "4 бөлме", "Санузел", "Жеке кіреберіс"],
          featured: false,
        },
        {
          tag: "Бастапқы",
          label: "В нұсқасы",
          title: "Бөлме",
          price: "131 920",
          sub: "₸ / айына",
          desc: "Жеке бөлме (3400 ₸ / м²). Ортақ аймақтар — бірлесіп пайдалануда. Коммуналдық қызметтер кіреді.",
          features: ["3400 ₸ / м²", "Wi-Fi қосылған", "Коммуналдық қызметтер"],
          featured: false,
        },
      ]
    },
    features: { 
      tag: "нысан туралы", 
      title: "Коммерциялық әлеуеті бар кеңістік",
      items: [
        { title: "300 м²", desc: "Кең бөлмелері мен биік төбелері бар екі қабатты коттедж" },
        { title: "Астанадан 20 мин", desc: "Қосшы қ., Ақмола обл. — елорда жанындағы тыныш аудан" },
        { title: "Дайын ас үй", desc: "Коммерциялық пайдалануға жабдықталған — кафе немесе корпоративтік тамақтану үшін" },
        { title: "Икемді жоспарлау", desc: "Кеңістікті кез келген коммерциялық қызмет түріне бейімдеу мүмкіндігі" },
        { title: "Кафе үшін әлеует", desc: "Жоспарлау мен инфрақұрылым бастапқыда мекеме ретінде қарастырылған" },
        { title: "Қауіпсіздік", desc: "Жабық аумақ, сенімді есіктер, бейнебақылау мүмкіндігі" },
      ]
    },
    gallery: { tag: "галерея", title: "Кеңістікті тамашалаңыз", add: "Фото қосу", items: ["Басты зал", "Ас үй", "1-бөлме", "2-қабат", "Аумақ", "Көрініс"] },
    contact: { 
      tag: "байланысу", 
      title: "Жалға алуды талқылайық", 
      desc: "Өтінім қалдырыңыз — біз бір сағат ішінде жауап береміз және ыңғайлы уақытта көрсетілім ұйымдастырамыз.", 
      labels: { 
        name: "Сіздің есіміңіз", 
        phone: "Телефон / WhatsApp", 
        option: "Жалға алу нұсқасы", 
        message: "Хабарлама", 
        btn: "Өтінімді жіберу",
        address: "Мекенжай",
        phoneLabel: "Телефон",
        schedule: "Жұмыс режимі",
        whatsapp: "WhatsApp-қа жазу",
        selectPlaceholder: "Нұсқаны таңдаңыз"
      }, 
      placeholders: {
        name: "Асхат Қайратов",
        message: "Бизнесіңіз туралы айтып беріңіз..."
      },
      options: [
        "Бүкіл ғимарат — 1 020 000 ₸/ай",
        "Қабат — 476 000 ₸/ай бастап",
        "Бөлме — 70 380 ₸/ай бастап",
        "Жеке талқылау"
      ],
      success: "Өтінім жіберілді!", 
      successSub: "Біз сізбен бір сағат ішінде байланысамыз.",
      info: {
        address: "Қосшы қ., Сүйінбай көш. 126 · Астанадан 20 мин",
        schedule: "Дс–Жм 9:00–19:00 · Көрсетілім келісім бойынша"
      }
    },
    common: { 
      language: "Тіл", 
      near: "жанында", 
      astana: "Астананың", 
      heroTitlePrefix: "Сіздің бизнесіңіз",
      rotatingPhrases: [
        "Астананың жанында",
        "болашақ орталығында",
        "жаңа ауқымда",
        "сіздің таңдауыңыз бойынша",
        "сіздің табысыңыз үшін",
        "жаңа форматта",
        "жақсы ортада"
      ]
    },
    footer: { terms: "Шарттар", privacy: "Құпиялылық" },
    auth: { login: "Кіру", logout: "Шығу" },
    map: {
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
      selectRoom: "Толық ақпаратты көру үшін жоспардағы бөлмені таңдаңыз"
    },
    cabinet: {
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
      profile: "Профиль",
      editProfile: "Профильді өңдеу",
      fullName: "Аты-жөні",
      dob: "Туған күні",
      phone: "Телефон",
      iin: "ЖСН",
      activity: "Қызмет түрі",
      save: "Сақтау",
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
      cleaningReminderDesc: "Әр жексенбіде біз тазалықты еске саламыз. Клинингке тапсырыс беру үшін басыңыз."
    },
    registration: {
      title: "Тіркеуді аяқтау",
      desc: "Кабинетке кіру үшін деректерді толтырыңыз",
      fullName: "Толық аты-жөні",
      dob: "Туған күні",
      phone: "Телефон нөмірі",
      iin: "ЖСН",
      activity: "Қызмет түрі (немен айналысуды жоспарлайсыз)",
      submit: "Тіркеуді аяқтау",
      skip: "Өткізіп жіберу"
    }
  }
};

function LanguageSwitcher({ lang, setLang, inHeader = false }: { lang: 'ru' | 'kk', setLang: (l: 'ru' | 'kk') => void, inHeader?: boolean }) {
  const containerStyle: React.CSSProperties = inHeader ? {
    display: "flex", gap: 2, background: "rgba(27,67,50,0.06)",
    borderRadius: 100, padding: 2, border: "1px solid rgba(27,67,50,0.1)",
    marginRight: 8
  } : {
    position: "fixed", top: 24, right: 24, zIndex: 200,
    display: "flex", gap: 4, background: "rgba(255,255,255,0.45)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: 100, padding: 4, boxShadow: "0 12px 40px rgba(27,67,50,0.15)"
  };

  return (
    <motion.div 
      initial={inHeader ? false : { opacity: 0, x: 20 }}
      animate={inHeader ? {} : { opacity: 1, x: 0 }}
      transition={{ delay: 1.5, duration: 0.8 }}
      style={containerStyle}
    >
      {!inHeader && (
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px", color: GREEN }}>
          <Languages size={15} />
        </div>
      )}
      {(['ru', 'kk'] as const).map(l => (
        <button
          key={l}
          onClick={(e) => {
            e.stopPropagation();
            setLang(l);
          }}
          style={{
            border: "none", borderRadius: 100, 
            padding: inHeader ? "4px 12px" : "8px 16px",
            fontSize: inHeader ? 11 : 12, 
            fontWeight: 700, cursor: "pointer",
            background: lang === l ? GREEN : "transparent",
            color: lang === l ? "#fff" : GREEN,
            textTransform: "uppercase", transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {l}
        </button>
      ))}
    </motion.div>
  );
}

function TextRotator({ phrases }: { phrases: string[] }) {
  const [index, setIndex] = React.useState(0);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [phrases.length]);

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center",
      alignItems: "center",
      position: "relative", 
      height: isMobile ? "2.2em" : "1.6em", 
      overflow: "hidden",
      width: "100%",
    }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          style={{ 
            display: "block", 
            fontStyle: "italic", 
            color: GREEN2,
            position: "absolute",
            width: "100%",
            lineHeight: 1.1,
            textAlign: "center",
            padding: "0 10px"
          }}
        >
          {phrases[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function Header({ 
  isMobile, t, scrollTo, scrollY, isMenuOpen, setIsMenuOpen, lang, setLang, isHeaderHidden, setIsHeaderHidden, user, view, setView 
}: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAdmin = user?.email === "pzhumash@gmail.com";

  useEffect(() => {
    const timer = setTimeout(() => setIsExpanded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const headerWidth = isExpanded 
    ? (isMobile ? "calc(100% - 32px)" : "min(90%, 1160px)") 
    : (isMobile ? "240px" : "320px");

  return (
    <motion.div
      initial={{ y: -100, opacity: 0, x: "-50%" }}
      animate={{ 
        y: isHeaderHidden ? -120 : (scrollY > 60 ? 12 : 24), 
        opacity: isHeaderHidden ? 0 : 1, 
        x: "-50%",
        width: headerWidth,
        backgroundColor: scrollY > 60 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
        backdropFilter: scrollY > 60 ? "blur(30px)" : "blur(15px)",
        borderRadius: isExpanded ? (scrollY > 60 ? 24 : 32) : 100,
        boxShadow: scrollY > 60 
          ? "0 20px 40px rgba(27,67,50,0.12), inset 0 0 0 1px rgba(255,255,255,0.5)" 
          : "0 10px 30px rgba(27,67,50,0.05)",
      }}
      transition={{ 
        y: { duration: 0.6, ease: "easeOut" },
        width: { duration: 0.8, ease: [0.65, 0, 0.35, 1] },
        x: { duration: 0 },
        backgroundColor: { duration: 0.4 },
        backdropFilter: { duration: 0.4 },
        borderRadius: { duration: 0.8 }
      }}
      style={{
        position: "fixed", 
        top: 0, 
        left: "50%", 
        zIndex: 150,
        WebkitBackdropFilter: scrollY > 60 ? "blur(30px)" : "blur(15px)",
        border: scrollY > 60 ? "1px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.4)",
        padding: isExpanded ? (isMobile ? "12px 20px" : "12px 28px") : "10px 24px",
        display: "flex", 
        flexDirection: "column", 
        gap: 8,
        overflow: isMenuOpen ? "visible" : "hidden",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", minHeight: 40 }}>
        <motion.div 
          layout
          onClick={() => setView("landing")}
          style={{ 
            fontFamily: "'DM Serif Display', serif", 
            fontSize: isMobile ? 19 : 24, 
            color: GREEN, 
            letterSpacing: "-0.01em", 
            whiteSpace: "nowrap", 
            flexShrink: 0,
            position: "relative",
            zIndex: 2,
            cursor: "pointer"
          }}
        >
          Koshy Cottage
        </motion.div>
        
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 20, flex: 1, justifyContent: "flex-end" }}
            >
              {!isMobile && (
                <>
                  <div style={{ display: "flex", gap: 28, marginRight: 12 }}>
                    {[["rental", t.nav.rental],["features", t.nav.features],["gallery", t.nav.gallery],["contact", t.nav.contact]].map(([id, label]) => (
                      <button key={id} onClick={() => { setView("landing"); setTimeout(() => scrollTo(id), 100); }} style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 13, fontWeight: 600, color: view === "landing" ? "#3a6b50" : "rgba(58,107,80,0.5)",
                        letterSpacing: "0.02em", transition: "color 0.2s",
                        whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif"
                      }}
                      onMouseEnter={e => (e.target as HTMLButtonElement).style.color = GREEN}
                      onMouseLeave={e => (e.target as HTMLButtonElement).style.color = view === "landing" ? "#3a6b50" : "rgba(58,107,80,0.5)"}
                      >{label}</button>
                    ))}
                  </div>
                  
                  <LanguageSwitcher lang={lang} setLang={setLang} inHeader={true} />

                  <GreenBtn onClick={() => scrollTo("contact")} style={{ padding: "10px 24px", fontSize: 13, whiteSpace: "nowrap" }}>
                    {t.nav.btn}
                  </GreenBtn>
                </>
              )}

              {isMobile && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button 
                    onClick={() => setIsHeaderHidden(true)}
                    style={{ background: "none", border: "none", color: GREEN, cursor: "pointer", padding: 8, display: "flex", alignItems: "center", opacity: 0.6 }}
                    title="Скрыть меню"
                  >
                    <ChevronUp size={24}/>
                  </button>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{ background: "none", border: "none", color: GREEN, cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }}
                  >
                    {isMenuOpen ? <X size={28}/> : <Menu size={28}/>}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!isExpanded && !isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", alignItems: "center" }}
          >
            <GreenBtn onClick={() => scrollTo("contact")} style={{ padding: "8px 16px", fontSize: 12, whiteSpace: "nowrap" }}>
              {t.nav.btn}
            </GreenBtn>
          </motion.div>
        )}
      </div>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobile && isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "absolute", top: "100%", left: 0, right: 0, marginTop: 12,
              background: "rgba(255,255,255,0.95)", backdropFilter: "blur(24px)",
              padding: "24px", borderRadius: 32, border: "1px solid rgba(255,255,255,0.7)",
              display: "flex", flexDirection: "column", gap: 16,
              boxShadow: "0 20px 50px rgba(27,67,50,0.15)",
            }}
          >
            {[["rental", t.nav.rental],["features", t.nav.features],["gallery", t.nav.gallery],["contact", t.nav.contact]].map(([id, label]) => (
              <button key={id} onClick={() => { scrollTo(id); setIsMenuOpen(false); }} style={{
                background: "none", border: "none", textAlign: "left",
                fontSize: 16, fontWeight: 600, color: GREEN,
                letterSpacing: "0.04em", padding: "12px 0", borderBottom: "1px solid rgba(27,67,50,0.05)"
              }}>{label}</button>
            ))}
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: GREEN }}>{t.common.language}</span>
              <LanguageSwitcher lang={lang} setLang={setLang} inHeader={true} />
            </div>

            <GreenBtn onClick={() => { scrollTo("contact"); setIsMenuOpen(false); }} style={{ width: "100%", padding: "16px", fontSize: 16, marginTop: 8 }}>
              {t.nav.btn}
            </GreenBtn>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FloatingNav({ view, setView, user, lang, notifications }: any) {
  if (!user) return null;
  
  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;
  
  const navItems = [
    { id: "landing", label: lang === 'ru' ? "Главная" : "Басты", icon: <Home size={18} /> },
    { id: "map", label: lang === 'ru' ? "Карта" : "Карта", icon: <MapIcon size={18} /> },
    { id: "tenant", label: lang === 'ru' ? "Кабинет" : "Кабинет", icon: (
      <div style={{ position: "relative" }}>
        <UserIcon size={18} />
        {unreadCount > 0 && (
          <div style={{
            position: "absolute", top: -4, right: -4,
            width: 8, height: 8, borderRadius: "50%",
            background: "#e63946", border: "2px solid rgba(27,67,50,0.9)"
          }} />
        )}
      </div>
    ) },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        zIndex: 200,
        background: "rgba(27,67,50,0.9)",
        backdropFilter: "blur(20px)",
        padding: "8px",
        borderRadius: "20px",
        display: "flex",
        gap: "4px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.1)"
      }}
    >
      {navItems.map((item) => {
        const isActive = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            style={{
              background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
              border: "none",
              borderRadius: "14px",
              padding: "10px 16px",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s",
              minWidth: "70px"
            }}
          >
            <motion.div
              animate={{ scale: isActive ? 1.1 : 1 }}
              style={{ opacity: isActive ? 1 : 0.6 }}
            >
              {item.icon}
            </motion.div>
            <span style={{ 
              fontSize: "10px", 
              fontWeight: 600, 
              opacity: isActive ? 1 : 0.6,
              letterSpacing: "0.02em"
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}

function RegistrationModal({ user, t, onComplete, onSkip }: { user: User, t: any, onComplete: () => void, onSkip: () => void }) {
  const [formData, setFormData] = useState({
    fullName: user.displayName || "",
    dob: "",
    phone: "",
    iin: "",
    activity: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.dob || !formData.phone || !formData.iin) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        email: user.email,
        photoURL: user.photoURL,
        role: "tenant",
        isChatMember: false,
        createdAt: serverTimestamp()
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ position: "relative", background: "#fff", borderRadius: 32, padding: 40, width: "100%", maxWidth: 500, boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{t.title}</h2>
          <button onClick={onSkip} style={{ border: "none", background: "rgba(0,0,0,0.05)", color: "#666", padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {t.skip || "Пропустить"}
          </button>
        </div>
        <p style={{ color: "#666", marginBottom: 32 }}>{t.desc}</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: GREEN }}>{t.fullName}</label>
            <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid #eee", fontSize: 15, outline: "none", background: "#fcfdfc" }} />
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: GREEN }}>{t.dob}</label>
              <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid #eee", fontSize: 15, outline: "none", background: "#fcfdfc" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: GREEN }}>{t.phone}</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid #eee", fontSize: 15, outline: "none", background: "#fcfdfc" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: GREEN }}>{t.iin}</label>
            <input value={formData.iin} onChange={e => setFormData({...formData, iin: e.target.value})} style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid #eee", fontSize: 15, outline: "none", background: "#fcfdfc" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: GREEN }}>{t.activity}</label>
            <textarea value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid #eee", fontSize: 15, outline: "none", background: "#fcfdfc", minHeight: 100, resize: "none" }} />
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={loading || !formData.fullName || !formData.dob || !formData.phone || !formData.iin}
            style={{ 
              background: GREEN, color: "#fff", border: "none", padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, marginTop: 12, cursor: "pointer",
              opacity: (loading || !formData.fullName || !formData.dob || !formData.phone || !formData.iin) ? 0.5 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : t.submit}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<'ru' | 'kk'>('ru');
  const t = TRANSLATIONS[lang];
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", option: "", message: "" });
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasSkippedRegistration, setHasSkippedRegistration] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);
  const [galleryCategories, setGalleryCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showMarquee, setShowMarquee] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideMarquee') !== 'true';
    }
    return true;
  });

  const handleHideMarquee = () => {
    setShowMarquee(false);
    localStorage.setItem('hideMarquee', 'true');
  };

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [view, setView] = useState<string>("landing");
  const [notifications, setNotifications] = useState<any[]>([]);

  const isAdmin = user?.email === "pzhumash@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          // If profile is complete, definitely close registration
          if (data.fullName && data.phone && data.iin && data.dob) {
            setIsRegistrationOpen(false);
          } else if (!hasSkippedRegistration) {
            setIsRegistrationOpen(true);
          }
        } else {
          if (!hasSkippedRegistration) {
            setIsRegistrationOpen(true);
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });
      return () => unsub();
    } else {
      setUserProfile(null);
      setIsRegistrationOpen(false);
      setHasSkippedRegistration(false);
    }
  }, [user, hasSkippedRegistration]);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const images = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGalleryImages(images);
      setIsGalleryLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "gallery");
      setIsGalleryLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "gallery_categories"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty && user?.email === "pzhumash@gmail.com") {
        const defaults = [
          { name: "Главный зал", icon: "home", order: 0, authorUid: user?.uid },
          { name: "Кухня", icon: "utensils", order: 1, authorUid: user?.uid },
          { name: "Комната 1", icon: "bed", order: 2, authorUid: user?.uid },
          { name: "2-й этаж", icon: "building", order: 3, authorUid: user?.uid },
          { name: "Территория", icon: "trees", order: 4, authorUid: user?.uid },
          { name: "Вид", icon: "sparkles", order: 5, authorUid: user?.uid }
        ];
        defaults.forEach(cat => addDoc(collection(db, "gallery_categories"), cat));
      }
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGalleryCategories(categories);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "gallery_categories");
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    const resizeHandler = () => setIsMobile(window.innerWidth < 960);
    
    window.addEventListener("scroll", handler);
    window.addEventListener("resize", resizeHandler);
    resizeHandler();
    
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  // Sunday Notification Logic
  useEffect(() => {
    if (!user || userProfile?.role !== 'tenant') return;

    const checkSundayReminder = async () => {
      const today = new Date();
      if (today.getDay() === 0) { // Sunday
        const dateStr = today.toISOString().split('T')[0];
        try {
          const q = query(
            collection(db, "notifications"), 
            where("userId", "==", user.uid),
            where("type", "==", "cleaning_reminder"),
            where("dateStr", "==", dateStr)
          );
          const snap = await getDocs(q);
          if (snap.empty) {
            await addDoc(collection(db, "notifications"), {
              userId: user.uid,
              title: t.cabinet.cleaningReminder,
              message: t.cabinet.cleaningReminderDesc,
              type: "cleaning_reminder",
              dateStr: dateStr,
              link: "cleaning",
              isRead: false,
              createdAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.error("Error checking Sunday reminder:", err);
        }
      }
    };

    checkSundayReminder();
  }, [user, userProfile, lang]);

  // Fetch Notifications
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "notifications");
    });
    return () => unsub();
  }, [user]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  const handleSubmit = () => {
    if (formData.name && formData.phone) {
      const message = `Новая заявка!\nИмя: ${formData.name}\nТелефон: ${formData.phone}\nВариант: ${formData.option}\nСообщение: ${formData.message}`;
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/77053701298?text=${encoded}`, '_blank');
      setSent(true);
    }
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: `linear-gradient(160deg, #e8f2ec 0%, #d4e8dc 30%, #c8ddd2 60%, #deeee6 100%)`,
      minHeight: "100vh", overflowX: "hidden", color: "#0f2d20"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(27,67,50,0.2); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #d4e8dc; }
        ::-webkit-scrollbar-thumb { background: #40916c; border-radius: 3px; }
        input, select, textarea, button { font-family: inherit; }
        @keyframes floatOrb { 0%,100%{transform:translate(0,0)} 33%{transform:translate(30px,-20px)} 66%{transform:translate(-20px,15px)} }
        @keyframes pulseGreen { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.6)} }
        @keyframes scrollAnim { 0%{transform:scaleY(0);transform-origin:top} 50%{transform:scaleY(1);transform-origin:top} 51%{transform:scaleY(1);transform-origin:bottom} 100%{transform:scaleY(0);transform-origin:bottom} }
      `}</style>

      {/* BG ORBS */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {[
          { w: 600, h: 600, top: "-10%", left: "-8%", delay: "0s", color: "rgba(100,200,140,0.25)" },
          { w: 450, h: 450, top: "30%", right: "-5%", delay: "3s", color: "rgba(64,145,108,0.2)" },
          { w: 350, h: 350, bottom: "10%", left: "30%", delay: "6s", color: "rgba(160,220,190,0.22)" },
        ].map((orb, i) => (
          <div key={i} style={{
            position: "absolute", width: orb.w, height: orb.h,
            top: orb.top, left: orb.left, right: orb.right, bottom: orb.bottom,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: "blur(60px)",
            animation: `floatOrb ${18 + i * 4}s ease-in-out infinite`,
            animationDelay: orb.delay,
          }}/>
        ))}
      </div>

      <AnimatePresence>
        {isRegistrationOpen && user && (
          <RegistrationModal 
            user={user} 
            t={t.registration} 
            onComplete={() => setIsRegistrationOpen(false)} 
            onSkip={() => {
              setHasSkippedRegistration(true);
              setIsRegistrationOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <Header 
        isMobile={isMobile} 
        t={t} 
        scrollTo={scrollTo} 
        scrollY={scrollY} 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen} 
        lang={lang}
        setLang={setLang}
        isHeaderHidden={isHeaderHidden}
        setIsHeaderHidden={setIsHeaderHidden}
        user={user}
        view={view}
        setView={setView}
      />

      {/* ADMIN PANEL MODAL */}
      <AnimatePresence>
        {isAdminPanelOpen && user?.email === "pzhumash@gmail.com" && (
          <AdminPanel 
            onClose={() => setIsAdminPanelOpen(false)} 
            user={user} 
            galleryImages={galleryImages}
            galleryCategories={galleryCategories}
            lang={lang}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      {/* HEADER TOGGLE BUTTON (MOBILE ONLY) */}
      {isMobile && isHeaderHidden && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsHeaderHidden(false)}
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 200,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            border: `1px solid rgba(27,67,50,0.1)`,
            color: GREEN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 25px rgba(27,67,50,0.15)",
            cursor: "pointer"
          }}
        >
          <Menu size={24} />
        </motion.button>
      )}

      {/* VIEW CONTENT */}
      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* HERO */}
            <section style={{ minHeight: isMobile ? "auto" : "92vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "4rem 1.5rem" : "5rem 2rem 4rem", textAlign: "center", position: "relative", zIndex: 1 }}>

        {/* tag */}
        <div style={{ marginBottom: 20 }}>
          <PillBadge>
            <span style={{ width: 7, height: 7, background: GREEN3, borderRadius: "50%", animation: "pulseGreen 2s infinite" }}/>
            {t.hero.badge}
          </PillBadge>
        </div>

        {/* headline */}
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: isMobile ? "2.2rem" : "clamp(3.2rem, 6.5vw, 6rem)",
          fontWeight: 400, lineHeight: 1.1,
          color: GREEN, marginBottom: 24, 
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center"
        }}>
          {t.common.heroTitlePrefix}
          <div style={{ fontSize: isMobile ? "0.75em" : "0.85em", width: "100%", marginTop: "-0.2em" }}>
            <TextRotator phrases={t.common.rotatingPhrases} />
          </div>
        </h1>

        <p style={{ fontSize: 16, color: "#3a6b50", fontWeight: 300, maxWidth: "44ch", lineHeight: 1.75, marginBottom: 36 }}>
          {t.hero.sub}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
          <GreenBtn onClick={() => scrollTo("rental")}>
            {t.hero.btn1} <ArrowRight size={15}/>
          </GreenBtn>
          <GreenBtn outline onClick={() => scrollTo("gallery")}>
            {t.hero.btn2}
          </GreenBtn>
        </div>

        {/* social proof */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}
        >
          <div style={{ display: "flex" }}>
            {["АК","НМ","ДС","+5"].map((initials, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "2px solid #fff",
                background: [GREEN, GREEN2, GREEN3, "#52b788"][i],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#fff", fontWeight: 700,
                marginLeft: i === 0 ? 0 : -12,
                boxShadow: "0 4px 12px rgba(27,67,50,0.15)",
              }}>{initials}</div>
            ))}
          </div>
          <div style={{ fontSize: 14, color: "#3a6b50", fontWeight: 500 }}>
            {t.hero.interested}
          </div>
        </motion.div>

        {/* stat pills */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { icon: <Building2 size={13}/>, text: t.hero.stats[0] },
            { icon: <BedDouble size={13}/>, text: t.hero.stats[1] },
            { icon: <Home size={13}/>, text: t.hero.stats[2] },
            { icon: <MapPin size={13}/>, text: t.hero.stats[3] },
          ].map((p, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.75)", borderRadius: 100,
              padding: "7px 14px", fontSize: 12, color: GREEN2, fontWeight: 400,
            }}>
              <span style={{ color: GREEN3 }}>{p.icon}</span>{p.text}
            </div>
          ))}
        </div>

        {/* scroll hint */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", color: "#5a8a70" }}>
          <div style={{ width: 1, height: 36, background: `linear-gradient(to bottom, ${GREEN2}, transparent)`, animation: "scrollAnim 2.2s 1s infinite" }}/>
        </div>
      </section>

      {/* MARQUEE */}
      {showMarquee && <Marquee lang={lang} t={t} onHide={handleHideMarquee}/>}

      {/* RENTAL OPTIONS */}
      <section id="rental" style={{ padding: "7rem 2rem", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 22, height: 1, background: GREEN3 }}/>
              <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: GREEN3, fontWeight: 500 }}>{t.rental.tag}</span>
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 400, color: GREEN, marginBottom: 8 }}>
              {t.rental.title}
            </h2>
            <p style={{ fontSize: 15, color: "#4a7a60", fontWeight: 300, maxWidth: "44ch", lineHeight: 1.7, marginBottom: 48 }}>
              {t.rental.desc}
            </p>
          </Reveal>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {t.rental.options.map((opt: any, i: number) => {
              const icons = [<Building2 size={22}/>, <Home size={22}/>, <BedDouble size={22}/>];
              return (
                <Reveal key={i} delay={i * 0.1}>
                  <GlassCard featured={opt.featured} hover={false} style={{ padding: isMobile ? "1.5rem" : "2.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr auto", gap: isMobile ? 24 : 32, alignItems: isMobile ? "start" : "center" }}>
                      {/* left */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: isMobile ? "auto" : 200 }}>
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: opt.featured ? "rgba(255,255,255,0.15)" : "rgba(27,67,50,0.08)",
                          borderRadius: 100, padding: "4px 12px",
                          fontSize: 11, fontWeight: 500, letterSpacing: "0.06em",
                          color: opt.featured ? "rgba(255,255,255,0.8)" : GREEN3,
                          alignSelf: "flex-start"
                        }}>
                          <Star size={10} fill="currentColor"/> {opt.tag}
                        </div>
                        <div style={{
                          width: 46, height: 46, borderRadius: 14,
                          background: opt.featured ? "rgba(255,255,255,0.15)" : "rgba(27,67,50,0.08)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: opt.featured ? "rgba(255,255,255,0.9)" : GREEN2,
                        }}>
                          {icons[i]}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: opt.featured ? "rgba(255,255,255,0.5)" : "#5a8a70", marginBottom: 4 }}>{opt.label}</div>
                          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 22 : 26, fontWeight: 400, color: opt.featured ? "#fff" : GREEN }}>{opt.title}</div>
                        </div>
                      </div>

                      {/* middle */}
                      <div style={{ paddingLeft: isMobile ? 0 : 16, borderLeft: isMobile ? "none" : `1px solid ${opt.featured ? "rgba(255,255,255,0.15)" : "rgba(27,67,50,0.1)"}`, paddingTop: isMobile ? 16 : 0, borderTop: isMobile ? `1px solid ${opt.featured ? "rgba(255,255,255,0.15)" : "rgba(27,67,50,0.1)"}` : "none" }}>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 32, fontWeight: 400, color: opt.featured ? "#fff" : GREEN, lineHeight: 1 }}>
                          {opt.price} <span style={{ fontSize: 16, color: opt.featured ? "rgba(255,255,255,0.5)" : "#5a8a70", fontFamily: "inherit" }}>{opt.sub}</span>
                        </div>
                        <p style={{ fontSize: 14, color: opt.featured ? "rgba(255,255,255,0.6)" : "#4a7a60", fontWeight: 300, lineHeight: 1.65, marginTop: 10, maxWidth: "40ch" }}>
                          {opt.desc}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                          {opt.features.map((f: string, fi: number) => (
                            <span key={fi} style={{
                              fontSize: 11, padding: "4px 10px", borderRadius: 100,
                              background: opt.featured ? "rgba(255,255,255,0.12)" : "rgba(27,67,50,0.07)",
                              color: opt.featured ? "rgba(255,255,255,0.75)" : GREEN2,
                              border: `1px solid ${opt.featured ? "rgba(255,255,255,0.15)" : "rgba(27,67,50,0.12)"}`,
                              fontWeight: 400,
                            }}>{f}</span>
                          ))}
                        </div>
                      </div>

                      {/* right */}
                      <div style={{ marginTop: isMobile ? 8 : 0 }}>
                        <GreenBtn
                          outline={!opt.featured}
                          onClick={() => scrollTo("contact")}
                          style={{ 
                            width: isMobile ? "100%" : "auto", 
                            justifyContent: "center",
                            background: !opt.featured ? "rgba(255,255,255,0.55)" : undefined,
                            backdropFilter: !opt.featured ? "blur(12px)" : undefined 
                          }}
                        >
                          {t.nav.btn} <ArrowRight size={14}/>
                        </GreenBtn>
                      </div>
                    </div>
                  </GlassCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{
        padding: "7rem 2rem",
        background: `linear-gradient(160deg, ${GREEN} 0%, #2d6a4f 100%)`,
        position: "relative", zIndex: 1, overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: "none" }}/>
        <div style={{ maxWidth: 1160, margin: "0 auto", position: "relative" }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 22, height: 1, background: "rgba(200,221,210,0.5)" }}/>
              <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(200,221,210,0.7)", fontWeight: 500 }}>{t.features.tag}</span>
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 400, color: "#fff", marginBottom: 48 }}>
              {t.features.title}
            </h2>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {t.features.items.map((f: any, i: number) => {
              const icons = [
                <Building2 size={20}/>, <MapPin size={20}/>, <UtensilsCrossed size={20}/>,
                <Layout size={20}/>, <Coffee size={20}/>, <ShieldCheck size={20}/>
              ];
              return (
                <Reveal key={i} delay={i * 0.08}>
                  <div style={{
                    background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 18, padding: isMobile ? "1.5rem" : "2rem",
                    transition: "background 0.3s, transform 0.3s",
                    cursor: "default",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 13,
                      background: "rgba(200,221,210,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: SAGE, marginBottom: 18,
                    }}>{icons[i]}</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginBottom: 8 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: "rgba(200,221,210,0.65)", lineHeight: 1.7, fontWeight: 300 }}>{f.desc}</div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" style={{ padding: "7rem 2rem", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 22, height: 1, background: GREEN3 }}/>
              <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: GREEN3, fontWeight: 500 }}>{t.gallery.tag}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 20 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 400, color: GREEN, margin: 0 }}>
                {t.gallery.title}
              </h2>
              {selectedCategoryId && (
                <button 
                  onClick={() => setSelectedCategoryId(null)}
                  style={{ background: "none", border: "none", color: GREEN, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500 }}
                >
                  <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} />
                  {lang === 'ru' ? "Назад к категориям" : "Санаттарға оралу"}
                </button>
              )}
            </div>
          </Reveal>

          <Reveal>
            <AnimatePresence mode="wait">
              {!selectedCategoryId ? (
                <motion.div 
                  key="categories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)",
                    gap: 16,
                  }}
                >
                  {galleryCategories.map((cat, i) => {
                    const catPhotos = galleryImages.filter(img => img.categoryId === cat.id);
                    const coverImg = catPhotos[0]?.url;
                    
                    return (
                      <div 
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        style={{
                          height: isMobile ? 180 : 240,
                          background: coverImg ? `url(${coverImg}) center/cover no-referrer` : `rgba(255,255,255,0.45)`,
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.65)",
                          borderRadius: 22,
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center", gap: 10,
                          cursor: "pointer", transition: "all 0.3s",
                          position: "relative", overflow: "hidden",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                      >
                        {coverImg && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(27,67,50,0.3)", zIndex: 1 }} />
                        )}
                        <div style={{ 
                          width: 48, height: 48, borderRadius: 14, 
                          background: coverImg ? "rgba(255,255,255,0.2)" : "rgba(27,67,50,0.1)", 
                          display: "flex", alignItems: "center", justifyContent: "center", 
                          color: coverImg ? "#fff" : GREEN2,
                          zIndex: 2, backdropFilter: "blur(4px)"
                        }}>
                          {cat.icon === 'utensils' ? <UtensilsCrossed size={20}/> : 
                           cat.icon === 'bed' ? <BedDouble size={20}/> :
                           cat.icon === 'building' ? <Building2 size={20}/> :
                           cat.icon === 'trees' ? <Trees size={20}/> :
                           cat.icon === 'sparkles' ? <Sparkles size={20}/> :
                           <Home size={20}/>}
                        </div>
                        <span style={{ 
                          fontSize: 14, color: coverImg ? "#fff" : GREEN2, 
                          letterSpacing: "0.08em", textTransform: "uppercase", 
                          fontWeight: 600, textAlign: "center", zIndex: 2,
                          textShadow: coverImg ? "0 2px 4px rgba(0,0,0,0.3)" : "none"
                        }}>
                          {cat.name}
                        </span>
                        <span style={{ 
                          fontSize: 11, color: coverImg ? "rgba(255,255,255,0.8)" : "#5a8a70", 
                          fontWeight: 400, zIndex: 2 
                        }}>
                          {catPhotos.length} {lang === 'ru' ? "фото" : "фото"}
                        </span>
                        {user?.email === "pzhumash@gmail.com" && (
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(lang === 'ru' ? "Удалить категорию и все её фото?" : "Санатты және оның барлық фотоларын өшіру?")) {
                                // Delete all photos in category first
                                for (const img of catPhotos) {
                                  await deleteDoc(doc(db, "gallery", img.id));
                                }
                                await deleteDoc(doc(db, "gallery_categories", cat.id));
                              }
                            }}
                            style={{
                              position: "absolute", top: 12, right: 12,
                              background: "rgba(230, 57, 70, 0.9)", color: "#fff",
                              border: "none", borderRadius: "50%", width: 28, height: 28,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", zIndex: 10
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  
                  {isAdmin && (
                    <div 
                      style={{
                        height: isMobile ? 180 : 240,
                        background: "rgba(27,67,50,0.05)",
                        border: `2px dashed ${GREEN}33`,
                        borderRadius: 22,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 10,
                        cursor: "pointer", color: GREEN,
                        padding: 20
                      }}
                    >
                      {isAddingCategory ? (
                        <div 
                          onClick={e => e.stopPropagation()}
                          style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}
                        >
                          <input 
                            autoFocus
                            type="text" 
                            placeholder={lang === 'ru' ? "Название..." : "Атауы..."}
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && newCategoryName && !isSaving) {
                                setIsSaving(true);
                                try {
                                  await addDoc(collection(db, "gallery_categories"), {
                                    name: newCategoryName,
                                    icon: "home",
                                    order: galleryCategories.length,
                                    authorUid: user?.uid
                                  });
                                  setNewCategoryName("");
                                  setIsAddingCategory(false);
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.CREATE, "gallery_categories");
                                } finally {
                                  setIsSaving(false);
                                }
                              }
                              if (e.key === 'Escape') setIsAddingCategory(false);
                            }}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${GREEN}33`, fontSize: 14 }}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button 
                              disabled={!newCategoryName || isSaving}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (newCategoryName && !isSaving) {
                                  setIsSaving(true);
                                  try {
                                    await addDoc(collection(db, "gallery_categories"), {
                                      name: newCategoryName,
                                      icon: "home",
                                      order: galleryCategories.length,
                                      authorUid: user?.uid
                                    });
                                    setNewCategoryName("");
                                    setIsAddingCategory(false);
                                  } catch (err) {
                                    handleFirestoreError(err, OperationType.CREATE, "gallery_categories");
                                  } finally {
                                    setIsSaving(false);
                                  }
                                }
                              }}
                              style={{ 
                                flex: 1, background: GREEN, color: "#fff", border: "none", 
                                padding: "8px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                                opacity: (!newCategoryName || isSaving) ? 0.5 : 1,
                                cursor: (!newCategoryName || isSaving) ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center"
                              }}
                            >
                              {isSaving ? <Loader2 size={14} className="animate-spin" /> : "OK"}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setIsAddingCategory(false); }}
                              style={{ flex: 1, background: "rgba(0,0,0,0.05)", color: "#666", border: "none", padding: "8px", borderRadius: 8, fontSize: 13 }}
                            >
                              {lang === 'ru' ? "Отмена" : "Болдырмау"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => setIsAddingCategory(true)}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%", height: "100%", justifyContent: "center" }}
                        >
                          <Plus size={24} />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{lang === 'ru' ? "Добавить категорию" : "Санат қосу"}</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="photos"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)",
                    gridAutoRows: isMobile ? "180px" : "240px",
                    gap: 16,
                  }}
                >
                  {isGalleryLoading ? (
                    <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
                      <Loader2 size={32} className="animate-spin" style={{ color: GREEN }} />
                    </div>
                  ) : galleryImages.filter(img => img.categoryId === selectedCategoryId).length === 0 && !isAdmin ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: "#666" }}>
                      {lang === 'ru' ? "В этой категории пока нет фото" : "Бұл санатта әзірге фотосуреттер жоқ"}
                    </div>
                  ) : (
                    galleryImages.filter(img => img.categoryId === selectedCategoryId).map((img, i) => (
                      <motion.div 
                        key={img.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          position: "relative",
                          borderRadius: 22,
                          overflow: "hidden",
                          boxShadow: "0 4px 24px rgba(27,67,50,0.08)"
                        }}
                      >
                        <img 
                          src={img.url} 
                          alt={img.caption || "Gallery"} 
                          referrerPolicy="no-referrer"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        {isAdmin && (
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(lang === 'ru' ? "Удалить фото?" : "Фотоны өшіру?")) {
                                await deleteDoc(doc(db, "gallery", img.id));
                              }
                            }}
                            style={{
                              position: "absolute", top: 12, right: 12,
                              background: "rgba(230, 57, 70, 0.9)", color: "#fff",
                              border: "none", borderRadius: "50%", width: 32, height: 32,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", zIndex: 10
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </motion.div>
                    ))
                  )}
                  
                  {isAdmin && (
                    <div 
                      style={{
                        height: isMobile ? 180 : 240,
                        background: "rgba(27,67,50,0.05)",
                        border: `2px dashed ${GREEN}33`,
                        borderRadius: 22,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 10,
                        cursor: "pointer", color: GREEN,
                        padding: 20
                      }}
                    >
                      {isAddingPhoto ? (
                        <div 
                          onClick={e => e.stopPropagation()}
                          style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}
                        >
                          <input 
                            autoFocus
                            type="text" 
                            placeholder={lang === 'ru' ? "URL фото..." : "Фото URL..."}
                            value={newPhotoUrl}
                            onChange={e => setNewPhotoUrl(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && newPhotoUrl && !isSaving) {
                                setIsSaving(true);
                                try {
                                  await addDoc(collection(db, "gallery"), {
                                    url: newPhotoUrl,
                                    categoryId: selectedCategoryId,
                                    createdAt: serverTimestamp(),
                                    authorUid: user?.uid
                                  });
                                  setNewPhotoUrl("");
                                  setIsAddingPhoto(false);
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.CREATE, "gallery");
                                } finally {
                                  setIsSaving(false);
                                }
                              }
                              if (e.key === 'Escape') setIsAddingPhoto(false);
                            }}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${GREEN}33`, fontSize: 14 }}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button 
                              disabled={!newPhotoUrl || isSaving}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (newPhotoUrl && !isSaving) {
                                  setIsSaving(true);
                                  try {
                                    await addDoc(collection(db, "gallery"), {
                                      url: newPhotoUrl,
                                      categoryId: selectedCategoryId,
                                      createdAt: serverTimestamp(),
                                      authorUid: user?.uid
                                    });
                                    setNewPhotoUrl("");
                                    setIsAddingPhoto(false);
                                  } catch (err) {
                                    handleFirestoreError(err, OperationType.CREATE, "gallery");
                                  } finally {
                                    setIsSaving(false);
                                  }
                                }
                              }}
                              style={{ 
                                flex: 1, background: GREEN, color: "#fff", border: "none", 
                                padding: "8px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                                opacity: (!newPhotoUrl || isSaving) ? 0.5 : 1,
                                cursor: (!newPhotoUrl || isSaving) ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center"
                              }}
                            >
                              {isSaving ? <Loader2 size={14} className="animate-spin" /> : "OK"}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setIsAddingPhoto(false); }}
                              style={{ flex: 1, background: "rgba(0,0,0,0.05)", color: "#666", border: "none", padding: "8px", borderRadius: 8, fontSize: 13 }}
                            >
                              {lang === 'ru' ? "Отмена" : "Болдырмау"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => setIsAddingPhoto(true)}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%", height: "100%", justifyContent: "center" }}
                        >
                          <Plus size={24} />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{lang === 'ru' ? "Добавить фото" : "Фото қосу"}</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Reveal>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{
        padding: isMobile ? "4rem 1.5rem" : "7rem 2rem",
        background: `linear-gradient(145deg, #163d2b, #1b4332, #2d6a4f)`,
        position: "relative", zIndex: 1,
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 48 : 64, alignItems: "start" }}>
          <Reveal>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 22, height: 1, background: "rgba(200,221,210,0.4)" }}/>
                <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(200,221,210,0.6)", fontWeight: 500 }}>{t.contact.tag}</span>
              </div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 400, color: "#fff", marginBottom: 16, lineHeight: 1.15 }}>
                {t.contact.title}
              </h2>
              <p style={{ fontSize: 15, color: "rgba(200,221,210,0.6)", fontWeight: 300, lineHeight: 1.7, marginBottom: 36, maxWidth: "38ch" }}>
                {t.contact.desc}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { icon: <MapPin size={15}/>, label: t.contact.labels.address, val: t.contact.info.address },
                  { icon: <Phone size={15}/>, label: t.contact.labels.phoneLabel, val: "+7 (705) 370 12 98", link: "tel:+77053701298" },
                  { icon: <MessageCircle size={15}/>, label: "WhatsApp", val: t.contact.labels.whatsapp, link: "https://wa.me/77053701298" },
                  { icon: <Clock size={15}/>, label: t.contact.labels.schedule, val: t.contact.info.schedule },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: "rgba(200,221,210,0.1)", border: "1px solid rgba(200,221,210,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "rgba(200,221,210,0.7)", marginTop: 2,
                    }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(200,221,210,0.35)", marginBottom: 3 }}>{item.label}</div>
                      {item.link ? (
                        <a href={item.link} target={item.link.startsWith('http') ? "_blank" : undefined} rel="noreferrer" style={{ fontSize: 14, color: "rgba(200,221,210,0.75)", fontWeight: 300, textDecoration: "none" }}>
                          {item.val}
                        </a>
                      ) : (
                        <div style={{ fontSize: 14, color: "rgba(200,221,210,0.75)", fontWeight: 300 }}>{item.val}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <GlassCard style={{
              background: "rgba(255,255,255,0.07)", backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.12)", padding: isMobile ? "1.5rem" : "2.5rem",
            }} hover={false}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(200,221,210,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: SAGE }}>
                    <Sparkles size={24}/>
                  </div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#fff", marginBottom: 8 }}>{t.contact.success}</div>
                  <div style={{ fontSize: 14, color: "rgba(200,221,210,0.6)", fontWeight: 300 }}>{t.contact.successSub}</div>
                </div>
              ) : (
                <>
                  {[
                    { label: t.contact.labels.name, key: "name", type: "text", placeholder: t.contact.placeholders.name },
                    { label: t.contact.labels.phone, key: "phone", type: "text", placeholder: "+7 (705) 370 12 98" },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key} style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(200,221,210,0.4)", marginBottom: 8 }}>{label}</label>
                      <input type={type} placeholder={placeholder} value={formData[key as keyof typeof formData]}
                        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                        style={{
                          width: "100%", background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
                          color: "rgba(255,255,255,0.85)", padding: "12px 14px",
                          fontSize: 14, fontWeight: 300, outline: "none",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={e => e.target.style.borderColor = "rgba(200,221,210,0.45)"}
                        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                      />
                    </div>
                  ))}

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(200,221,210,0.4)", marginBottom: 8 }}>{t.contact.labels.option}</label>
                    <select value={formData.option} onChange={e => setFormData(p => ({ ...p, option: e.target.value }))}
                      style={{
                        width: "100%", background: "rgba(27,67,50,0.8)",
                        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
                        color: "rgba(255,255,255,0.75)", padding: "12px 14px",
                        fontSize: 14, fontWeight: 300, outline: "none", cursor: "pointer",
                      }}>
                      <option value="">{t.contact.labels.selectPlaceholder}</option>
                      {t.contact.options.map((opt: string) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(200,221,210,0.4)", marginBottom: 8 }}>{t.contact.labels.message}</label>
                    <textarea value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                      placeholder={t.contact.placeholders.message}
                      rows={4}
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
                        color: "rgba(255,255,255,0.85)", padding: "12px 14px",
                        fontSize: 14, fontWeight: 300, outline: "none", resize: "vertical",
                      }}
                      onFocus={e => e.target.style.borderColor = "rgba(200,221,210,0.45)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={handleSubmit} 
                    style={{
                      width: "100%", background: "#fff", color: GREEN,
                      border: "none", borderRadius: 100, padding: "14px",
                      fontSize: 14, fontWeight: 500, cursor: "pointer",
                      letterSpacing: "0.04em",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.25s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = SAGE; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    {t.contact.labels.btn} <ArrowRight size={15}/>
                  </button>
                </>
              )}
            </GlassCard>
          </Reveal>
        </div>
      </section>
          </motion.div>
        )}

        {view === "map" && user && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ paddingTop: 120, minHeight: "100vh" }}
          >
            <InteractiveMap 
              user={user} 
              userProfile={userProfile}
              lang={lang} 
              onBookingSuccess={() => {
                console.log("Booking success! Switching to tenant view.");
                setView("tenant");
              }} 
              openRegistration={() => setIsRegistrationOpen(true)}
            />
          </motion.div>
        )}

        {view === "tenant" && user && (
          <motion.div
            key="tenant"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ paddingTop: 120, minHeight: "100vh" }}
          >
            <TenantDashboard user={user} lang={lang} notifications={notifications} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING NAV */}
      <FloatingNav view={view} setView={setView} user={user} lang={lang} notifications={notifications} />

      {/* FOOTER */}
      <div style={{
        background: "#112d1e", borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: isMobile ? "32px 24px" : "20px 32px", 
        display: "flex", flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "center" : "center", 
        justifyContent: "space-between",
        gap: isMobile ? 24 : 0,
        textAlign: isMobile ? "center" : "left"
      }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "rgba(200,221,210,0.4)" }}>Koshy Cottage</div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {[t.footer.terms, t.footer.privacy].map(link => (
            <a key={link} href="#" style={{ fontSize: 12, color: "rgba(200,221,210,0.25)", textDecoration: "none" }}>{link}</a>
          ))}
          {user ? (
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {user.email === "pzhumash@gmail.com" && (
                <span 
                  onClick={() => setIsAdminPanelOpen(true)}
                  style={{ cursor: "pointer", color: SAGE, fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Layout size={14}/> Admin Panel
                </span>
              )}
              <span 
                onClick={() => logout()}
                style={{ cursor: "pointer", color: "rgba(200,221,210,0.4)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
              >
                <LogOut size={14}/> {t.auth.logout}
              </span>
            </div>
          ) : (
            <span 
              onClick={() => loginWithGoogle()}
              style={{ cursor: "pointer", color: "rgba(200,221,210,0.25)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
            >
              <LogIn size={14}/> {t.auth.login}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "rgba(200,221,210,0.2)", letterSpacing: "0.06em" }}>© 2026 Koshy Cottage Rental</div>
      </div>
    </div>
  );
}

function AdminPanel({ onClose, user, galleryImages, galleryCategories, lang, isMobile }: { onClose: () => void, user: User | null, galleryImages: any[], galleryCategories: any[], lang: 'ru' | 'kk', isMobile: boolean }) {
  const [activeTab, setActiveTab] = useState<"gallery" | "erp">("erp");
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!url || !categoryId) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "gallery"), {
        url,
        categoryId,
        createdAt: serverTimestamp(),
        authorUid: user?.uid
      });
      setUrl("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Удалить это фото?")) return;
    try {
      await deleteDoc(doc(db, "gallery", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(27,67,50,0.8)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          background: "#fff", borderRadius: 24, padding: isMobile ? 16 : 32,
          width: "100%", maxWidth: activeTab === "erp" ? 1000 : 600, maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          transition: "max-width 0.3s ease"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 24, gap: 16 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <h2 
              onClick={() => setActiveTab("erp")}
              style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 20 : 24, color: activeTab === "erp" ? GREEN : "#999", cursor: "pointer", borderBottom: activeTab === "erp" ? `2px solid ${GREEN}` : "none", paddingBottom: 4 }}
            >
              ERP Analytics
            </h2>
            <h2 
              onClick={() => setActiveTab("gallery")}
              style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 20 : 24, color: activeTab === "gallery" ? GREEN : "#999", cursor: "pointer", borderBottom: activeTab === "gallery" ? `2px solid ${GREEN}` : "none", paddingBottom: 4 }}
            >
              Gallery
            </h2>
          </div>
          <div style={{ display: "flex", gap: 12, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-end" }}>
            <button onClick={() => logout()} style={{ border: "none", background: "none", color: "#666", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <LogOut size={14}/> Logout
            </button>
            <button onClick={onClose} style={{ border: "none", background: "none", color: GREEN, cursor: "pointer" }}>
              <X size={24}/>
            </button>
          </div>
        </div>

        {activeTab === "erp" ? (
          <AdminERP lang={lang} />
        ) : (
          <>
            <div style={{ background: "rgba(27,67,50,0.05)", padding: 20, borderRadius: 16, marginBottom: 32 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: GREEN }}>{lang === 'ru' ? "Загрузить новое фото" : "Жаңа фото жүктеу"}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <select 
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14 }}
                >
                  <option value="">{lang === 'ru' ? "Выберите категорию" : "Санатты таңдаңыз"}</option>
                  {galleryCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <input 
                  type="text" placeholder={lang === 'ru' ? "Ссылка на фото (URL)" : "Фото сілтемесі (URL)"}
                  value={url} onChange={e => setUrl(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14 }}
                />
                <button 
                  onClick={handleUpload} 
                  disabled={loading || !url || !categoryId}
                  style={{ 
                    background: GREEN, color: "#fff", border: "none", padding: "12px", 
                    borderRadius: 8, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: (loading || !url || !categoryId) ? 0.6 : 1
                  }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
                  {lang === 'ru' ? "Добавить в галерею" : "Галереяға қосу"}
                </button>
              </div>
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: GREEN }}>{lang === 'ru' ? "Управление фото" : "Фотоларды басқару"} ({galleryImages.length})</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {galleryImages.map(img => (
                <div key={img.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "1/1" }}>
                  <img src={img.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer"/>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 10, padding: 4, textAlign: "center" }}>
                    {galleryCategories.find(c => c.id === img.categoryId)?.name || "..."}
                  </div>
                  <button 
                    onClick={() => handleDelete(img.id)}
                    style={{
                      position: "absolute", top: 4, right: 4,
                      width: 28, height: 28, borderRadius: 8,
                      background: "rgba(255,255,255,0.9)", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#e63946", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
