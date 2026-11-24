import * as Sharing from "expo-sharing";

export async function compartilharPdf(
  caminho: string,
  _mensagem: string,
): Promise<void> {
  const disponivel = await Sharing.isAvailableAsync();

  if (!disponivel) {
    throw new Error("Compartilhamento de PDF não está disponível neste dispositivo.");
  }

  await Sharing.shareAsync(caminho, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
  });
}
