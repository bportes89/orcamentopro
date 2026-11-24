import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const MAX_LOGO_BYTES = 500 * 1024;

const COMPRESSION_ATTEMPTS = [
  { maxWidth: 1024, compress: 0.8 },
  { maxWidth: 1024, compress: 0.6 },
  { maxWidth: 800, compress: 0.5 },
  { maxWidth: 640, compress: 0.4 },
  { maxWidth: 480, compress: 0.3 },
];

export async function compressImageForUpload(uri: string): Promise<File> {
  for (const attempt of COMPRESSION_ATTEMPTS) {
    const context = ImageManipulator.manipulate(uri, {
      maxWidth: attempt.maxWidth,
      maxHeight: attempt.maxWidth,
    });
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({
      compress: attempt.compress,
      format: SaveFormat.JPEG,
    });
    const file = new File(result.uri);

    if (file.size <= MAX_LOGO_BYTES) {
      return file;
    }
  }

  throw new Error(
    "A logo deve ter no máximo 500 KB. Escolha uma imagem menor.",
  );
}
