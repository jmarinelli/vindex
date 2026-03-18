import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Img,
  Preview,
} from "@react-email/components";

interface InspectionSignedEmailProps {
  vehicleName: string;
  plate: string | null;
  vin: string;
  inspectorName: string;
  eventDate: string;
  findingsSummary: { good: number; attention: number; critical: number };
  reportUrl: string;
  reviewUrl: string;
  brandColor?: string | null;
  brandAccent?: string | null;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function InspectionSignedEmail({
  vehicleName,
  plate,
  vin,
  inspectorName,
  eventDate,
  findingsSummary,
  reportUrl,
  reviewUrl,
  brandColor,
  brandAccent,
}: InspectionSignedEmailProps) {
  const reportBtnBg = brandColor || "#1E293B";
  const reviewBtnBg = brandAccent || "#0EA5E9";
  const previewText = `Verificación de ${vehicleName} firmada por ${inspectorName}. Podés ver el reporte y dejar tu reseña.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Heading */}
          <Section style={sectionStyle}>
            <Text style={titleStyle}>Verificación firmada</Text>
            <Text style={introStyle}>
              Se firmó la verificación de tu vehículo.
            </Text>
          </Section>

          {/* Vehicle Card */}
          <Section style={vehicleCardStyle}>
            <Text style={vehicleNameStyle}>
              {vehicleName}
            </Text>
            {plate && (
              <Text style={vehicleDetailStyle}>Patente: {plate}</Text>
            )}
            <Text style={vinStyle}>VIN: {vin}</Text>
            <Text style={vehicleDetailStyle}>Verificador: {inspectorName}</Text>
            <Text style={vehicleDetailStyle}>
              Fecha: {formatDate(eventDate)}
            </Text>
            <Text style={resultStyle}>
              {`Resultado: ✓ ${findingsSummary.good} Bien · ⚠ ${findingsSummary.attention} Att · ✕ ${findingsSummary.critical} Crit`}
            </Text>
          </Section>

          {/* Report CTA */}
          <Section style={ctaSectionStyle}>
            <Button style={{ ...primaryButtonStyle, backgroundColor: reportBtnBg }} href={reportUrl}>
              Ver reporte completo
            </Button>
          </Section>

          <Hr style={hrStyle} />

          {/* Review Section */}
          <Section style={sectionStyle}>
            <Text style={reviewTitleStyle}>Dejá tu reseña</Text>
            <Text style={reviewDescStyle}>
              ¿El vehículo coincidió con lo que describió el informe? Tu opinión
              ayuda a otros compradores.
            </Text>
          </Section>

          <Section style={ctaSectionStyle}>
            <Button style={{ ...accentButtonStyle, backgroundColor: reviewBtnBg }} href={reviewUrl}>
              Dejar reseña
            </Button>
          </Section>

          <Text style={expiryStyle}>Este enlace expira en 90 días.</Text>

          <Hr style={hrStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerRegisteredStyle}>
              Registrado en{" "}
              <Img
                src="https://vindex-kappa.vercel.app/logo-email.png"
                width="80"
                height="22"
                alt="VinDex"
                style={{ display: "inline-block", verticalAlign: "middle" }}
              />
            </Text>
            <Text style={footerTextStyle}>
              Este email fue enviado porque un verificador de VinDex incluyó tu
              dirección como cliente de una verificación.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#F9FAFB",
  fontFamily,
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#FFFFFF",
  borderRadius: "8px",
  padding: "24px",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#E5E7EB",
  margin: "16px 0",
};

const sectionStyle: React.CSSProperties = {
  padding: "0",
};

const titleStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#1F2937",
  lineHeight: "1.5",
  margin: "0 0 8px 0",
};

const introStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#4B5563",
  lineHeight: "1.5",
  margin: "0 0 16px 0",
};

const vehicleCardStyle: React.CSSProperties = {
  backgroundColor: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  padding: "16px",
  margin: "0 0 16px 0",
};

const vehicleNameStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#1F2937",
  margin: "0 0 4px 0",
};

const vehicleDetailStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4B5563",
  lineHeight: "1.5",
  margin: "0",
};

const vinStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6B7280",
  fontFamily: "monospace",
  lineHeight: "1.5",
  margin: "0",
};

const resultStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#1F2937",
  lineHeight: "1.5",
  margin: "8px 0 0 0",
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "8px 0",
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: "#1E293B",
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: 600,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
};

const accentButtonStyle: React.CSSProperties = {
  backgroundColor: "#0EA5E9",
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: 600,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
};

const reviewTitleStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#1F2937",
  lineHeight: "1.5",
  margin: "0 0 8px 0",
};

const reviewDescStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#4B5563",
  lineHeight: "1.5",
  margin: "0 0 8px 0",
};

const expiryStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9CA3AF",
  textAlign: "center" as const,
  margin: "8px 0 0 0",
};

const footerStyle: React.CSSProperties = {
  padding: "0",
  textAlign: "center" as const,
};

const footerRegisteredStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#9CA3AF",
  lineHeight: "1.5",
  margin: "0 0 4px 0",
  textAlign: "center" as const,
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9CA3AF",
  lineHeight: "1.5",
  margin: "0",
};
