import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* Sección 1: Hero */}
      <section className="bg-white text-neutral-900 py-20 md:py-32">
        <div className="max-w-4xl w-full mx-auto px-8 text-center">
          <header>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Rueda de Problemas
            </h1>
            <h2 className="text-3xl md:text-4xl font-light text-neutral-700 mt-2">
              Conectando Desafíos con Soluciones
            </h2>
          </header>
          <main>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed mt-6">
              La plataforma insignia de la UNSA para la asignación estratégica de sus 
              fondos de canon. Presente sus desafíos y conéctelos con nuestra 
              capacidad de investigación.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/registro">Registrar mi Desafío</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
            </div>
          </main>
        </div>
      </section>

      {/* Sección 2: ¿Qué es? */}
      <section className="bg-neutral-50 py-24">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold text-neutral-900">
            ¿Qué es la Rueda de Problemas?
          </h2>
          <p className="text-lg text-neutral-600 mt-6 max-w-3xl mx-auto leading-relaxed">
            Es una metodología innovadora que conecta problemas reales del sector 
            productivo, gubernamental y social con las capacidades de 
            investigación e innovación de la Universidad Nacional de San Agustín 
            de Arequipa.
          </p>
        </div>
      </section>
      
      {/* Sección 3: ¿Cómo Funciona? */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-neutral-900 text-center mb-16">
            ¿Cómo Funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-neutral-200 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-4">
                <span className="text-neutral-400 font-bold mr-3">01.</span>
                Identifica Problemas
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Actores externos presentan desafíos reales que requieren 
                soluciones innovadoras.
              </p>
            </div>
            <div className="border border-neutral-200 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-4">
                <span className="text-neutral-400 font-bold mr-3">02.</span>
                Conecta Capacidades
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Investigadores UNSA registran sus capacidades y expertise 
                para resolver problemas.
              </p>
            </div>
            <div className="border border-neutral-200 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-4">
                <span className="text-neutral-400 font-bold mr-3">03.</span>
                Genera Proyectos
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Se crean fichas de proyectos I+D+i+e con potencial 
                de financiamiento.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}