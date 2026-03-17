import Link from "next/link";
import {
  ClipboardCheck,
  Stamp,
  FileCheck,
  Layers,
  Search,
  ShieldCheck,
  Eye,
  Smartphone,
  Palette,
  TrendingUp,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LandingHeader } from "@/components/landing/landing-header";
import { ContactForm } from "@/components/landing/contact-form";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link */}
      <a
        href="#como-funciona"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-brand-accent focus:text-white focus:rounded-sm"
      >
        Ir al contenido
      </a>

      <LandingHeader />

      {/* Hero */}
      <section className="w-full min-h-[70vh] min-[900px]:min-h-[80vh] bg-gradient-to-b from-brand-primary to-[#0F172A] flex items-center justify-center px-6 pt-16">
        <div className="max-w-[768px] text-center flex flex-col items-center gap-5 min-[900px]:gap-6 py-12 min-[900px]:py-24">
          <h1 className="text-3xl min-[900px]:text-[48px] min-[900px]:leading-[1.1] font-extrabold text-white max-w-[600px] tracking-tight">
            El historial que cada auto debería tener.
          </h1>
          <p className="text-lg text-gray-400 max-w-[500px]">
            VinDex construye identidad vehicular documentada — una verificación
            profesional a la vez.
          </p>
          <div className="flex flex-col min-[900px]:flex-row gap-3 min-[900px]:gap-4 w-full min-[900px]:w-auto mt-4">
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center h-12 px-8 rounded-sm bg-brand-accent text-white font-semibold text-base hover:bg-brand-accent/90 transition-colors"
            >
              Cómo funciona
            </a>
            <a
              href="#contacto"
              className="inline-flex items-center justify-center h-12 px-8 rounded-sm border border-white/50 text-white font-medium text-base hover:bg-white/10 transition-colors"
            >
              ¿Sos verificador? Contactanos
            </a>
          </div>
          <p className="text-xs text-white/40 mt-6">
            Identidad vehicular documentada &middot; Inmutable &middot;
            Profesional
          </p>
        </div>
      </section>

      {/* The Idea */}
      <section className="w-full bg-white py-12 min-[900px]:py-16">
        <div className="max-w-[640px] mx-auto px-6 text-center">
          <h2 className="text-2xl min-[900px]:text-[30px] min-[900px]:leading-snug font-bold text-gray-800">
            Hoy, comprar un usado es un acto de fe
          </h2>
          <p className="text-base text-gray-500 leading-relaxed mt-6">
            No hay forma confiable de saber qué le hicieron al auto que estás
            viendo. VinDex cambia eso: documenta desde la fuente, con los profesionales que lo
            ven y trabajan en él directamente.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="w-full bg-gray-50 py-12 min-[900px]:py-16 scroll-mt-16">
        <div className="max-w-[1024px] mx-auto px-6 text-center">
          <h2 className="text-2xl min-[900px]:text-[32px] font-bold text-gray-800">
            Cómo funciona
          </h2>

          <div className="grid grid-cols-1 min-[900px]:grid-cols-4 gap-8 min-[900px]:gap-6 mt-10 relative">
            {/* Connecting line — desktop only */}
            <div className="hidden min-[900px]:block absolute top-12 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-gray-300" />

            <StepCard
              number={1}
              icon={<ClipboardCheck className="size-8 text-gray-600" />}
              title="Un profesional evalúa el vehículo"
              description="Un verificador o taller registrado evalúa el vehículo y documenta su estado real, punto por punto."
            />
            <StepCard
              number={2}
              icon={<Stamp className="size-8 text-gray-600" />}
              title="El resultado queda vinculado al VIN"
              description="Firmado, inmutable, vinculado a la identidad del vehículo para siempre."
            />
            <StepCard
              number={3}
              icon={<FileCheck className="size-8 text-gray-600" />}
              title="El cliente recibe un informe profesional"
              description="Un link con preview visual, listo para compartir en publicaciones o por WhatsApp."
            />
            <StepCard
              number={4}
              icon={<Layers className="size-8 text-gray-600" />}
              title="El vehículo acumula su historia"
              description="Cada servicio profesional se vincula al VIN. Cuando alguien quiera saber qué pasó con ese auto, la información va a estar."
            />
          </div>
        </div>
      </section>

      {/* Buyers Section */}
      <section id="compradores" className="w-full bg-white py-12 min-[900px]:py-16 scroll-mt-16">
        <div className="max-w-[1024px] mx-auto px-6 text-center">
          <h2 className="text-2xl min-[900px]:text-[32px] font-bold text-gray-800">
            Confianza con evidencia
          </h2>
          <p className="text-base text-gray-500 mt-2">
            Consultá el historial documentado de un vehículo antes de tomar una
            decisión.
          </p>

          <div className="grid grid-cols-1 min-[900px]:grid-cols-3 gap-6 mt-10">
            <FeatureCard
              icon={<Search className="size-9 text-brand-accent" />}
              title="Consultá el historial"
              description="Accedé a todo lo documentado sobre un vehículo por su VIN. Cada verificación y servicio registrado, en un solo lugar."
              variant="muted"
            />
            <FeatureCard
              icon={<ShieldCheck className="size-9 text-brand-accent" />}
              title="Inmutable por diseño"
              description="Una vez firmado, nadie puede alterar lo que el profesional encontró. Lo que ves es lo que se documentó."
              variant="muted"
            />
            <FeatureCard
              icon={<Eye className="size-9 text-brand-accent" />}
              title="Transparencia total"
              description="Sabé quién pidió la verificación, quién la hizo, cuándo, y a qué kilometraje. Sin zonas grises."
              variant="muted"
            />
          </div>
        </div>
      </section>

      {/* Inspectors Section */}
      <section id="verificadores" className="w-full bg-gray-50 py-12 min-[900px]:py-16 scroll-mt-16">
        <div className="max-w-[1024px] mx-auto px-6 text-center">
          <h2 className="text-2xl min-[900px]:text-[32px] font-bold text-gray-800">
            Tu herramienta, tu marca, tu historial
          </h2>
          <p className="text-base text-gray-500 mt-2">
            Todo lo que necesitás para ofrecer verificaciones profesionales.
          </p>

          <div className="grid grid-cols-1 min-[900px]:grid-cols-3 gap-6 mt-10">
            <FeatureCard
              icon={<Smartphone className="size-9 text-brand-accent" />}
              title="Una herramienta superior"
              description="Formularios estructurados, fotos integradas, funciona offline. Más rápido y profesional que tu método actual."
            />
            <FeatureCard
              icon={<Palette className="size-9 text-brand-accent" />}
              title="Tu marca, no la nuestra"
              description="Reportes white-label con tu identidad prominente. La plataforma queda en segundo plano."
            />
            <FeatureCard
              icon={<TrendingUp className="size-9 text-brand-accent" />}
              title="Reputación que se acumula"
              description="Cada verificación construye tu perfil profesional: cantidad de verificaciones, nivel de detalle, reseñas de compradores."
            />
          </div>
        </div>
      </section>

      {/* Vehicle Timeline */}
      <section
        id="historial"
        className="w-full bg-brand-primary py-12 min-[900px]:py-16 scroll-mt-16"
      >
        <div className="max-w-[1024px] mx-auto px-6 text-center flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl min-[900px]:text-[32px] font-bold text-white">
              Un VIN, toda su vida documentada
            </h2>
            <p className="text-base text-gray-400 leading-relaxed max-w-[560px]">
              Verificaciones, servicios y reparaciones se vinculan al VIN. Con el
              tiempo, se construye un registro profesional que habla por sí
              solo.
            </p>
          </div>

          <ol className="w-full max-w-[520px] min-[900px]:max-w-none min-[900px]:grid min-[900px]:grid-cols-4 min-[900px]:items-start min-[900px]:gap-0 flex flex-col text-left pt-2">
            <TimelineEvent
              date="Mar 2026"
              description="Verificación pre-compra"
              meta="78.400 km · Verif. Martínez"
            />
            <TimelineEvent
              date="Sep 2026"
              description="Cambio de aceite y filtros"
              meta="87.000 km · Taller López"
            />
            <TimelineEvent
              date="Dic 2026"
              description="Alineación y balanceo"
              meta="93.200 km · Taller López"
            />
            <TimelineEvent
              date="Mar 2027"
              description="Verificación periódica"
              meta="104.800 km · Verif. Martínez"
              isLast
            />
          </ol>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="w-full bg-gray-50 py-12 min-[900px]:py-16 scroll-mt-16">
        <div className="max-w-[560px] mx-auto px-6 text-center">
          <h2 className="text-2xl min-[900px]:text-[32px] font-bold text-gray-800">
            ¿Sos verificador?
          </h2>
          <p className="text-base text-gray-500 mt-2">
            Contactanos para empezar a usar VinDex.
          </p>

          <div className="bg-white rounded-md shadow-sm p-6 min-[900px]:p-8 mt-8 text-left">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-brand-primary py-8 px-6">
        <div className="max-w-[1024px] mx-auto grid grid-cols-1 min-[900px]:grid-cols-[1fr_auto_1fr] items-center gap-4 justify-items-center">
          <Logo
            size="sm"
            className="[&>span]:text-white min-[900px]:justify-self-start"
          />
          <div className="flex items-center gap-4 text-sm text-gray-300 min-[900px]:justify-self-center">
            <Link href="#" className="hover:text-white transition-colors">
              Privacidad
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Términos
            </Link>
            <a
              href="mailto:contacto@vindex.app"
              className="hover:text-white transition-colors"
            >
              contacto@vindex.app
            </a>
          </div>
          <p className="text-xs text-gray-500 min-[900px]:justify-self-end">
            &copy; 2026 VinDex. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center gap-3 p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-brand-accent text-white font-bold text-xl flex items-center justify-center">
        {number}
      </div>
      {icon}
      <h3 className="text-lg font-medium text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 max-w-[240px]">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  variant = "elevated",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: "elevated" | "muted";
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 p-5 rounded-md text-center ${
        variant === "elevated" ? "bg-white shadow-sm" : "bg-gray-50"
      }`}
    >
      {icon}
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function TimelineEvent({
  date,
  description,
  meta,
  isLast = false,
}: {
  date: string;
  description: string;
  meta: string;
  isLast?: boolean;
}) {
  return (
    <li className={`pr-3 min-[900px]:pr-4 ${isLast ? "" : "pb-6 min-[900px]:pb-0"}`}>
      <div className="border-l-2 border-white/20 pl-5 flex flex-col gap-1">
        <p className="text-[13px] font-semibold text-gray-400">{date}</p>
        <p className="text-base font-medium text-white leading-snug">
          {description}
        </p>
        <p className="text-[13px] text-gray-400">{meta}</p>
      </div>
    </li>
  );
}
