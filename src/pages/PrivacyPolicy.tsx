import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Política de Privacidade | Proteção de Dados e Privacidade</title>
        <meta 
          name="description" 
          content="Política de Privacidade completa. Saiba como coletamos, usamos e protegemos seus dados pessoais em conformidade com a LGPD." 
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${window.location.origin}/privacy-policy`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <article>
            <h1 className="text-4xl font-bold mb-6 text-foreground">Política de Privacidade</h1>
            
            <p className="text-muted-foreground mb-8">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introdução</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nossa plataforma. Estamos comprometidos em proteger sua privacidade e garantir a segurança de seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Informações que Coletamos</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Coletamos diferentes tipos de informações para fornecer e melhorar nossos serviços:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Informações de cadastro: nome, e-mail, senha</li>
                <li>Informações de perfil: foto, bio, links sociais</li>
                <li>Dados de uso: páginas visitadas, interações, preferências</li>
                <li>Informações técnicas: endereço IP, tipo de navegador, dispositivo</li>
                <li>Dados de formulários: respostas enviadas através dos formulários criados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Como Usamos suas Informações</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Fornecer, operar e manter nossa plataforma</li>
                <li>Melhorar, personalizar e expandir nossos serviços</li>
                <li>Entender e analisar como você usa nossa plataforma</li>
                <li>Desenvolver novos produtos, serviços e funcionalidades</li>
                <li>Comunicar com você para atualizações, suporte e marketing</li>
                <li>Prevenir fraudes e garantir a segurança da plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Compartilhamento de Dados</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Não vendemos suas informações pessoais. Podemos compartilhar seus dados apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Com seu consentimento explícito</li>
                <li>Com prestadores de serviços que nos auxiliam na operação da plataforma</li>
                <li>Para cumprir obrigações legais ou solicitações governamentais</li>
                <li>Para proteger nossos direitos, privacidade, segurança ou propriedade</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Segurança dos Dados</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia de dados, controles de acesso e monitoramento contínuo de segurança.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Seus Direitos</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                De acordo com a LGPD, você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Confirmar a existência de tratamento de dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
                <li>Solicitar a portabilidade de dados</li>
                <li>Revogar o consentimento</li>
                <li>Obter informações sobre compartilhamento de dados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Cookies</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, analisar o uso da plataforma e personalizar conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Retenção de Dados</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Alterações nesta Política</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações publicando a nova política nesta página e atualizando a data de "última atualização".
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Contato</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Se você tiver dúvidas sobre esta Política de Privacidade ou desejar exercer seus direitos, entre em contato conosco através do e-mail: contato@exemplo.com
              </p>
            </section>
          </article>
        </main>
      </div>
    </>
  );
};

export default PrivacyPolicy;
