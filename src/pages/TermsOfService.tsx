import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Termos de Uso | Condições de Uso da Plataforma</title>
        <meta 
          name="description" 
          content="Termos de Uso da plataforma. Conheça as regras, direitos e responsabilidades ao utilizar nossos serviços." 
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${window.location.origin}/terms-of-service`} />
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
            <h1 className="text-4xl font-bold mb-6 text-foreground">Termos de Uso</h1>
            
            <p className="text-muted-foreground mb-8">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Aceitação dos Termos</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Ao acessar e usar esta plataforma, você aceita e concorda em estar vinculado aos termos e condições aqui estabelecidos. Se você não concordar com qualquer parte destes termos, não deve usar nossa plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Descrição do Serviço</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Nossa plataforma oferece ferramentas para criação de páginas personalizadas, gerenciamento de links e criação de formulários. Os serviços incluem:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Criação e personalização de páginas de perfil</li>
                <li>Gerenciamento de links e cards personalizados</li>
                <li>Construtor de formulários com coleta de respostas</li>
                <li>Análise de dados e métricas de uso</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Cadastro e Conta</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Para utilizar certos recursos da plataforma, você deve criar uma conta. Você concorda em:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Fornecer informações precisas, atualizadas e completas</li>
                <li>Manter a segurança de sua senha</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                <li>Ser responsável por todas as atividades em sua conta</li>
                <li>Não transferir sua conta para terceiros</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Uso Aceitável</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Você concorda em não usar a plataforma para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Violar qualquer lei ou regulamento aplicável</li>
                <li>Publicar conteúdo ilegal, difamatório, obsceno ou ofensivo</li>
                <li>Transmitir vírus, malware ou código malicioso</li>
                <li>Interferir ou interromper o funcionamento da plataforma</li>
                <li>Tentar obter acesso não autorizado a sistemas ou dados</li>
                <li>Coletar informações de outros usuários sem consentimento</li>
                <li>Usar a plataforma para spam ou comunicações não solicitadas</li>
                <li>Violar direitos de propriedade intelectual de terceiros</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Conteúdo do Usuário</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Você mantém todos os direitos sobre o conteúdo que publica na plataforma. Ao publicar conteúdo, você nos concede uma licença mundial, não exclusiva, isenta de royalties para usar, reproduzir e exibir esse conteúdo em conexão com o fornecimento dos serviços.
              </p>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Você é responsável pelo conteúdo que publica e deve garantir que possui todos os direitos necessários para compartilhá-lo.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Propriedade Intelectual</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                A plataforma, incluindo seu design, código-fonte, textos, gráficos e outros materiais, é protegida por direitos autorais, marcas registradas e outros direitos de propriedade intelectual. Você não pode copiar, modificar, distribuir ou vender qualquer parte da plataforma sem nossa permissão expressa.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Planos e Pagamentos</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Alguns recursos da plataforma podem estar disponíveis apenas através de planos pagos. Você concorda em:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Pagar todas as taxas aplicáveis ao seu plano</li>
                <li>Fornecer informações de pagamento precisas e atualizadas</li>
                <li>Autorizar cobranças recorrentes, se aplicável</li>
                <li>Entender que reembolsos estão sujeitos à nossa política</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Suspensão e Encerramento</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Reservamo-nos o direito de suspender ou encerrar sua conta, a nosso critério exclusivo, se você violar estes Termos de Uso ou por qualquer outro motivo, com ou sem aviso prévio. Você pode encerrar sua conta a qualquer momento através das configurações da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Isenção de Garantias</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                A plataforma é fornecida "como está" e "conforme disponível", sem garantias de qualquer tipo, expressas ou implícitas. Não garantimos que a plataforma será ininterrupta, livre de erros ou segura.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Limitação de Responsabilidade</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Na máxima extensão permitida por lei, não seremos responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, ou qualquer perda de lucros ou receitas, incorridos direta ou indiretamente, ou qualquer perda de dados, uso ou outros ativos intangíveis.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Indenização</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Você concorda em indenizar e isentar a plataforma, seus diretores, funcionários e afiliados de e contra quaisquer reclamações, responsabilidades, danos, perdas e despesas decorrentes de seu uso da plataforma ou violação destes Termos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Modificações dos Termos</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Notificaremos você sobre alterações materiais publicando os novos termos na plataforma. Seu uso continuado após tais alterações constitui sua aceitação dos novos termos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Lei Aplicável</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar suas disposições sobre conflito de leis. Quaisquer disputas serão resolvidas nos tribunais competentes do Brasil.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">14. Contato</h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através do e-mail: contato@exemplo.com
              </p>
            </section>
          </article>
        </main>
      </div>
    </>
  );
};

export default TermsOfService;
